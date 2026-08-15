import { createHash } from "node:crypto";
import type {
  CommercialActivity,
  CommercialOperationalEventType,
  CommercialTimelineActorKind,
  CommercialTimelineEntry,
  CommercialTimelineOperationalEvent,
  CommercialTimelineOrigin,
  CommercialWorkspaceItem,
} from "./commercial-models.js";

const eventLabels: Record<CommercialOperationalEventType, string> = {
  OPPORTUNITY_CREATED: "Consulta incorporada al proceso comercial",
  STAGE_CHANGED: "Etapa comercial actualizada",
  NEXT_ACTION_UPDATED: "Próximo paso actualizado",
  FOLLOW_UP_RECORDED: "Seguimiento registrado",
  ORDER_CREATED: "Cliente y pedido creados",
  PRODUCTION_RELEASED: "Pedido entregado a producción",
};

const readableStages: Record<string, string> = {
  NUEVO: "Contacto inicial",
  EN_CALIFICACION: "Calificación",
  COTIZADO: "Cotización enviada",
  EN_SEGUIMIENTO: "Seguimiento",
  PERDIDO: "Cerrado sin venta",
  SENA_VALIDADA: "Seña validada",
};

const readableFollowUpOutcomes: Record<string, string> = {
  SIN_CAMBIOS: "Sin cambios",
  AVANZO: "Avanzó",
  SIN_RESPUESTA: "Sin respuesta",
  NO_CONTINUA: "No continúa",
};

// A follow-up accepts a 1,000-character canonical note and prefixes the
// longest outcome ("SIN_RESPUESTA: "), so the derived detail needs 1,015.
export const MAX_OPERATIONAL_DETAIL_LENGTH = 1_015;

export function readableOperationalDetail(type: CommercialOperationalEventType, value: string): string {
  if (type === "OPPORTUNITY_CREATED") return "Ya forma parte del seguimiento comercial.";
  if (type === "FOLLOW_UP_RECORDED") {
    const separator = value.indexOf(": ");
    if (separator < 0) return value;
    const outcome = value.slice(0, separator);
    const readableOutcome = readableFollowUpOutcomes[outcome];
    return readableOutcome ? `${readableOutcome}${value.slice(separator)}` : value;
  }
  if (type === "STAGE_CHANGED") {
    const arrow = value.indexOf(" → ");
    if (arrow < 0) return value;
    const remainder = value.slice(arrow + 3);
    const separator = remainder.indexOf(": ");
    if (separator < 0) return value;
    const previous = value.slice(0, arrow);
    const next = remainder.slice(0, separator);
    const readablePrevious = readableStages[previous];
    const readableNext = readableStages[next];
    return readablePrevious && readableNext
      ? `${readablePrevious} → ${readableNext}${remainder.slice(separator)}`
      : value;
  }
  return value;
}

export const PASSIVE_ASSISTANT_CONTRACT = Object.freeze({
  runtimeMode: "OFF" as const,
  executable: false as const,
  actorKind: "ASSISTANT" as const,
  origin: "ASSISTANT" as const,
});

function actorKind(activity: CommercialActivity): CommercialTimelineActorKind {
  if (activity.actorKind) return activity.actorKind;
  return activity.type === "OPPORTUNITY_CREATED" ? "SYSTEM" : "HUMAN";
}

function origin(activity: CommercialActivity): CommercialTimelineOrigin {
  if (activity.origin) return activity.origin;
  return activity.type === "OPPORTUNITY_CREATED" ? "CORE" : "OPERATOR";
}

export function operationalEventId(activity: CommercialActivity): string {
  const identity = [
    activity.correlationId,
    activity.type,
    activity.occurredAt,
    activity.evidenceMessageId ?? "none",
  ].map((value) => `${Buffer.byteLength(value, "utf8")}:${value}`).join("|");
  return `activity:${createHash("md5").update(identity).digest("hex")}`;
}

export function projectOperationalEvents(item: CommercialWorkspaceItem): CommercialTimelineOperationalEvent[] {
  return item.activity
    .filter((activity): activity is CommercialActivity & { type: CommercialOperationalEventType } =>
      activity.type !== "MESSAGE_RECEIVED")
    .map((activity) => ({
      kind: "OPERATIONAL_EVENT",
      id: operationalEventId(activity),
      eventType: activity.type,
      occurredAt: activity.occurredAt,
      actor: { kind: actorKind(activity), ref: activity.actorId },
      origin: origin(activity),
      correlationId: activity.correlationId,
      evidenceMessageId: activity.evidenceMessageId,
      label: eventLabels[activity.type],
      detail: readableOperationalDetail(activity.type, activity.detail),
    }));
}

export function buildConversationTimeline(
  item: CommercialWorkspaceItem,
  operationalEvents = projectOperationalEvents(item),
): CommercialTimelineEntry[] {
  const entries: CommercialTimelineEntry[] = [
    ...item.conversation.messages.map((message) => ({
      kind: "MESSAGE" as const,
      id: `message:${message.provider}:${message.providerMessageId}`,
      occurredAt: message.occurredAt,
      message,
    })),
    ...operationalEvents,
  ];
  return entries.sort((left, right) =>
    left.occurredAt.localeCompare(right.occurredAt)
      || (left.kind === right.kind ? 0 : left.kind === "MESSAGE" ? -1 : 1)
      || left.id.localeCompare(right.id));
}

export function mergeOperationalEvents(
  sourceEvents: CommercialTimelineOperationalEvent[],
  persistedEvents: CommercialTimelineOperationalEvent[],
): CommercialTimelineOperationalEvent[] {
  const merged = new Map(sourceEvents.map((event) => [event.id, event]));
  for (const event of persistedEvents) merged.set(event.id, event);
  return [...merged.values()];
}

export function withConversationTimeline(
  item: CommercialWorkspaceItem,
  operationalEvents?: CommercialTimelineOperationalEvent[],
): CommercialWorkspaceItem {
  return { ...item, timeline: buildConversationTimeline(item, operationalEvents) };
}
