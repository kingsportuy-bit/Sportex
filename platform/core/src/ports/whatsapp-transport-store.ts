import type {
  NormalizedWhatsAppIngress,
  WhatsAppOutboundRecord,
} from "../domain/whatsapp-transport-models.js";

export type WhatsAppIngressState = "PENDING" | "PROCESSED" | "QUARANTINED";

export interface WhatsAppIngressCounts {
  PENDING: number;
  PROCESSED: number;
  QUARANTINED: number;
}

export interface WhatsAppIngressJournal {
  ingest(envelope: NormalizedWhatsAppIngress): Promise<{ duplicate: boolean }>;
  pending(tenantId: string, limit?: number): Promise<NormalizedWhatsAppIngress[]>;
  markProcessed(tenantId: string, providerEventId: string): Promise<void>;
  quarantine(tenantId: string, providerEventId: string, error: unknown): Promise<void>;
  counts(tenantId: string): Promise<WhatsAppIngressCounts>;
  close(): Promise<void>;
}

export interface WhatsAppOutboundStore {
  enqueue(record: WhatsAppOutboundRecord): Promise<{ duplicate: boolean; record: WhatsAppOutboundRecord }>;
  findByProviderMessageId(tenantId: string, providerMessageId: string): Promise<WhatsAppOutboundRecord | null>;
  update(record: WhatsAppOutboundRecord): Promise<void>;
  pendingOutbound(tenantId: string, limit?: number): Promise<WhatsAppOutboundRecord[]>;
  close(): Promise<void>;
}
