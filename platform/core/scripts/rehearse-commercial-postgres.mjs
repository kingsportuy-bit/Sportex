import assert from "node:assert/strict";
import pg from "pg";
import { PostgresCommercialReplayStore } from "../dist/adapters/persistence/postgres-commercial-replay-store.js";
import { CommercialReplayService } from "../dist/application/commercial-replay-service.js";
import { CommercialWhatsAppProjector } from "../dist/application/commercial-whatsapp-projector.js";
import {
  SimulatedEvolutionAdapter,
  SimulatedEvolutionWorker,
} from "../dist/adapters/evolution/simulated-evolution-adapter.js";
import { PostgresWhatsAppTransportStore } from "../dist/adapters/persistence/postgres-whatsapp-transport-store.js";

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
  capabilities: ["commercial.read", "commercial.replay", "commercial.manage"],
  correlationId: `postgres-rehearsal-${tenantId}`,
});

const timelineFailures = [];
const store = new PostgresCommercialReplayStore(config, (failure) => timelineFailures.push(failure));
const transportStore = new PostgresWhatsAppTransportStore(config);
const adminPool = new pg.Pool({ connectionString: databaseUrl });
let timelineTableRenamed = false;
try {
  await store.checkReady();
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
  assert.equal(created.data.timeline.some((entry) => entry.kind === "MESSAGE"), true);
  assert.equal(
    created.data.timeline.some((entry) =>
      entry.kind === "OPERATIONAL_EVENT" && entry.eventType === "OPPORTUNITY_CREATED"),
    true,
  );
  const staged = await service.updateStage(context(tenantA), created.data.id, {
    stage: "EN_CALIFICACION",
    expectedVersion: 1,
    reason: "Ensayo de cronología PostgreSQL",
  });
  assert.equal(
    staged.timeline.some((entry) =>
      entry.kind === "OPERATIONAL_EVENT" && entry.eventType === "STAGE_CHANGED"),
    true,
  );
  const reloaded = (await service.list(context(tenantA))).find((item) => item.id === created.data.id);
  assert.equal(
    reloaded.timeline.some((entry) =>
      entry.kind === "OPERATIONAL_EVENT" && entry.eventType === "STAGE_CHANGED"),
    true,
  );

  await adminPool.query(
    "ALTER TABLE public.sportex_staging_conversation_timeline_events RENAME TO sportex_staging_conversation_timeline_events_degraded",
  );
  timelineTableRenamed = true;
  await assert.rejects(() => store.checkReady());
  const maximumNote = "n".repeat(1_000);
  const degraded = await service.recordFollowUp(context(tenantA), created.data.id, {
    outcome: "SIN_RESPUESTA",
    note: maximumNote,
    expectedVersion: 2,
  });
  assert.equal(degraded.opportunity.version, 3);
  assert.equal(degraded.opportunity.followUps.at(-1)?.note, maximumNote);
  assert.equal(
    degraded.timeline.find((entry) => entry.kind === "OPERATIONAL_EVENT" && entry.eventType === "FOLLOW_UP_RECORDED")?.detail,
    `Sin respuesta: ${maximumNote}`,
  );
  assert.equal(
    degraded.timeline.some((entry) =>
      entry.kind === "OPERATIONAL_EVENT" && entry.eventType === "FOLLOW_UP_RECORDED"),
    true,
  );
  assert.deepEqual(new Set(timelineFailures.map((failure) => failure.operation)), new Set(["read", "write"]));
  const sourcePersisted = await adminPool.query(
    `SELECT activity_data
     FROM public.sportex_staging_commercial_opportunities
     WHERE tenant_id = $1 AND workspace_id = $2`,
    [tenantA, created.data.id],
  );
  assert.equal(
    sourcePersisted.rows[0].activity_data.some((activity) => activity.type === "FOLLOW_UP_RECORDED"),
    true,
  );
  assert.equal(
    sourcePersisted.rows[0].activity_data.find((activity) => activity.type === "FOLLOW_UP_RECORDED")?.detail,
    `SIN_RESPUESTA: ${maximumNote}`,
  );
  await adminPool.query(
    "ALTER TABLE public.sportex_staging_conversation_timeline_events_degraded RENAME TO sportex_staging_conversation_timeline_events",
  );
  timelineTableRenamed = false;
  await store.checkReady();
  const reconstructed = (await service.list(context(tenantA))).find((item) => item.id === created.data.id);
  assert.equal(
    reconstructed.timeline.some((entry) =>
      entry.kind === "OPERATIONAL_EVENT" && entry.eventType === "FOLLOW_UP_RECORDED"),
    true,
  );

  const rlsClient = await adminPool.connect();
  let tenantAOwnCount;
  let tenantACrossCount;
  let tenantBOwnCount;
  try {
    await rlsClient.query("BEGIN");
    await rlsClient.query("SET LOCAL ROLE sportex_staging_app");
    await rlsClient.query("SELECT set_config('app.tenant_id', $1, true)", [tenantA]);
    tenantAOwnCount = Number((await rlsClient.query(
      "SELECT count(*) AS count FROM public.sportex_staging_conversation_timeline_events",
    )).rows[0].count);
    tenantACrossCount = Number((await rlsClient.query(
      "SELECT count(*) AS count FROM public.sportex_staging_conversation_timeline_events WHERE tenant_id = $1",
      [tenantB],
    )).rows[0].count);
    await rlsClient.query("ROLLBACK");

    await rlsClient.query("BEGIN");
    await rlsClient.query("SET LOCAL ROLE sportex_staging_app");
    await rlsClient.query("SELECT set_config('app.tenant_id', $1, true)", [tenantB]);
    tenantBOwnCount = Number((await rlsClient.query(
      "SELECT count(*) AS count FROM public.sportex_staging_conversation_timeline_events",
    )).rows[0].count);
    await rlsClient.query("ROLLBACK");
  } finally {
    rlsClient.release();
  }
  assert.ok(tenantAOwnCount > 0);
  assert.equal(tenantACrossCount, 0);
  assert.ok(tenantBOwnCount > 0);

  const adapter = new SimulatedEvolutionAdapter();
  const projector = new CommercialWhatsAppProjector(service, actorId);
  const normalized = adapter.normalize(tenantA, {
    event: "messages.upsert",
    eventId: "evt-ficticio-postgres-worker",
    instance: "LOCAL_FIXTURE",
    source: "BACKFILL",
    receivedAt: "2026-08-14T16:05:00.000Z",
    data: {
      key: {
        id: "msg-ficticio-postgres-worker",
        remoteJid: "contacto-ficticio-postgres-worker",
        fromMe: false,
      },
      pushName: "Contacto worker PostgreSQL",
      messageTimestamp: "2026-08-14T16:04:00.000Z",
      message: { conversation: "Mensaje persistido antes de proyectar." },
    },
  });
  assert.equal((await transportStore.ingest(normalized)).duplicate, false);
  assert.equal((await transportStore.ingest(normalized)).duplicate, true);
  await new SimulatedEvolutionWorker(transportStore, tenantA).drain(
    (event) => projector.project(event).then(() => undefined),
  );
  assert.deepEqual(await transportStore.counts(tenantA), {
    PENDING: 0,
    PROCESSED: 1,
    QUARANTINED: 0,
  });
  const otherTenantEnvelope = { ...normalized, tenantId: tenantB };
  assert.equal((await transportStore.ingest(otherTenantEnvelope)).duplicate, false);
  assert.deepEqual(await transportStore.counts(tenantB), {
    PENDING: 1,
    PROCESSED: 0,
    QUARANTINED: 0,
  });
  assert.equal((await service.list(context(tenantA))).length, 2);

  const outbound = {
    tenantId: tenantA,
    conversationRef: "contacto-ficticio-postgres-worker",
    destinationRef: "contacto-ficticio-postgres-worker",
    text: "Mensaje manual ficticio en outbox durable.",
    idempotencyKey: "postgres-outbound-rehearsal-001",
    correlationId: "corr-postgres-outbound-rehearsal",
    confirmedBy: actorId,
    providerMessageId: null,
    status: "PENDING",
    attempts: 0,
    createdAt: "2026-08-14T16:06:00.000Z",
    updatedAt: "2026-08-14T16:06:00.000Z",
  };
  assert.equal((await transportStore.enqueue(outbound)).duplicate, false);
  assert.equal((await transportStore.enqueue(outbound)).duplicate, true);
  const sent = {
    ...outbound,
    providerMessageId: "msg-ficticio-postgres-outbound",
    status: "SENT",
    attempts: 1,
    updatedAt: "2026-08-14T16:07:00.000Z",
  };
  await transportStore.update(sent);
  assert.equal(
    (await transportStore.findByProviderMessageId(tenantA, sent.providerMessageId))?.status,
    "SENT",
  );
  assert.equal(
    await transportStore.findByProviderMessageId(tenantB, sent.providerMessageId),
    null,
  );
  console.log("SPORTEX_COMMERCIAL_POSTGRES_REHEARSAL=PASS");
  console.log("TENANT_A_ITEMS=1");
  console.log("TENANT_B_ITEMS=1");
  console.log("PROVIDER_REPLAYED=true");
  console.log("WHATSAPP_JOURNAL_PROCESSED=1");
  console.log("WHATSAPP_OUTBOX_IDEMPOTENT=true");
  console.log("CONVERSATION_TIMELINE_SEPARATED=true");
  console.log("TIMELINE_DEGRADED_MAIN_MUTATION_PRESERVED=true");
  console.log("FOLLOW_UP_MAX_NOTE_LENGTH=1000");
  console.log("FOLLOW_UP_MAX_DETAIL_LENGTH=1015");
  console.log(`TIMELINE_PROJECTION_FAILURES=${timelineFailures.map((failure) => failure.operation).join(",")}`);
  console.log(`RLS_APP_TENANT_A_OWN=${tenantAOwnCount}`);
  console.log(`RLS_APP_TENANT_A_CROSS=${tenantACrossCount}`);
  console.log(`RLS_APP_TENANT_B_OWN=${tenantBOwnCount}`);
} finally {
  if (timelineTableRenamed) {
    await adminPool.query(
      "ALTER TABLE public.sportex_staging_conversation_timeline_events_degraded RENAME TO sportex_staging_conversation_timeline_events",
    ).catch(() => undefined);
  }
  await adminPool.end();
  await transportStore.close();
  await store.close();
}
