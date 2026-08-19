import type {
  CommercialConversationReadState,
  CommercialMediaAsset,
  CommercialReplayIdempotency,
  CommercialWorkspaceItem,
} from "../domain/commercial-models.js";

export interface CommercialReplayTransaction {
  findIdempotency(key: string): Promise<CommercialReplayIdempotency | null>;
  saveIdempotency(record: CommercialReplayIdempotency): Promise<void>;
  findById(id: string): Promise<CommercialWorkspaceItem | null>;
  findByProviderMessageId(providerMessageId: string): Promise<CommercialWorkspaceItem | null>;
  findByProviderConversationRef(providerConversationRef: string): Promise<CommercialWorkspaceItem | null>;
  findMedia(assetId: string): Promise<CommercialMediaAsset | null>;
  findMediaByMessageId(messageId: string): Promise<CommercialMediaAsset | null>;
  saveMedia(asset: CommercialMediaAsset): Promise<void>;
  findReadState(actorId: string, conversationId: string): Promise<CommercialConversationReadState | null>;
  saveReadState(state: CommercialConversationReadState): Promise<void>;
  save(item: CommercialWorkspaceItem): Promise<void>;
  list(): Promise<CommercialWorkspaceItem[]>;
  listPage(actorId: string, limit: number, cursor: string | null): Promise<{ items: CommercialWorkspaceItem[]; nextCursor: string | null }>;
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
  schemaVersion: 2;
  items: CommercialWorkspaceItem[];
  idempotency: CommercialReplayIdempotency[];
  mediaAssets: CommercialMediaAsset[];
  readStates: CommercialConversationReadState[];
}

export function emptyCommercialReplayState(): CommercialReplayState {
  return { schemaVersion: 2, items: [], idempotency: [], mediaAssets: [], readStates: [] };
}
