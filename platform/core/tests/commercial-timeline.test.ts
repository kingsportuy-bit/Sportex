import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_OPERATIONAL_DETAIL_LENGTH,
  buildConversationTimeline,
  PASSIVE_ASSISTANT_CONTRACT,
  mergeOperationalEvents,
  operationalEventId,
  projectOperationalEvents,
  withConversationTimeline,
} from "../src/domain/commercial-timeline.js";
import type { CommercialWorkspaceItem } from "../src/domain/commercial-models.js";
import { createCommercialDemoSeed } from "../src/fixtures/commercial-demo-seed.js";

const tenantId = "11111111-1111-4111-8111-111111111111";
const technicalTokens = "NUEVO|EN_CALIFICACION|COTIZADO|EN_SEGUIMIENTO|PERDIDO|SENA_VALIDADA|SIN_CAMBIOS|AVANZO|SIN_RESPUESTA|NO_CONTINUA|";

function maximumTechnicalTokenNote(): string {
  return technicalTokens.repeat(Math.ceil(999 / technicalTokens.length)).slice(0, 999) + "Z";
}

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

test("event identity and readable detail stay inside the database contract", () => {
  const item = fixture();
  const baseActivity = item.activity.find((candidate) => candidate.type !== "MESSAGE_RECEIVED");
  assert.ok(baseActivity);
  const activity = {
    ...baseActivity,
    type: "STAGE_CHANGED" as const,
    correlationId: "á".repeat(200),
    evidenceMessageId: "e".repeat(200),
    detail: `NUEVO → EN_CALIFICACION: Motivo libre ${technicalTokens}`,
  };
  const event = projectOperationalEvents({ ...item, activity: [activity] })[0]!;
  assert.match(operationalEventId(activity), /^activity:[0-9a-f]{32}$/u);
  assert.equal(event.id.length, 41);
  assert.equal(event.detail, `Contacto inicial → Calificación: Motivo libre ${technicalTokens}`);
  assert.ok(event.detail.length <= MAX_OPERATIONAL_DETAIL_LENGTH);
});

test("persisted and source events merge by deterministic identity without losing either side", () => {
  const source = projectOperationalEvents(fixture());
  const persisted = [{ ...source[0]!, detail: "Detalle persistido" }, {
    ...source[0]!,
    id: "activity:00000000000000000000000000000000",
    detail: "Evento futuro persistido",
  }];
  const merged = mergeOperationalEvents(source, persisted);
  assert.equal(merged.filter((event) => event.id === source[0]!.id).length, 1);
  assert.equal(merged.find((event) => event.id === source[0]!.id)?.detail, "Detalle persistido");
  assert.equal(merged.some((event) => event.detail === "Evento futuro persistido"), true);
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
  const projected = timeline.find((entry) =>
    entry.kind === "OPERATIONAL_EVENT" && entry.actor.ref === "assistant-future-contract");
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

test("maximum follow-up note remains complete in the readable timeline detail", () => {
  const item = fixture();
  const note = maximumTechnicalTokenNote();
  item.activity.push({
    type: "FOLLOW_UP_RECORDED",
    occurredAt: "2026-08-15T17:00:00.000Z",
    actorId: "operator-max-note",
    actorKind: "HUMAN",
    origin: "OPERATOR",
    correlationId: "follow-up-max-note",
    evidenceMessageId: null,
    detail: `SIN_RESPUESTA: ${note}`,
  });

  const projected = projectOperationalEvents(item).find((entry) => entry.correlationId === "follow-up-max-note");
  assert.equal(projected?.detail, `Sin respuesta: ${note}`);
  assert.equal(projected?.detail.length, MAX_OPERATIONAL_DETAIL_LENGTH);
});

test("humanization never replaces technical tokens inside free text", () => {
  const item = fixture();
  const freeText = `Motivo ${technicalTokens}`;
  item.activity.push({
    type: "STAGE_CHANGED",
    occurredAt: "2026-08-15T18:00:00.000Z",
    actorId: "operator-stage-reason",
    actorKind: "HUMAN",
    origin: "OPERATOR",
    correlationId: "stage-free-text",
    evidenceMessageId: null,
    detail: `NUEVO → COTIZADO: ${freeText}`,
  }, {
    type: "NEXT_ACTION_UPDATED",
    occurredAt: "2026-08-15T18:01:00.000Z",
    actorId: "operator-next-action",
    actorKind: "HUMAN",
    origin: "OPERATOR",
    correlationId: "next-action-free-text",
    evidenceMessageId: null,
    detail: freeText,
  });
  const events = projectOperationalEvents(item);
  assert.equal(
    events.find((entry) => entry.correlationId === "stage-free-text")?.detail,
    `Contacto inicial → Cotización enviada: ${freeText}`,
  );
  assert.equal(events.find((entry) => entry.correlationId === "next-action-free-text")?.detail, freeText);
});
