import type { CommercialReplayService } from "./commercial-replay-service.js";
import type { EvolutionHttpTransport } from "../adapters/evolution/evolution-http-transport.js";
import type { ActorContext } from "../domain/models.js";
import type { WhatsAppOutboundRecord } from "../domain/whatsapp-transport-models.js";
import type { WhatsAppOutboundStore } from "../ports/whatsapp-transport-store.js";
import { requireCapability } from "../shared/authorization.js";
import { notFound } from "../shared/errors.js";

export class RealWhatsAppOutboundService {
  constructor(
    private readonly store: WhatsAppOutboundStore,
    private readonly transport: EvolutionHttpTransport,
    private readonly commercial: CommercialReplayService,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async send(
    context: ActorContext,
    itemId: string,
    text: string,
    idempotencyKey: string,
  ): Promise<{ duplicate: boolean; record: WhatsAppOutboundRecord }> {
    requireCapability(context, "commercial.manage");
    const item = (await this.commercial.list(context)).find((candidate) => candidate.id === itemId);
    if (!item) throw notFound("commercial_workspace_not_found", "Commercial workspace item was not found");
    const normalizedText = text.trim();
    if (!normalizedText) throw new Error("outbound_text_required");
    const now = this.clock().toISOString();
    const command = {
      tenantId: context.tenantId,
      conversationRef: item.conversation.providerConversationRef,
      destinationRef: item.contact.providerContactRef,
      text: normalizedText,
      idempotencyKey,
      correlationId: context.correlationId,
      confirmedBy: context.actorId,
    };
    const queued = await this.store.enqueue({
      ...command,
      providerMessageId: null,
      status: "PENDING",
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    });
    if (queued.duplicate && queued.record.providerMessageId) return queued;
    try {
      const sent = await this.transport.send(command);
      await this.store.update(sent);
      return { duplicate: queued.duplicate, record: sent };
    } catch (error) {
      const unknown: WhatsAppOutboundRecord = {
        ...queued.record,
        status: "UNKNOWN",
        attempts: queued.record.attempts + 1,
        updatedAt: this.clock().toISOString(),
      };
      await this.store.update(unknown);
      throw error;
    }
  }
}
