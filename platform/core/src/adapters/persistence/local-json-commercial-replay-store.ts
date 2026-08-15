import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type {
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
  if (candidate.schemaVersion !== 1 || !Array.isArray(candidate.items) || !Array.isArray(candidate.idempotency)) {
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
