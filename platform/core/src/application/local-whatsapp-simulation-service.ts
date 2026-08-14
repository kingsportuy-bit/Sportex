import type { CommercialWorkspaceItem } from "../domain/commercial-models.js";
import type { ActorContext } from "../domain/models.js";
import type { SimulatedEvolutionEvent } from "../domain/whatsapp-transport-models.js";
import {
  FakeEvolutionOutboundTransport,
  InMemoryEvolutionJournal,
  InMemoryWhatsAppOutboundStore,
  SimulatedEvolutionAdapter,
  SimulatedEvolutionWorker,
} from "../adapters/evolution/simulated-evolution-adapter.js";
import { notFound } from "../shared/errors.js";
import { requireCapability } from "../shared/authorization.js";
import { CommercialReplayService } from "./commercial-replay-service.js";
import { CommercialWhatsAppProjector } from "./commercial-whatsapp-projector.js";
import { SimulatedWhatsAppOutboundService } from "./simulated-whatsapp-outbound-service.js";

type Clock = () => Date;

export class LocalWhatsAppSimulationService {
  private readonly adapter = new SimulatedEvolutionAdapter();
  private readonly journal = new InMemoryEvolutionJournal();
  private readonly outboundStore = new InMemoryWhatsAppOutboundStore();
  private readonly transport: FakeEvolutionOutboundTransport;
  private readonly outbound: SimulatedWhatsAppOutboundService;

  constructor(
    private readonly commercial: CommercialReplayService,
    private readonly clock: Clock = () => new Date(),
  ) {
    this.transport = new FakeEvolutionOutboundTransport(true, clock);
    this.outbound = new SimulatedWhatsAppOutboundService(this.outboundStore, this.transport, clock);
  }

  async ingest(context: ActorContext, event: SimulatedEvolutionEvent): Promise<{ duplicate: boolean }> {
    const envelope = this.adapter.normalize(context.tenantId, event);
    const result = await this.journal.ingest(envelope);
    await new SimulatedEvolutionWorker(this.journal, context.tenantId).drain(
      (entry) => new CommercialWhatsAppProjector(this.commercial, context.actorId)
        .project(entry)
        .then(() => undefined),
    );
    return result;
  }

  async send(
    context: ActorContext,
    itemId: string,
    text: string,
    idempotencyKey: string,
  ): Promise<CommercialWorkspaceItem> {
    requireCapability(context, "commercial.manage");
    const item = await this.requiredItem(context, itemId);
    const command = {
      tenantId: context.tenantId,
      conversationRef: item.conversation.providerConversationRef,
      destinationRef: item.contact.providerContactRef,
      text,
      idempotencyKey,
      correlationId: context.correlationId,
      confirmedBy: context.actorId,
    };
    await this.outbound.enqueue(command);
    await this.outbound.drain(context.tenantId);
    const record = await this.outboundStore.findByIdempotencyKey(context.tenantId, idempotencyKey);
    if (!record?.providerMessageId) throw new Error("simulated_outbound_not_sent");
    const suffix = record.providerMessageId.replace(/^msg-ficticio-/u, "");
    await this.ingest(context, {
      event: "messages.upsert",
      eventId: `evt-ficticio-${suffix}`,
      instance: "LOCAL_FIXTURE",
      source: "SIMULATED_LIVE",
      receivedAt: record.updatedAt,
      data: {
        key: {
          id: record.providerMessageId,
          remoteJid: item.conversation.providerConversationRef,
          fromMe: true,
        },
        pushName: "Delta ficticio",
        messageTimestamp: record.updatedAt,
        message: { conversation: record.text },
      },
    });
    return this.requiredItem(context, itemId);
  }

  async status(context: ActorContext): Promise<{
    ingress: Awaited<ReturnType<InMemoryEvolutionJournal["counts"]>>;
    pendingOutbound: number;
  }> {
    requireCapability(context, "commercial.read");
    return {
      ingress: await this.journal.counts(context.tenantId),
      pendingOutbound: (await this.outboundStore.pendingOutbound(context.tenantId)).length,
    };
  }

  private async requiredItem(context: ActorContext, itemId: string): Promise<CommercialWorkspaceItem> {
    const item = (await this.commercial.list(context)).find((candidate) => candidate.id === itemId);
    if (!item) throw notFound("commercial_workspace_not_found", "Commercial workspace item was not found");
    return item;
  }
}
