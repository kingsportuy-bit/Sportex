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

const readableTerms: Record<string, string> = {
  NUEVO: "Contacto inicial",
  EN_CALIFICACION: "Calificación",
  COTIZADO: "Cotización enviada",
  EN_SEGUIMIENTO: "Seguimiento",
  PERDIDO: "Cerrado sin venta",
  SENA_VALIDADA: "Seña validada",
  SIN_CAMBIOS: "Sin cambios",
  AVANZO: "Avanzó",
  SIN_RESPUESTA: "Sin respuesta",
  NO_CONTINUA: "No continúa",
};

export function readableOperationalDetail(type: CommercialOperationalEventType, value: string): string {
  if (type === "OPPORTUNITY_CREATED") return "Ya forma parte del seguimiento comercial.";
  return Object.entries(readableTerms).reduce(
    (detail, [technical, readable]) => detail.replaceAll(technical, readable),
    value,
  ).slice(0, 1_000);
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
