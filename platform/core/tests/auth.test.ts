import assert from "node:assert/strict";
import test from "node:test";
import type { SportexConfig } from "../src/config.js";
import { InMemoryCoreStore } from "../src/adapters/persistence/in-memory-core-store.js";
import { buildServer } from "../src/server.js";

const tenantId = "11111111-1111-4111-8111-111111111111";
const otherTenantId = "22222222-2222-4222-8222-222222222222";
const actorId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const config: SportexConfig = {
  environment: "test",
  storeDriver: "memory",
  devAuthEnabled: false,
  tablePrefix: "sportex_staging_",
  authInternalUrl: "https://auth.test/auth/v1",
  authPublicUrl: "https://auth.test/auth/v1",
  authAnonKey: "test-anon-key-with-enough-length",
  host: "127.0.0.1",
  port: 8080,
};

function authFetchFor(assignedTenantId = tenantId): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url = String(input);
    if (url.endsWith("/health")) return new Response(JSON.stringify({ version: "test" }), { status: 200 });
    if (url.endsWith("/user")) {
      return new Response(JSON.stringify({
        id: actorId,
        email: "fito@delta.test",
        app_metadata: { sportex_tenant_id: assignedTenantId },
        user_metadata: { password_change_required: true },
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    return new Response("not found", { status: 404 });
  }) as typeof fetch;
}

test("Supabase identity is resolved through an active membership", async () => {
  const store = new InMemoryCoreStore([{
    tenantId,
    tenantName: "Delta Sport",
    actorId,
    capabilities: ["clients.create", "clients.read", "payments.certify", "orders.create", "orders.read"],
    status: "active",
  }]);
  const app = await buildServer({ config, store, logger: false, authFetch: authFetchFor() });

  const session = await app.inject({
    method: "GET",
    url: "/v1/session",
    headers: { authorization: "Bearer signed-token" },
  });
  assert.equal(session.statusCode, 200);
  assert.equal(session.json().data.tenantId, tenantId);
  assert.equal(session.json().data.tenantName, "Delta Sport");
  assert.equal(session.json().data.passwordChangeRequired, true);

  const created = await app.inject({
    method: "POST",
    url: "/v1/clients",
    headers: { authorization: "Bearer signed-token", "idempotency-key": "auth-client" },
    payload: { displayName: "Cliente autenticado", teamName: "Delta Test FC" },
  });
  assert.equal(created.statusCode, 201);
  assert.equal(store.snapshot().clients[0]?.tenantId, tenantId);
  await app.close();
});

test("a valid Supabase user cannot choose another tenant without membership", async () => {
  const store = new InMemoryCoreStore([{
    tenantId,
    tenantName: "Delta Sport",
    actorId,
    capabilities: ["clients.read"],
    status: "active",
  }]);
  const app = await buildServer({ config, store, logger: false, authFetch: authFetchFor(otherTenantId) });
  const response = await app.inject({
    method: "GET",
    url: "/v1/clients",
    headers: { authorization: "Bearer signed-token" },
  });
  assert.equal(response.statusCode, 403);
  assert.equal(response.json().error, "tenant_membership_required");
  await app.close();
});
