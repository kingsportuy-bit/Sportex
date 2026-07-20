import assert from "node:assert/strict";

const baseUrl = process.env.SPORTEX_BASE_URL;
const emailA = process.env.SPORTEX_TEST_EMAIL_A;
const passwordA = process.env.SPORTEX_TEST_PASSWORD_A;
const emailB = process.env.SPORTEX_TEST_EMAIL_B;
const passwordB = process.env.SPORTEX_TEST_PASSWORD_B;

for (const [name, value] of Object.entries({ baseUrl, emailA, passwordA, emailB, passwordB })) {
  if (!value) throw new Error(`missing_${name}`);
}

async function json(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${response.status}:${payload.error ?? payload.msg ?? "request_failed"}`);
  return payload;
}

const publicConfig = (await json(await fetch(`${baseUrl}/v1/public-config`))).data;
assert.equal(publicConfig.environment, "staging");
assert.ok(publicConfig.authUrl);
assert.ok(publicConfig.authAnonKey);

async function login(email, password) {
  return json(await fetch(`${publicConfig.authUrl}/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: publicConfig.authAnonKey, "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  }));
}

async function api(token, path, options = {}) {
  const headers = new Headers(options.headers ?? {});
  headers.set("authorization", `Bearer ${token}`);
  if (options.body) headers.set("content-type", "application/json");
  return json(await fetch(`${baseUrl}${path}`, { ...options, headers }));
}

const loginA = await login(emailA, passwordA);
const loginB = await login(emailB, passwordB);
const sessionA = (await api(loginA.access_token, "/v1/session")).data;
const sessionB = (await api(loginB.access_token, "/v1/session")).data;
assert.notEqual(sessionA.tenantId, sessionB.tenantId);

const suffix = Date.now().toString(36);
const clientKey = `e2e-client-${suffix}`;
const clientBody = { displayName: "Cliente E2E", teamName: `Delta E2E ${suffix}` };
const clientA = await api(loginA.access_token, "/v1/clients", {
  method: "POST",
  headers: { "idempotency-key": clientKey },
  body: JSON.stringify(clientBody),
});
const replayA = await api(loginA.access_token, "/v1/clients", {
  method: "POST",
  headers: { "idempotency-key": clientKey },
  body: JSON.stringify(clientBody),
});
assert.equal(replayA.data.id, clientA.data.id);
assert.equal(replayA.meta.replayed, true);

const paymentA = await api(loginA.access_token, "/v1/payments/certify", {
  method: "POST",
  headers: { "idempotency-key": `e2e-payment-${suffix}` },
  body: JSON.stringify({
    clientId: clientA.data.id,
    evidenceReference: `E2E-${suffix}`,
    amountCents: 150_000,
    currency: "UYU",
  }),
});

const orderA = await api(loginA.access_token, "/v1/orders/from-certified-payment", {
  method: "POST",
  headers: { "idempotency-key": `e2e-order-${suffix}` },
  body: JSON.stringify({
    clientId: clientA.data.id,
    certifiedPaymentId: paymentA.data.id,
    teamName: clientBody.teamName,
    quotedTotalCents: 450_000,
    currency: "UYU",
  }),
});
assert.equal(orderA.data.balanceCents, 300_000);

const [clientsA, ordersA, clientsB, ordersB] = await Promise.all([
  api(loginA.access_token, "/v1/clients"),
  api(loginA.access_token, "/v1/orders"),
  api(loginB.access_token, "/v1/clients"),
  api(loginB.access_token, "/v1/orders"),
]);
assert.ok(clientsA.data.some((client) => client.id === clientA.data.id));
assert.ok(ordersA.data.some((order) => order.id === orderA.data.id));
assert.ok(!clientsB.data.some((client) => client.id === clientA.data.id));
assert.ok(!ordersB.data.some((order) => order.id === orderA.data.id));

process.stdout.write(JSON.stringify({
  ok: true,
  release: publicConfig.release,
  tenantA: sessionA.tenantId,
  tenantB: sessionB.tenantId,
  orderNumber: orderA.data.orderNumber,
  idempotencyReplay: replayA.meta.replayed,
  crossTenantIsolation: true,
}));
