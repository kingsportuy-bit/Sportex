import assert from "node:assert/strict";
import test from "node:test";
import {
  FakeEvolutionOutboundTransport,
  InMemoryEvolutionJournal,
  SimulatedEvolutionAdapter,
  SimulatedEvolutionWorker,
} from "../src/adapters/evolution/simulated-evolution-adapter.js";
import type { SimulatedEvolutionMessageEvent } from "../src/domain/whatsapp-transport-models.js";

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
  assert.equal(journal.ingest(late).duplicate, false);
  assert.equal(journal.ingest(early).duplicate, false);
  assert.equal(journal.ingest(early).duplicate, true);
  assert.equal(journal.ingest(adapter.normalize(tenantB, message("early", "2026-08-14T17:00:00.000Z"))).duplicate, false);

  const processed: string[] = [];
  await new SimulatedEvolutionWorker(journal).drain(async (event) => {
    processed.push(`${event.tenantId}:${event.providerEventId}`);
  });
  assert.deepEqual(processed, [
    `${tenantA}:evt-ficticio-early`,
    `${tenantB}:evt-ficticio-early`,
    `${tenantA}:evt-ficticio-late`,
  ]);
  assert.deepEqual(journal.counts(), { PENDING: 0, PROCESSED: 3, QUARANTINED: 0 });
});

test("a restarted worker resumes pending entries and quarantines only the failing event", async () => {
  const adapter = new SimulatedEvolutionAdapter();
  const journal = new InMemoryEvolutionJournal();
  journal.ingest(adapter.normalize(tenantA, message("ok", "2026-08-14T17:00:00.000Z")));
  journal.ingest(adapter.normalize(tenantA, message("bad", "2026-08-14T17:01:00.000Z")));
  const restartedWorker = new SimulatedEvolutionWorker(journal);
  await restartedWorker.drain(async (event) => {
    if (event.providerEventId.endsWith("bad")) throw new Error("fixture_handler_failed");
  });
  assert.deepEqual(journal.counts(), { PENDING: 0, PROCESSED: 1, QUARANTINED: 1 });
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
  assert.equal(replayed.providerMessageId, sent.providerMessageId);
  assert.equal(replayed.attempts, 1);
  assert.equal(transport.applyReceipt(tenantA, sent.providerMessageId, "DELIVERED").status, "DELIVERED");
  assert.equal(transport.applyReceipt(tenantA, sent.providerMessageId, "SENT").status, "DELIVERED");
  assert.equal(transport.applyReceipt(tenantA, sent.providerMessageId, "READ").status, "READ");
  assert.equal(transport.applyReceipt(tenantA, sent.providerMessageId, "FAILED").status, "READ");
});
