import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type {
  CommercialConversationReadState,
  CommercialMediaAsset,
  CommercialReplayIdempotency,
  CommercialWorkspaceItem,
} from "../../domain/commercial-models.js";
import type {
  CommercialReplayState,
  CommercialReplayStore,
  CommercialReplayTransaction,
} from "../../ports/commercial-replay-store.js";
import { emptyCommercialReplayState } from "../../ports/commercial-replay-store.js";

function assertState(value: unknown): asserts value is CommercialReplayState {
  if (!value || typeof value !== "object") throw new Error("commercial_demo_file_invalid");
  const candidate = value as Partial<CommercialReplayState>;
  if (![1, 2].includes(Number(candidate.schemaVersion)) || !Array.isArray(candidate.items) || !Array.isArray(candidate.idempotency)) {
    throw new Error("commercial_demo_file_invalid");
  }
  const invalidItem = candidate.items.some((item) =>
    !item || typeof item !== "object" || typeof item.id !== "string" || typeof item.tenantId !== "string",
  );
  const invalidIdempotency = candidate.idempotency.some((record) =>
    !record || typeof record !== "object" || typeof record.key !== "string" || typeof record.tenantId !== "string",
  );
  if (invalidItem || invalidIdempotency) throw new Error("commercial_demo_file_invalid");
}

function hydrateLegacyContacts(state: CommercialReplayState): CommercialReplayState {
  return {
    ...state,
    schemaVersion: 2,
    mediaAssets: Array.isArray(state.mediaAssets) ? state.mediaAssets : [],
    readStates: Array.isArray(state.readStates) ? state.readStates : [],
    items: state.items.map((item) => {
      if (item.contact) return item;
      return {
        ...item,
        contact: {
          id: `contact-${item.conversation.id}`,
          tenantId: item.tenantId,
          provider: "EVOLUTION",
          providerInstance: item.conversation.providerInstance,
          providerContactRef: item.conversation.providerConversationRef,
          displayName: item.conversation.contactName,
          normalizedPhone: null,
          createdAt: item.conversation.firstContactAt,
          updatedAt: item.conversation.lastActivityAt,
          fixtureOnly: true,
        },
      };
    }),
  };
}

class JsonCommercialReplayTransaction implements CommercialReplayTransaction {
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
    if (record.tenantId !== this.tenantId) throw new Error("commercial_store_tenant_mismatch");
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
    if (item.tenantId !== this.tenantId) throw new Error("commercial_store_tenant_mismatch");
    const index = this.state.items.findIndex(
      (candidate) => candidate.tenantId === this.tenantId && candidate.id === item.id,
    );
    if (index === -1) this.state.items.push(structuredClone(item));
    else this.state.items[index] = structuredClone(item);
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

export class LocalJsonCommercialReplayStore implements CommercialReplayStore {
  private state: CommercialReplayState | null = null;
  private queue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {
    if (!filePath.trim()) throw new Error("commercial_demo_file_required");
  }

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
      const current = await this.load();
      const draft = structuredClone(current);
      const result = await operation(new JsonCommercialReplayTransaction(tenantId, draft));
      await this.persist(draft);
      this.state = draft;
      return result;
    } finally {
      release();
    }
  }

  async close(): Promise<void> {
    await this.queue;
  }

  async checkReady(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<CommercialReplayState> {
    if (this.state) return this.state;
    let raw: string;
    try {
      raw = await readFile(this.filePath, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        this.state = emptyCommercialReplayState();
        return this.state;
      }
      throw error;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      throw new Error("commercial_demo_file_invalid");
    }
    assertState(parsed);
    this.state = hydrateLegacyContacts(parsed);
    return this.state;
  }

  private async persist(state: CommercialReplayState): Promise<void> {
    const directory = dirname(this.filePath);
    const temporaryPath = `${this.filePath}.${process.pid}.tmp`;
    await mkdir(directory, { recursive: true });
    try {
      await writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, {
        encoding: "utf8",
        mode: 0o600,
      });
      await rename(temporaryPath, this.filePath);
    } catch (error) {
      await unlink(temporaryPath).catch(() => undefined);
      throw error;
    }
  }
}
