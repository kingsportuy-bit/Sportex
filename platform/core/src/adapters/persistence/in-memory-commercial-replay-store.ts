import type {
  CommercialReplayIdempotency,
  CommercialWorkspaceItem,
} from "../../domain/commercial-models.js";
import type {
  CommercialReplayStore,
  CommercialReplayState,
  CommercialReplayTransaction,
} from "../../ports/commercial-replay-store.js";
import { emptyCommercialReplayState } from "../../ports/commercial-replay-store.js";

class MemoryCommercialReplayTransaction implements CommercialReplayTransaction {
  constructor(
    private readonly tenantId: string,
    private readonly state: CommercialReplayState,
  ) {}

  async findIdempotency(key: string): Promise<CommercialReplayIdempotency | null> {
    return this.state.idempotency.find(
      (record) => record.tenantId === this.tenantId && record.key === key,
    ) ?? null;
  }

  async saveIdempotency(record: CommercialReplayIdempotency): Promise<void> {
    this.state.idempotency.push(record);
  }

  async findById(id: string): Promise<CommercialWorkspaceItem | null> {
    return this.state.items.find(
      (item) => item.tenantId === this.tenantId && item.id === id,
    ) ?? null;
  }

  async findByProviderMessageId(providerMessageId: string): Promise<CommercialWorkspaceItem | null> {
    return this.state.items.find(
      (item) => item.tenantId === this.tenantId
        && item.conversation.messages.some((message) => message.providerMessageId === providerMessageId),
    ) ?? null;
  }

  async findByProviderConversationRef(providerConversationRef: string): Promise<CommercialWorkspaceItem | null> {
    return this.state.items.find(
      (item) => item.tenantId === this.tenantId
        && item.conversation.providerConversationRef === providerConversationRef,
    ) ?? null;
  }

  async save(item: CommercialWorkspaceItem): Promise<void> {
    const index = this.state.items.findIndex(
      (candidate) => candidate.tenantId === this.tenantId && candidate.id === item.id,
    );
    if (index === -1) this.state.items.push(item);
    else this.state.items[index] = item;
  }

  async list(): Promise<CommercialWorkspaceItem[]> {
    return this.state.items
      .filter((item) => item.tenantId === this.tenantId)
      .sort((left, right) => right.conversation.lastActivityAt.localeCompare(left.conversation.lastActivityAt));
  }

  async replaceTenant(items: CommercialWorkspaceItem[]): Promise<void> {
    if (items.some((item) => item.tenantId !== this.tenantId)) {
      throw new Error("commercial_store_tenant_mismatch");
    }
    this.state.items = [
      ...this.state.items.filter((item) => item.tenantId !== this.tenantId),
      ...structuredClone(items),
    ];
    this.state.idempotency = this.state.idempotency.filter(
      (record) => record.tenantId !== this.tenantId,
    );
  }
}

export class InMemoryCommercialReplayStore implements CommercialReplayStore {
  private state: CommercialReplayState = emptyCommercialReplayState();
  private queue: Promise<void> = Promise.resolve();

  async transaction<T>(
    tenantId: string,
    operation: (transaction: CommercialReplayTransaction) => Promise<T>,
  ): Promise<T> {
    const previous = this.queue;
    let release = (): void => undefined;
    this.queue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;

    try {
      const draft = structuredClone(this.state);
      const result = await operation(new MemoryCommercialReplayTransaction(tenantId, draft));
      this.state = draft;
      return result;
    } finally {
      release();
    }
  }

  snapshot(): CommercialReplayState {
    return structuredClone(this.state);
  }

  async checkReady(): Promise<void> {
    return Promise.resolve();
  }

  async close(): Promise<void> {
    return Promise.resolve();
  }
}
