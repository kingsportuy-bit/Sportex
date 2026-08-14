import type { CommercialReplayService } from "./commercial-replay-service.js";
import { CommercialWhatsAppProjector } from "./commercial-whatsapp-projector.js";
import type { EvolutionWebhookAdapter } from "../adapters/evolution/evolution-webhook-adapter.js";
import type { WhatsAppIngressJournal } from "../ports/whatsapp-transport-store.js";

export class RealWhatsAppIntegrationService {
  constructor(
    private readonly adapter: EvolutionWebhookAdapter,
    private readonly journal: WhatsAppIngressJournal,
    private readonly commercial: CommercialReplayService,
    private readonly tenantId: string,
    private readonly actorId: string,
  ) {}

  async ingest(payload: unknown): Promise<{ duplicate: boolean }> {
    const envelope = this.adapter.normalize(payload);
    const result = await this.journal.ingest(envelope);
    await this.drain();
    return result;
  }

  async drain(): Promise<void> {
    const projector = new CommercialWhatsAppProjector(this.commercial, this.actorId);
    for (const event of await this.journal.pending(this.tenantId)) {
      try {
        await projector.project(event);
        await this.journal.markProcessed(event.tenantId, event.providerEventId);
      } catch (error) {
        await this.journal.quarantine(event.tenantId, event.providerEventId, error);
      }
    }
  }

  async status(): Promise<{ ingress: Awaited<ReturnType<WhatsAppIngressJournal["counts"]>> }> {
    return { ingress: await this.journal.counts(this.tenantId) };
  }

  async close(): Promise<void> {
    await this.journal.close();
  }
}
