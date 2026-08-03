import { randomUUID } from "node:crypto";
import type {
  CommercialAttribution,
  CommercialReplayIdempotency,
  CommercialWorkspaceItem,
  EvolutionReplayEvent,
  NormalizedConversationMessage,
} from "../domain/commercial-models.js";
import type { ActorContext } from "../domain/models.js";
import type {
  CommercialReplayStore,
  CommercialReplayTransaction,
} from "../ports/commercial-replay-store.js";
import { requireCapability } from "../shared/authorization.js";
import { requestHash } from "../shared/canonical-json.js";
import { AppError, conflict } from "../shared/errors.js";

type Clock = () => Date;
type IdFactory = () => string;

export interface CommercialReplayResult {
  data: CommercialWorkspaceItem;
  replayed: boolean;
}

export class CommercialReplayService {
  constructor(
    private readonly store: CommercialReplayStore,
    private readonly clock: Clock = () => new Date(),
    private readonly idFactory: IdFactory = randomUUID,
  ) {}

  async replay(
    context: ActorContext,
    idempotencyKey: string,
    input: EvolutionReplayEvent,
  ): Promise<CommercialReplayResult> {
    requireCapability(context, "commercial.replay");
    this.validateIdempotencyKey(idempotencyKey);
    this.validateFixture(input);
    const hash = requestHash(input);

    return this.store.transaction(context.tenantId, async (transaction) => {
      const idempotency = await transaction.findIdempotency(idempotencyKey);
      if (idempotency) {
        if (idempotency.requestHash !== hash) {
          throw conflict("idempotency_conflict", "Idempotency key was used with another payload");
        }
        const item = await transaction.findById(idempotency.workspaceItemId);
        if (!item) throw new Error("commercial_replay_idempotency_orphaned");
        return { data: item, replayed: true };
      }

      const providerMessageId = input.data.key.id.trim();
      const duplicate = await transaction.findByProviderMessageId(providerMessageId);
      if (duplicate) {
        await this.remember(transaction, context.tenantId, idempotencyKey, hash, duplicate.id);
        return { data: duplicate, replayed: true };
      }

      const now = this.clock().toISOString();
      const message = this.normalizeMessage(input, now);
      const existing = await transaction.findByProviderConversationRef(input.data.key.remoteJid);
      const item = existing
        ? this.appendMessage(existing, message, context)
        : this.createWorkspaceItem(input, message, context);
      await transaction.save(item);
      await this.remember(transaction, context.tenantId, idempotencyKey, hash, item.id);
      return { data: item, replayed: false };
    });
  }

  async list(context: ActorContext): Promise<CommercialWorkspaceItem[]> {
    requireCapability(context, "commercial.read");
    return this.store.transaction(context.tenantId, (transaction) => transaction.list());
  }

  private createWorkspaceItem(
    input: EvolutionReplayEvent,
    message: NormalizedConversationMessage,
    context: ActorContext,
  ): CommercialWorkspaceItem {
    const itemId = this.idFactory();
    const conversationId = this.idFactory();
    const leadId = this.idFactory();
    const opportunityId = this.idFactory();
    const contactName = input.data.pushName.trim();
    const nextAction = "Revisar conversación y calificar la consulta";

    return {
      id: itemId,
      tenantId: context.tenantId,
      conversation: {
        id: conversationId,
        tenantId: context.tenantId,
        channel: "WHATSAPP",
        provider: "EVOLUTION",
        providerInstance: input.instance,
        providerConversationRef: input.data.key.remoteJid,
        contactName,
        messages: [message],
        firstContactAt: message.occurredAt,
        lastActivityAt: message.occurredAt,
      },
      attribution: this.attribution(input, message.id),
      lead: {
        id: leadId,
        tenantId: context.tenantId,
        conversationId,
        contactName,
        status: "ACTIVO",
        createdAt: message.receivedAt,
      },
      opportunity: {
        id: opportunityId,
        tenantId: context.tenantId,
        leadId,
        conversationId,
        stage: "NUEVO",
        nextAction,
        nextActionStatus: "PENDIENTE",
        evidenceMessageId: message.id,
        createdAt: message.receivedAt,
        updatedAt: message.receivedAt,
      },
      activity: [
        {
          type: "MESSAGE_RECEIVED",
          occurredAt: message.receivedAt,
          actorId: context.actorId,
          correlationId: context.correlationId,
          evidenceMessageId: message.id,
        },
        {
          type: "OPPORTUNITY_CREATED",
          occurredAt: message.receivedAt,
          actorId: context.actorId,
          correlationId: context.correlationId,
          evidenceMessageId: message.id,
        },
      ],
    };
  }

  private appendMessage(
    existing: CommercialWorkspaceItem,
    message: NormalizedConversationMessage,
    context: ActorContext,
  ): CommercialWorkspaceItem {
    return {
      ...existing,
      conversation: {
        ...existing.conversation,
        messages: [...existing.conversation.messages, message]
          .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt)),
        lastActivityAt: [existing.conversation.lastActivityAt, message.occurredAt].sort().at(-1) ?? message.occurredAt,
      },
      opportunity: {
        ...existing.opportunity,
        updatedAt: message.receivedAt,
      },
      activity: [
        ...existing.activity,
        {
          type: "MESSAGE_RECEIVED",
          occurredAt: message.receivedAt,
          actorId: context.actorId,
          correlationId: context.correlationId,
          evidenceMessageId: message.id,
        },
      ],
    };
  }

  private normalizeMessage(input: EvolutionReplayEvent, receivedAt: string): NormalizedConversationMessage {
    return {
      id: this.idFactory(),
      provider: "EVOLUTION",
      providerMessageId: input.data.key.id.trim(),
      direction: "CLIENTE",
      occurredAt: new Date(input.data.messageTimestamp).toISOString(),
      receivedAt,
      contentType: "TEXT",
      text: input.data.message.conversation.trim(),
      evidenceRef: `fixture:${input.data.key.id.trim()}`,
    };
  }

  private attribution(input: EvolutionReplayEvent, evidenceMessageId: string): CommercialAttribution {
    const external = input.data.contextInfo?.externalAdReply;
    const sourceId = external?.sourceId?.trim();
    if (!sourceId) {
      return {
        classification: "DESCONOCIDO",
        adId: null,
        sourceUrl: null,
        ctwaClid: null,
        ref: null,
        evidenceMessageId,
      };
    }
    return {
      classification: "META_EXACTO",
      adId: sourceId,
      sourceUrl: external?.sourceUrl?.trim() || null,
      ctwaClid: external?.ctwaClid?.trim() || null,
      ref: external?.ref?.trim() || null,
      evidenceMessageId,
    };
  }

  private validateFixture(input: EvolutionReplayEvent): void {
    if (input.instance !== "LOCAL_FIXTURE") {
      throw new AppError("fixture_only", 400, "Only the LOCAL_FIXTURE instance is accepted");
    }
    if (!/^contacto-ficticio-[a-z0-9-]{1,80}$/u.test(input.data.key.remoteJid)) {
      throw new AppError("fixture_only", 400, "Only fictional contact references are accepted");
    }
    if (!/^msg-ficticio-[a-z0-9-]{1,80}$/u.test(input.data.key.id)) {
      throw new AppError("fixture_only", 400, "Only fictional message IDs are accepted");
    }
    if (!input.data.message.conversation.trim()) {
      throw new AppError("invalid_payload", 400, "Message text is required");
    }
    if (Number.isNaN(Date.parse(input.data.messageTimestamp))) {
      throw new AppError("invalid_payload", 400, "messageTimestamp must be an ISO date");
    }
    const external = input.data.contextInfo?.externalAdReply;
    if (external?.sourceId && !/^ad-ficticio-[a-z0-9-]{1,80}$/u.test(external.sourceId)) {
      throw new AppError("fixture_only", 400, "Only fictional ad IDs are accepted");
    }
    if (external?.sourceUrl && new URL(external.sourceUrl).hostname !== "example.invalid") {
      throw new AppError("fixture_only", 400, "Only example.invalid source URLs are accepted");
    }
  }

  private validateIdempotencyKey(key: string): void {
    if (!key.trim()) throw new AppError("idempotency_key_required", 400, "Idempotency-Key is required");
    if (key.length > 200) throw new AppError("idempotency_key_invalid", 400, "Idempotency-Key is too long");
  }

  private async remember(
    transaction: CommercialReplayTransaction,
    tenantId: string,
    key: string,
    hash: string,
    workspaceItemId: string,
  ): Promise<void> {
    const record: CommercialReplayIdempotency = {
      tenantId,
      key,
      requestHash: hash,
      workspaceItemId,
    };
    await transaction.saveIdempotency(record);
  }
}
