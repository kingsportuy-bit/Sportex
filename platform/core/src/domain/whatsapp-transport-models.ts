export type WhatsAppIngressSource = "SIMULATED_LIVE" | "LIVE" | "BACKFILL";
export type WhatsAppDeliveryStatus = "PENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED" | "UNKNOWN";
export type WhatsAppImageMimeType = "image/jpeg" | "image/png" | "image/webp";

export interface WhatsAppImagePayload {
  mimeType: WhatsAppImageMimeType;
  fileName: string;
  sizeBytes: number;
  sha256: string;
  dataBase64: string;
  width: number | null;
  height: number | null;
}

export interface SimulatedEvolutionMessageEvent {
  event: "messages.upsert";
  eventId: string;
  instance: "LOCAL_FIXTURE";
  source: WhatsAppIngressSource;
  receivedAt: string;
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
        mimetype: WhatsAppImageMimeType;
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

export interface SimulatedEvolutionReceiptEvent {
  event: "messages.update";
  eventId: string;
  instance: "LOCAL_FIXTURE";
  receivedAt: string;
  data: {
    key: { id: string; remoteJid: string; fromMe: true };
    status: Exclude<WhatsAppDeliveryStatus, "PENDING">;
    occurredAt: string;
  };
}

export type SimulatedEvolutionEvent = SimulatedEvolutionMessageEvent | SimulatedEvolutionReceiptEvent;

export interface NormalizedWhatsAppIngress {
  eventId: string;
  providerEventId: string;
  tenantId: string;
  environment: "DESARROLLO_LOCAL" | "PILOTO_DELTA";
  occurredAt: string;
  receivedAt: string;
  channel: "WHATSAPP";
  provider: "EVOLUTION";
  providerInstance: string;
  senderRef: string;
  conversationRef: string;
  direction: "CLIENTE" | "DELTA";
  contentType: "TEXT" | "IMAGE" | "RECEIPT";
  contentRef: string;
  text: string | null;
  image: WhatsAppImagePayload | null;
  source: WhatsAppIngressSource;
  correlationId: string;
  contractVersion: 1;
  metadata: Record<string, string>;
}

export interface WhatsAppOutboundCommand {
  tenantId: string;
  conversationRef: string;
  destinationRef: string;
  text: string;
  image?: WhatsAppImagePayload | null;
  idempotencyKey: string;
  correlationId: string;
  confirmedBy: string;
}

export interface WhatsAppOutboundRecord extends WhatsAppOutboundCommand {
  providerMessageId: string | null;
  status: WhatsAppDeliveryStatus;
  attempts: number;
  createdAt: string;
  updatedAt: string;
}
