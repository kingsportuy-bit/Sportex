import assert from "node:assert/strict";
import test from "node:test";
import {
  buildConversationTimeline,
  PASSIVE_ASSISTANT_CONTRACT,
  projectOperationalEvents,
  withConversationTimeline,
} from "../src/domain/commercial-timeline.js";
import type { CommercialWorkspaceItem } from "../src/domain/commercial-models.js";
import { createCommercialDemoSeed } from "../src/fixtures/commercial-demo-seed.js";

const tenantId = "11111111-1111-4111-8111-111111111111";

function fixture(): CommercialWorkspaceItem {
  const item = createCommercialDemoSeed(tenantId)[0];
  if (!item) throw new Error("timeline_fixture_missing");
  return structuredClone(item);
}

test("timeline keeps WhatsApp messages and operational events as different entry kinds", () => {
  const item = withConversationTimeline(fixture());
  const messages = item.timeline?.filter((entry) => entry.kind === "MESSAGE") ?? [];
  const events = item.timeline?.filter((entry) => entry.kind === "OPERATIONAL_EVENT") ?? [];

  assert.equal(messages.length, item.conversation.messages.length);
  assert.ok(events.length >= 1);
  assert.equal(events.some((entry) => entry.kind === "OPERATIONAL_EVENT" && entry.eventType === "OPPORTUNITY_CREATED"), true);
  assert.equal(events.some((entry) => entry.kind === "OPERATIONAL_EVENT" && entry.label.includes("OPPORTUNITY")), false);
  assert.deepEqual(
    item.timeline?.map((entry) => entry.occurredAt),
    [...(item.timeline ?? [])].map((entry) => entry.occurredAt).sort(),
  );
});

test("reprojection is deterministic and does not duplicate an existing Core event", () => {
  const item = fixture();
  const first = buildConversationTimeline(item);
  const second = buildConversationTimeline(item);
  assert.deepEqual(second, first);
  assert.equal(new Set(projectOperationalEvents(item).map((event) => event.id)).size, projectOperationalEvents(item).length);
});

test("assistant is representable only as passive event data and cannot become a message", () => {
  const item = fixture();
  const beforeMessages = structuredClone(item.conversation.messages);
  item.activity.push({
    type: "NEXT_ACTION_UPDATED",
    occurredAt: "2026-08-15T16:00:00.000Z",
    actorId: "assistant-future-contract",
    actorKind: "ASSISTANT",
    origin: "ASSISTANT",
    correlationId: "assistant-passive-contract",
    evidenceMessageId: null,
    detail: "Preparar respuesta para revisión humana.",
  });

  const timeline = buildConversationTimeline(item);
  const projected = timeline.find((entry) => entry.id.includes("assistant-passive-contract"));
  assert.equal(projected?.kind, "OPERATIONAL_EVENT");
  if (projected?.kind === "OPERATIONAL_EVENT") {
    assert.equal(projected.actor.kind, "ASSISTANT");
    assert.equal(projected.origin, "ASSISTANT");
  }
  assert.deepEqual(item.conversation.messages, beforeMessages);
  assert.deepEqual(PASSIVE_ASSISTANT_CONTRACT, {
    runtimeMode: "OFF",
    executable: false,
    actorKind: "ASSISTANT",
    origin: "ASSISTANT",
  });
});
