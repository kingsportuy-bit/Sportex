import type {
  CommercialReplayIdempotency,
  CommercialWorkspaceItem,
} from "../domain/commercial-models.js";

export interface CommercialReplayTransaction {
  findIdempotency(key: string): Promise<CommercialReplayIdempotency | null>;
  saveIdempotency(record: CommercialReplayIdempotency): Promise<void>;
  findById(id: string): Promise<CommercialWorkspaceItem | null>;
  findByProviderMessageId(providerMessageId: string): Promise<CommercialWorkspaceItem | null>;
  findByProviderConversationRef(providerConversationRef: string): Promise<CommercialWorkspaceItem | null>;
  save(item: CommercialWorkspaceItem): Promise<void>;
  list(): Promise<CommercialWorkspaceItem[]>;
  replaceTenant(items: CommercialWorkspaceItem[]): Promise<void>;
}

export interface CommercialReplayStore {
  transaction<T>(
    tenantId: string,
    operation: (transaction: CommercialReplayTransaction) => Promise<T>,
  ): Promise<T>;
  checkReady(): Promise<void>;
  close(): Promise<void>;
}

export interface CommercialReplayState {
  schemaVersion: 1;
  items: CommercialWorkspaceItem[];
  idempotency: CommercialReplayIdempotency[];
}

export function emptyCommercialReplayState(): CommercialReplayState {
  return { schemaVersion: 1, items: [], idempotency: [] };
}
