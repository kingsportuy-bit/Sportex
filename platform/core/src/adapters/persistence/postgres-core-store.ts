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
  OrderDetails,
  OrderStatus,
  OutboxEvent,
} from "../../domain/models.js";
import type { StageBoardKind, StageDefinition } from "../../domain/stage-configuration.js";
import type {
  CompanyConfiguration,
  CompanyProduct,
  CompanyResource,
  CompanySizeChart,
  ProductPriceTier,
  SizeChartRow,
} from "../../domain/company-configuration.js";
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
  stageDefinitions: string;
  companyProfiles: string;
  companySizeCharts: string;
  catalogProducts: string;
  catalogProductPriceTiers: string;
  companyResources: string;
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
    stageDefinitions: `${prefix}stage_definitions`,
    companyProfiles: `${prefix}company_profiles`,
    companySizeCharts: `${prefix}company_size_charts`,
    catalogProducts: `${prefix}catalog_products`,
    catalogProductPriceTiers: `${prefix}catalog_product_price_tiers`,
    companyResources: `${prefix}company_resources`,
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
  const details = (row.details ?? {}) as Partial<OrderDetails>;
  const sketch = details.currentSketch;
  const currentSketch = sketch && typeof sketch === "object"
    && typeof sketch.messageId === "string"
    && typeof sketch.assetId === "string"
    && (sketch.mimeType === "image/jpeg" || sketch.mimeType === "image/png" || sketch.mimeType === "image/webp")
    && typeof sketch.fileName === "string"
    && (typeof sketch.width === "number" || sketch.width === null)
    && (typeof sketch.height === "number" || sketch.height === null)
    ? sketch
    : null;
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
    details: {
      product: typeof details.product === "string" ? details.product : null,
      quantity: typeof details.quantity === "number" ? details.quantity : null,
      colors: Array.isArray(details.colors) ? details.colors.filter((color): color is string => typeof color === "string") : [],
      sizes: typeof details.sizes === "string" ? details.sizes : null,
      notes: typeof details.notes === "string" ? details.notes : null,
      currentSketch,
    },
    version: Number(row.version),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function jsonStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function rowToPriceTier(row: Record<string, unknown>): ProductPriceTier {
  return {
    id: String(row.id),
    minQuantity: Number(row.min_quantity),
    maxQuantity: row.max_quantity === null ? null : Number(row.max_quantity),
    unitPriceCents: Number(row.unit_price_cents),
    currency: String(row.currency) as Currency,
  };
}

function rowToSizeChart(row: Record<string, unknown>): CompanySizeChart {
  return {
    id: String(row.id),
    name: String(row.name),
    audience: String(row.audience) as CompanySizeChart["audience"],
    notes: row.notes === null ? null : String(row.notes),
    rows: (Array.isArray(row.rows) ? row.rows : []) as SizeChartRow[],
    active: Boolean(row.active),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function rowToProduct(row: Record<string, unknown>, priceTiers: ProductPriceTier[]): CompanyProduct {
  return {
    id: String(row.id),
    name: String(row.name),
    category: String(row.category),
    description: row.description === null ? null : String(row.description),
    active: Boolean(row.active),
    minimumQuantity: Number(row.minimum_quantity),
    defaultLeadTimeDays: Number(row.default_lead_time_days),
    sizeChartId: row.size_chart_id === null ? null : String(row.size_chart_id),
    priceTiers,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function rowToResource(row: Record<string, unknown>): CompanyResource {
  return {
    id: String(row.id),
    kind: String(row.kind) as CompanyResource["kind"],
    name: String(row.name),
    description: row.description === null ? null : String(row.description),
    reference: row.reference === null ? null : String(row.reference),
    active: Boolean(row.active),
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
        quoted_total_cents, deposit_cents, currency, details, version, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, $14)`,
      [order.id, order.tenantId, order.orderNumber, order.clientId, order.certifiedPaymentId,
         order.teamName, order.status, order.quotedTotalCents, order.depositCents, order.currency, JSON.stringify(order.details),
         order.version, order.createdAt, order.updatedAt],
    );
  }

  async updateOrder(order: Order, expectedVersion: number): Promise<void> {
    const result = await this.client.query(
      `UPDATE ${this.tables.orders}
       SET status = $3, details = $4::jsonb, version = $5, updated_at = $6
       WHERE tenant_id = $1 AND id = $2 AND version = $7`,
      [this.tenantId, order.id, order.status, JSON.stringify(order.details), order.version, order.updatedAt, expectedVersion],
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

  async listStageDefinitions(board: StageBoardKind): Promise<StageDefinition[]> {
    const result = await this.client.query(
      `SELECT id, tenant_id, board, name, position, terminal, created_at, updated_at
       FROM ${this.tables.stageDefinitions}
       WHERE tenant_id = $1 AND board = $2 ORDER BY position, id`,
      [this.tenantId, board],
    );
    return result.rows.map((row) => ({
      id: String(row.id), tenantId: String(row.tenant_id), board: String(row.board) as StageBoardKind,
      name: String(row.name), position: Number(row.position), terminal: Boolean(row.terminal),
      createdAt: iso(row.created_at), updatedAt: iso(row.updated_at),
    }));
  }

  async saveStageDefinition(definition: StageDefinition): Promise<void> {
    await this.client.query(
      `INSERT INTO ${this.tables.stageDefinitions} (id, tenant_id, board, name, position, terminal, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (tenant_id, board, id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position,
         terminal = EXCLUDED.terminal, updated_at = EXCLUDED.updated_at`,
      [definition.id, definition.tenantId, definition.board, definition.name, definition.position,
        definition.terminal, definition.createdAt, definition.updatedAt],
    );
  }

  async deleteStageDefinition(board: StageBoardKind, id: string): Promise<void> {
    await this.client.query(`DELETE FROM ${this.tables.stageDefinitions} WHERE tenant_id = $1 AND board = $2 AND id = $3`, [this.tenantId, board, id]);
  }

  async findCompanyConfiguration(): Promise<CompanyConfiguration | null> {
    const profileResult = await this.client.query(
      `SELECT * FROM ${this.tables.companyProfiles} WHERE tenant_id = $1`,
      [this.tenantId],
    );
    const profile = profileResult.rows[0] as Record<string, unknown> | undefined;
    if (!profile) return null;
    const [chartResult, productResult, tierResult, resourceResult] = await Promise.all([
      this.client.query(`SELECT * FROM ${this.tables.companySizeCharts} WHERE tenant_id = $1 ORDER BY created_at, id`, [this.tenantId]),
      this.client.query(`SELECT * FROM ${this.tables.catalogProducts} WHERE tenant_id = $1 ORDER BY created_at, id`, [this.tenantId]),
      this.client.query(`SELECT * FROM ${this.tables.catalogProductPriceTiers} WHERE tenant_id = $1 ORDER BY product_id, min_quantity, id`, [this.tenantId]),
      this.client.query(`SELECT * FROM ${this.tables.companyResources} WHERE tenant_id = $1 ORDER BY created_at, id`, [this.tenantId]),
    ]);
    const tiersByProduct = new Map<string, ProductPriceTier[]>();
    for (const rawRow of tierResult.rows) {
      const row = rawRow as Record<string, unknown>;
      const productId = String(row.product_id);
      const tiers = tiersByProduct.get(productId) ?? [];
      tiers.push(rowToPriceTier(row));
      tiersByProduct.set(productId, tiers);
    }
    return {
      id: this.tenantId,
      tenantId: this.tenantId,
      brand: {
        brandName: String(profile.brand_name),
        legalName: profile.legal_name === null ? null : String(profile.legal_name),
        primaryPhone: profile.primary_phone === null ? null : String(profile.primary_phone),
        primaryEmail: profile.primary_email === null ? null : String(profile.primary_email),
        website: profile.website === null ? null : String(profile.website),
        description: profile.description === null ? null : String(profile.description),
      },
      operations: {
        defaultCurrency: String(profile.default_currency) as Currency,
        depositPercentage: Number(profile.deposit_percentage),
        defaultQuoteValidityDays: Number(profile.default_quote_validity_days),
        defaultLeadTimeDays: Number(profile.default_lead_time_days),
        paymentMethods: jsonStringArray(profile.payment_methods),
        deliveryMethods: jsonStringArray(profile.delivery_methods),
        salesTerms: profile.sales_terms === null ? null : String(profile.sales_terms),
        productionNotes: profile.production_notes === null ? null : String(profile.production_notes),
      },
      products: productResult.rows.map((row) => {
        const record = row as Record<string, unknown>;
        return rowToProduct(record, tiersByProduct.get(String(record.id)) ?? []);
      }),
      sizeCharts: chartResult.rows.map((row) => rowToSizeChart(row as Record<string, unknown>)),
      resources: resourceResult.rows.map((row) => rowToResource(row as Record<string, unknown>)),
      version: Number(profile.version),
      createdAt: iso(profile.created_at),
      updatedAt: iso(profile.updated_at),
    };
  }

  async saveCompanyConfiguration(configuration: CompanyConfiguration, expectedVersion: number): Promise<void> {
    const profileValues = [
      configuration.tenantId,
      configuration.brand.brandName,
      configuration.brand.legalName,
      configuration.brand.primaryPhone,
      configuration.brand.primaryEmail,
      configuration.brand.website,
      configuration.brand.description,
      configuration.operations.defaultCurrency,
      configuration.operations.depositPercentage,
      configuration.operations.defaultQuoteValidityDays,
      configuration.operations.defaultLeadTimeDays,
      JSON.stringify(configuration.operations.paymentMethods),
      JSON.stringify(configuration.operations.deliveryMethods),
      configuration.operations.salesTerms,
      configuration.operations.productionNotes,
      configuration.version,
      configuration.createdAt,
      configuration.updatedAt,
    ];
    const result = expectedVersion === 0
      ? await this.client.query(
        `INSERT INTO ${this.tables.companyProfiles}
         (tenant_id, brand_name, legal_name, primary_phone, primary_email, website, description,
          default_currency, deposit_percentage, default_quote_validity_days, default_lead_time_days,
          payment_methods, delivery_methods, sales_terms, production_notes, version, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14,$15,$16,$17,$18)
         ON CONFLICT (tenant_id) DO NOTHING RETURNING tenant_id`,
        profileValues,
      )
      : await this.client.query(
        `UPDATE ${this.tables.companyProfiles}
         SET brand_name=$2, legal_name=$3, primary_phone=$4, primary_email=$5, website=$6, description=$7,
             default_currency=$8, deposit_percentage=$9, default_quote_validity_days=$10, default_lead_time_days=$11,
             payment_methods=$12::jsonb, delivery_methods=$13::jsonb, sales_terms=$14, production_notes=$15,
             version=$16, updated_at=$18
         WHERE tenant_id=$1 AND version=$19 RETURNING tenant_id`,
        [...profileValues, expectedVersion],
      );
    if (result.rowCount !== 1) {
      throw conflict("company_configuration_version_conflict", "Company configuration changed", { expectedVersion });
    }

    await this.client.query(`DELETE FROM ${this.tables.catalogProductPriceTiers} WHERE tenant_id = $1`, [this.tenantId]);
    await this.client.query(`DELETE FROM ${this.tables.catalogProducts} WHERE tenant_id = $1`, [this.tenantId]);
    await this.client.query(`DELETE FROM ${this.tables.companySizeCharts} WHERE tenant_id = $1`, [this.tenantId]);
    await this.client.query(`DELETE FROM ${this.tables.companyResources} WHERE tenant_id = $1`, [this.tenantId]);

    for (const chart of configuration.sizeCharts) {
      await this.client.query(
        `INSERT INTO ${this.tables.companySizeCharts}
         (id, tenant_id, name, audience, notes, rows, active, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9)`,
        [chart.id, this.tenantId, chart.name, chart.audience, chart.notes, JSON.stringify(chart.rows), chart.active, chart.createdAt, chart.updatedAt],
      );
    }
    for (const product of configuration.products) {
      await this.client.query(
        `INSERT INTO ${this.tables.catalogProducts}
         (id, tenant_id, name, category, description, active, minimum_quantity, default_lead_time_days,
          size_chart_id, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [product.id, this.tenantId, product.name, product.category, product.description, product.active,
          product.minimumQuantity, product.defaultLeadTimeDays, product.sizeChartId, product.createdAt, product.updatedAt],
      );
      for (const tier of product.priceTiers) {
        await this.client.query(
          `INSERT INTO ${this.tables.catalogProductPriceTiers}
           (id, tenant_id, product_id, min_quantity, max_quantity, unit_price_cents, currency)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [tier.id, this.tenantId, product.id, tier.minQuantity, tier.maxQuantity, tier.unitPriceCents, tier.currency],
        );
      }
    }
    for (const resource of configuration.resources) {
      await this.client.query(
        `INSERT INTO ${this.tables.companyResources}
         (id, tenant_id, kind, name, description, reference, active, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [resource.id, this.tenantId, resource.kind, resource.name, resource.description, resource.reference,
          resource.active, resource.createdAt, resource.updatedAt],
      );
    }
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
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      if (this.config.databaseRole) await client.query(`SET LOCAL ROLE ${this.config.databaseRole}`);
      await client.query("SELECT set_config('app.tenant_id', $1, true)", ["00000000-0000-4000-8000-000000000000"]);
      await client.query(
        `SELECT profile.tenant_id
         FROM ${this.tables.companyProfiles} profile
         LEFT JOIN ${this.tables.companySizeCharts} size_chart
           ON size_chart.tenant_id = profile.tenant_id
         LEFT JOIN ${this.tables.catalogProducts} product
           ON product.tenant_id = profile.tenant_id
         LEFT JOIN ${this.tables.catalogProductPriceTiers} price_tier
           ON price_tier.tenant_id = profile.tenant_id
         LEFT JOIN ${this.tables.companyResources} resource
           ON resource.tenant_id = profile.tenant_id
         LIMIT 0`,
      );
      await client.query("ROLLBACK");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
