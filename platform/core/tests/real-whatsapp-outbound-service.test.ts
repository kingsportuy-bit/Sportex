import assert from "node:assert/strict";
import test from "node:test";
import { EvolutionHttpTransport } from "../src/adapters/evolution/evolution-http-transport.js";
import { InMemoryWhatsAppOutboundStore } from "../src/adapters/evolution/simulated-evolution-adapter.js";
import { InMemoryCommercialReplayStore } from "../src/adapters/persistence/in-memory-commercial-replay-store.js";
import { CommercialReplayService } from "../src/application/commercial-replay-service.js";
import { RealWhatsAppOutboundService } from "../src/application/real-whatsapp-outbound-service.js";
import type { EvolutionReplayEvent } from "../src/domain/commercial-models.js";
import type { ActorContext } from "../src/domain/models.js";

const tenantId = "11111111-1111-4111-8111-111111111111";
const actorId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const conversationRef = "59899123456@s.whatsapp.net";

const context: ActorContext = {
  tenantId,
  actorId,
  capabilities: ["commercial.read", "commercial.replay", "commercial.manage"],
  correlationId: "corr-real-outbound",
};

function event(id: string, fromMe: boolean, text: string): EvolutionReplayEvent {
  return {
    event: "messages.upsert",
    instance: "DELTA",
    receivedAt: "2026-08-14T20:00:00.000Z",
    sourceKind: "LIVE",
    data: {
      key: { id, remoteJid: conversationRef, fromMe },
      pushName: fromMe ? "Delta" : "Cliente real",
      messageTimestamp: "2026-08-14T20:00:00.000Z",
      message: { conversation: text },
    },
  };
}

test("manual outbound is durable and visible before the Evolution echo without duplicating it", async () => {
  const commercial = new CommercialReplayService(new InMemoryCommercialReplayStore());
  const inbound = await commercial.replayTrustedEvolution(
    context,
    "live-inbound-1",
    event("MSG-IN-1", false, "Hola, quiero consultar por talles."),
  );
  const outboundStore = new InMemoryWhatsAppOutboundStore();
  const transport = new EvolutionHttpTransport(
    "https://evolution.example.test",
    "DELTA",
    "secret-api-key",
    async () => new Response(JSON.stringify({ key: { id: "MSG-OUT-1" } }), {
      status: 201,
      headers: { "content-type": "application/json" },
    }),
    () => new Date("2026-08-14T20:01:00.000Z"),
  );
  const outbound = new RealWhatsAppOutboundService(
    outboundStore,
    transport,
    commercial,
    () => new Date("2026-08-14T20:01:00.000Z"),
  );

  const sent = await outbound.send(
    context,
    inbound.data.id,
    "Sí, te paso la lista de talles.",
    "manual-outbound-1",
  );

  assert.equal(sent.record.status, "SENT");
  assert.equal((await outboundStore.findByIdempotencyKey(tenantId, "manual-outbound-1"))?.status, "SENT");
  let workspace = await commercial.list(context);
  assert.deepEqual(workspace[0]?.conversation.messages.map((message) => message.direction), ["CLIENTE", "DELTA"]);
  assert.equal(workspace[0]?.conversation.messages[1]?.providerMessageId, "MSG-OUT-1");

  const echo = await commercial.replayTrustedEvolution(
    context,
    "live-outbound-echo-1",
    event("MSG-OUT-1", true, "Sí, te paso la lista de talles."),
  );
  workspace = await commercial.list(context);
  assert.equal(echo.replayed, true);
  assert.equal(workspace[0]?.conversation.messages.length, 2);
});
