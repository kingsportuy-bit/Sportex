import { createHash } from "node:crypto";
import type {
  NormalizedWhatsAppIngress,
  SimulatedEvolutionEvent,
  SimulatedEvolutionMessageEvent,
  WhatsAppDeliveryStatus,
  WhatsAppOutboundCommand,
  WhatsAppOutboundRecord,
} from "../../domain/whatsapp-transport-models.js";
import type {
  WhatsAppIngressCounts,
  WhatsAppIngressJournal,
  WhatsAppOutboundStore,
} from "../../ports/whatsapp-transport-store.js";

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

interface JournalEntry {
  envelope: NormalizedWhatsAppIngress;
  state: keyof WhatsAppIngressCounts;
  error: string | null;
}

export class InMemoryEvolutionJournal implements WhatsAppIngressJournal {
  private readonly entries = new Map<string, JournalEntry>();

  async ingest(envelope: NormalizedWhatsAppIngress): Promise<{ duplicate: boolean }> {
    const key = `${envelope.tenantId}:${envelope.providerEventId}`;
    if (this.entries.has(key)) return { duplicate: true };
    this.entries.set(key, { envelope: structuredClone(envelope), state: "PENDING", error: null });
    return { duplicate: false };
  }

  async pending(tenantId: string, limit = 100): Promise<NormalizedWhatsAppIngress[]> {
    return [...this.entries.values()]
      .filter((entry) => entry.state === "PENDING" && entry.envelope.tenantId === tenantId)
      .map((entry) => structuredClone(entry.envelope))
      .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt)
        || left.receivedAt.localeCompare(right.receivedAt)
        || left.eventId.localeCompare(right.eventId))
      .slice(0, limit);
  }

  async markProcessed(tenantId: string, providerEventId: string): Promise<void> {
    this.required(tenantId, providerEventId).state = "PROCESSED";
  }

  async quarantine(tenantId: string, providerEventId: string, error: unknown): Promise<void> {
    const entry = this.required(tenantId, providerEventId);
    entry.state = "QUARANTINED";
    entry.error = error instanceof Error ? error.message : "unknown_processing_error";
  }

  async counts(tenantId: string): Promise<WhatsAppIngressCounts> {
    return [...this.entries.values()]
      .filter((entry) => entry.envelope.tenantId === tenantId)
      .reduce<WhatsAppIngressCounts>(
      (counts, entry) => ({ ...counts, [entry.state]: counts[entry.state] + 1 }),
      { PENDING: 0, PROCESSED: 0, QUARANTINED: 0 },
    );
  }

  async close(): Promise<void> {}

  private required(tenantId: string, providerEventId: string): JournalEntry {
    const entry = this.entries.get(`${tenantId}:${providerEventId}`);
    if (!entry) throw new Error("evolution_journal_entry_not_found");
    return entry;
  }
}

export class SimulatedEvolutionWorker {
  constructor(
    private readonly journal: WhatsAppIngressJournal,
    private readonly tenantId: string,
  ) {}

  async drain(handler: (event: NormalizedWhatsAppIngress) => Promise<void>): Promise<void> {
    for (const event of await this.journal.pending(this.tenantId)) {
      try {
        await handler(event);
        await this.journal.markProcessed(event.tenantId, event.providerEventId);
      } catch (error) {
        await this.journal.quarantine(event.tenantId, event.providerEventId, error);
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

export function canAdvanceDelivery(current: WhatsAppDeliveryStatus, next: WhatsAppDeliveryStatus): boolean {
  if (current === "READ" || current === "FAILED") return false;
  if (next === "UNKNOWN") return current === "PENDING";
  if (next === "FAILED") return current === "PENDING" || current === "UNKNOWN" || current === "SENT";
  return deliveryRank[next] > deliveryRank[current];
}

export class InMemoryWhatsAppOutboundStore implements WhatsAppOutboundStore {
  private readonly records = new Map<string, WhatsAppOutboundRecord>();

  async enqueue(record: WhatsAppOutboundRecord): Promise<{ duplicate: boolean; record: WhatsAppOutboundRecord }> {
    const key = `${record.tenantId}:${record.idempotencyKey}`;
    const existing = this.records.get(key);
    if (existing) {
      if (existing.destinationRef !== record.destinationRef || existing.text !== record.text) {
        throw new Error("whatsapp_outbound_idempotency_conflict");
      }
      return { duplicate: true, record: structuredClone(existing) };
    }
    this.records.set(key, structuredClone(record));
    return { duplicate: false, record: structuredClone(record) };
  }

  async findByProviderMessageId(tenantId: string, providerMessageId: string): Promise<WhatsAppOutboundRecord | null> {
    const record = [...this.records.values()].find((candidate) =>
      candidate.tenantId === tenantId && candidate.providerMessageId === providerMessageId);
    return record ? structuredClone(record) : null;
  }

  async findByIdempotencyKey(tenantId: string, idempotencyKey: string): Promise<WhatsAppOutboundRecord | null> {
    const record = this.records.get(`${tenantId}:${idempotencyKey}`);
    return record ? structuredClone(record) : null;
  }

  async update(record: WhatsAppOutboundRecord): Promise<void> {
    const key = `${record.tenantId}:${record.idempotencyKey}`;
    if (!this.records.has(key)) throw new Error("whatsapp_outbound_not_found");
    this.records.set(key, structuredClone(record));
  }

  async pendingOutbound(tenantId: string, limit = 100): Promise<WhatsAppOutboundRecord[]> {
    return [...this.records.values()]
      .filter((record) => record.tenantId === tenantId && ["PENDING", "UNKNOWN"].includes(record.status))
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt)
        || left.idempotencyKey.localeCompare(right.idempotencyKey))
      .slice(0, limit)
      .map((record) => structuredClone(record));
  }

  async close(): Promise<void> {}
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
