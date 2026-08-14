import { Pool, type PoolClient } from "pg";
import type { SportexConfig } from "../../config.js";
import type {
  NormalizedWhatsAppIngress,
  WhatsAppDeliveryStatus,
  WhatsAppOutboundRecord,
} from "../../domain/whatsapp-transport-models.js";
import type {
  WhatsAppIngressCounts,
  WhatsAppIngressJournal,
  WhatsAppOutboundStore,
} from "../../ports/whatsapp-transport-store.js";

interface Tables {
  ingress: string;
  outbound: string;
}

function tablesForPrefix(prefix: SportexConfig["tablePrefix"]): Tables {
  return {
    ingress: `${prefix}whatsapp_ingress_events`,
    outbound: `${prefix}whatsapp_outbound_messages`,
  };
}

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}

function jsonValue<T>(value: unknown): T {
  return (typeof value === "string" ? JSON.parse(value) : value) as T;
}

function safeErrorCode(error: unknown): string {
  const raw = error instanceof Error ? error.message : "unknown_processing_error";
  return raw.replace(/[^a-zA-Z0-9_.:-]/gu, "_").slice(0, 160) || "unknown_processing_error";
}

function rowToOutbound(row: Record<string, unknown>): WhatsAppOutboundRecord {
  return {
    tenantId: String(row.tenant_id),
    conversationRef: String(row.conversation_ref),
    destinationRef: String(row.destination_ref),
    text: String(row.body_text),
    idempotencyKey: String(row.idempotency_key),
    correlationId: String(row.correlation_id),
    confirmedBy: String(row.confirmed_by),
    providerMessageId: row.provider_message_id ? String(row.provider_message_id) : null,
    status: String(row.delivery_status) as WhatsAppDeliveryStatus,
    attempts: Number(row.attempts),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export class PostgresWhatsAppTransportStore implements WhatsAppIngressJournal, WhatsAppOutboundStore {
  private readonly pool: Pool;
  private readonly tables: Tables;

  constructor(private readonly config: SportexConfig) {
    if (!config.databaseUrl) throw new Error("database_url_required");
    this.pool = new Pool({ connectionString: config.databaseUrl, max: 10 });
    this.tables = tablesForPrefix(config.tablePrefix);
  }

  async ingest(envelope: NormalizedWhatsAppIngress): Promise<{ duplicate: boolean }> {
    return this.withTenant(envelope.tenantId, async (client) => {
      const result = await client.query(
        `INSERT INTO ${this.tables.ingress}
         (tenant_id, provider_event_id, event_id, provider, provider_instance, environment,
          occurred_at, received_at, source_kind, envelope_data, processing_state,
          attempt_count, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,'PENDING',0,$8,$8)
         ON CONFLICT (tenant_id, provider_event_id) DO NOTHING
         RETURNING provider_event_id`,
        [envelope.tenantId, envelope.providerEventId, envelope.eventId, envelope.provider,
          envelope.providerInstance, envelope.environment, envelope.occurredAt,
          envelope.receivedAt, envelope.source, JSON.stringify(envelope)],
      );
      return { duplicate: result.rowCount === 0 };
    });
  }

  async pending(tenantId: string, limit = 100): Promise<NormalizedWhatsAppIngress[]> {
    return this.withTenant(tenantId, async (client) => {
      const result = await client.query(
        `SELECT envelope_data
         FROM ${this.tables.ingress}
         WHERE tenant_id = $1 AND processing_state = 'PENDING'
         ORDER BY occurred_at, received_at, provider_event_id
         LIMIT $2`,
        [tenantId, limit],
      );
      return result.rows.map((row) => jsonValue<NormalizedWhatsAppIngress>(
        (row as Record<string, unknown>).envelope_data,
      ));
    });
  }

  async markProcessed(tenantId: string, providerEventId: string): Promise<void> {
    await this.withTenant(tenantId, async (client) => {
      const result = await client.query(
        `UPDATE ${this.tables.ingress}
         SET processing_state = 'PROCESSED', attempt_count = attempt_count + 1,
             last_error_code = NULL, updated_at = now()
         WHERE tenant_id = $1 AND provider_event_id = $2 AND processing_state = 'PENDING'`,
        [tenantId, providerEventId],
      );
      if (result.rowCount !== 1) throw new Error("evolution_journal_entry_not_pending");
    });
  }

  async quarantine(tenantId: string, providerEventId: string, error: unknown): Promise<void> {
    await this.withTenant(tenantId, async (client) => {
      const result = await client.query(
        `UPDATE ${this.tables.ingress}
         SET processing_state = 'QUARANTINED', attempt_count = attempt_count + 1,
             last_error_code = $3, updated_at = now()
         WHERE tenant_id = $1 AND provider_event_id = $2 AND processing_state = 'PENDING'`,
        [tenantId, providerEventId, safeErrorCode(error)],
      );
      if (result.rowCount !== 1) throw new Error("evolution_journal_entry_not_pending");
    });
  }

  async counts(tenantId: string): Promise<WhatsAppIngressCounts> {
    return this.withTenant(tenantId, async (client) => {
      const result = await client.query(
        `SELECT processing_state, count(*)::integer AS total
         FROM ${this.tables.ingress}
         WHERE tenant_id = $1
         GROUP BY processing_state`,
        [tenantId],
      );
      const counts: WhatsAppIngressCounts = { PENDING: 0, PROCESSED: 0, QUARANTINED: 0 };
      for (const candidate of result.rows) {
        const row = candidate as Record<string, unknown>;
        const state = String(row.processing_state) as keyof WhatsAppIngressCounts;
        counts[state] = Number(row.total);
      }
      return counts;
    });
  }

  async enqueue(record: WhatsAppOutboundRecord): Promise<{ duplicate: boolean; record: WhatsAppOutboundRecord }> {
    return this.withTenant(record.tenantId, async (client) => {
      const inserted = await client.query(
        `INSERT INTO ${this.tables.outbound}
         (tenant_id, idempotency_key, conversation_ref, destination_ref, body_text,
          correlation_id, confirmed_by, provider_message_id, delivery_status, attempts,
          created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (tenant_id, idempotency_key) DO NOTHING
         RETURNING *`,
        [record.tenantId, record.idempotencyKey, record.conversationRef,
          record.destinationRef, record.text, record.correlationId, record.confirmedBy,
          record.providerMessageId, record.status, record.attempts, record.createdAt,
          record.updatedAt],
      );
      if (inserted.rowCount === 1) {
        return { duplicate: false, record: rowToOutbound(inserted.rows[0] as Record<string, unknown>) };
      }
      const existing = await client.query(
        `SELECT * FROM ${this.tables.outbound}
         WHERE tenant_id = $1 AND idempotency_key = $2`,
        [record.tenantId, record.idempotencyKey],
      );
      const row = existing.rows[0] as Record<string, unknown> | undefined;
      if (!row) throw new Error("whatsapp_outbound_idempotency_orphaned");
      const current = rowToOutbound(row);
      if (current.destinationRef !== record.destinationRef || current.text !== record.text) {
        throw new Error("whatsapp_outbound_idempotency_conflict");
      }
      return { duplicate: true, record: current };
    });
  }

  async findByProviderMessageId(tenantId: string, providerMessageId: string): Promise<WhatsAppOutboundRecord | null> {
    return this.withTenant(tenantId, async (client) => {
      const result = await client.query(
        `SELECT * FROM ${this.tables.outbound}
         WHERE tenant_id = $1 AND provider_message_id = $2`,
        [tenantId, providerMessageId],
      );
      const row = result.rows[0] as Record<string, unknown> | undefined;
      return row ? rowToOutbound(row) : null;
    });
  }

  async update(record: WhatsAppOutboundRecord): Promise<void> {
    await this.withTenant(record.tenantId, async (client) => {
      const result = await client.query(
        `UPDATE ${this.tables.outbound}
         SET provider_message_id = $3, delivery_status = $4, attempts = $5, updated_at = $6
         WHERE tenant_id = $1 AND idempotency_key = $2`,
        [record.tenantId, record.idempotencyKey, record.providerMessageId,
          record.status, record.attempts, record.updatedAt],
      );
      if (result.rowCount !== 1) throw new Error("whatsapp_outbound_not_found");
    });
  }

  async pendingOutbound(tenantId: string, limit = 100): Promise<WhatsAppOutboundRecord[]> {
    return this.withTenant(tenantId, async (client) => {
      const result = await client.query(
        `SELECT * FROM ${this.tables.outbound}
         WHERE tenant_id = $1 AND delivery_status IN ('PENDING', 'UNKNOWN')
         ORDER BY created_at, idempotency_key
         LIMIT $2`,
        [tenantId, limit],
      );
      return result.rows.map((row) => rowToOutbound(row as Record<string, unknown>));
    });
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private async withTenant<T>(tenantId: string, operation: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      if (this.config.databaseRole) await client.query(`SET LOCAL ROLE ${this.config.databaseRole}`);
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
      const result = await operation(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
