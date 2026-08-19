import { randomUUID } from "node:crypto";
import type {
  CommercialAttribution,
  CommercialCoreConversion,
  ConvertCommercialOpportunityInput,
  CommercialReplayIdempotency,
  CommercialWorkspaceItem,
  CommercialMediaAsset,
  EvolutionReplayEvent,
  NormalizedConversationMessage,
  RecordCommercialFollowUpInput,
  ReleaseCommercialOrderToProductionInput,
  UpdateCommercialNextActionInput,
  UpdateCommercialStageInput,
} from "../domain/commercial-models.js";
import { allowedCommercialStageTransitions } from "../domain/commercial-models.js";
import { withConversationTimeline } from "../domain/commercial-timeline.js";
import type { ActorContext } from "../domain/models.js";
import type {
  CommercialReplayStore,
  CommercialReplayTransaction,
} from "../ports/commercial-replay-store.js";
import { requireCapability } from "../shared/authorization.js";
import { requestHash } from "../shared/canonical-json.js";
import { AppError, conflict, notFound } from "../shared/errors.js";
import { CoreService } from "./core-service.js";
import { normalizeWhatsAppImage } from "../domain/whatsapp-image.js";

type Clock = () => Date;
type IdFactory = () => string;
type CommercialSeedFactory = (tenantId: string) => CommercialWorkspaceItem[];

export interface CommercialReplayResult {
  data: CommercialWorkspaceItem;
  replayed: boolean;
}

export interface CommercialDemoResetResult {
  restored: number;
  fixtureVersion: "commercial-demo-v1";
}

export interface CommercialWorkspaceChange {
  tenantId: string;
  workspaceItemId: string;
  revision: number;
}

export class CommercialReplayService {
  private readonly subscribers = new Set<(change: CommercialWorkspaceChange) => void>();
  constructor(
    private readonly store: CommercialReplayStore,
    private readonly clock: Clock = () => new Date(),
    private readonly idFactory: IdFactory = randomUUID,
    private readonly seedFactory: CommercialSeedFactory | null = null,
    private readonly coreService: CoreService | null = null,
  ) {}

  subscribe(listener: (change: CommercialWorkspaceChange) => void): () => void {
    this.subscribers.add(listener);
    return () => this.subscribers.delete(listener);
  }

  private publish(item: CommercialWorkspaceItem): void {
    const change: CommercialWorkspaceChange = {
      tenantId: item.tenantId,
      workspaceItemId: item.id,
      revision: item.opportunity.version,
    };
    for (const listener of this.subscribers) listener(change);
  }

  async replay(
    context: ActorContext,
    idempotencyKey: string,
    input: EvolutionReplayEvent,
  ): Promise<CommercialReplayResult> {
    requireCapability(context, "commercial.replay");
    this.validateIdempotencyKey(idempotencyKey);
    this.validateFixture(input);
    return this.replayValidated(context, idempotencyKey, input, true);
  }

  async replayTrustedEvolution(
    context: ActorContext,
    idempotencyKey: string,
    input: EvolutionReplayEvent,
  ): Promise<CommercialReplayResult> {
    requireCapability(context, "commercial.replay");
    this.validateIdempotencyKey(idempotencyKey);
    this.validateTrustedEvolution(input);
    return this.replayValidated(context, idempotencyKey, input, false);
  }

  private async replayValidated(
    context: ActorContext,
    idempotencyKey: string,
    input: EvolutionReplayEvent,
    fixtureOnly: boolean,
  ): Promise<CommercialReplayResult> {
    const hash = requestHash(input);

    const result = await this.store.transaction(context.tenantId, async (transaction) => {
      await this.ensureSeeded(transaction, context.tenantId);
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

      const now = input.receivedAt
        ? new Date(input.receivedAt).toISOString()
        : this.clock().toISOString();
      const normalized = this.normalizeMessage(input, now, fixtureOnly, context.tenantId);
      const message = normalized.message;
      if (normalized.asset) await transaction.saveMedia(normalized.asset);
      const existing = await transaction.findByProviderConversationRef(input.data.key.remoteJid);
      if (!existing && message.direction === "DELTA") {
        throw conflict(
          "commercial_outbound_conversation_not_found",
          "An outbound message cannot create a commercial opportunity",
        );
      }
      const item = existing
        ? this.appendMessage(existing, message, context)
        : this.createWorkspaceItem(input, message, context, fixtureOnly);
      await transaction.save(item);
      await this.remember(transaction, context.tenantId, idempotencyKey, hash, item.id);
      return { data: item, replayed: false };
    });
    const data = withConversationTimeline(result.data);
    if (!result.replayed) this.publish(data);
    return { ...result, data };
  }

  async list(context: ActorContext): Promise<CommercialWorkspaceItem[]> {
    requireCapability(context, "commercial.read");
    return this.store.transaction(context.tenantId, async (transaction) => {
      await this.ensureSeeded(transaction, context.tenantId);
      const items = await transaction.list();
      return Promise.all(items.map(async (item) => {
        const readState = await transaction.findReadState(context.actorId, item.conversation.id);
        const unreadCount = this.unreadCount(item, readState?.lastReadMessageId ?? null);
        const view = { ...item, conversation: { ...item.conversation, unreadCount } };
        return view.timeline ? view : withConversationTimeline(view);
      }));
    });
  }

  async listPage(context: ActorContext, limit: number, cursor: string | null): Promise<{ items: CommercialWorkspaceItem[]; nextCursor: string | null }> {
    requireCapability(context, "commercial.read");
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new AppError("invalid_payload", 400, "Invalid conversation page size");
    return this.store.transaction(context.tenantId, async (transaction) => {
      await this.ensureSeeded(transaction, context.tenantId);
      return transaction.listPage(context.actorId, limit, cursor);
    });
  }

  async get(context: ActorContext, itemId: string): Promise<CommercialWorkspaceItem> {
    requireCapability(context, "commercial.read");
    return this.store.transaction(context.tenantId, async (transaction) => {
      await this.ensureSeeded(transaction, context.tenantId);
      return withConversationTimeline(await this.requiredItem(transaction, itemId));
    });
  }

  async markConversationRead(context: ActorContext, itemId: string): Promise<CommercialWorkspaceItem> {
    requireCapability(context, "commercial.read");
    const result = await this.store.transaction(context.tenantId, async (transaction) => {
      await this.ensureSeeded(transaction, context.tenantId);
      const item = await this.requiredItem(transaction, itemId);
      const latestInbound = [...item.conversation.messages].reverse().find((message) => message.direction === "CLIENTE");
      if (latestInbound) {
        await transaction.saveReadState({
          tenantId: context.tenantId,
          actorId: context.actorId,
          conversationId: item.conversation.id,
          lastReadMessageId: latestInbound.id,
          lastReadAt: this.clock().toISOString(),
        });
      }
      return withConversationTimeline({
        ...item,
        conversation: { ...item.conversation, unreadCount: 0 },
      });
    });
    return result;
  }

  async media(context: ActorContext, messageId: string): Promise<CommercialMediaAsset> {
    requireCapability(context, "commercial.read");
    const result = await this.store.transaction(context.tenantId, async (transaction) => {
      const asset = await transaction.findMediaByMessageId(messageId);
      if (!asset) throw notFound("commercial_media_not_found", "WhatsApp image was not found");
      return asset;
    });
    return result;
  }

  async updateStage(
    context: ActorContext,
    itemId: string,
    input: UpdateCommercialStageInput,
  ): Promise<CommercialWorkspaceItem> {
    requireCapability(context, "commercial.manage");
    // Las columnas son configuración de Core. La proyección comercial sólo puede
    // asignar una etapa que exista para esta empresa; nunca inventa ids desde UI.
    if (this.coreService) {
      const stages = await this.coreService.listStageDefinitions(context, "lead");
      if (!stages.some((stage) => stage.id === input.stage)) {
        throw conflict("commercial_stage_not_configured", "Lead stage is not configured for this company", { to: input.stage });
      }
    }
    const result = await this.store.transaction(context.tenantId, async (transaction) => {
      await this.ensureSeeded(transaction, context.tenantId);
      const item = await this.requiredItem(transaction, itemId);
      this.requireVersion(item, input.expectedVersion);
      if (item.opportunity.stage === input.stage) return withConversationTimeline(item);
      const customStage = !["NUEVO", "EN_CALIFICACION", "COTIZADO", "EN_SEGUIMIENTO", "SENA_VALIDADA", "PERDIDO"].includes(input.stage);
      if (!customStage && !allowedCommercialStageTransitions(item.opportunity.stage).includes(input.stage)) {
        throw conflict("commercial_stage_transition_invalid", "Commercial stage transition is not allowed", {
          from: item.opportunity.stage,
          to: input.stage,
        });
      }

      const now = this.clock().toISOString();
      const reason = input.reason?.trim() || "Cambio manual en la demo CRM local";
      const previous = item.opportunity.stage;
      const updated: CommercialWorkspaceItem = {
        ...item,
        lead: {
          ...item.lead,
          status: input.stage === "PERDIDO" ? "PERDIDO" : "ACTIVO",
        },
        opportunity: {
          ...item.opportunity,
          stage: input.stage,
          allowedStageTransitions: allowedCommercialStageTransitions(input.stage),
          nextActionStatus: input.stage === "PERDIDO" ? "SIN_ACCION" : "PENDIENTE",
          lossReason: input.stage === "PERDIDO" ? reason : null,
          depositValidation: input.stage === "SENA_VALIDADA" ? {
            kind: "FIXTURE_MANUAL",
            note: "Validación manual ficticia; no certifica un pago ni crea un pedido.",
            validatedAt: now,
            validatedBy: context.actorId,
            fixtureOnly: true,
          } : null,
          coreConversion: input.stage === "SENA_VALIDADA" ? item.opportunity.coreConversion : null,
          stageHistory: [
            ...item.opportunity.stageHistory,
            {
              id: this.idFactory(),
              from: previous,
              to: input.stage,
              reason,
              actorId: context.actorId,
              occurredAt: now,
            },
          ],
          version: item.opportunity.version + 1,
          updatedAt: now,
        },
        activity: [
          ...item.activity,
          {
            type: "STAGE_CHANGED",
            occurredAt: now,
            actorId: context.actorId,
            actorKind: "HUMAN",
            origin: "OPERATOR",
            correlationId: context.correlationId,
            evidenceMessageId: null,
            detail: `${previous} → ${input.stage}: ${reason}`,
          },
        ],
      };
      await transaction.save(updated);
      return withConversationTimeline(updated);
    });
    this.publish(result);
    return result;
  }

  async reassignStageForConfiguration(
    context: ActorContext,
    fromStage: string,
    toStage: string,
  ): Promise<number> {
    requireCapability(context, "commercial.manage");
    if (fromStage === toStage) throw new AppError("stage_definition_reassignment_required", 409, "Choose another destination stage");
    if (this.coreService) {
      const stages = await this.coreService.listStageDefinitions(context, "lead");
      if (!stages.some((stage) => stage.id === toStage)) {
        throw conflict("commercial_stage_not_configured", "Lead stage is not configured for this company", { to: toStage });
      }
    }
    return this.store.transaction(context.tenantId, async (transaction) => {
      await this.ensureSeeded(transaction, context.tenantId);
      const affected = (await transaction.list()).filter((item) => item.opportunity.stage === fromStage);
      const now = this.clock().toISOString();
      for (const item of affected) {
        const updated: CommercialWorkspaceItem = {
          ...item,
          lead: { ...item.lead, status: toStage === "PERDIDO" ? "PERDIDO" : "ACTIVO" },
          opportunity: {
            ...item.opportunity, stage: toStage,
            allowedStageTransitions: allowedCommercialStageTransitions(toStage),
            version: item.opportunity.version + 1, updatedAt: now,
            stageHistory: [...item.opportunity.stageHistory, {
              id: this.idFactory(), from: fromStage, to: toStage,
              reason: "Columna eliminada", actorId: context.actorId, occurredAt: now,
            }],
          },
          activity: [...item.activity, {
            type: "STAGE_CHANGED", occurredAt: now, actorId: context.actorId, actorKind: "HUMAN", origin: "OPERATOR",
            correlationId: context.correlationId, evidenceMessageId: null, detail: `${fromStage} → ${toStage}: Columna eliminada`,
          }],
        };
        await transaction.save(updated);
      }
      return affected.length;
    });
  }

  async updateNextAction(
    context: ActorContext,
    itemId: string,
    input: UpdateCommercialNextActionInput,
  ): Promise<CommercialWorkspaceItem> {
    requireCapability(context, "commercial.manage");
    return this.store.transaction(context.tenantId, async (transaction) => {
      await this.ensureSeeded(transaction, context.tenantId);
      const item = await this.requiredItem(transaction, itemId);
      this.requireVersion(item, input.expectedVersion);
      const now = this.clock().toISOString();
      const description = input.description.trim();
      const updated: CommercialWorkspaceItem = {
        ...item,
        opportunity: {
          ...item.opportunity,
          nextAction: description,
          nextActionDueAt: input.dueAt,
          nextActionStatus: /^sin próxima acción/iu.test(description) ? "SIN_ACCION" : "PENDIENTE",
          version: item.opportunity.version + 1,
          updatedAt: now,
        },
        activity: [
          ...item.activity,
          {
            type: "NEXT_ACTION_UPDATED",
            occurredAt: now,
            actorId: context.actorId,
            actorKind: "HUMAN",
            origin: "OPERATOR",
            correlationId: context.correlationId,
            evidenceMessageId: null,
            detail: input.dueAt ? `${description} · ${input.dueAt}` : description,
          },
        ],
      };
      await transaction.save(updated);
      return withConversationTimeline(updated);
    });
  }

  async recordFollowUp(
    context: ActorContext,
    itemId: string,
    input: RecordCommercialFollowUpInput,
  ): Promise<CommercialWorkspaceItem> {
    requireCapability(context, "commercial.manage");
    return this.store.transaction(context.tenantId, async (transaction) => {
      await this.ensureSeeded(transaction, context.tenantId);
      const item = await this.requiredItem(transaction, itemId);
      this.requireVersion(item, input.expectedVersion);
      const now = this.clock().toISOString();
      const followUp = {
        id: this.idFactory(),
        note: input.note.trim(),
        outcome: input.outcome,
        actorId: context.actorId,
        correlationId: context.correlationId,
        occurredAt: now,
      };
      const updated: CommercialWorkspaceItem = {
        ...item,
        opportunity: {
          ...item.opportunity,
          followUps: [...item.opportunity.followUps, followUp],
          version: item.opportunity.version + 1,
          updatedAt: now,
        },
        activity: [
          ...item.activity,
          {
            type: "FOLLOW_UP_RECORDED",
            occurredAt: now,
            actorId: context.actorId,
            actorKind: "HUMAN",
            origin: "OPERATOR",
            correlationId: context.correlationId,
            evidenceMessageId: null,
            detail: `${input.outcome}: ${followUp.note}`,
          },
        ],
      };
      await transaction.save(updated);
      return withConversationTimeline(updated);
    });
  }

  async convertValidatedOpportunity(
    context: ActorContext,
    itemId: string,
    input: ConvertCommercialOpportunityInput,
  ): Promise<CommercialWorkspaceItem> {
    requireCapability(context, "commercial.manage");
    if (!this.coreService) throw notFound("commercial_core_unavailable", "Commercial Core conversion is unavailable");

    const snapshot = await this.store.transaction(context.tenantId, async (transaction) => {
      await this.ensureSeeded(transaction, context.tenantId);
      const item = await this.requiredItem(transaction, itemId);
      if (item.opportunity.coreConversion) {
        this.requireSameConversion(item.opportunity.coreConversion, input);
        return item;
      }
      this.requireVersion(item, input.expectedVersion);
      const convertibleStage = item.opportunity.stage === "SENA_VALIDADA"
        || item.opportunity.stage === "COTIZADO"
        || item.opportunity.stage === "EN_SEGUIMIENTO";
      if (!convertibleStage) {
        throw conflict("commercial_deposit_not_validated", "The opportunity requires a validated deposit");
      }
      if (!item.opportunity.quote || !item.lead.teamName) {
        throw conflict("commercial_order_data_incomplete", "The opportunity requires a quote and team name");
      }
      return item;
    });
    if (snapshot.opportunity.coreConversion) return withConversationTimeline(snapshot);

    const quote = snapshot.opportunity.quote;
    const teamName = snapshot.lead.teamName;
    if (!quote || !teamName) throw new Error("commercial_conversion_precondition_lost");
    const keyPrefix = `commercial:${snapshot.opportunity.id}`;
    const client = await this.coreService.createClient(context, `${keyPrefix}:client`, {
      displayName: snapshot.lead.contactName,
      teamName,
    });
    const payment = await this.coreService.certifyPayment(context, `${keyPrefix}:payment`, {
      clientId: client.data.id,
      evidenceReference: input.evidenceReference,
      amountCents: input.depositCents,
      currency: quote.currency,
    });
    const order = await this.coreService.createOrderFromCertifiedPayment(context, `${keyPrefix}:order`, {
      clientId: client.data.id,
      certifiedPaymentId: payment.data.id,
      teamName,
      quotedTotalCents: quote.totalCents,
      currency: quote.currency,
      details: {
        product: snapshot.lead.productType === "CAMISETAS" ? "Camisetas" : snapshot.lead.productType === "EQUIPO_COMPLETO" ? "Equipo completo" : null,
        quantity: snapshot.lead.quantity,
        colors: snapshot.lead.colors,
        sizes: snapshot.lead.sizeBreakdown.length
          ? snapshot.lead.sizeBreakdown.map((entry) => `${entry.size}: ${entry.quantity}`).join(", ")
          : null,
        notes: snapshot.lead.personalization.length ? `Personalización: ${snapshot.lead.personalization.join(", ")}` : null,
        currentSketch: null,
      },
    });

    return this.store.transaction(context.tenantId, async (transaction) => {
      const current = await this.requiredItem(transaction, itemId);
      if (current.opportunity.coreConversion) {
        this.requireSameConversion(current.opportunity.coreConversion, input);
        return current;
      }
      this.requireVersion(current, input.expectedVersion);
      const convertedAt = this.clock().toISOString();
      const conversion: CommercialCoreConversion = {
        clientId: client.data.id,
        certifiedPaymentId: payment.data.id,
        orderId: order.data.id,
        orderNumber: order.data.orderNumber,
        evidenceReference: input.evidenceReference.trim(),
        depositCents: input.depositCents,
        quotedTotalCents: quote.totalCents,
        currency: quote.currency,
        convertedAt,
        convertedBy: context.actorId,
        orderVersion: order.data.version,
      };
      const updated: CommercialWorkspaceItem = {
        ...current,
        opportunity: {
          ...current.opportunity,
          stage: "SENA_VALIDADA",
          allowedStageTransitions: allowedCommercialStageTransitions("SENA_VALIDADA"),
          depositValidation: {
            kind: "CERTIFIED_PAYMENT",
            note: `Seña certificada con referencia ${input.evidenceReference.trim()}.`,
            validatedAt: convertedAt,
            validatedBy: context.actorId,
            fixtureOnly: false,
          },
          coreConversion: conversion,
          nextAction: "Preparar el pedido para producción",
          nextActionDueAt: null,
          nextActionStatus: "PENDIENTE",
          version: current.opportunity.version + 1,
          updatedAt: convertedAt,
          stageHistory: current.opportunity.stage === "SENA_VALIDADA" ? current.opportunity.stageHistory : [
            ...current.opportunity.stageHistory,
            {
              id: this.idFactory(),
              from: current.opportunity.stage,
              to: "SENA_VALIDADA",
              reason: "Seña certificada y pedido creado desde SPORTEX",
              actorId: context.actorId,
              occurredAt: convertedAt,
            },
          ],
        },
        activity: [...current.activity, {
          type: "ORDER_CREATED",
          occurredAt: convertedAt,
          actorId: context.actorId,
          actorKind: "HUMAN",
          origin: "OPERATOR",
          correlationId: context.correlationId,
          evidenceMessageId: current.opportunity.evidenceMessageId,
          detail: `Pedido ${order.data.orderNumber} creado desde la seña validada.`,
        }],
      };
      await transaction.save(updated);
      return withConversationTimeline(updated);
    });
  }

  async releaseOrderToProduction(
    context: ActorContext,
    itemId: string,
    input: ReleaseCommercialOrderToProductionInput,
  ): Promise<CommercialWorkspaceItem> {
    requireCapability(context, "commercial.manage");
    if (!this.coreService) throw notFound("commercial_core_unavailable", "Commercial Core conversion is unavailable");

    const snapshot = await this.store.transaction(context.tenantId, async (transaction) => {
      await this.ensureSeeded(transaction, context.tenantId);
      const item = await this.requiredItem(transaction, itemId);
      const conversion = item.opportunity.coreConversion;
      if (!conversion) throw conflict("commercial_order_required", "The opportunity requires a linked order");
      if (conversion.productionReleasedAt) return item;
      this.requireVersion(item, input.expectedVersion);
      return item;
    });
    const conversion = snapshot.opportunity.coreConversion;
    if (!conversion || conversion.productionReleasedAt) return withConversationTimeline(snapshot);

    const released = await this.coreService.releaseOrderToProduction(
      context,
      conversion.orderId,
      `commercial:${snapshot.opportunity.id}:production-release`,
      {
        expectedVersion: conversion.orderVersion ?? 1,
        confirmation: input.confirmation,
      },
    );

    return this.store.transaction(context.tenantId, async (transaction) => {
      const current = await this.requiredItem(transaction, itemId);
      const currentConversion = current.opportunity.coreConversion;
      if (!currentConversion) throw conflict("commercial_order_required", "The opportunity requires a linked order");
      if (currentConversion.productionReleasedAt) return current;
      this.requireVersion(current, input.expectedVersion);
      const releasedAt = this.clock().toISOString();
      const updated: CommercialWorkspaceItem = {
        ...current,
        opportunity: {
          ...current.opportunity,
          coreConversion: {
            ...currentConversion,
            orderVersion: released.data.version,
            productionReleasedAt: releasedAt,
            productionReleasedBy: context.actorId,
          },
          nextAction: "Coordinar la primera etapa de producción",
          nextActionDueAt: null,
          nextActionStatus: "PENDIENTE",
          version: current.opportunity.version + 1,
          updatedAt: releasedAt,
        },
        activity: [...current.activity, {
          type: "PRODUCTION_RELEASED",
          occurredAt: releasedAt,
          actorId: context.actorId,
          actorKind: "HUMAN",
          origin: "OPERATOR",
          correlationId: context.correlationId,
          evidenceMessageId: current.opportunity.evidenceMessageId,
          detail: `Pedido ${released.data.orderNumber} entregado a producción.`,
        }],
      };
      await transaction.save(updated);
      return withConversationTimeline(updated);
    });
  }

  async resetDemo(context: ActorContext, confirmation: string): Promise<CommercialDemoResetResult> {
    requireCapability(context, "commercial.manage");
    if (confirmation !== "RESTAURAR_DATOS_FICTICIOS") {
      throw new AppError("commercial_demo_confirmation_required", 400, "Exact reset confirmation is required");
    }
    if (!this.seedFactory) throw notFound("commercial_demo_unavailable", "Commercial demo is unavailable");
    const seed = this.seedFactory(context.tenantId);
    await this.store.transaction(context.tenantId, (transaction) => transaction.replaceTenant(seed));
    return { restored: seed.length, fixtureVersion: "commercial-demo-v1" };
  }

  private async ensureSeeded(transaction: CommercialReplayTransaction, tenantId: string): Promise<void> {
    if (!this.seedFactory) return;
    const existing = await transaction.list();
    if (existing.length === 0) await transaction.replaceTenant(this.seedFactory(tenantId));
  }

  private async requiredItem(
    transaction: CommercialReplayTransaction,
    itemId: string,
  ): Promise<CommercialWorkspaceItem> {
    const item = await transaction.findById(itemId);
    if (!item) throw notFound("commercial_workspace_not_found", "Commercial workspace item was not found");
    return item;
  }

  private requireVersion(item: CommercialWorkspaceItem, expectedVersion: number): void {
    if (item.opportunity.version !== expectedVersion) {
      throw conflict("commercial_version_conflict", "Commercial workspace version changed", {
        expectedVersion,
        currentVersion: item.opportunity.version,
      });
    }
  }

  private requireSameConversion(
    conversion: CommercialCoreConversion,
    input: ConvertCommercialOpportunityInput,
  ): void {
    if (conversion.evidenceReference !== input.evidenceReference.trim()
      || conversion.depositCents !== input.depositCents) {
      throw conflict("commercial_conversion_conflict", "The opportunity was already converted with other payment data");
    }
  }

  private createWorkspaceItem(
    input: EvolutionReplayEvent,
    message: NormalizedConversationMessage,
    context: ActorContext,
    fixtureOnly: boolean,
  ): CommercialWorkspaceItem {
    const itemId = this.idFactory();
    const contactId = this.idFactory();
    const conversationId = this.idFactory();
    const leadId = this.idFactory();
    const opportunityId = this.idFactory();
    const contactName = input.data.pushName.trim();
    const nextAction = "Revisar conversación y calificar la consulta";

    return {
      id: itemId,
      tenantId: context.tenantId,
      contact: {
        id: contactId,
        tenantId: context.tenantId,
        provider: "EVOLUTION",
        providerInstance: input.instance,
        providerContactRef: input.data.key.remoteJid,
        displayName: contactName,
        normalizedPhone: null,
        createdAt: message.receivedAt,
        updatedAt: message.receivedAt,
        fixtureOnly,
      },
      conversation: {
        id: conversationId,
        tenantId: context.tenantId,
        contactId,
        channel: "WHATSAPP",
        provider: "EVOLUTION",
        providerInstance: input.instance,
        providerConversationRef: input.data.key.remoteJid,
        contactName,
        messages: [message],
        firstContactAt: message.occurredAt,
        lastActivityAt: message.occurredAt,
        fixtureOnly,
      },
      attribution: this.attribution(input, message.id),
      lead: {
        id: leadId,
        tenantId: context.tenantId,
        contactId,
        conversationId,
        contactName,
        teamName: null,
        productType: null,
        quantity: null,
        sizeBreakdown: [],
        colors: [],
        personalization: [],
        requestedDeliveryAt: null,
        confirmedInfo: [{ label: "Contacto", value: contactName }],
        missingInfo: ["Equipo", "Producto", "Cantidad", "Talles", "Fecha solicitada"],
        status: "ACTIVO",
        createdAt: message.receivedAt,
      },
      opportunity: {
        id: opportunityId,
        tenantId: context.tenantId,
        contactId,
        leadId,
        conversationId,
        stage: "NUEVO",
        allowedStageTransitions: allowedCommercialStageTransitions("NUEVO"),
        nextAction,
        nextActionDueAt: null,
        nextActionStatus: "PENDIENTE",
        quote: null,
        lossReason: null,
        depositValidation: null,
        coreConversion: null,
        stageHistory: [{
          id: this.idFactory(),
          from: null,
          to: "NUEVO",
          reason: fixtureOnly ? "Oportunidad creada desde replay ficticio local" : "Oportunidad creada desde WhatsApp",
          actorId: context.actorId,
          occurredAt: message.receivedAt,
        }],
        followUps: [],
        evidenceMessageId: message.id,
        version: 1,
        createdAt: message.receivedAt,
        updatedAt: message.receivedAt,
      },
      activity: [
        {
          type: "MESSAGE_RECEIVED",
          occurredAt: message.receivedAt,
          actorId: context.actorId,
          actorKind: "SYSTEM",
          origin: "INTEGRATION",
          correlationId: context.correlationId,
          evidenceMessageId: message.id,
          detail: fixtureOnly ? "Mensaje ficticio normalizado por el Core." : "Mensaje de WhatsApp normalizado por el Core.",
        },
        {
          type: "OPPORTUNITY_CREATED",
          occurredAt: message.receivedAt,
          actorId: context.actorId,
          actorKind: "SYSTEM",
          origin: "CORE",
          correlationId: context.correlationId,
          evidenceMessageId: message.id,
          detail: fixtureOnly ? "Lead y oportunidad creados desde replay ficticio local." : "Lead y oportunidad creados desde WhatsApp.",
        },
      ],
      fixtureVersion: null,
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
        version: existing.opportunity.version + 1,
        updatedAt: message.receivedAt,
      },
      activity: [
        ...existing.activity,
        {
          type: "MESSAGE_RECEIVED",
          occurredAt: message.receivedAt,
          actorId: context.actorId,
          actorKind: "SYSTEM",
          origin: "INTEGRATION",
          correlationId: context.correlationId,
          evidenceMessageId: message.id,
          detail: existing.fixtureVersion
            ? "Mensaje ficticio agregado a la conversación normalizada."
            : "Mensaje de WhatsApp agregado a la conversación normalizada.",
        },
      ],
    };
  }

  private normalizeMessage(
    input: EvolutionReplayEvent,
    receivedAt: string,
    fixtureOnly: boolean,
    tenantId: string,
  ): { message: NormalizedConversationMessage; asset: CommercialMediaAsset | null } {
    const image = input.data.message.imageMessage;
    const assetId = image ? this.idFactory() : null;
    const message: NormalizedConversationMessage = {
      id: this.idFactory(),
      provider: "EVOLUTION",
      providerMessageId: input.data.key.id.trim(),
      direction: input.data.key.fromMe ? "DELTA" : "CLIENTE",
      occurredAt: new Date(input.data.messageTimestamp).toISOString(),
      receivedAt,
      contentType: image ? "IMAGE" : "TEXT",
      text: image?.caption?.trim() ?? input.data.message.conversation?.trim() ?? "",
      media: image && assetId ? {
        assetId,
        mimeType: image.mimetype,
        fileName: image.fileName,
        sizeBytes: image.fileLength,
        width: image.width ?? null,
        height: image.height ?? null,
      } : null,
      evidenceRef: `${fixtureOnly ? "fixture" : "evolution"}:${input.data.key.id.trim()}`,
      sourceKind: input.sourceKind ?? "FIXTURE",
      fixtureOnly,
    };
    const asset: CommercialMediaAsset | null = image && assetId ? {
      id: assetId,
      tenantId,
      mimeType: image.mimetype,
      fileName: image.fileName,
      sizeBytes: image.fileLength,
      sha256: image.fileSha256,
      width: image.width ?? null,
      height: image.height ?? null,
      dataBase64: image.dataBase64,
      createdAt: receivedAt,
      fixtureOnly,
    } : null;
    return { message, asset };
  }

  private attribution(input: EvolutionReplayEvent, evidenceMessageId: string): CommercialAttribution {
    const external = input.data.contextInfo?.externalAdReply;
    const sourceId = external?.sourceId?.trim();
    if (!sourceId) {
      return {
        classification: "DESCONOCIDO",
        adId: null,
        adName: null,
        campaignId: null,
        campaignName: null,
        sourceUrl: null,
        ctwaClid: null,
        ref: null,
        creative: null,
        evidenceMessageId,
      };
    }
    return {
      classification: "META_EXACTO",
      adId: sourceId,
      adName: null,
      campaignId: null,
      campaignName: null,
      sourceUrl: external?.sourceUrl?.trim() || null,
      ctwaClid: external?.ctwaClid?.trim() || null,
      ref: external?.ref?.trim() || null,
      creative: null,
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
    this.validateMessageContent(input);
    if (Number.isNaN(Date.parse(input.data.messageTimestamp))) {
      throw new AppError("invalid_payload", 400, "messageTimestamp must be an ISO date");
    }
    if (input.receivedAt && Number.isNaN(Date.parse(input.receivedAt))) {
      throw new AppError("invalid_payload", 400, "receivedAt must be an ISO date");
    }
    const external = input.data.contextInfo?.externalAdReply;
    if (external?.sourceId && !/^ad-ficticio-[a-z0-9-]{1,80}$/u.test(external.sourceId)) {
      throw new AppError("fixture_only", 400, "Only fictional ad IDs are accepted");
    }
    if (external?.sourceUrl && new URL(external.sourceUrl).hostname !== "example.invalid") {
      throw new AppError("fixture_only", 400, "Only example.invalid source URLs are accepted");
    }
  }

  private validateTrustedEvolution(input: EvolutionReplayEvent): void {
    if (input.instance !== "DELTA") {
      throw new AppError("evolution_instance_forbidden", 400, "Evolution instance is not allowed");
    }
    if (!/^\d{8,15}@s\.whatsapp\.net$/u.test(input.data.key.remoteJid)) {
      throw new AppError("evolution_contact_invalid", 400, "WhatsApp contact reference is invalid");
    }
    if (!input.data.key.id.trim() || input.data.key.id.length > 160) {
      throw new AppError("evolution_message_id_invalid", 400, "Evolution message ID is invalid");
    }
    this.validateMessageContent(input);
    if (Number.isNaN(Date.parse(input.data.messageTimestamp))) {
      throw new AppError("invalid_payload", 400, "messageTimestamp must be an ISO date");
    }
    if (input.receivedAt && Number.isNaN(Date.parse(input.receivedAt))) {
      throw new AppError("invalid_payload", 400, "receivedAt must be an ISO date");
    }
  }

  private validateIdempotencyKey(key: string): void {
    if (!key.trim()) throw new AppError("idempotency_key_required", 400, "Idempotency-Key is required");
    if (key.length > 200) throw new AppError("idempotency_key_invalid", 400, "Idempotency-Key is too long");
  }

  private validateMessageContent(input: EvolutionReplayEvent): void {
    const text = input.data.message.conversation?.trim();
    const image = input.data.message.imageMessage;
    if (!text && !image) throw new AppError("invalid_payload", 400, "Message content is required");
    if (image) {
      if (!image.dataBase64 || image.fileLength <= 0 || image.fileLength > 5 * 1024 * 1024) {
        throw new AppError("whatsapp_image_invalid", 400, "WhatsApp image is invalid");
      }
      if (!/^[a-f0-9]{64}$/u.test(image.fileSha256)) {
        throw new AppError("whatsapp_image_invalid", 400, "WhatsApp image checksum is invalid");
      }
      try {
        const normalized = normalizeWhatsAppImage({
          mimeType: image.mimetype, fileName: image.fileName, dataBase64: image.dataBase64,
          ...(image.width ? { width: image.width } : {}), ...(image.height ? { height: image.height } : {}),
        });
        if (normalized.sha256 !== image.fileSha256 || normalized.sizeBytes !== image.fileLength) {
          throw new Error("whatsapp_image_integrity_invalid");
        }
      } catch {
        throw new AppError("whatsapp_image_invalid", 400, "WhatsApp image integrity is invalid");
      }
    }
  }

  private unreadCount(item: CommercialWorkspaceItem, lastReadMessageId: string | null): number {
    const messages = item.conversation.messages;
    const cursor = lastReadMessageId ? messages.findIndex((message) => message.id === lastReadMessageId) : -1;
    return messages.slice(cursor + 1).filter((message) => message.direction === "CLIENTE").length;
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
