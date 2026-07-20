import assert from "node:assert/strict";
import test from "node:test";
import { CoreService } from "../src/application/core-service.js";
import { InMemoryCoreStore } from "../src/adapters/persistence/in-memory-core-store.js";
import type { ActorContext, Capability } from "../src/domain/models.js";
import { AppError } from "../src/shared/errors.js";

const tenantA = "11111111-1111-4111-8111-111111111111";
const tenantB = "22222222-2222-4222-8222-222222222222";
const actorA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const actorB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const allCapabilities: Capability[] = [
  "clients.create",
  "clients.read",
  "payments.certify",
  "orders.create",
  "orders.read",
];

function context(tenantId: string, actorId: string, capabilities = allCapabilities): ActorContext {
  return { tenantId, actorId, capabilities, correlationId: `corr-${tenantId}` };
}

function isAppError(code: string): (error: unknown) => boolean {
  return (error) => error instanceof AppError && error.code === code;
}

test("clients are isolated by tenant and idempotent", async () => {
  const store = new InMemoryCoreStore();
  const service = new CoreService(store, () => new Date("2026-07-19T12:00:00.000Z"));

  const first = await service.createClient(context(tenantA, actorA), "client-a", {
    displayName: "Fito",
    teamName: "Delta FC",
    primaryPhone: "+59899111222",
  });
  const replay = await service.createClient(context(tenantA, actorA), "client-a", {
    displayName: "Fito",
    teamName: "Delta FC",
    primaryPhone: "+59899111222",
  });
  const otherTenant = await service.createClient(context(tenantB, actorB), "client-b", {
    displayName: "Otro cliente",
    primaryPhone: "+59899111222",
  });

  assert.equal(first.replayed, false);
  assert.equal(replay.replayed, true);
  assert.equal(replay.data.id, first.data.id);
  assert.notEqual(otherTenant.data.id, first.data.id);
  assert.equal((await service.listClients(context(tenantA, actorA))).length, 1);
  assert.equal((await service.listClients(context(tenantB, actorB))).length, 1);
  assert.equal(store.snapshot().auditEvents.length, 2);

  await assert.rejects(
    service.createClient(context(tenantA, actorA), "client-a-duplicate-phone", {
      displayName: "Otro en A",
      primaryPhone: "+59899111222",
    }),
    isAppError("client_phone_conflict"),
  );
});

test("an idempotency key cannot be reused with another payload", async () => {
  const store = new InMemoryCoreStore();
  const service = new CoreService(store);
  await service.createClient(context(tenantA, actorA), "same-key", { displayName: "Cliente uno" });

  await assert.rejects(
    service.createClient(context(tenantA, actorA), "same-key", { displayName: "Cliente dos" }),
    isAppError("idempotency_conflict"),
  );
  assert.equal(store.snapshot().clients.length, 1);
});

test("certified payment creates one order with audit and outbox", async () => {
  const store = new InMemoryCoreStore();
  const service = new CoreService(store, () => new Date("2026-07-19T12:00:00.000Z"));
  const actor = context(tenantA, actorA);
  const client = (await service.createClient(actor, "client", {
    displayName: "Fito",
    teamName: "Titanes FC",
  })).data;
  const payment = (await service.certifyPayment(actor, "payment", {
    clientId: client.id,
    evidenceReference: "transferencia-001",
    amountCents: 150_000,
    currency: "UYU",
  })).data;

  await assert.rejects(
    service.createOrderFromCertifiedPayment(actor, "invalid-order", {
      clientId: client.id,
      certifiedPaymentId: payment.id,
      teamName: "Titanes FC",
      quotedTotalCents: 149_999,
      currency: "UYU",
    }),
    isAppError("quoted_total_below_deposit"),
  );

  const created = await service.createOrderFromCertifiedPayment(actor, "valid-order", {
    clientId: client.id,
    certifiedPaymentId: payment.id,
    teamName: "Titanes FC",
    quotedTotalCents: 450_000,
    currency: "UYU",
  });
  const replay = await service.createOrderFromCertifiedPayment(actor, "valid-order", {
    clientId: client.id,
    certifiedPaymentId: payment.id,
    teamName: "Titanes FC",
    quotedTotalCents: 450_000,
    currency: "UYU",
  });

  assert.equal(created.data.orderNumber, "SPX-2026-00001");
  assert.equal(created.data.depositCents, 150_000);
  assert.equal(replay.replayed, true);
  assert.equal(replay.data.id, created.data.id);
  assert.equal(store.snapshot().orders.length, 1);
  assert.equal(store.snapshot().outboxEvents.length, 1);
  assert.equal(store.snapshot().outboxEvents[0]?.eventType, "order.created");
  assert.equal(store.snapshot().auditEvents.length, 3);

  await assert.rejects(
    service.createOrderFromCertifiedPayment(actor, "another-order-key", {
      clientId: client.id,
      certifiedPaymentId: payment.id,
      teamName: "Titanes FC",
      quotedTotalCents: 450_000,
      currency: "UYU",
    }),
    isAppError("payment_already_used"),
  );
});

test("a tenant cannot use another tenant payment", async () => {
  const store = new InMemoryCoreStore();
  const service = new CoreService(store);
  const clientA = (await service.createClient(context(tenantA, actorA), "client-a", { displayName: "Cliente A" })).data;
  const paymentA = (await service.certifyPayment(context(tenantA, actorA), "payment-a", {
    clientId: clientA.id,
    evidenceReference: "evidence-a",
    amountCents: 1_000,
    currency: "UYU",
  })).data;
  const clientB = (await service.createClient(context(tenantB, actorB), "client-b", { displayName: "Cliente B" })).data;

  await assert.rejects(
    service.createOrderFromCertifiedPayment(context(tenantB, actorB), "cross-tenant", {
      clientId: clientB.id,
      certifiedPaymentId: paymentA.id,
      teamName: "Equipo B",
      quotedTotalCents: 5_000,
      currency: "UYU",
    }),
    isAppError("payment_not_found"),
  );
  assert.equal(store.snapshot().orders.length, 0);
  assert.equal(store.snapshot().outboxEvents.length, 0);
});

test("capabilities deny by default", async () => {
  const store = new InMemoryCoreStore();
  const service = new CoreService(store);
  await assert.rejects(
    service.createClient(context(tenantA, actorA, []), "client", { displayName: "Sin permiso" }),
    isAppError("permission_denied"),
  );
});
