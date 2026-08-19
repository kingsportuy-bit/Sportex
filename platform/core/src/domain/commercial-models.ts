export type AttributionClassification = "META_EXACTO" | "DESCONOCIDO";
export type CommercialStage = string;
export type CommercialProductType = "CAMISETAS" | "EQUIPO_COMPLETO";
export type CommercialMessageDirection = "CLIENTE" | "DELTA";
export type CommercialFollowUpOutcome = "SIN_CAMBIOS" | "AVANZO" | "SIN_RESPUESTA" | "NO_CONTINUA";

const transitionMap: Record<CommercialStage, CommercialStage[]> = {
  NUEVO: ["EN_CALIFICACION", "PERDIDO"],
  EN_CALIFICACION: ["NUEVO", "COTIZADO", "PERDIDO"],
  COTIZADO: ["EN_CALIFICACION", "EN_SEGUIMIENTO", "SENA_VALIDADA", "PERDIDO"],
  EN_SEGUIMIENTO: ["COTIZADO", "SENA_VALIDADA", "PERDIDO"],
  PERDIDO: ["EN_CALIFICACION"],
  SENA_VALIDADA: ["EN_SEGUIMIENTO"],
};

export function allowedCommercialStageTransitions(stage: CommercialStage): CommercialStage[] {
  return [...(transitionMap[stage] ?? Object.keys(transitionMap))];
}

export interface EvolutionReplayEvent {
  event: "messages.upsert";
  instance: string;
  receivedAt?: string;
  sourceKind?: "FIXTURE" | "BACKFILL" | "LIVE";
  data: {
    key: {
      id: string;
      remoteJid: string;
      fromMe: boolean;
    };
    pushName: string;
    messageTimestamp: string;
    message: {
      conversation?: string;
      imageMessage?: {
        caption?: string;
        mimetype: "image/jpeg" | "image/png" | "image/webp";
        fileName: string;
        fileLength: number;
        fileSha256: string;
        width?: number;
        height?: number;
        dataBase64: string;
      };
    };
    contextInfo?: {
      externalAdReply?: {
        sourceId?: string;
        sourceUrl?: string;
        ctwaClid?: string;
        ref?: string;
      };
    };
  };
}

export interface NormalizedConversationMessage {
  id: string;
  provider: "EVOLUTION";
  providerMessageId: string;
  direction: CommercialMessageDirection;
  occurredAt: string;
  receivedAt: string;
  contentType: "TEXT" | "IMAGE";
  text: string;
  media: {
    assetId: string;
    mimeType: "image/jpeg" | "image/png" | "image/webp";
    fileName: string;
    sizeBytes: number;
    width: number | null;
    height: number | null;
  } | null;
  evidenceRef: string;
  sourceKind?: "FIXTURE" | "BACKFILL" | "LIVE";
  fixtureOnly: boolean;
}

export interface CommercialCreative {
  id: string;
  name: string;
  format: "IMAGEN" | "CARRUSEL" | "REEL" | "HISTORIA";
  title: string;
  body: string;
  visualLabel: string;
  accent: string;
}

export interface CommercialContact {
  id: string;
  tenantId: string;
  provider: "EVOLUTION";
  providerInstance: string;
  providerContactRef: string;
  displayName: string;
  normalizedPhone: string | null;
  createdAt: string;
  updatedAt: string;
  fixtureOnly: boolean;
}

export interface CommercialAttribution {
  classification: AttributionClassification;
  adId: string | null;
  adName: string | null;
  campaignId: string | null;
  campaignName: string | null;
  sourceUrl: string | null;
  ctwaClid: string | null;
  ref: string | null;
  creative: CommercialCreative | null;
  evidenceMessageId: string;
}

export interface CommercialConversation {
  id: string;
  tenantId: string;
  contactId: string;
  channel: "WHATSAPP";
  provider: "EVOLUTION";
  providerInstance: string;
  providerConversationRef: string;
  contactName: string;
  messages: NormalizedConversationMessage[];
  firstContactAt: string;
  lastActivityAt: string;
  fixtureOnly: boolean;
  unreadCount?: number;
}

export interface CommercialMediaAsset {
  id: string;
  tenantId: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  fileName: string;
  sizeBytes: number;
  sha256: string;
  width: number | null;
  height: number | null;
  dataBase64: string;
  createdAt: string;
  fixtureOnly: boolean;
}

export interface CommercialConversationReadState {
  tenantId: string;
  actorId: string;
  conversationId: string;
  lastReadMessageId: string;
  lastReadAt: string;
}

export interface CommercialSizeBreakdown {
  size: string;
  quantity: number;
}

export interface CommercialConfirmedFact {
  label: string;
  value: string;
}

export interface CommercialLead {
  id: string;
  tenantId: string;
  contactId: string;
  conversationId: string;
  contactName: string;
  teamName: string | null;
  productType: CommercialProductType | null;
  quantity: number | null;
  sizeBreakdown: CommercialSizeBreakdown[];
  colors: string[];
  personalization: string[];
  requestedDeliveryAt: string | null;
  confirmedInfo: CommercialConfirmedFact[];
  missingInfo: string[];
  status: "ACTIVO" | "PERDIDO";
  createdAt: string;
}

export interface CommercialQuoteSummary {
  version: number;
  totalCents: number;
  currency: "UYU";
  sentAt: string;
  fixtureOnly: true;
}

export interface CommercialDepositValidation {
  kind: "FIXTURE_MANUAL" | "CERTIFIED_PAYMENT";
  note: string;
  validatedAt: string;
  validatedBy: string;
  fixtureOnly: boolean;
}

export interface CommercialCoreConversion {
  clientId: string;
  certifiedPaymentId: string;
  orderId: string;
  orderNumber: string;
  evidenceReference: string;
  depositCents: number;
  quotedTotalCents: number;
  currency: "UYU";
  convertedAt: string;
  convertedBy: string;
  orderVersion?: number;
  productionReleasedAt?: string;
  productionReleasedBy?: string;
}

export interface CommercialStageHistoryEntry {
  id: string;
  from: CommercialStage | null;
  to: CommercialStage;
  reason: string;
  actorId: string;
  occurredAt: string;
}

export interface CommercialFollowUp {
  id: string;
  note: string;
  outcome: CommercialFollowUpOutcome;
  actorId: string;
  correlationId: string;
  occurredAt: string;
}

export interface CommercialOpportunity {
  id: string;
  tenantId: string;
  contactId: string;
  leadId: string;
  conversationId: string;
  stage: CommercialStage;
  allowedStageTransitions: CommercialStage[];
  nextAction: string;
  nextActionDueAt: string | null;
  nextActionStatus: "PENDIENTE" | "SIN_ACCION";
  quote: CommercialQuoteSummary | null;
  lossReason: string | null;
  depositValidation: CommercialDepositValidation | null;
  coreConversion: CommercialCoreConversion | null;
  stageHistory: CommercialStageHistoryEntry[];
  followUps: CommercialFollowUp[];
  evidenceMessageId: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommercialActivity {
  type:
    | "OPPORTUNITY_CREATED"
    | "MESSAGE_RECEIVED"
    | "STAGE_CHANGED"
    | "NEXT_ACTION_UPDATED"
    | "FOLLOW_UP_RECORDED"
    | "ORDER_CREATED"
    | "PRODUCTION_RELEASED";
  occurredAt: string;
  actorId: string;
  actorKind?: "HUMAN" | "SYSTEM" | "ASSISTANT";
  origin?: "OPERATOR" | "CORE" | "INTEGRATION" | "ASSISTANT";
  correlationId: string;
  evidenceMessageId: string | null;
  detail: string;
}

export type CommercialOperationalEventType = Exclude<CommercialActivity["type"], "MESSAGE_RECEIVED">;
export type CommercialTimelineActorKind = "HUMAN" | "SYSTEM" | "ASSISTANT";
export type CommercialTimelineOrigin = "OPERATOR" | "CORE" | "INTEGRATION" | "ASSISTANT";

export interface CommercialTimelineMessage {
  kind: "MESSAGE";
  id: string;
  occurredAt: string;
  message: NormalizedConversationMessage;
}

export interface CommercialTimelineOperationalEvent {
  kind: "OPERATIONAL_EVENT";
  id: string;
  eventType: CommercialOperationalEventType;
  occurredAt: string;
  actor: {
    kind: CommercialTimelineActorKind;
    ref: string;
  };
  origin: CommercialTimelineOrigin;
  correlationId: string;
  evidenceMessageId: string | null;
  label: string;
  detail: string;
}

export type CommercialTimelineEntry = CommercialTimelineMessage | CommercialTimelineOperationalEvent;

export interface CommercialWorkspaceItem {
  id: string;
  tenantId: string;
  contact: CommercialContact;
  conversation: CommercialConversation;
  attribution: CommercialAttribution;
  lead: CommercialLead;
  opportunity: CommercialOpportunity;
  activity: CommercialActivity[];
  timeline?: CommercialTimelineEntry[];
  fixtureVersion: "commercial-demo-v1" | null;
}

export interface CommercialReplayIdempotency {
  tenantId: string;
  key: string;
  requestHash: string;
  workspaceItemId: string;
}

export interface UpdateCommercialStageInput {
  stage: CommercialStage;
  expectedVersion: number;
  reason?: string;
}

export interface UpdateCommercialNextActionInput {
  description: string;
  dueAt: string | null;
  expectedVersion: number;
}

export interface RecordCommercialFollowUpInput {
  note: string;
  outcome: CommercialFollowUpOutcome;
  expectedVersion: number;
}

export interface ConvertCommercialOpportunityInput {
  evidenceReference: string;
  depositCents: number;
  expectedVersion: number;
}

export interface ReleaseCommercialOrderToProductionInput {
  expectedVersion: number;
  confirmation: "ENTREGAR_A_PRODUCCION";
}
