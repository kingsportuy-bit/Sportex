export type AttributionClassification = "META_EXACTO" | "DESCONOCIDO";
export type CommercialStage = "NUEVO";

export interface EvolutionReplayEvent {
  event: "messages.upsert";
  instance: string;
  data: {
    key: {
      id: string;
      remoteJid: string;
      fromMe: false;
    };
    pushName: string;
    messageTimestamp: string;
    message: {
      conversation: string;
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
  direction: "CLIENTE";
  occurredAt: string;
  receivedAt: string;
  contentType: "TEXT";
  text: string;
  evidenceRef: string;
}

export interface CommercialAttribution {
  classification: AttributionClassification;
  adId: string | null;
  sourceUrl: string | null;
  ctwaClid: string | null;
  ref: string | null;
  evidenceMessageId: string;
}

export interface CommercialConversation {
  id: string;
  tenantId: string;
  channel: "WHATSAPP";
  provider: "EVOLUTION";
  providerInstance: string;
  providerConversationRef: string;
  contactName: string;
  messages: NormalizedConversationMessage[];
  firstContactAt: string;
  lastActivityAt: string;
}

export interface CommercialLead {
  id: string;
  tenantId: string;
  conversationId: string;
  contactName: string;
  status: "ACTIVO";
  createdAt: string;
}

export interface CommercialOpportunity {
  id: string;
  tenantId: string;
  leadId: string;
  conversationId: string;
  stage: CommercialStage;
  nextAction: string;
  nextActionStatus: "PENDIENTE";
  evidenceMessageId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommercialActivity {
  type: "OPPORTUNITY_CREATED" | "MESSAGE_RECEIVED";
  occurredAt: string;
  actorId: string;
  correlationId: string;
  evidenceMessageId: string;
}

export interface CommercialWorkspaceItem {
  id: string;
  tenantId: string;
  conversation: CommercialConversation;
  attribution: CommercialAttribution;
  lead: CommercialLead;
  opportunity: CommercialOpportunity;
  activity: CommercialActivity[];
}

export interface CommercialReplayIdempotency {
  tenantId: string;
  key: string;
  requestHash: string;
  workspaceItemId: string;
}
