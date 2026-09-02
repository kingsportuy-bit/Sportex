import type {
  AuditEvent,
  CertifiedPayment,
  Client,
  IdempotencyRecord,
  Membership,
  Order,
  OutboxEvent,
} from "../../domain/models.js";
import type { StageBoardKind, StageDefinition } from "../../domain/stage-configuration.js";
import type { CompanyConfiguration } from "../../domain/company-configuration.js";
import { conflict } from "../../shared/errors.js";
import type { CoreStore, CoreTransaction } from "../../ports/core-store.js";

interface MemoryState {
  memberships: Membership[];
  clients: Client[];
  payments: CertifiedPayment[];
  orders: Order[];
  idempotency: IdempotencyRecord[];
  auditEvents: AuditEvent[];
  outboxEvents: OutboxEvent[];
  orderCounters: Record<string, number>;
  stageDefinitions: StageDefinition[];
  companyConfigurations: CompanyConfiguration[];
}

const emptyState = (): MemoryState => ({
  memberships: [],
  clients: [],
  payments: [],
  orders: [],
  idempotency: [],
  auditEvents: [],
  outboxEvents: [],
  orderCounters: {},
  stageDefinitions: [],
  companyConfigurations: [],
});

class MemoryTransaction implements CoreTransaction {
  constructor(
    private readonly tenantId: string,
    private readonly state: MemoryState,
  ) {}

  async lockIdempotency(_scope: string, _key: string): Promise<void> {}

  async findIdempotency<T>(scope: string, key: string): Promise<IdempotencyRecord<T> | null> {
    return (this.state.idempotency.find(
      (record) => record.tenantId === this.tenantId && record.scope === scope && record.key === key,
    ) as IdempotencyRecord<T> | undefined) ?? null;
  }

  async saveIdempotency<T>(record: IdempotencyRecord<T>): Promise<void> {
    this.state.idempotency.push(record as IdempotencyRecord);
  }

  async findActiveMembership(actorId: string): Promise<Membership | null> {
    return this.state.memberships.find(
      (membership) => membership.tenantId === this.tenantId && membership.actorId === actorId && membership.status === "active",
    ) ?? null;
  }

  async findClientById(id: string): Promise<Client | null> {
    return this.state.clients.find((client) => client.tenantId === this.tenantId && client.id === id) ?? null;
  }

  async findClientByPhone(phone: string): Promise<Client | null> {
    return this.state.clients.find(
      (client) => client.tenantId === this.tenantId && client.primaryPhone === phone,
    ) ?? null;
  }

  async createClient(client: Client): Promise<void> {
    this.state.clients.push(client);
  }

  async listClients(): Promise<Client[]> {
    return this.state.clients
      .filter((client) => client.tenantId === this.tenantId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  async findPaymentById(id: string): Promise<CertifiedPayment | null> {
    return this.state.payments.find((payment) => payment.tenantId === this.tenantId && payment.id === id) ?? null;
  }

  async findPaymentByEvidence(reference: string): Promise<CertifiedPayment | null> {
    return this.state.payments.find(
      (payment) => payment.tenantId === this.tenantId
        && payment.evidenceReference.toLocaleLowerCase() === reference.toLocaleLowerCase(),
    ) ?? null;
  }

  async createPayment(payment: CertifiedPayment): Promise<void> {
    this.state.payments.push(payment);
  }

  async findOrderByPaymentId(paymentId: string): Promise<Order | null> {
    return this.state.orders.find(
      (order) => order.tenantId === this.tenantId && order.certifiedPaymentId === paymentId,
    ) ?? null;
  }

  async findOrderById(id: string): Promise<Order | null> {
    return this.state.orders.find(
      (order) => order.tenantId === this.tenantId && order.id === id,
    ) ?? null;
  }

  async nextOrderSequence(): Promise<number> {
    const next = (this.state.orderCounters[this.tenantId] ?? 0) + 1;
    this.state.orderCounters[this.tenantId] = next;
    return next;
  }

  async createOrder(order: Order): Promise<void> {
    this.state.orders.push(order);
  }

  async updateOrder(order: Order, expectedVersion: number): Promise<void> {
    const index = this.state.orders.findIndex(
      (candidate) => candidate.tenantId === this.tenantId && candidate.id === order.id,
    );
    if (index === -1) throw new Error("order_not_found");
    if (this.state.orders[index]?.version !== expectedVersion) throw new Error("order_version_conflict");
    this.state.orders[index] = structuredClone(order);
  }

  async listOrders(): Promise<Order[]> {
    return this.state.orders
      .filter((order) => order.tenantId === this.tenantId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  async listStageDefinitions(board: StageBoardKind): Promise<StageDefinition[]> {
    return this.state.stageDefinitions
      .filter((definition) => definition.tenantId === this.tenantId && definition.board === board)
      .sort((left, right) => left.position - right.position || left.id.localeCompare(right.id));
  }

  async saveStageDefinition(definition: StageDefinition): Promise<void> {
    const index = this.state.stageDefinitions.findIndex((candidate) => candidate.tenantId === this.tenantId
      && candidate.board === definition.board && candidate.id === definition.id);
    if (index >= 0) this.state.stageDefinitions[index] = structuredClone(definition);
    else this.state.stageDefinitions.push(structuredClone(definition));
  }

  async deleteStageDefinition(board: StageBoardKind, id: string): Promise<void> {
    this.state.stageDefinitions = this.state.stageDefinitions.filter((candidate) => !(candidate.tenantId === this.tenantId
      && candidate.board === board && candidate.id === id));
  }

  async findCompanyConfiguration(): Promise<CompanyConfiguration | null> {
    const configuration = this.state.companyConfigurations.find((candidate) => candidate.tenantId === this.tenantId);
    return configuration ? structuredClone(configuration) : null;
  }

  async saveCompanyConfiguration(configuration: CompanyConfiguration, expectedVersion: number): Promise<void> {
    const index = this.state.companyConfigurations.findIndex((candidate) => candidate.tenantId === this.tenantId);
    const current = index >= 0 ? this.state.companyConfigurations[index] : undefined;
    if ((current?.version ?? 0) !== expectedVersion) {
      throw conflict("company_configuration_version_conflict", "Company configuration changed", {
        expectedVersion,
        currentVersion: current?.version ?? 0,
      });
    }
    if (index >= 0) this.state.companyConfigurations[index] = structuredClone(configuration);
    else this.state.companyConfigurations.push(structuredClone(configuration));
  }

  async appendAudit(event: AuditEvent): Promise<void> {
    this.state.auditEvents.push(event);
  }

  async enqueueOutbox(event: OutboxEvent): Promise<void> {
    this.state.outboxEvents.push(event);
  }
}

export class InMemoryCoreStore implements CoreStore {
  private state: MemoryState;
  private queue: Promise<void> = Promise.resolve();
  private closed = false;

  constructor(memberships: Membership[] = []) {
    this.state = emptyState();
    this.state.memberships = structuredClone(memberships);
  }

  async transaction<T>(tenantId: string, operation: (transaction: CoreTransaction) => Promise<T>): Promise<T> {
    const previous = this.queue;
    let release = (): void => undefined;
    this.queue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;

    try {
      if (this.closed) throw new Error("store_closed");
      const draft = structuredClone(this.state);
      const result = await operation(new MemoryTransaction(tenantId, draft));
      this.state = draft;
      return result;
    } finally {
      release();
    }
  }

  async findActiveMembership(tenantId: string, actorId: string): Promise<Membership | null> {
    return this.transaction(tenantId, (transaction) => transaction.findActiveMembership(actorId));
  }

  async checkReady(): Promise<void> {
    if (this.closed) throw new Error("store_closed");
  }

  async close(): Promise<void> {
    this.closed = true;
  }

  snapshot(): MemoryState {
    return structuredClone(this.state);
  }
}
