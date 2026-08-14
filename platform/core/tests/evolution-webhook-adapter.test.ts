import assert from "node:assert/strict";
import test from "node:test";
import { EvolutionWebhookAdapter } from "../src/adapters/evolution/evolution-webhook-adapter.js";
import { InMemoryEvolutionJournal } from "../src/adapters/evolution/simulated-evolution-adapter.js";
import { InMemoryCommercialReplayStore } from "../src/adapters/persistence/in-memory-commercial-replay-store.js";
import { CommercialReplayService } from "../src/application/commercial-replay-service.js";
import { RealWhatsAppIntegrationService } from "../src/application/real-whatsapp-integration-service.js";

const tenantId = "11111111-1111-4111-8111-111111111111";
const actorId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const clock = () => new Date("2026-08-14T19:00:00.000Z");

function liveMessage(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    event: "messages.upsert",
    instance: "DELTA",
    data: {
      key: { id: "3A123456789", remoteJid: "59899123456@s.whatsapp.net", fromMe: false },
      pushName: "Lucas R.",
      messageTimestamp: 1786726800,
      message: { conversation: "Hola, quiero consultar por camisetas" },
      ...overrides,
    },
  };
}

test("real Evolution adapter normalizes a DELTA message without trusting tenant data from payload", () => {
  const adapter = new EvolutionWebhookAdapter({ tenantId, actorId, instance: "DELTA", clock });
  const envelope = adapter.normalize({ ...liveMessage(), tenantId: "otro-tenant" });
  assert.equal(envelope.tenantId, tenantId);
  assert.equal(envelope.providerInstance, "DELTA");
  assert.equal(envelope.source, "LIVE");
  assert.equal(envelope.direction, "CLIENTE");
  assert.equal(envelope.conversationRef, "59899123456@s.whatsapp.net");
  assert.equal(envelope.text, "Hola, quiero consultar por camisetas");
  assert.equal(envelope.metadata.providerMessageId, "3A123456789");
});

test("real Evolution adapter resolves LID only with a phone alternate and rejects groups or another instance", () => {
  const adapter = new EvolutionWebhookAdapter({ tenantId, actorId, instance: "DELTA", clock });
  const resolved = adapter.normalize(liveMessage({
    key: {
      id: "3A-LID",
      remoteJid: "123456789@lid",
      remoteJidAlt: "59899123456@s.whatsapp.net",
      fromMe: false,
    },
  }));
  assert.equal(resolved.conversationRef, "59899123456@s.whatsapp.net");
  assert.throws(() => adapter.normalize(liveMessage({
    key: { id: "3A-GROUP", remoteJid: "12345@g.us", fromMe: false },
  })), /evolution_group_out_of_scope/u);
  assert.throws(() => adapter.normalize({ ...liveMessage(), instance: "OTRA" }), /evolution_instance_forbidden/u);
});

test("live ingestion is idempotent and projects inbound plus manual external outbound into one conversation", async () => {
  const adapter = new EvolutionWebhookAdapter({ tenantId, actorId, instance: "DELTA", clock });
  const journal = new InMemoryEvolutionJournal();
  const commercial = new CommercialReplayService(new InMemoryCommercialReplayStore());
  const integration = new RealWhatsAppIntegrationService(adapter, journal, commercial, tenantId, actorId);
  assert.equal((await integration.ingest(liveMessage())).duplicate, false);
  assert.equal((await integration.ingest(liveMessage())).duplicate, true);
  await integration.ingest(liveMessage({
    key: { id: "3A-OUT", remoteJid: "59899123456@s.whatsapp.net", fromMe: true },
    messageTimestamp: 1786726860,
    message: { extendedTextMessage: { text: "Te paso los talles disponibles" } },
  }));
  const items = await commercial.list({
    tenantId,
    actorId,
    capabilities: ["commercial.read"],
    correlationId: "read-live",
  });
  assert.equal(items.length, 1);
  assert.equal(items[0]?.fixtureVersion, null);
  assert.equal(items[0]?.contact.fixtureOnly, false);
  assert.deepEqual(items[0]?.conversation.messages.map((message) => message.direction), ["CLIENTE", "DELTA"]);
  assert.deepEqual(items[0]?.conversation.messages.map((message) => message.sourceKind), ["LIVE", "LIVE"]);
  assert.deepEqual(await integration.status(), {
    ingress: { PENDING: 0, PROCESSED: 2, QUARANTINED: 0 },
  });
});

test("receipt event has a stable deduplication identity and never becomes a chat bubble", () => {
  const adapter = new EvolutionWebhookAdapter({ tenantId, actorId, instance: "DELTA", clock });
  const first = adapter.normalize({
    event: "messages.update",
    instance: "DELTA",
    data: {
      key: { id: "3A-OUT", remoteJid: "59899123456@s.whatsapp.net", fromMe: true },
      status: "DELIVERY_ACK",
      messageTimestamp: 1786726900,
    },
  });
  const repeated = adapter.normalize({
    event: "messages.update",
    instance: "DELTA",
    data: {
      key: { id: "3A-OUT", remoteJid: "59899123456@s.whatsapp.net", fromMe: true },
      status: "DELIVERY_ACK",
      messageTimestamp: 1786726900,
    },
  });
  assert.equal(first.providerEventId, repeated.providerEventId);
  assert.equal(first.contentType, "RECEIPT");
  assert.equal(first.metadata.deliveryStatus, "DELIVERED");
});
