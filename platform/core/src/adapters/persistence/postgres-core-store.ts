import { Pool, type PoolClient } from "pg";
import type { SportexConfig } from "../../config.js";
import type {
  AuditEvent,
  CertifiedPayment,
  Client,
  Currency,
  IdempotencyRecord,
  Membership,
  Order,
  OrderStatus,
  OutboxEvent,
} from "../../domain/models.js";
import type { CoreStore, CoreTransaction } from "../../ports/core-store.js";
import { conflict } from "../../shared/errors.js";

interface Tables {
  tenants: string;
  memberships: string;
  clients: string;
  payments: string;
  orders: string;
  orderCounters: string;
  idempotency: string;
  auditEvents: string;
  outbox: string;
}

function tablesForPrefix(prefix: SportexConfig["tablePrefix"]): Tables {
  return {
    tenants: `${prefix}tenants`,
    memberships: `${prefix}memberships`,
    clients: `${prefix}clients`,
    payments: `${prefix}certified_payments`,
    orders: `${prefix}orders`,
    orderCounters: `${prefix}order_counters`,
    idempotency: `${prefix}idempotency`,
    auditEvents: `${prefix}audit_events`,
    outbox: `${prefix}outbox`,
  };
}

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}

function rowToClient(row: Record<string, unknown>): Client {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    displayName: String(row.display_name),
    ...(row.team_name ? { teamName: String(row.team_name) } : {}),
    ...(row.primary_phone ? { primaryPhone: String(row.primary_phone) } : {}),
    status: "active",
    version: Number(row.version),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function rowToPayment(row: Record<string, unknown>): CertifiedPayment {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    clientId: String(row.client_id),
    evidenceReference: String(row.evidence_reference),
    amountCents: Number(row.amount_cents),
    currency: String(row.currency) as Currency,
    status: "certified",
    certifiedBy: String(row.certified_by),
    certifiedAt: iso(row.certified_at),
    createdAt: iso(row.created_at),
  };
}

function rowToOrder(row: Record<string, unknown>): Order {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    orderNumber: String(row.order_number),
    clientId: String(row.client_id),
    certifiedPaymentId: String(row.certified_payment_id),
    teamName: String(row.team_name),
    status: String(row.status) as OrderStatus,
    quotedTotalCents: Number(row.quoted_total_cents),
    depositCents: Number(row.deposit_cents),
    balanceCents: Number(row.quoted_total_cents) - Number(row.deposit_cents),
    currency: String(row.currency) as Currency,
    version: Number(row.version),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function mapPostgresError(error: unknown): unknown {
  const candidate = error as { code?: string; constraint?: string };
  if (candidate.code !== "23505") return error;
  const constraint = candidate.constraint ?? "";
  if (constraint.endsWith("clients_phone_unique")) {
    return conflict("client_phone_conflict", "A client already uses this phone");
  }
  if (constraint.endsWith("payments_evidence_unique")) {
    return conflict("payment_evidence_conflict", "Payment evidence already certified");
  }
  if (constraint.endsWith("orders_tenant_id_certified_payment_id_key")) {
    return conflict("payment_already_used", "Certified payment already created an order");
  }
  return error;
}

class PostgresTransaction implements CoreTransaction {
  constructor(
    private readonly client: PoolClient,
    private readonly tenantId: string,
    private readonly tables: Tables,
  ) {}

  async lockIdempotency(scope: string, key: string): Promise<void> {
    await this.client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [
      `${this.tenantId}:${scope}:${key}`,
    ]);
  }

  async findIdempotency<T>(scope: string, key: string): Promise<IdempotencyRecord<T> | null> {
    const result = await this.client.query(
      `SELECT tenant_id, scope, idempotency_key, request_hash, response_status, response_body, resource_id, created_at
       FROM ${this.tables.idempotency}
       WHERE tenant_id = $1 AND scope = $2 AND idempotency_key = $3`,
      [this.tenantId, scope, key],
    );
    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      tenantId: String(row.tenant_id),
      scope: String(row.scope),
      key: String(row.idempotency_key),
      requestHash: String(row.request_hash),
      responseStatus: Number(row.response_status),
      responseBody: row.response_body as T,
      resourceId: String(row.resource_id),
      createdAt: iso(row.created_at),
    };
  }

  async saveIdempotency<T>(record: IdempotencyRecord<T>): Promise<void> {
    await this.client.query(
      `INSERT INTO ${this.tables.idempotency}
       (tenant_id, scope, idempotency_key, request_hash, response_status, response_body, resource_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)`,
      [record.tenantId, record.scope, record.key, record.requestHash, record.responseStatus,
        JSON.stringify(record.responseBody), record.resourceId, record.createdAt],
    );
  }

  async findActiveMembership(actorId: string): Promise<Membership | null> {
    const result = await this.client.query(
      `SELECT membership.tenant_id, tenant.name AS tenant_name, membership.actor_id,
              membership.capabilities, membership.status
       FROM ${this.tables.memberships} membership
       JOIN ${this.tables.tenants} tenant ON tenant.id = membership.tenant_id
       WHERE membership.tenant_id = $1 AND membership.actor_id = $2
         AND membership.status = 'active' AND tenant.status = 'active'`,
      [this.tenantId, actorId],
    );
    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      tenantId: String(row.tenant_id),
      tenantName: String(row.tenant_name),
      actorId: String(row.actor_id),
      capabilities: Array.isArray(row.capabilities) ? row.capabilities.map(String) as Membership["capabilities"] : [],
      status: "active",
    };
  }

  async findClientById(id: string): Promise<Client | null> {
    const result = await this.client.query(
      `SELECT * FROM ${this.tables.clients} WHERE tenant_id = $1 AND id = $2`,
      [this.tenantId, id],
    );
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? rowToClient(row) : null;
  }

  async findClientByPhone(phone: string): Promise<Client | null> {
    const result = await this.client.query(
      `SELECT * FROM ${this.tables.clients} WHERE tenant_id = $1 AND primary_phone = $2`,
      [this.tenantId, phone],
    );
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? rowToClient(row) : null;
  }

  async createClient(client: Client): Promise<void> {
    await this.client.query(
      `INSERT INTO ${this.tables.clients}
       (id, tenant_id, display_name, team_name, primary_phone, status, version, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [client.id, client.tenantId, client.displayName, client.teamName ?? null, client.primaryPhone ?? null,
        client.status, client.version, client.createdAt, client.updatedAt],
    );
  }

  async listClients(): Promise<Client[]> {
    const result = await this.client.query(
      `SELECT * FROM ${this.tables.clients} WHERE tenant_id = $1 ORDER BY created_at, id`,
      [this.tenantId],
    );
    return result.rows.map((row) => rowToClient(row as Record<string, unknown>));
  }

  async findPaymentById(id: string): Promise<CertifiedPayment | null> {
    const result = await this.client.query(
      `SELECT * FROM ${this.tables.payments} WHERE tenant_id = $1 AND id = $2`,
      [this.tenantId, id],
    );
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? rowToPayment(row) : null;
  }

  async findPaymentByEvidence(reference: string): Promise<CertifiedPayment | null> {
    const result = await this.client.query(
      `SELECT * FROM ${this.tables.payments}
       WHERE tenant_id = $1 AND lower(evidence_reference) = lower($2)`,
      [this.tenantId, reference],
    );
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? rowToPayment(row) : null;
  }

  async createPayment(payment: CertifiedPayment): Promise<void> {
    await this.client.query(
      `INSERT INTO ${this.tables.payments}
       (id, tenant_id, client_id, evidence_reference, amount_cents, currency, status, certified_by,
        certified_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [payment.id, payment.tenantId, payment.clientId, payment.evidenceReference, payment.amountCents,
        payment.currency, payment.status, payment.certifiedBy, payment.certifiedAt, payment.createdAt],
    );
  }

  async findOrderByPaymentId(paymentId: string): Promise<Order | null> {
    const result = await this.client.query(
      `SELECT * FROM ${this.tables.orders} WHERE tenant_id = $1 AND certified_payment_id = $2`,
      [this.tenantId, paymentId],
    );
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? rowToOrder(row) : null;
  }

  async findOrderById(id: string): Promise<Order | null> {
    const result = await this.client.query(
      `SELECT * FROM ${this.tables.orders} WHERE tenant_id = $1 AND id = $2`,
      [this.tenantId, id],
    );
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? rowToOrder(row) : null;
  }

  async nextOrderSequence(): Promise<number> {
    const result = await this.client.query(
      `INSERT INTO ${this.tables.orderCounters} AS counter (tenant_id, last_value)
       VALUES ($1, 1)
       ON CONFLICT (tenant_id) DO UPDATE SET last_value = counter.last_value + 1
       RETURNING last_value`,
      [this.tenantId],
    );
    return Number(result.rows[0]?.last_value);
  }

  async createOrder(order: Order): Promise<void> {
    await this.client.query(
      `INSERT INTO ${this.tables.orders}
       (id, tenant_id, order_number, client_id, certified_payment_id, team_name, status,
        quoted_total_cents, deposit_cents, currency, version, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [order.id, order.tenantId, order.orderNumber, order.clientId, order.certifiedPaymentId,
        order.teamName, order.status, order.quotedTotalCents, order.depositCents, order.currency,
        order.version, order.createdAt, order.updatedAt],
    );
  }

  async updateOrder(order: Order, expectedVersion: number): Promise<void> {
    const result = await this.client.query(
      `UPDATE ${this.tables.orders}
       SET status = $3, version = $4, updated_at = $5
       WHERE tenant_id = $1 AND id = $2 AND version = $6`,
      [this.tenantId, order.id, order.status, order.version, order.updatedAt, expectedVersion],
    );
    if (result.rowCount !== 1) {
      throw conflict("order_version_conflict", "Order version changed");
    }
  }

  async listOrders(): Promise<Order[]> {
    const result = await this.client.query(
      `SELECT * FROM ${this.tables.orders} WHERE tenant_id = $1 ORDER BY created_at, id`,
      [this.tenantId],
    );
    return result.rows.map((row) => rowToOrder(row as Record<string, unknown>));
  }

  async appendAudit(event: AuditEvent): Promise<void> {
    await this.client.query(
      `INSERT INTO ${this.tables.auditEvents}
       (id, tenant_id, actor_id, action, resource_type, resource_id, result, correlation_id,
        metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)`,
      [event.id, event.tenantId, event.actorId, event.action, event.resourceType, event.resourceId,
        event.result, event.correlationId, JSON.stringify(event.metadata), event.createdAt],
    );
  }

  async enqueueOutbox(event: OutboxEvent): Promise<void> {
    await this.client.query(
      `INSERT INTO ${this.tables.outbox}
       (id, tenant_id, event_type, aggregate_type, aggregate_id, payload, correlation_id,
        status, attempts, available_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11)`,
      [event.id, event.tenantId, event.eventType, event.aggregateType, event.aggregateId,
        JSON.stringify(event.payload), event.correlationId, event.status, event.attempts,
        event.availableAt, event.createdAt],
    );
  }
}

export class PostgresCoreStore implements CoreStore {
  private readonly pool: Pool;
  private readonly tables: Tables;

  constructor(private readonly config: SportexConfig) {
    if (!config.databaseUrl) throw new Error("database_url_required");
    this.pool = new Pool({ connectionString: config.databaseUrl, max: 10 });
    this.tables = tablesForPrefix(config.tablePrefix);
  }

  async transaction<T>(tenantId: string, operation: (transaction: CoreTransaction) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      if (this.config.databaseRole) await client.query(`SET LOCAL ROLE ${this.config.databaseRole}`);
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
      const result = await operation(new PostgresTransaction(client, tenantId, this.tables));
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw mapPostgresError(error);
    } finally {
      client.release();
    }
  }

  async findActiveMembership(tenantId: string, actorId: string): Promise<Membership | null> {
    return this.transaction(tenantId, (transaction) => transaction.findActiveMembership(actorId));
  }

  async checkReady(): Promise<void> {
    await this.pool.query("SELECT 1");
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
