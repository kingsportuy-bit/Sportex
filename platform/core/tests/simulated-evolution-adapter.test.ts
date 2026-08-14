import assert from "node:assert/strict";
import test from "node:test";
import {
  FakeEvolutionOutboundTransport,
  InMemoryEvolutionJournal,
  InMemoryWhatsAppOutboundStore,
  SimulatedEvolutionAdapter,
  SimulatedEvolutionWorker,
} from "../src/adapters/evolution/simulated-evolution-adapter.js";
import type { SimulatedEvolutionMessageEvent } from "../src/domain/whatsapp-transport-models.js";
import { CommercialWhatsAppProjector } from "../src/application/commercial-whatsapp-projector.js";
import { CommercialReplayService } from "../src/application/commercial-replay-service.js";
import { InMemoryCommercialReplayStore } from "../src/adapters/persistence/in-memory-commercial-replay-store.js";
import { SimulatedWhatsAppOutboundService } from "../src/application/simulated-whatsapp-outbound-service.js";

const tenantA = "11111111-1111-4111-8111-111111111111";
const tenantB = "22222222-2222-4222-8222-222222222222";

function message(suffix: string, occurredAt: string, source: SimulatedEvolutionMessageEvent["source"] = "SIMULATED_LIVE"): SimulatedEvolutionMessageEvent {
  return {
    event: "messages.upsert",
    eventId: `evt-ficticio-${suffix}`,
    instance: "LOCAL_FIXTURE",
    source,
    receivedAt: "2026-08-14T18:00:00.000Z",
    data: {
      key: {
        id: `msg-ficticio-${suffix}`,
        remoteJid: "contacto-ficticio-lucas",
        fromMe: false,
      },
      pushName: "Lucas ficticio",
      messageTimestamp: occurredAt,
      message: { conversation: `Mensaje ${suffix}` },
    },
  };
}

test("simulated Evolution adapter normalizes both directions and fails closed outside fixtures", () => {
  const adapter = new SimulatedEvolutionAdapter();
  const inbound = adapter.normalize(tenantA, message("inbound", "2026-08-14T17:00:00.000Z"));
  const outbound = adapter.normalize(tenantA, {
    ...message("outbound", "2026-08-14T17:01:00.000Z"),
    data: { ...message("outbound", "2026-08-14T17:01:00.000Z").data, key: {
      id: "msg-ficticio-outbound",
      remoteJid: "contacto-ficticio-lucas",
      fromMe: true,
    } },
  });
  assert.equal(inbound.direction, "CLIENTE");
  assert.equal(outbound.direction, "DELTA");
  assert.throws(() => adapter.normalize(tenantA, {
    ...message("forbidden", "2026-08-14T17:00:00.000Z"),
    instance: "DELTA" as "LOCAL_FIXTURE",
  }), /evolution_instance_forbidden/u);
});

test("journal deduplicates per tenant and worker processes out-of-order events chronologically", async () => {
  const adapter = new SimulatedEvolutionAdapter();
  const journal = new InMemoryEvolutionJournal();
  const late = adapter.normalize(tenantA, message("late", "2026-08-14T17:10:00.000Z"));
  const early = adapter.normalize(tenantA, message("early", "2026-08-14T17:00:00.000Z", "BACKFILL"));
  assert.equal((await journal.ingest(late)).duplicate, false);
  assert.equal((await journal.ingest(early)).duplicate, false);
  assert.equal((await journal.ingest(early)).duplicate, true);
  assert.equal((await journal.ingest(adapter.normalize(tenantB, message("early", "2026-08-14T17:00:00.000Z")))).duplicate, false);

  const processed: string[] = [];
  await new SimulatedEvolutionWorker(journal, tenantA).drain(async (event) => {
    processed.push(`${event.tenantId}:${event.providerEventId}`);
  });
  await new SimulatedEvolutionWorker(journal, tenantB).drain(async (event) => {
    processed.push(`${event.tenantId}:${event.providerEventId}`);
  });
  assert.deepEqual(processed, [
    `${tenantA}:evt-ficticio-early`,
    `${tenantA}:evt-ficticio-late`,
    `${tenantB}:evt-ficticio-early`,
  ]);
  assert.deepEqual(await journal.counts(tenantA), { PENDING: 0, PROCESSED: 2, QUARANTINED: 0 });
  assert.deepEqual(await journal.counts(tenantB), { PENDING: 0, PROCESSED: 1, QUARANTINED: 0 });
});

test("a restarted worker resumes pending entries and quarantines only the failing event", async () => {
  const adapter = new SimulatedEvolutionAdapter();
  const journal = new InMemoryEvolutionJournal();
  await journal.ingest(adapter.normalize(tenantA, message("ok", "2026-08-14T17:00:00.000Z")));
  await journal.ingest(adapter.normalize(tenantA, message("bad", "2026-08-14T17:01:00.000Z")));
  const restartedWorker = new SimulatedEvolutionWorker(journal, tenantA);
  await restartedWorker.drain(async (event) => {
    if (event.providerEventId.endsWith("bad")) throw new Error("fixture_handler_failed");
  });
  assert.deepEqual(await journal.counts(tenantA), { PENDING: 0, PROCESSED: 1, QUARANTINED: 1 });
});

test("fake outbound is killed by default, idempotent when enabled and receipts never regress", () => {
  const transport = new FakeEvolutionOutboundTransport(false, () => new Date("2026-08-14T18:00:00.000Z"));
  const command = {
    tenantId: tenantA,
    conversationRef: "contacto-ficticio-lucas",
    destinationRef: "contacto-ficticio-lucas",
    text: "Respuesta manual ficticia",
    idempotencyKey: "outbound-fixture-001",
    correlationId: "corr-outbound-fixture-001",
    confirmedBy: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  };
  assert.throws(() => transport.send(command), /evolution_outbound_kill_switch_active/u);
  transport.setOutboundEnabled(true);
  const sent = transport.send(command);
  const replayed = transport.send(command);
  assert.ok(sent.providerMessageId);
  assert.equal(replayed.providerMessageId, sent.providerMessageId);
  assert.equal(replayed.attempts, 1);
  assert.equal(transport.applyReceipt(tenantA, sent.providerMessageId, "DELIVERED").status, "DELIVERED");
  assert.equal(transport.applyReceipt(tenantA, sent.providerMessageId, "SENT").status, "DELIVERED");
  assert.equal(transport.applyReceipt(tenantA, sent.providerMessageId, "READ").status, "READ");
  assert.equal(transport.applyReceipt(tenantA, sent.providerMessageId, "FAILED").status, "READ");
});

test("worker projects backfill, inbound and outbound into one ordered workspace without a web UI", async () => {
  const adapter = new SimulatedEvolutionAdapter();
  const journal = new InMemoryEvolutionJournal();
  const commercialStore = new InMemoryCommercialReplayStore();
  const commercial = new CommercialReplayService(commercialStore);
  const projector = new CommercialWhatsAppProjector(
    commercial,
    "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  );
  const live = message("live", "2026-08-14T17:00:00.000Z");
  const backfill = message("backfill", "2026-08-14T16:55:00.000Z", "BACKFILL");
  const outgoingBase = message("operator", "2026-08-14T17:05:00.000Z");
  const outgoing: SimulatedEvolutionMessageEvent = {
    ...outgoingBase,
    data: {
      ...outgoingBase.data,
      key: { ...outgoingBase.data.key, fromMe: true },
      message: { conversation: "Respuesta manual ficticia" },
    },
  };
  await journal.ingest(adapter.normalize(tenantA, live));
  await journal.ingest(adapter.normalize(tenantA, outgoing));
  await journal.ingest(adapter.normalize(tenantA, backfill));

  await new SimulatedEvolutionWorker(journal, tenantA).drain((event) => projector.project(event).then(() => undefined));
  const items = await commercial.list({
    tenantId: tenantA,
    actorId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    capabilities: ["commercial.read"],
    correlationId: "corr-read-after-worker",
  });
  assert.equal(items.length, 1);
  assert.deepEqual(items[0]?.conversation.messages.map((item) => item.providerMessageId), [
    "msg-ficticio-backfill",
    "msg-ficticio-live",
    "msg-ficticio-operator",
  ]);
  assert.deepEqual(items[0]?.conversation.messages.map((item) => item.direction), [
    "CLIENTE",
    "CLIENTE",
    "DELTA",
  ]);
  assert.deepEqual(items[0]?.conversation.messages.map((item) => item.sourceKind), [
    "BACKFILL",
    "FIXTURE",
    "FIXTURE",
  ]);
  assert.deepEqual(await journal.counts(tenantA), { PENDING: 0, PROCESSED: 3, QUARANTINED: 0 });
});

test("durable fake outbox remains pending behind the kill switch and sends once after enablement", async () => {
  const store = new InMemoryWhatsAppOutboundStore();
  const transport = new FakeEvolutionOutboundTransport(false, () => new Date("2026-08-14T18:00:00.000Z"));
  const service = new SimulatedWhatsAppOutboundService(
    store,
    transport,
    () => new Date("2026-08-14T18:00:00.000Z"),
  );
  const command = {
    tenantId: tenantA,
    conversationRef: "contacto-ficticio-lucas",
    destinationRef: "contacto-ficticio-lucas",
    text: "  Mensaje confirmado y ficticio  ",
    idempotencyKey: "durable-outbound-001",
    correlationId: "corr-durable-outbound-001",
    confirmedBy: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  };
  assert.equal((await service.enqueue(command)).duplicate, false);
  assert.equal((await service.enqueue(command)).duplicate, true);
  assert.deepEqual(await service.drain(tenantA), { sent: 0, blocked: 1 });
  assert.equal((await store.pendingOutbound(tenantA)).length, 1);

  transport.setOutboundEnabled(true);
  assert.deepEqual(await service.drain(tenantA), { sent: 1, blocked: 0 });
  assert.equal((await store.pendingOutbound(tenantA)).length, 0);
  const sent = transport.send({ ...command, text: command.text.trim() });
  assert.ok(sent.providerMessageId);
  assert.equal((await service.applyReceipt(tenantA, sent.providerMessageId, "DELIVERED")).status, "DELIVERED");
  assert.equal((await service.applyReceipt(tenantA, sent.providerMessageId, "SENT")).status, "DELIVERED");
});
