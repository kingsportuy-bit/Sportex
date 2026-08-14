import assert from "node:assert/strict";
import test from "node:test";
import { EvolutionHttpTransport } from "../src/adapters/evolution/evolution-http-transport.js";

const command = {
  tenantId: "11111111-1111-4111-8111-111111111111",
  conversationRef: "59899123456@s.whatsapp.net",
  destinationRef: "59899123456@s.whatsapp.net",
  text: "Te paso los talles disponibles",
  idempotencyKey: "manual-send-1",
  correlationId: "corr-manual-send-1",
  confirmedBy: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
};

test("Evolution transport sends the exact v2 text payload and never exposes the API key in the URL", async () => {
  let capturedUrl = "";
  let captured: RequestInit | undefined;
  const transport = new EvolutionHttpTransport(
    "https://evolution.example.test",
    "DELTA",
    "secret-api-key",
    async (input, init) => {
      capturedUrl = String(input);
      captured = init;
      return new Response(JSON.stringify({ key: { id: "3A-SENT" } }), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    },
    () => new Date("2026-08-14T20:00:00.000Z"),
  );
  const record = await transport.send(command);
  assert.equal(capturedUrl, "https://evolution.example.test/message/sendText/DELTA");
  assert.equal(capturedUrl.includes("secret-api-key"), false);
  assert.equal(new Headers(captured?.headers).get("apikey"), "secret-api-key");
  assert.deepEqual(JSON.parse(String(captured?.body)), {
    number: "59899123456",
    text: "Te paso los talles disponibles",
  });
  assert.equal(record.providerMessageId, "3A-SENT");
  assert.equal(record.status, "SENT");
});

test("Evolution transport rejects an ambiguous destination before network access", async () => {
  let called = false;
  const transport = new EvolutionHttpTransport(
    "https://evolution.example.test",
    "DELTA",
    "secret-api-key",
    async () => {
      called = true;
      return new Response();
    },
  );
  await assert.rejects(() => transport.send({ ...command, destinationRef: "123@lid" }), /evolution_destination_invalid/u);
  assert.equal(called, false);
});
