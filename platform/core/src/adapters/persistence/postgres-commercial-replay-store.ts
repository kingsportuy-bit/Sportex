import { Pool, type PoolClient } from "pg";
import type { SportexConfig } from "../../config.js";
import type {
  CommercialActivity,
  CommercialAttribution,
  CommercialContact,
  CommercialConversation,
  CommercialLead,
  CommercialOpportunity,
  CommercialReplayIdempotency,
  CommercialWorkspaceItem,
  NormalizedConversationMessage,
} from "../../domain/commercial-models.js";
import type {
  CommercialReplayStore,
  CommercialReplayTransaction,
} from "../../ports/commercial-replay-store.js";
import { conflict } from "../../shared/errors.js";

interface CommercialTables {
  contacts: string;
  conversations: string;
  messages: string;
  opportunities: string;
  idempotency: string;
}

function tablesForPrefix(prefix: SportexConfig["tablePrefix"]): CommercialTables {
  return {
    contacts: `${prefix}commercial_contacts`,
    conversations: `${prefix}commercial_conversations`,
    messages: `${prefix}commercial_messages`,
    opportunities: `${prefix}commercial_opportunities`,
    idempotency: `${prefix}idempotency`,
  };
}

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}

function jsonValue<T>(value: unknown): T {
  if (typeof value === "string") return JSON.parse(value) as T;
  return value as T;
}

class PostgresCommercialTransaction implements CommercialReplayTransaction {
  constructor(
    private readonly client: PoolClient,
    private readonly tenantId: string,
    private readonly tables: CommercialTables,
  ) {}

  async findIdempotency(key: string): Promise<CommercialReplayIdempotency | null> {
    const result = await this.client.query(
      `SELECT request_hash, resource_id
       FROM ${this.tables.idempotency}
       WHERE tenant_id = $1 AND scope = 'commercial.replay' AND idempotency_key = $2`,
      [this.tenantId, key],
    );
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? {
      tenantId: this.tenantId,
      key,
      requestHash: String(row.request_hash),
      workspaceItemId: String(row.resource_id),
    } : null;
  }

  async saveIdempotency(record: CommercialReplayIdempotency): Promise<void> {
    this.assertTenant(record.tenantId);
    await this.client.query(
      `INSERT INTO ${this.tables.idempotency}
       (tenant_id, scope, idempotency_key, request_hash, response_status, response_body,
        resource_id, created_at)
       VALUES ($1, 'commercial.replay', $2, $3, 201, $4::jsonb, $5, now())`,
      [record.tenantId, record.key, record.requestHash,
        JSON.stringify({ workspaceItemId: record.workspaceItemId }), record.workspaceItemId],
    );
  }

  async findById(id: string): Promise<CommercialWorkspaceItem | null> {
    return this.findOne("opportunity.workspace_id = $2", [this.tenantId, id]);
  }

  async findByProviderMessageId(providerMessageId: string): Promise<CommercialWorkspaceItem | null> {
    return this.findOne(
      `opportunity.conversation_id IN (
         SELECT message.conversation_id FROM ${this.tables.messages} message
         WHERE message.tenant_id = $1 AND message.provider_message_id = $2
       )`,
      [this.tenantId, providerMessageId],
    );
  }

  async findByProviderConversationRef(providerConversationRef: string): Promise<CommercialWorkspaceItem | null> {
    return this.findOne("conversation.provider_conversation_ref = $2", [this.tenantId, providerConversationRef]);
  }

  async save(item: CommercialWorkspaceItem): Promise<void> {
    this.assertTenant(item.tenantId);
    this.assertTenant(item.contact.tenantId);
    this.assertTenant(item.conversation.tenantId);
    this.assertTenant(item.lead.tenantId);
    this.assertTenant(item.opportunity.tenantId);

    await this.client.query(
      `INSERT INTO ${this.tables.contacts}
       (id, tenant_id, provider, provider_instance, provider_contact_ref, display_name,
        normalized_phone, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (tenant_id, id) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         normalized_phone = EXCLUDED.normalized_phone,
         updated_at = EXCLUDED.updated_at`,
      [item.contact.id, item.tenantId, item.contact.provider, item.contact.providerInstance,
        item.contact.providerContactRef, item.contact.displayName, item.contact.normalizedPhone,
        item.contact.createdAt, item.contact.updatedAt],
    );

    await this.client.query(
      `INSERT INTO ${this.tables.conversations}
       (id, tenant_id, contact_id, channel, provider, provider_instance,
        provider_conversation_ref, first_contact_at, last_activity_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (tenant_id, id) DO UPDATE SET
         contact_id = EXCLUDED.contact_id,
         last_activity_at = EXCLUDED.last_activity_at,
         updated_at = EXCLUDED.updated_at`,
      [item.conversation.id, item.tenantId, item.contact.id, item.conversation.channel,
        item.conversation.provider, item.conversation.providerInstance,
        item.conversation.providerConversationRef, item.conversation.firstContactAt,
        item.conversation.lastActivityAt, item.conversation.firstContactAt,
        item.opportunity.updatedAt],
    );

    for (const message of item.conversation.messages) {
      await this.client.query(
        `INSERT INTO ${this.tables.messages}
         (id, tenant_id, conversation_id, provider, provider_instance, provider_message_id,
          direction, content_type, body_text, evidence_ref, occurred_at, received_at,
          source_kind, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'FIXTURE',$12)
         ON CONFLICT (tenant_id, provider, provider_instance, provider_message_id) DO UPDATE SET
           direction = EXCLUDED.direction,
           body_text = EXCLUDED.body_text,
           evidence_ref = EXCLUDED.evidence_ref,
           occurred_at = EXCLUDED.occurred_at,
           received_at = EXCLUDED.received_at`,
        [message.id, item.tenantId, item.conversation.id, message.provider,
          item.conversation.providerInstance, message.providerMessageId, message.direction,
          message.contentType, message.text, message.evidenceRef, message.occurredAt,
          message.receivedAt],
      );
    }

    const saved = await this.client.query(
      `INSERT INTO ${this.tables.opportunities} AS current
       (id, tenant_id, workspace_id, contact_id, conversation_id, stage, lead_data,
        attribution_data, workflow_data, activity_data, version, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11,$12,$13)
       ON CONFLICT (tenant_id, id) DO UPDATE SET
         contact_id = EXCLUDED.contact_id,
         conversation_id = EXCLUDED.conversation_id,
         stage = EXCLUDED.stage,
         lead_data = EXCLUDED.lead_data,
         attribution_data = EXCLUDED.attribution_data,
         workflow_data = EXCLUDED.workflow_data,
         activity_data = EXCLUDED.activity_data,
         version = EXCLUDED.version,
         updated_at = EXCLUDED.updated_at
       WHERE current.version = EXCLUDED.version - 1
       RETURNING id`,
      [item.opportunity.id, item.tenantId, item.id, item.contact.id, item.conversation.id,
        item.opportunity.stage, JSON.stringify(item.lead), JSON.stringify(item.attribution),
        JSON.stringify(item.opportunity), JSON.stringify(item.activity),
        item.opportunity.version, item.opportunity.createdAt, item.opportunity.updatedAt],
    );
    if (saved.rowCount !== 1) {
      throw conflict("commercial_version_conflict", "Commercial workspace version changed");
    }
  }

  async list(): Promise<CommercialWorkspaceItem[]> {
    const result = await this.client.query(
      `SELECT opportunity.workspace_id
       FROM ${this.tables.opportunities} opportunity
       WHERE opportunity.tenant_id = $1
       ORDER BY opportunity.updated_at DESC, opportunity.id`,
      [this.tenantId],
    );
    const items = await Promise.all(result.rows.map((row) =>
      this.findById(String((row as Record<string, unknown>).workspace_id))));
    return items.filter((item): item is CommercialWorkspaceItem => item !== null);
  }

  async replaceTenant(_items: CommercialWorkspaceItem[]): Promise<void> {
    throw new Error("commercial_postgres_replace_forbidden");
  }

  private async findOne(where: string, parameters: unknown[]): Promise<CommercialWorkspaceItem | null> {
    const result = await this.client.query(
      `SELECT opportunity.workspace_id, opportunity.lead_data, opportunity.attribution_data,
              opportunity.workflow_data, opportunity.activity_data,
              contact.id AS contact_id, contact.provider AS contact_provider,
              contact.provider_instance AS contact_provider_instance,
              contact.provider_contact_ref, contact.display_name, contact.normalized_phone,
              contact.created_at AS contact_created_at, contact.updated_at AS contact_updated_at,
              conversation.id AS conversation_id, conversation.channel,
              conversation.provider AS conversation_provider,
              conversation.provider_instance AS conversation_provider_instance,
              conversation.provider_conversation_ref, conversation.first_contact_at,
              conversation.last_activity_at
       FROM ${this.tables.opportunities} opportunity
       JOIN ${this.tables.contacts} contact
         ON contact.tenant_id = opportunity.tenant_id AND contact.id = opportunity.contact_id
       JOIN ${this.tables.conversations} conversation
         ON conversation.tenant_id = opportunity.tenant_id AND conversation.id = opportunity.conversation_id
       WHERE opportunity.tenant_id = $1 AND ${where}
       ORDER BY opportunity.updated_at DESC
       LIMIT 1`,
      parameters,
    );
    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (!row) return null;
    const messages = await this.messages(String(row.conversation_id));
    const contact: CommercialContact = {
      id: String(row.contact_id),
      tenantId: this.tenantId,
      provider: "EVOLUTION",
      providerInstance: String(row.contact_provider_instance),
      providerContactRef: String(row.provider_contact_ref),
      displayName: String(row.display_name),
      normalizedPhone: row.normalized_phone ? String(row.normalized_phone) : null,
      createdAt: iso(row.contact_created_at),
      updatedAt: iso(row.contact_updated_at),
      fixtureOnly: true,
    };
    const conversation: CommercialConversation = {
      id: String(row.conversation_id),
      tenantId: this.tenantId,
      contactId: contact.id,
      channel: "WHATSAPP",
      provider: "EVOLUTION",
      providerInstance: String(row.conversation_provider_instance),
      providerConversationRef: String(row.provider_conversation_ref),
      contactName: contact.displayName,
      messages,
      firstContactAt: iso(row.first_contact_at),
      lastActivityAt: iso(row.last_activity_at),
      fixtureOnly: true,
    };
    return {
      id: String(row.workspace_id),
      tenantId: this.tenantId,
      contact,
      conversation,
      lead: jsonValue<CommercialLead>(row.lead_data),
      attribution: jsonValue<CommercialAttribution>(row.attribution_data),
      opportunity: jsonValue<CommercialOpportunity>(row.workflow_data),
      activity: jsonValue<CommercialActivity[]>(row.activity_data),
      fixtureVersion: null,
    };
  }

  private async messages(conversationId: string): Promise<NormalizedConversationMessage[]> {
    const result = await this.client.query(
      `SELECT id, provider_message_id, direction, content_type, body_text, evidence_ref,
              occurred_at, received_at
       FROM ${this.tables.messages}
       WHERE tenant_id = $1 AND conversation_id = $2
       ORDER BY occurred_at, id`,
      [this.tenantId, conversationId],
    );
    return result.rows.map((candidate) => {
      const row = candidate as Record<string, unknown>;
      return {
        id: String(row.id),
        provider: "EVOLUTION",
        providerMessageId: String(row.provider_message_id),
        direction: String(row.direction) as NormalizedConversationMessage["direction"],
        occurredAt: iso(row.occurred_at),
        receivedAt: iso(row.received_at),
        contentType: "TEXT",
        text: String(row.body_text),
        evidenceRef: String(row.evidence_ref),
        fixtureOnly: true,
      };
    });
  }

  private assertTenant(tenantId: string): void {
    if (tenantId !== this.tenantId) throw new Error("commercial_store_tenant_mismatch");
  }
}

export class PostgresCommercialReplayStore implements CommercialReplayStore {
  private readonly pool: Pool;
  private readonly tables: CommercialTables;

  constructor(private readonly config: SportexConfig) {
    if (!config.databaseUrl) throw new Error("database_url_required");
    this.pool = new Pool({ connectionString: config.databaseUrl, max: 10 });
    this.tables = tablesForPrefix(config.tablePrefix);
  }

  async transaction<T>(
    tenantId: string,
    operation: (transaction: CommercialReplayTransaction) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      if (this.config.databaseRole) await client.query(`SET LOCAL ROLE ${this.config.databaseRole}`);
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
      await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [`commercial:${tenantId}`]);
      const result = await operation(new PostgresCommercialTransaction(client, tenantId, this.tables));
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
