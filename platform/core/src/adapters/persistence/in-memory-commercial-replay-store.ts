import type {
  CommercialReplayIdempotency,
  CommercialWorkspaceItem,
} from "../../domain/commercial-models.js";
import type {
  CommercialReplayStore,
  CommercialReplayTransaction,
} from "../../ports/commercial-replay-store.js";

interface CommercialReplayState {
  items: CommercialWorkspaceItem[];
  idempotency: CommercialReplayIdempotency[];
}

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
}

export class InMemoryCommercialReplayStore implements CommercialReplayStore {
  private state: CommercialReplayState = { items: [], idempotency: [] };
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
}
