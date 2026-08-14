import assert from "node:assert/strict";
import { PostgresCommercialReplayStore } from "../dist/adapters/persistence/postgres-commercial-replay-store.js";
import { CommercialReplayService } from "../dist/application/commercial-replay-service.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const tenantA = "11111111-1111-4111-8111-111111111111";
const tenantB = "22222222-2222-4222-8222-222222222222";
const actorId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const config = {
  environment: "test",
  storeDriver: "postgres",
  devAuthEnabled: true,
  tablePrefix: "sportex_staging_",
  databaseUrl,
  databaseRole: "sportex_staging_app",
  host: "127.0.0.1",
  port: 8080,
};
const input = {
  event: "messages.upsert",
  instance: "LOCAL_FIXTURE",
  data: {
    key: {
      id: "msg-ficticio-postgres-rehearsal",
      remoteJid: "contacto-ficticio-postgres-rehearsal",
      fromMe: false,
    },
    pushName: "Contacto ensayo PostgreSQL",
    messageTimestamp: "2026-08-14T16:00:00.000Z",
    message: { conversation: "Quiero consultar por camisetas para mi equipo." },
  },
};
const context = (tenantId) => ({
  tenantId,
  actorId,
  capabilities: ["commercial.read", "commercial.replay"],
  correlationId: `postgres-rehearsal-${tenantId}`,
});

const store = new PostgresCommercialReplayStore(config);
try {
  const service = new CommercialReplayService(
    store,
    () => new Date("2026-08-14T16:01:00.000Z"),
  );
  const created = await service.replay(context(tenantA), "postgres-rehearsal-a", input);
  const replayed = await service.replay(context(tenantA), "postgres-rehearsal-b", input);
  const isolated = await service.replay(context(tenantB), "postgres-rehearsal-a", input);
  assert.equal(created.replayed, false);
  assert.equal(replayed.replayed, true);
  assert.equal(replayed.data.id, created.data.id);
  assert.notEqual(isolated.data.id, created.data.id);
  assert.equal((await service.list(context(tenantA))).length, 1);
  assert.equal((await service.list(context(tenantB))).length, 1);
  assert.equal(created.data.conversation.messages.length, 1);
  console.log("SPORTEX_COMMERCIAL_POSTGRES_REHEARSAL=PASS");
  console.log("TENANT_A_ITEMS=1");
  console.log("TENANT_B_ITEMS=1");
  console.log("PROVIDER_REPLAYED=true");
} finally {
  await store.close();
}
