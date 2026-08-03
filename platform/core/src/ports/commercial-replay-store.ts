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
}

export interface CommercialReplayStore {
  transaction<T>(
    tenantId: string,
    operation: (transaction: CommercialReplayTransaction) => Promise<T>,
  ): Promise<T>;
}
