import type {
  CommercialConversationReadState,
  CommercialMediaAsset,
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

  async findMedia(assetId: string): Promise<CommercialMediaAsset | null> {
    return this.state.mediaAssets.find((asset) => asset.tenantId === this.tenantId && asset.id === assetId) ?? null;
  }

  async findMediaByMessageId(messageId: string): Promise<CommercialMediaAsset | null> {
    const item = this.state.items.find((candidate) => candidate.tenantId === this.tenantId
      && candidate.conversation.messages.some((message) => message.id === messageId));
    const message = item?.conversation.messages.find((candidate) => candidate.id === messageId);
    return message?.media ? this.findMedia(message.media.assetId) : null;
  }

  async saveMedia(asset: CommercialMediaAsset): Promise<void> {
    if (asset.tenantId !== this.tenantId) throw new Error("commercial_store_tenant_mismatch");
    if (!this.state.mediaAssets.some((candidate) => candidate.tenantId === this.tenantId && candidate.id === asset.id)) {
      this.state.mediaAssets.push(structuredClone(asset));
    }
  }

  async findReadState(actorId: string, conversationId: string): Promise<CommercialConversationReadState | null> {
    return this.state.readStates.find((state) => state.tenantId === this.tenantId
      && state.actorId === actorId && state.conversationId === conversationId) ?? null;
  }

  async saveReadState(state: CommercialConversationReadState): Promise<void> {
    if (state.tenantId !== this.tenantId) throw new Error("commercial_store_tenant_mismatch");
    const index = this.state.readStates.findIndex((candidate) => candidate.tenantId === this.tenantId
      && candidate.actorId === state.actorId && candidate.conversationId === state.conversationId);
    if (index === -1) this.state.readStates.push(structuredClone(state));
    else this.state.readStates[index] = structuredClone(state);
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

  async listPage(actorId: string, limit: number, cursor: string | null): Promise<{ items: CommercialWorkspaceItem[]; nextCursor: string | null }> {
    const items = await this.list();
    const start = cursor ? Math.max(0, items.findIndex((item) => item.id === cursor) + 1) : 0;
    const page = items.slice(start, start + limit).map((item) => {
      const messages = item.conversation.messages;
      const last = messages.at(-1);
      const read = this.state.readStates.find((candidate) => candidate.tenantId === this.tenantId
        && candidate.actorId === actorId && candidate.conversationId === item.conversation.id);
      const readIndex = read ? messages.findIndex((message) => message.id === read.lastReadMessageId) : -1;
      const { timeline: _timeline, ...summary } = item;
      return {
        ...summary,
        conversation: { ...item.conversation, messages: last ? [last] : [], unreadCount: messages.slice(readIndex + 1).filter((message) => message.direction === "CLIENTE").length },
        activity: [],
      };
    });
    const last = page.at(-1);
    return { items: page, nextCursor: items.length > start + limit && last ? last.id : null };
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
    this.state.mediaAssets = this.state.mediaAssets.filter((asset) => asset.tenantId !== this.tenantId);
    this.state.readStates = this.state.readStates.filter((state) => state.tenantId !== this.tenantId);
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
