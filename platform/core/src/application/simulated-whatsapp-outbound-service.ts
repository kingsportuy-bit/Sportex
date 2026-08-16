import type {
  WhatsAppDeliveryStatus,
  WhatsAppOutboundCommand,
  WhatsAppOutboundRecord,
} from "../domain/whatsapp-transport-models.js";
import type { WhatsAppOutboundStore } from "../ports/whatsapp-transport-store.js";
import {
  canAdvanceDelivery,
  FakeEvolutionOutboundTransport,
} from "../adapters/evolution/simulated-evolution-adapter.js";

type Clock = () => Date;

export class SimulatedWhatsAppOutboundService {
  constructor(
    private readonly store: WhatsAppOutboundStore,
    private readonly transport: FakeEvolutionOutboundTransport,
    private readonly clock: Clock = () => new Date(),
  ) {}

  async enqueue(command: WhatsAppOutboundCommand): Promise<{ duplicate: boolean; record: WhatsAppOutboundRecord }> {
    if (!command.confirmedBy.trim()) throw new Error("outbound_human_confirmation_required");
    if (!command.text.trim() && !command.image) throw new Error("outbound_content_required");
    const now = this.clock().toISOString();
    return this.store.enqueue({
      ...structuredClone(command),
      text: command.text.trim(),
      providerMessageId: null,
      status: "PENDING",
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  async drain(tenantId: string): Promise<{ sent: number; blocked: number }> {
    let sent = 0;
    let blocked = 0;
    for (const pending of await this.store.pendingOutbound(tenantId)) {
      try {
        const delivered = this.transport.send({
          tenantId: pending.tenantId,
          conversationRef: pending.conversationRef,
          destinationRef: pending.destinationRef,
          text: pending.text,
          image: pending.image ?? null,
          idempotencyKey: pending.idempotencyKey,
          correlationId: pending.correlationId,
          confirmedBy: pending.confirmedBy,
        });
        await this.store.update(delivered);
        sent += 1;
      } catch (error) {
        if (error instanceof Error && error.message === "evolution_outbound_kill_switch_active") {
          blocked += 1;
          continue;
        }
        const unknown: WhatsAppOutboundRecord = {
          ...pending,
          status: "UNKNOWN",
          attempts: pending.attempts + 1,
          updatedAt: this.clock().toISOString(),
        };
        await this.store.update(unknown);
      }
    }
    return { sent, blocked };
  }

  async applyReceipt(
    tenantId: string,
    providerMessageId: string,
    status: Exclude<WhatsAppDeliveryStatus, "PENDING">,
  ): Promise<WhatsAppOutboundRecord> {
    const record = await this.store.findByProviderMessageId(tenantId, providerMessageId);
    if (!record) throw new Error("outbound_message_not_found");
    if (!canAdvanceDelivery(record.status, status)) return record;
    const updated: WhatsAppOutboundRecord = {
      ...record,
      status,
      updatedAt: this.clock().toISOString(),
    };
    await this.store.update(updated);
    return updated;
  }
}
