import { createHash } from "node:crypto";
import type {
  NormalizedWhatsAppIngress,
  SimulatedEvolutionEvent,
  SimulatedEvolutionMessageEvent,
  WhatsAppDeliveryStatus,
  WhatsAppOutboundCommand,
  WhatsAppOutboundRecord,
} from "../../domain/whatsapp-transport-models.js";

function assertIso(value: string, label: string): void {
  if (!Number.isFinite(Date.parse(value))) throw new Error(`${label}_invalid`);
}

function assertFixtureRef(value: string, prefix: string, label: string): void {
  if (!value.startsWith(prefix) || value.length > 160) throw new Error(`${label}_invalid`);
}

export class SimulatedEvolutionAdapter {
  normalize(tenantId: string, event: SimulatedEvolutionEvent): NormalizedWhatsAppIngress {
    if (!tenantId) throw new Error("tenant_id_required");
    if (event.instance !== "LOCAL_FIXTURE") throw new Error("evolution_instance_forbidden");
    assertFixtureRef(event.eventId, "evt-ficticio-", "provider_event_id");
    assertIso(event.receivedAt, "received_at");

    if (event.event === "messages.update") {
      assertFixtureRef(event.data.key.id, "msg-ficticio-", "provider_message_id");
      assertFixtureRef(event.data.key.remoteJid, "contacto-ficticio-", "conversation_ref");
      assertIso(event.data.occurredAt, "occurred_at");
      return {
        eventId: event.eventId,
        providerEventId: event.eventId,
        tenantId,
        environment: "DESARROLLO_LOCAL",
        occurredAt: event.data.occurredAt,
        receivedAt: event.receivedAt,
        channel: "WHATSAPP",
        provider: "EVOLUTION",
        providerInstance: "LOCAL_FIXTURE",
        senderRef: "delta-ficticio",
        conversationRef: event.data.key.remoteJid,
        direction: "DELTA",
        contentType: "RECEIPT",
        contentRef: `fixture:receipt:${event.data.key.id}`,
        text: null,
        source: "SIMULATED_LIVE",
        correlationId: event.eventId,
        contractVersion: 1,
        metadata: {
          providerMessageId: event.data.key.id,
          deliveryStatus: event.data.status,
        },
      };
    }

    this.assertMessage(event);
    const external = event.data.contextInfo?.externalAdReply;
    return {
      eventId: event.eventId,
      providerEventId: event.eventId,
      tenantId,
      environment: "DESARROLLO_LOCAL",
      occurredAt: event.data.messageTimestamp,
      receivedAt: event.receivedAt,
      channel: "WHATSAPP",
      provider: "EVOLUTION",
      providerInstance: "LOCAL_FIXTURE",
      senderRef: event.data.key.fromMe ? "delta-ficticio" : event.data.key.remoteJid,
      conversationRef: event.data.key.remoteJid,
      direction: event.data.key.fromMe ? "DELTA" : "CLIENTE",
      contentType: "TEXT",
      contentRef: `fixture:message:${event.data.key.id}`,
      text: event.data.message.conversation.trim(),
      source: event.source,
      correlationId: event.eventId,
      contractVersion: 1,
      metadata: {
        providerMessageId: event.data.key.id,
        pushName: event.data.pushName.trim(),
        ...(external?.sourceId ? { adId: external.sourceId } : {}),
        ...(external?.sourceUrl ? { sourceUrl: external.sourceUrl } : {}),
        ...(external?.ctwaClid ? { ctwaClid: external.ctwaClid } : {}),
        ...(external?.ref ? { ref: external.ref } : {}),
      },
    };
  }

  private assertMessage(event: SimulatedEvolutionMessageEvent): void {
    assertFixtureRef(event.data.key.id, "msg-ficticio-", "provider_message_id");
    assertFixtureRef(event.data.key.remoteJid, "contacto-ficticio-", "conversation_ref");
    assertIso(event.data.messageTimestamp, "occurred_at");
    const text = event.data.message.conversation.trim();
    if (!text || text.length > 4_000) throw new Error("message_text_invalid");
  }
}

type IngressState = "PENDING" | "PROCESSED" | "QUARANTINED";

interface JournalEntry {
  envelope: NormalizedWhatsAppIngress;
  state: IngressState;
  error: string | null;
}

export class InMemoryEvolutionJournal {
  private readonly entries = new Map<string, JournalEntry>();

  ingest(envelope: NormalizedWhatsAppIngress): { duplicate: boolean } {
    const key = `${envelope.tenantId}:${envelope.providerEventId}`;
    if (this.entries.has(key)) return { duplicate: true };
    this.entries.set(key, { envelope: structuredClone(envelope), state: "PENDING", error: null });
    return { duplicate: false };
  }

  pending(): NormalizedWhatsAppIngress[] {
    return [...this.entries.values()]
      .filter((entry) => entry.state === "PENDING")
      .map((entry) => structuredClone(entry.envelope))
      .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt)
        || left.receivedAt.localeCompare(right.receivedAt)
        || left.eventId.localeCompare(right.eventId));
  }

  markProcessed(tenantId: string, providerEventId: string): void {
    this.required(tenantId, providerEventId).state = "PROCESSED";
  }

  quarantine(tenantId: string, providerEventId: string, error: unknown): void {
    const entry = this.required(tenantId, providerEventId);
    entry.state = "QUARANTINED";
    entry.error = error instanceof Error ? error.message : "unknown_processing_error";
  }

  counts(): Record<IngressState, number> {
    return [...this.entries.values()].reduce<Record<IngressState, number>>(
      (counts, entry) => ({ ...counts, [entry.state]: counts[entry.state] + 1 }),
      { PENDING: 0, PROCESSED: 0, QUARANTINED: 0 },
    );
  }

  private required(tenantId: string, providerEventId: string): JournalEntry {
    const entry = this.entries.get(`${tenantId}:${providerEventId}`);
    if (!entry) throw new Error("evolution_journal_entry_not_found");
    return entry;
  }
}

export class SimulatedEvolutionWorker {
  constructor(private readonly journal: InMemoryEvolutionJournal) {}

  async drain(handler: (event: NormalizedWhatsAppIngress) => Promise<void>): Promise<void> {
    for (const event of this.journal.pending()) {
      try {
        await handler(event);
        this.journal.markProcessed(event.tenantId, event.providerEventId);
      } catch (error) {
        this.journal.quarantine(event.tenantId, event.providerEventId, error);
      }
    }
  }
}

const deliveryRank: Record<WhatsAppDeliveryStatus, number> = {
  PENDING: 0,
  UNKNOWN: 0,
  SENT: 1,
  DELIVERED: 2,
  READ: 3,
  FAILED: 1,
};

function canAdvanceDelivery(current: WhatsAppDeliveryStatus, next: WhatsAppDeliveryStatus): boolean {
  if (current === "READ" || current === "FAILED") return false;
  if (next === "UNKNOWN") return current === "PENDING";
  if (next === "FAILED") return current === "PENDING" || current === "UNKNOWN" || current === "SENT";
  return deliveryRank[next] > deliveryRank[current];
}

export class FakeEvolutionOutboundTransport {
  private readonly records = new Map<string, WhatsAppOutboundRecord>();

  constructor(private outboundEnabled = false, private readonly clock = () => new Date()) {}

  setOutboundEnabled(enabled: boolean): void {
    this.outboundEnabled = enabled;
  }

  send(command: WhatsAppOutboundCommand): WhatsAppOutboundRecord {
    if (!this.outboundEnabled) throw new Error("evolution_outbound_kill_switch_active");
    const key = `${command.tenantId}:${command.idempotencyKey}`;
    const existing = this.records.get(key);
    if (existing) return structuredClone(existing);
    if (!command.confirmedBy.trim()) throw new Error("outbound_human_confirmation_required");
    assertFixtureRef(command.destinationRef, "contacto-ficticio-", "destination_ref");
    const now = this.clock().toISOString();
    const providerMessageId = `msg-ficticio-out-${createHash("sha256").update(key).digest("hex").slice(0, 24)}`;
    const record: WhatsAppOutboundRecord = {
      ...structuredClone(command),
      providerMessageId,
      status: "SENT",
      attempts: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.records.set(key, record);
    return structuredClone(record);
  }

  applyReceipt(tenantId: string, providerMessageId: string, status: Exclude<WhatsAppDeliveryStatus, "PENDING">): WhatsAppOutboundRecord {
    const found = [...this.records.entries()].find(([, record]) =>
      record.tenantId === tenantId && record.providerMessageId === providerMessageId);
    if (!found) throw new Error("outbound_message_not_found");
    const [key, record] = found;
    if (canAdvanceDelivery(record.status, status)) {
      record.status = status;
      record.updatedAt = this.clock().toISOString();
      this.records.set(key, record);
    }
    return structuredClone(record);
  }
}
