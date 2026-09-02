import type {
  AuditEvent,
  CertifiedPayment,
  Client,
  IdempotencyRecord,
  Membership,
  Order,
  OutboxEvent,
} from "../domain/models.js";
import type { StageBoardKind, StageDefinition } from "../domain/stage-configuration.js";
import type { CompanyConfiguration } from "../domain/company-configuration.js";

export interface CoreTransaction {
  lockIdempotency(scope: string, key: string): Promise<void>;
  findIdempotency<T>(scope: string, key: string): Promise<IdempotencyRecord<T> | null>;
  saveIdempotency<T>(record: IdempotencyRecord<T>): Promise<void>;

  findActiveMembership(actorId: string): Promise<Membership | null>;

  findClientById(id: string): Promise<Client | null>;
  findClientByPhone(phone: string): Promise<Client | null>;
  createClient(client: Client): Promise<void>;
  listClients(): Promise<Client[]>;

  findPaymentById(id: string): Promise<CertifiedPayment | null>;
  findPaymentByEvidence(reference: string): Promise<CertifiedPayment | null>;
  createPayment(payment: CertifiedPayment): Promise<void>;

  findOrderByPaymentId(paymentId: string): Promise<Order | null>;
  findOrderById(id: string): Promise<Order | null>;
  nextOrderSequence(): Promise<number>;
  createOrder(order: Order): Promise<void>;
  updateOrder(order: Order, expectedVersion: number): Promise<void>;
  listOrders(): Promise<Order[]>;

  listStageDefinitions(board: StageBoardKind): Promise<StageDefinition[]>;
  saveStageDefinition(definition: StageDefinition): Promise<void>;
  deleteStageDefinition(board: StageBoardKind, id: string): Promise<void>;

  findCompanyConfiguration(): Promise<CompanyConfiguration | null>;
  saveCompanyConfiguration(configuration: CompanyConfiguration, expectedVersion: number): Promise<void>;

  appendAudit(event: AuditEvent): Promise<void>;
  enqueueOutbox(event: OutboxEvent): Promise<void>;
}

export interface CoreStore {
  transaction<T>(tenantId: string, operation: (transaction: CoreTransaction) => Promise<T>): Promise<T>;
  findActiveMembership(tenantId: string, actorId: string): Promise<Membership | null>;
  checkReady(): Promise<void>;
  close(): Promise<void>;
}
