import type { CommercialReplayResult } from "./commercial-replay-service.js";
import { CommercialReplayService } from "./commercial-replay-service.js";
import type { EvolutionReplayEvent } from "../domain/commercial-models.js";
import type { ActorContext } from "../domain/models.js";
import type { NormalizedWhatsAppIngress } from "../domain/whatsapp-transport-models.js";

export class CommercialWhatsAppProjector {
  constructor(
    private readonly service: CommercialReplayService,
    private readonly actorId: string,
  ) {}

  async project(envelope: NormalizedWhatsAppIngress): Promise<CommercialReplayResult | null> {
    if (envelope.contentType === "RECEIPT") return null;
    if (!envelope.text) throw new Error("whatsapp_text_missing");
    const providerMessageId = envelope.metadata.providerMessageId;
    if (!providerMessageId) throw new Error("provider_message_id_missing");

    const context: ActorContext = {
      tenantId: envelope.tenantId,
      actorId: this.actorId,
      capabilities: ["commercial.replay"],
      correlationId: envelope.correlationId,
    };
    const externalAdReply = envelope.metadata.adId ? {
      sourceId: envelope.metadata.adId,
      ...(envelope.metadata.sourceUrl ? { sourceUrl: envelope.metadata.sourceUrl } : {}),
      ...(envelope.metadata.ctwaClid ? { ctwaClid: envelope.metadata.ctwaClid } : {}),
      ...(envelope.metadata.ref ? { ref: envelope.metadata.ref } : {}),
    } : undefined;
    const input: EvolutionReplayEvent = {
      event: "messages.upsert",
      instance: envelope.providerInstance,
      receivedAt: envelope.receivedAt,
      sourceKind: envelope.source === "BACKFILL" ? "BACKFILL" : "FIXTURE",
      data: {
        key: {
          id: providerMessageId,
          remoteJid: envelope.conversationRef,
          fromMe: envelope.direction === "DELTA",
        },
        pushName: envelope.metadata.pushName ?? "Contacto ficticio",
        messageTimestamp: envelope.occurredAt,
        message: { conversation: envelope.text },
        ...(externalAdReply ? { contextInfo: { externalAdReply } } : {}),
      },
    };
    return this.service.replay(context, envelope.providerEventId, input);
  }
}
