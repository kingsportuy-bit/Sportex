import assert from "node:assert/strict";
import test from "node:test";
import type { SportexConfig } from "../src/config.js";
import { InMemoryCoreStore } from "../src/adapters/persistence/in-memory-core-store.js";
import { buildServer } from "../src/server.js";

const config: SportexConfig = {
  environment: "test",
  storeDriver: "memory",
  devAuthEnabled: true,
  tablePrefix: "sportex_staging_",
  host: "127.0.0.1",
  port: 8080,
};

const tenantA = "11111111-1111-4111-8111-111111111111";
const tenantB = "22222222-2222-4222-8222-222222222222";
const actor = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function headers(tenantId = tenantA, idempotency = "client-001"): Record<string, string> {
  return {
    "x-sportex-tenant-id": tenantId,
    "x-sportex-actor-id": actor,
    "x-sportex-capabilities": "clients.create,clients.read,payments.certify,orders.create,orders.read",
    "idempotency-key": idempotency,
    "x-correlation-id": "corr-api-test",
  };
}

test("health and readiness are separate surfaces", async () => {
  const app = await buildServer({ config, store: new InMemoryCoreStore(), logger: false });
  const health = await app.inject({ method: "GET", url: "/health" });
  const ready = await app.inject({ method: "GET", url: "/ready" });
  assert.equal(health.statusCode, 200);
  assert.equal(health.json().service, "sportex-core");
  assert.equal(ready.statusCode, 200);
  assert.equal(ready.json().store, "memory");
  await app.close();
});

test("API requires identity and isolates list responses", async () => {
  const app = await buildServer({ config, store: new InMemoryCoreStore(), logger: false });
  const unauthorized = await app.inject({ method: "GET", url: "/v1/clients" });
  assert.equal(unauthorized.statusCode, 401);
  assert.equal(unauthorized.json().error, "authentication_required");

  const created = await app.inject({
    method: "POST",
    url: "/v1/clients",
    headers: headers(),
    payload: { displayName: "Fito", teamName: "Delta FC", primaryPhone: "+59899111222" },
  });
  assert.equal(created.statusCode, 201);
  assert.equal(created.headers["x-correlation-id"], "corr-api-test");
  assert.equal(created.json().meta.replayed, false);

  const replay = await app.inject({
    method: "POST",
    url: "/v1/clients",
    headers: headers(),
    payload: { displayName: "Fito", teamName: "Delta FC", primaryPhone: "+59899111222" },
  });
  assert.equal(replay.statusCode, 201);
  assert.equal(replay.json().meta.replayed, true);

  const ownList = await app.inject({ method: "GET", url: "/v1/clients", headers: headers() });
  const otherList = await app.inject({ method: "GET", url: "/v1/clients", headers: headers(tenantB) });
  assert.equal(ownList.json().data.length, 1);
  assert.equal(otherList.json().data.length, 0);
  await app.close();
});

test("API returns stable validation errors", async () => {
  const app = await buildServer({ config, store: new InMemoryCoreStore(), logger: false });
  const response = await app.inject({
    method: "POST",
    url: "/v1/clients",
    headers: headers(),
    payload: { displayName: "X", primaryPhone: "099111222", unexpected: true },
  });
  assert.equal(response.statusCode, 400);
  assert.equal(response.json().error, "invalid_payload");
  assert.equal(response.json().correlationId, "corr-api-test");
  await app.close();
});

test("API completes the client, payment and order vertical", async () => {
  const store = new InMemoryCoreStore();
  const app = await buildServer({ config, store, logger: false });
  const clientResponse = await app.inject({
    method: "POST",
    url: "/v1/clients",
    headers: headers(tenantA, "vertical-client"),
    payload: { displayName: "Cliente vertical", teamName: "Delta Test FC" },
  });
  const clientId = clientResponse.json().data.id as string;

  const paymentResponse = await app.inject({
    method: "POST",
    url: "/v1/payments/certify",
    headers: headers(tenantA, "vertical-payment"),
    payload: {
      clientId,
      evidenceReference: "vertical-transfer-001",
      amountCents: 150_000,
      currency: "UYU",
    },
  });
  assert.equal(paymentResponse.statusCode, 201);

  const orderResponse = await app.inject({
    method: "POST",
    url: "/v1/orders/from-certified-payment",
    headers: headers(tenantA, "vertical-order"),
    payload: {
      clientId,
      certifiedPaymentId: paymentResponse.json().data.id,
      teamName: "Delta Test FC",
      quotedTotalCents: 450_000,
      currency: "UYU",
    },
  });
  assert.equal(orderResponse.statusCode, 201);
  assert.match(orderResponse.json().data.orderNumber, /^SPX-\d{4}-00001$/u);
  assert.equal(store.snapshot().orders.length, 1);
  assert.equal(store.snapshot().outboxEvents.length, 1);
  await app.close();
});
