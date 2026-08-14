import { createHash } from "node:crypto";
import type { NormalizedWhatsAppIngress, WhatsAppDeliveryStatus } from "../../domain/whatsapp-transport-models.js";

type JsonObject = Record<string, unknown>;

function object(value: unknown, label: string): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label}_invalid`);
  return value as JsonObject;
}

function optionalObject(value: unknown): JsonObject | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : null;
}

function requiredString(value: unknown, label: string, max = 160): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error(`${label}_invalid`);
  return value.trim();
}

function optionalString(value: unknown, max = 240): string | null {
  return typeof value === "string" && value.trim() && value.length <= max ? value.trim() : null;
}

function isoTimestamp(value: unknown, label: string): string {
  if (typeof value === "number" || (typeof value === "string" && /^\d{10,13}$/u.test(value))) {
    const raw = Number(value);
    const milliseconds = raw < 10_000_000_000 ? raw * 1_000 : raw;
    const date = new Date(milliseconds);
    if (Number.isFinite(date.valueOf())) return date.toISOString();
  }
  if (typeof value === "string" && Number.isFinite(Date.parse(value))) return new Date(value).toISOString();
  throw new Error(`${label}_invalid`);
}

function contactJid(key: JsonObject): string {
  const primary = optionalString(key.remoteJid);
  const alternate = optionalString(key.remoteJidAlt);
  const candidate = primary?.endsWith("@lid") ? alternate : primary;
  if (!candidate || !/^\d{8,15}@s\.whatsapp\.net$/u.test(candidate)) {
    throw new Error(primary?.endsWith("@g.us") ? "evolution_group_out_of_scope" : "evolution_contact_ambiguous");
  }
  return candidate;
}

function messageText(message: JsonObject): { text: string; contextInfo: JsonObject | null } {
  const direct = optionalString(message.conversation, 4_000);
  if (direct) return { text: direct, contextInfo: null };
  const extended = optionalObject(message.extendedTextMessage);
  const extendedText = extended ? optionalString(extended.text, 4_000) : null;
  if (extendedText) return { text: extendedText, contextInfo: optionalObject(extended?.contextInfo) };
  throw new Error("evolution_message_type_out_of_scope");
}

function externalMetadata(contextInfo: JsonObject | null): Record<string, string> {
  const external = optionalObject(contextInfo?.externalAdReply);
  if (!external) return {};
  const sourceId = optionalString(external.sourceId, 160);
  const sourceUrl = optionalString(external.sourceUrl, 500);
  const ctwaClid = optionalString(external.ctwaClid, 240);
  const ref = optionalString(external.ref, 240);
  return {
    ...(sourceId ? { adId: sourceId } : {}),
    ...(sourceUrl ? { sourceUrl } : {}),
    ...(ctwaClid ? { ctwaClid } : {}),
    ...(ref ? { ref } : {}),
  };
}

function deliveryStatus(value: unknown): Exclude<WhatsAppDeliveryStatus, "PENDING"> {
  const normalized = String(value ?? "").toUpperCase();
  const map: Record<string, Exclude<WhatsAppDeliveryStatus, "PENDING">> = {
    ERROR: "FAILED",
    FAILED: "FAILED",
    PENDING: "UNKNOWN",
    SERVER_ACK: "SENT",
    SENT: "SENT",
    DELIVERY_ACK: "DELIVERED",
    DELIVERED: "DELIVERED",
    READ: "READ",
    PLAYED: "READ",
  };
  return map[normalized] ?? "UNKNOWN";
}

function deterministicId(parts: string[]): string {
  return createHash("sha256").update(parts.join("\u001f")).digest("hex");
}

export interface EvolutionWebhookAdapterOptions {
  tenantId: string;
  instance: string;
  actorId: string;
  clock?: () => Date;
}

export class EvolutionWebhookAdapter {
  private readonly clock: () => Date;

  constructor(private readonly options: EvolutionWebhookAdapterOptions) {
    this.clock = options.clock ?? (() => new Date());
  }

  normalize(payload: unknown): NormalizedWhatsAppIngress {
    const root = object(payload, "evolution_webhook");
    const event = requiredString(root.event, "evolution_event", 80).toLowerCase();
    const instance = requiredString(root.instance, "evolution_instance", 120);
    if (instance !== this.options.instance) throw new Error("evolution_instance_forbidden");
    const data = object(root.data, "evolution_data");
    const receivedAt = this.clock().toISOString();

    if (event === "messages.update") {
      const nestedKey = optionalObject(data.key);
      const messageId = requiredString(
        nestedKey?.id ?? data.keyId ?? data.messageId,
        "evolution_message_id",
        160,
      );
      const remoteJid = contactJid({
        remoteJid: nestedKey?.remoteJid ?? data.remoteJid,
        remoteJidAlt: nestedKey?.remoteJidAlt ?? data.remoteJidAlt,
      });
      const update = optionalObject(data.update);
      const status = deliveryStatus(data.status ?? update?.status);
      const occurredAt = this.optionalOccurredAt(data, receivedAt);
      const providerEventId = `messages.update:${instance}:${messageId}:${status}`;
      return this.envelope({
        eventId: deterministicId([providerEventId]),
        providerEventId,
        occurredAt,
        receivedAt,
        remoteJid,
        fromMe: true,
        contentType: "RECEIPT",
        text: null,
        metadata: { providerMessageId: messageId, deliveryStatus: status },
      });
    }

    if (event !== "messages.upsert") throw new Error("evolution_event_out_of_scope");
    const key = object(data.key, "evolution_message_key");
    const messageId = requiredString(key.id, "evolution_message_id", 160);
    const remoteJid = contactJid(key);
    const fromMe = key.fromMe === true;
    const message = object(data.message, "evolution_message");
    const extracted = messageText(message);
    const occurredAt = isoTimestamp(data.messageTimestamp, "evolution_message_timestamp");
    const providerEventId = `messages.upsert:${instance}:${messageId}`;
    const pushName = optionalString(data.pushName, 120) ?? "Contacto de WhatsApp";
    return this.envelope({
      eventId: deterministicId([providerEventId]),
      providerEventId,
      occurredAt,
      receivedAt,
      remoteJid,
      fromMe,
      contentType: "TEXT",
      text: extracted.text,
      metadata: {
        providerMessageId: messageId,
        pushName,
        ...externalMetadata(extracted.contextInfo ?? optionalObject(data.contextInfo)),
      },
    });
  }

  private envelope(input: {
    eventId: string;
    providerEventId: string;
    occurredAt: string;
    receivedAt: string;
    remoteJid: string;
    fromMe: boolean;
    contentType: "TEXT" | "RECEIPT";
    text: string | null;
    metadata: Record<string, string>;
  }): NormalizedWhatsAppIngress {
    return {
      eventId: input.eventId,
      providerEventId: input.providerEventId,
      tenantId: this.options.tenantId,
      environment: "PILOTO_DELTA",
      occurredAt: input.occurredAt,
      receivedAt: input.receivedAt,
      channel: "WHATSAPP",
      provider: "EVOLUTION",
      providerInstance: this.options.instance,
      senderRef: input.fromMe ? this.options.instance : input.remoteJid,
      conversationRef: input.remoteJid,
      direction: input.fromMe ? "DELTA" : "CLIENTE",
      contentType: input.contentType,
      contentRef: `evolution:${input.contentType.toLowerCase()}:${input.metadata.providerMessageId}`,
      text: input.text,
      source: "LIVE",
      correlationId: input.eventId,
      contractVersion: 1,
      metadata: input.metadata,
    };
  }

  private optionalOccurredAt(data: JsonObject, fallback: string): string {
    for (const candidate of [data.messageTimestamp, data.timestamp, data.dateTime]) {
      try {
        return isoTimestamp(candidate, "evolution_receipt_timestamp");
      } catch {}
    }
    return fallback;
  }
}
