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
  "company.read",
  "company.manage",
  "payments.certify",
  "orders.create",
  "orders.read",
  "production.release",
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

  const released = await service.releaseOrderToProduction(actor, created.data.id, "release-order", {
    expectedVersion: created.data.version,
    confirmation: "ENTREGAR_A_PRODUCCION",
  });
  const releasedReplay = await service.releaseOrderToProduction(actor, created.data.id, "release-order", {
    expectedVersion: created.data.version,
    confirmation: "ENTREGAR_A_PRODUCCION",
  });
  assert.equal(released.data.status, "production_ready");
  assert.equal(released.data.version, 2);
  assert.equal(releasedReplay.replayed, true);
  assert.equal(store.snapshot().outboxEvents.length, 2);
  assert.equal(store.snapshot().outboxEvents[1]?.eventType, "order.production_released");
  assert.equal(store.snapshot().auditEvents.length, 4);

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

test("company configuration is versioned, idempotent and isolated by tenant", async () => {
  const store = new InMemoryCoreStore();
  const service = new CoreService(store, () => new Date("2026-09-02T12:00:00.000Z"));
  const actor = { ...context(tenantA, actorA), tenantName: "Marca A" };
  const empty = await service.getCompanyConfiguration(actor);
  assert.equal(empty.brand.brandName, "Marca A");
  assert.equal(empty.version, 0);

  const input = {
    expectedVersion: 0,
    brand: {
      brandName: "Marca A", legalName: null, primaryPhone: "+59899111222", primaryEmail: "hola@marca.test",
      website: "https://marca.test", description: "Indumentaria deportiva personalizada",
    },
    operations: {
      defaultCurrency: "UYU" as const, depositPercentage: 50, defaultQuoteValidityDays: 7, defaultLeadTimeDays: 15,
      paymentMethods: ["Transferencia"], deliveryMethods: ["Retiro"], salesTerms: "Precios sujetos a confirmación",
      productionNotes: "El plazo comienza con la lista de talles confirmada",
    },
    sizeCharts: [{
      id: "33333333-3333-4333-8333-333333333333", name: "Adultos", audience: "ADULT" as const,
      notes: null, rows: [{ label: "M", measurements: { Pecho: "48 cm", Largo: "66 cm" } }], active: true,
    }],
    products: [{
      id: "44444444-4444-4444-8444-444444444444", name: "Equipo corto", category: "Equipos",
      description: null, active: true, minimumQuantity: 5, defaultLeadTimeDays: 15,
      sizeChartId: "33333333-3333-4333-8333-333333333333",
      priceTiers: [{
        id: "55555555-5555-4555-8555-555555555555", minQuantity: 5, maxQuantity: null,
        unitPriceCents: 59_000, currency: "UYU" as const,
      }],
    }],
    resources: [{
      id: "66666666-6666-4666-8666-666666666666", kind: "FABRIC_PHOTO" as const,
      name: "Tela dry fit", description: "Foto de referencia", reference: "carpeta/telas/dry-fit.jpg", active: true,
    }],
  };
  const saved = await service.saveCompanyConfiguration(actor, "company-save-1", input);
  const replay = await service.saveCompanyConfiguration(actor, "company-save-1", input);
  assert.equal(saved.data.version, 1);
  assert.equal(replay.replayed, true);
  assert.equal((await service.getCompanyConfiguration(actor)).products[0]?.priceTiers[0]?.unitPriceCents, 59_000);
  assert.equal((await service.getCompanyConfiguration(context(tenantB, actorB))).version, 0);
  assert.equal(store.snapshot().companyConfigurations.length, 1);

  await assert.rejects(
    service.saveCompanyConfiguration(actor, "company-save-stale", { ...input, brand: { ...input.brand, brandName: "Cambio viejo" } }),
    isAppError("company_configuration_version_conflict"),
  );
  await assert.rejects(service.getCompanyConfiguration(context(tenantA, actorA, [])), isAppError("permission_denied"));
});

test("tenant stage columns are configurable, reordered and safely reassign orders on deletion", async () => {
  const store = new InMemoryCoreStore();
  const service = new CoreService(store, () => new Date("2026-08-19T12:00:00.000Z"));
  const actor = context(tenantA, actorA);
  const defaults = await service.listStageDefinitions(actor, "order");
  assert.equal(defaults[0]?.id, "intake_pending");

  const configured = await service.saveStageDefinition(actor, "order", {
    id: "CUSTOM_CONTROL", name: "Control de calidad", position: 60, terminal: false,
  });
  assert.equal(configured.at(-1)?.id, "CUSTOM_CONTROL");
  const reordered = await service.reorderStageDefinition(actor, "order", "CUSTOM_CONTROL", "earlier");
  assert.equal(reordered.find((stage) => stage.id === "CUSTOM_CONTROL")?.position, 50);

  const client = (await service.createClient(actor, "stage-client", { displayName: "Cliente de etapa" })).data;
  const payment = (await service.certifyPayment(actor, "stage-payment", {
    clientId: client.id, evidenceReference: "stage-evidence", amountCents: 1_000, currency: "UYU",
  })).data;
  const order = (await service.createOrderFromCertifiedPayment(actor, "stage-order", {
    clientId: client.id, certifiedPaymentId: payment.id, teamName: "Delta", quotedTotalCents: 1_000, currency: "UYU",
  })).data;
  const moved = await service.moveOrderStage(actor, order.id, "stage-move", {
    status: "CUSTOM_CONTROL", expectedVersion: order.version,
  });
  assert.equal(moved.data.status, "CUSTOM_CONTROL");

  await service.deleteStageDefinition(actor, "order", "CUSTOM_CONTROL", "completed");
  assert.equal((await service.listOrders(actor))[0]?.status, "completed");
  await assert.rejects(
    service.moveOrderStage(actor, order.id, "unknown-stage", { status: "CUSTOM_CONTROL", expectedVersion: 3 }),
    isAppError("order_stage_not_configured"),
  );
});
