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
    "x-sportex-capabilities": "clients.create,clients.read,company.read,company.manage,payments.certify,orders.create,orders.read,production.release",
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

test("API persists the company configuration aggregate", async () => {
  const app = await buildServer({ config, store: new InMemoryCoreStore(), logger: false });
  const initial = await app.inject({ method: "GET", url: "/v1/company/configuration", headers: headers() });
  assert.equal(initial.statusCode, 200);
  assert.equal(initial.json().data.version, 0);

  const payload = {
    expectedVersion: 0,
    brand: { brandName: "Marca API", legalName: null, primaryPhone: null, primaryEmail: null, website: null, description: null },
    operations: {
      defaultCurrency: "UYU", depositPercentage: 50, defaultQuoteValidityDays: 7, defaultLeadTimeDays: 15,
      paymentMethods: ["Transferencia"], deliveryMethods: [], salesTerms: null, productionNotes: null,
    },
    products: [], sizeCharts: [], resources: [],
  };
  const saved = await app.inject({
    method: "PUT", url: "/v1/company/configuration", headers: headers(tenantA, "company-api-save"), payload,
  });
  assert.equal(saved.statusCode, 200);
  assert.equal(saved.json().data.brand.brandName, "Marca API");
  assert.equal(saved.json().data.version, 1);

  const fetched = await app.inject({ method: "GET", url: "/v1/company/configuration", headers: headers() });
  assert.equal(fetched.json().data.operations.paymentMethods[0], "Transferencia");
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
  const releaseResponse = await app.inject({
    method: "POST",
    url: `/v1/orders/${orderResponse.json().data.id}/release-to-production`,
    headers: headers(tenantA, "vertical-production-release"),
    payload: {
      expectedVersion: orderResponse.json().data.version,
      confirmation: "ENTREGAR_A_PRODUCCION",
    },
  });
  assert.equal(releaseResponse.statusCode, 200);
  assert.equal(releaseResponse.json().data.status, "production_ready");
  assert.equal(store.snapshot().orders.length, 1);
  assert.equal(store.snapshot().outboxEvents.length, 2);
  await app.close();
});

test("order workflow validates adjacent stages and records the final stage", async () => {
  const app = await buildServer({ config, store: new InMemoryCoreStore(), logger: false });
  const client = await app.inject({
    method: "POST",
    url: "/v1/clients",
    headers: headers(tenantA, "workflow-client"),
    payload: { displayName: "Cliente workflow", teamName: "Equipo workflow" },
  });
  const payment = await app.inject({
    method: "POST",
    url: "/v1/payments/certify",
    headers: headers(tenantA, "workflow-payment"),
    payload: {
      clientId: client.json().data.id,
      evidenceReference: "workflow-deposit-001",
      amountCents: 10_000,
      currency: "UYU",
    },
  });
  const order = await app.inject({
    method: "POST",
    url: "/v1/orders/from-certified-payment",
    headers: headers(tenantA, "workflow-order"),
    payload: {
      clientId: client.json().data.id,
      certifiedPaymentId: payment.json().data.id,
      teamName: "Equipo workflow",
      quotedTotalCents: 25_000,
      currency: "UYU",
    },
  });
  const orderId = order.json().data.id as string;

  const invalid = await app.inject({
    method: "PATCH",
    url: `/v1/orders/${orderId}/stage`,
    headers: headers(tenantA, "workflow-invalid"),
    payload: { status: "completed", expectedVersion: 1 },
  });
  assert.equal(invalid.statusCode, 409);
  assert.equal(invalid.json().error, "order_stage_transition_invalid");

  const details = await app.inject({
    method: "PATCH",
    url: `/v1/orders/${orderId}/details`,
    headers: headers(tenantA, "workflow-details"),
    payload: {
      expectedVersion: 1,
      details: {
        product: "Camisetas",
        quantity: 18,
        colors: ["Verde", "Blanco"],
        sizes: "S 4 · M 8 · L 6",
        notes: "Boceto con escudo al frente",
        currentSketch: {
          messageId: "message-sketch-001",
          assetId: "asset-sketch-001",
          mimeType: "image/png",
          fileName: "boceto-equipo.png",
          width: 1600,
          height: 900,
        },
      },
    },
  });
  assert.equal(details.statusCode, 200);
  assert.equal(details.json().data.details.quantity, 18);
  assert.equal(details.json().data.details.currentSketch.fileName, "boceto-equipo.png");

  let version = 2;
  for (const status of ["design_pending", "production_ready", "in_production", "completed"] as const) {
    const moved = await app.inject({
      method: "PATCH",
      url: `/v1/orders/${orderId}/stage`,
      headers: headers(tenantA, `workflow-${status}`),
      payload: { status, expectedVersion: version, reason: "Avance operativo" },
    });
    assert.equal(moved.statusCode, 200);
    assert.equal(moved.json().data.status, status);
    version += 1;
  }
  await app.close();
});
