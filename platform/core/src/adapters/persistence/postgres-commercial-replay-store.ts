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
  CommercialTimelineOperationalEvent,
  CommercialWorkspaceItem,
  CommercialMediaAsset,
  CommercialConversationReadState,
  NormalizedConversationMessage,
} from "../../domain/commercial-models.js";
import {
  buildConversationTimeline,
  mergeOperationalEvents,
  projectOperationalEvents,
  readableOperationalDetail,
} from "../../domain/commercial-timeline.js";
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
  timelineEvents: string;
  idempotency: string;
  mediaAssets: string;
  readStates: string;
}

export interface TimelineProjectionFailure {
  operation: "read" | "write";
  tenantId: string;
  conversationId: string;
  errorCode: string;
}

type TimelineProjectionFailureObserver = (failure: TimelineProjectionFailure) => void;

function errorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) return String(error.code);
  return "timeline_projection_failed";
}

function observeFailure(
  observer: TimelineProjectionFailureObserver,
  failure: TimelineProjectionFailure,
): void {
  try {
    observer(failure);
  } catch {
    // Observability is intentionally non-authoritative for the main mutation.
  }
}

function tablesForPrefix(prefix: SportexConfig["tablePrefix"]): CommercialTables {
  return {
    contacts: `${prefix}commercial_contacts`,
    conversations: `${prefix}commercial_conversations`,
    messages: `${prefix}commercial_messages`,
    opportunities: `${prefix}commercial_opportunities`,
    timelineEvents: `${prefix}conversation_timeline_events`,
    idempotency: `${prefix}idempotency`,
    mediaAssets: `${prefix}whatsapp_media_assets`,
    readStates: `${prefix}conversation_read_states`,
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
    private readonly onTimelineProjectionFailure: TimelineProjectionFailureObserver,
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

  async findMedia(assetId: string): Promise<CommercialMediaAsset | null> {
    const result = await this.client.query(
      `SELECT id, mime_type, file_name, size_bytes, sha256, width, height, data, created_at, fixture_only
       FROM ${this.tables.mediaAssets} WHERE tenant_id = $1 AND id = $2`,
      [this.tenantId, assetId],
    );
    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (!row) return null;
    const data = row.data;
    return {
      id: String(row.id), tenantId: this.tenantId,
      mimeType: String(row.mime_type) as CommercialMediaAsset["mimeType"],
      fileName: String(row.file_name), sizeBytes: Number(row.size_bytes), sha256: String(row.sha256),
      width: row.width === null ? null : Number(row.width), height: row.height === null ? null : Number(row.height),
      dataBase64: Buffer.isBuffer(data) ? data.toString("base64") : Buffer.from(String(data)).toString("base64"),
      createdAt: iso(row.created_at), fixtureOnly: Boolean(row.fixture_only),
    };
  }

  async findMediaByMessageId(messageId: string): Promise<CommercialMediaAsset | null> {
    const result = await this.client.query(
      `SELECT asset.id, asset.mime_type, asset.file_name, asset.size_bytes, asset.sha256, asset.width, asset.height,
              asset.data, asset.created_at, asset.fixture_only
       FROM ${this.tables.messages} message
       JOIN ${this.tables.mediaAssets} asset
         ON asset.tenant_id = message.tenant_id AND asset.id = message.media_asset_id
       WHERE message.tenant_id = $1 AND message.id = $2`,
      [this.tenantId, messageId],
    );
    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (!row) return null;
    const data = row.data;
    return {
      id: String(row.id), tenantId: this.tenantId, mimeType: String(row.mime_type) as CommercialMediaAsset["mimeType"],
      fileName: String(row.file_name), sizeBytes: Number(row.size_bytes), sha256: String(row.sha256),
      width: row.width === null ? null : Number(row.width), height: row.height === null ? null : Number(row.height),
      dataBase64: Buffer.isBuffer(data) ? data.toString("base64") : Buffer.from(String(data)).toString("base64"),
      createdAt: iso(row.created_at), fixtureOnly: Boolean(row.fixture_only),
    };
  }

  async saveMedia(asset: CommercialMediaAsset): Promise<void> {
    this.assertTenant(asset.tenantId);
    const result = await this.client.query(
      `INSERT INTO ${this.tables.mediaAssets}
       (id, tenant_id, mime_type, file_name, size_bytes, sha256, width, height, data, created_at, fixture_only)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,decode($9,'base64'),$10,$11)
       ON CONFLICT (tenant_id, id) DO UPDATE SET id = EXCLUDED.id RETURNING sha256`,
      [asset.id, asset.tenantId, asset.mimeType, asset.fileName, asset.sizeBytes, asset.sha256,
        asset.width, asset.height, asset.dataBase64, asset.createdAt, asset.fixtureOnly],
    );
    if (String((result.rows[0] as Record<string, unknown>).sha256) !== asset.sha256) {
      throw conflict("commercial_media_conflict", "Media asset identifier was reused with different content");
    }
  }

  async findReadState(actorId: string, conversationId: string): Promise<CommercialConversationReadState | null> {
    const result = await this.client.query(
      `SELECT last_read_message_id, last_read_at FROM ${this.tables.readStates}
       WHERE tenant_id = $1 AND actor_id = $2 AND conversation_id = $3`,
      [this.tenantId, actorId, conversationId],
    );
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? { tenantId: this.tenantId, actorId, conversationId,
      lastReadMessageId: String(row.last_read_message_id), lastReadAt: iso(row.last_read_at) } : null;
  }

  async saveReadState(state: CommercialConversationReadState): Promise<void> {
    this.assertTenant(state.tenantId);
    await this.client.query(
      `INSERT INTO ${this.tables.readStates}
       (tenant_id, actor_id, conversation_id, last_read_message_id, last_read_at)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (tenant_id, actor_id, conversation_id) DO UPDATE SET
         last_read_message_id = EXCLUDED.last_read_message_id, last_read_at = EXCLUDED.last_read_at`,
      [state.tenantId, state.actorId, state.conversationId, state.lastReadMessageId, state.lastReadAt],
    );
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
          source_kind, media_asset_id, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$12)
         ON CONFLICT (tenant_id, provider, provider_instance, provider_message_id) DO UPDATE SET
           direction = EXCLUDED.direction,
           body_text = EXCLUDED.body_text,
           evidence_ref = EXCLUDED.evidence_ref,
           occurred_at = EXCLUDED.occurred_at,
           received_at = EXCLUDED.received_at`,
        [message.id, item.tenantId, item.conversation.id, message.provider,
          item.conversation.providerInstance, message.providerMessageId, message.direction,
          message.contentType, message.text, message.evidenceRef, message.occurredAt,
          message.receivedAt, message.sourceKind ?? "FIXTURE", message.media?.assetId ?? null],
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

    await this.client.query("SAVEPOINT sportex_timeline_write");
    try {
      for (const event of projectOperationalEvents(item)) {
        await this.client.query(
          `INSERT INTO ${this.tables.timelineEvents}
           (event_id, tenant_id, conversation_id, event_type, actor_kind, actor_ref,
            origin, correlation_id, evidence_message_id, label, detail, occurred_at, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,now())
           ON CONFLICT (tenant_id, event_id) DO NOTHING`,
          [event.id, item.tenantId, item.conversation.id, event.eventType,
            event.actor.kind, event.actor.ref, event.origin, event.correlationId,
            event.evidenceMessageId, event.label, event.detail, event.occurredAt],
        );
      }
      await this.client.query("RELEASE SAVEPOINT sportex_timeline_write");
    } catch (error) {
      await this.client.query("ROLLBACK TO SAVEPOINT sportex_timeline_write");
      await this.client.query("RELEASE SAVEPOINT sportex_timeline_write");
      observeFailure(this.onTimelineProjectionFailure, {
        operation: "write",
        tenantId: item.tenantId,
        conversationId: item.conversation.id,
        errorCode: errorCode(error),
      });
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
    const items: CommercialWorkspaceItem[] = [];
    for (const row of result.rows) {
      const item = await this.findById(String((row as Record<string, unknown>).workspace_id));
      if (item) items.push(item);
    }
    return items;
  }

  async listPage(actorId: string, limit: number, cursor: string | null): Promise<{ items: CommercialWorkspaceItem[]; nextCursor: string | null }> {
    const result = await this.client.query(
      `SELECT opportunity.workspace_id, opportunity.lead_data, opportunity.attribution_data, opportunity.workflow_data,
              contact.id AS contact_id, contact.provider AS contact_provider, contact.provider_instance AS contact_provider_instance,
              contact.provider_contact_ref, contact.display_name, contact.normalized_phone, contact.created_at AS contact_created_at,
              contact.updated_at AS contact_updated_at, conversation.id AS conversation_id, conversation.channel,
              conversation.provider AS conversation_provider, conversation.provider_instance AS conversation_provider_instance,
              conversation.provider_conversation_ref, conversation.first_contact_at, conversation.last_activity_at,
              latest.id AS latest_id, latest.provider_message_id AS latest_provider_message_id, latest.direction AS latest_direction,
              latest.content_type AS latest_content_type, latest.body_text AS latest_body_text, latest.evidence_ref AS latest_evidence_ref,
              latest.occurred_at AS latest_occurred_at, latest.received_at AS latest_received_at, latest.source_kind AS latest_source_kind,
              latest.media_asset_id AS latest_media_asset_id, media.mime_type AS latest_media_mime_type,
              media.file_name AS latest_media_file_name, media.size_bytes AS latest_media_size_bytes,
              media.width AS latest_media_width, media.height AS latest_media_height,
              COALESCE(unread.unread_count, 0) AS unread_count
       FROM ${this.tables.opportunities} opportunity
       JOIN ${this.tables.contacts} contact
         ON contact.tenant_id = opportunity.tenant_id AND contact.id = opportunity.contact_id
       JOIN ${this.tables.conversations} conversation
         ON conversation.tenant_id = opportunity.tenant_id AND conversation.id = opportunity.conversation_id
       LEFT JOIN ${this.tables.readStates} read_state
         ON read_state.tenant_id = opportunity.tenant_id AND read_state.actor_id = $2 AND read_state.conversation_id = conversation.id
       LEFT JOIN ${this.tables.messages} read_message
         ON read_message.tenant_id = opportunity.tenant_id AND read_message.id = read_state.last_read_message_id
       LEFT JOIN LATERAL (
         SELECT id, provider_message_id, direction, content_type, body_text, evidence_ref, occurred_at, received_at, source_kind, media_asset_id
         FROM ${this.tables.messages}
         WHERE tenant_id = opportunity.tenant_id AND conversation_id = conversation.id
         ORDER BY occurred_at DESC, id DESC LIMIT 1
       ) latest ON true
       LEFT JOIN ${this.tables.mediaAssets} media
         ON media.tenant_id = opportunity.tenant_id AND media.id = latest.media_asset_id
       LEFT JOIN LATERAL (
         SELECT count(*)::integer AS unread_count
         FROM ${this.tables.messages} candidate
         WHERE candidate.tenant_id = opportunity.tenant_id AND candidate.conversation_id = conversation.id
           AND candidate.direction = 'CLIENTE'
           AND (read_message.id IS NULL OR (candidate.occurred_at, candidate.id) > (read_message.occurred_at, read_message.id))
       ) unread ON true
       WHERE opportunity.tenant_id = $1
         AND ($3::text IS NULL OR (conversation.last_activity_at, opportunity.workspace_id) < (
           SELECT candidate_conversation.last_activity_at, candidate_opportunity.workspace_id
           FROM ${this.tables.opportunities} candidate_opportunity
           JOIN ${this.tables.conversations} candidate_conversation
             ON candidate_conversation.tenant_id = candidate_opportunity.tenant_id
            AND candidate_conversation.id = candidate_opportunity.conversation_id
           WHERE candidate_opportunity.tenant_id = $1 AND candidate_opportunity.workspace_id = $3
         ))
       ORDER BY conversation.last_activity_at DESC, opportunity.workspace_id DESC
       LIMIT $4`,
      [this.tenantId, actorId, cursor, limit + 1],
    );
    const rows = result.rows as Record<string, unknown>[];
    const visible = rows.slice(0, limit);
    const items = visible.map((row) => this.summaryFromRow(row));
    return { items, nextCursor: rows.length > limit ? String(visible.at(-1)?.workspace_id ?? "") : null };
  }

  private summaryFromRow(row: Record<string, unknown>): CommercialWorkspaceItem {
    const latest = row.latest_id ? {
      id: String(row.latest_id), provider: "EVOLUTION" as const, providerMessageId: String(row.latest_provider_message_id),
      direction: String(row.latest_direction) as NormalizedConversationMessage["direction"],
      occurredAt: iso(row.latest_occurred_at), receivedAt: iso(row.latest_received_at),
      contentType: String(row.latest_content_type) as NormalizedConversationMessage["contentType"],
      text: String(row.latest_body_text),
      media: row.latest_media_asset_id ? {
        assetId: String(row.latest_media_asset_id), mimeType: String(row.latest_media_mime_type) as CommercialMediaAsset["mimeType"],
        fileName: String(row.latest_media_file_name), sizeBytes: Number(row.latest_media_size_bytes),
        width: row.latest_media_width === null ? null : Number(row.latest_media_width),
        height: row.latest_media_height === null ? null : Number(row.latest_media_height),
      } : null,
      evidenceRef: String(row.latest_evidence_ref), sourceKind: String(row.latest_source_kind) as NonNullable<NormalizedConversationMessage["sourceKind"]>,
      fixtureOnly: String(row.latest_source_kind) === "FIXTURE",
    } : null;
    const contact: CommercialContact = {
      id: String(row.contact_id), tenantId: this.tenantId, provider: "EVOLUTION", providerInstance: String(row.contact_provider_instance),
      providerContactRef: String(row.provider_contact_ref), displayName: String(row.display_name),
      normalizedPhone: row.normalized_phone ? String(row.normalized_phone) : null,
      createdAt: iso(row.contact_created_at), updatedAt: iso(row.contact_updated_at), fixtureOnly: latest?.fixtureOnly ?? false,
    };
    return {
      id: String(row.workspace_id), tenantId: this.tenantId, contact,
      conversation: {
        id: String(row.conversation_id), tenantId: this.tenantId, contactId: contact.id, channel: "WHATSAPP", provider: "EVOLUTION",
        providerInstance: String(row.conversation_provider_instance), providerConversationRef: String(row.provider_conversation_ref),
        contactName: contact.displayName, messages: latest ? [latest] : [], firstContactAt: iso(row.first_contact_at),
        lastActivityAt: iso(row.last_activity_at), fixtureOnly: latest?.fixtureOnly ?? false, unreadCount: Number(row.unread_count),
      },
      lead: jsonValue<CommercialLead>(row.lead_data), attribution: jsonValue<CommercialAttribution>(row.attribution_data),
      opportunity: jsonValue<CommercialOpportunity>(row.workflow_data), activity: [], fixtureVersion: null,
    };
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
    const timelineEvents = await this.timelineEvents(String(row.conversation_id));
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
      fixtureOnly: messages.every((message) => message.fixtureOnly),
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
      fixtureOnly: messages.every((message) => message.fixtureOnly),
    };
    const item: CommercialWorkspaceItem = {
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
    const sourceEvents = projectOperationalEvents(item);
    const operationalEvents = timelineEvents
      ? mergeOperationalEvents(sourceEvents, timelineEvents)
      : sourceEvents;
    return { ...item, timeline: buildConversationTimeline(item, operationalEvents) };
  }

  private async timelineEvents(conversationId: string): Promise<CommercialTimelineOperationalEvent[] | null> {
    await this.client.query("SAVEPOINT sportex_timeline_read");
    try {
      const result = await this.client.query(
        `SELECT event_id, event_type, actor_kind, actor_ref, origin, correlation_id,
                evidence_message_id, label, detail, occurred_at
         FROM ${this.tables.timelineEvents}
         WHERE tenant_id = $1 AND conversation_id = $2
         ORDER BY occurred_at, event_id`,
        [this.tenantId, conversationId],
      );
      await this.client.query("RELEASE SAVEPOINT sportex_timeline_read");
      return result.rows.map((candidate) => {
      const row = candidate as Record<string, unknown>;
      return {
        kind: "OPERATIONAL_EVENT",
        id: String(row.event_id),
        eventType: String(row.event_type) as CommercialTimelineOperationalEvent["eventType"],
        occurredAt: iso(row.occurred_at),
        actor: {
          kind: String(row.actor_kind) as CommercialTimelineOperationalEvent["actor"]["kind"],
          ref: String(row.actor_ref),
        },
        origin: String(row.origin) as CommercialTimelineOperationalEvent["origin"],
        correlationId: String(row.correlation_id),
        evidenceMessageId: row.evidence_message_id ? String(row.evidence_message_id) : null,
        label: String(row.label),
        detail: readableOperationalDetail(
          String(row.event_type) as CommercialTimelineOperationalEvent["eventType"],
          String(row.detail),
        ),
        };
      });
    } catch (error) {
      await this.client.query("ROLLBACK TO SAVEPOINT sportex_timeline_read");
      await this.client.query("RELEASE SAVEPOINT sportex_timeline_read");
      observeFailure(this.onTimelineProjectionFailure, {
        operation: "read",
        tenantId: this.tenantId,
        conversationId,
        errorCode: errorCode(error),
      });
      return null;
    }
  }

  private async messages(conversationId: string): Promise<NormalizedConversationMessage[]> {
    const result = await this.client.query(
      `SELECT id, provider_message_id, direction, content_type, body_text, evidence_ref,
              occurred_at, received_at, source_kind, media_asset_id
       FROM ${this.tables.messages}
       WHERE tenant_id = $1 AND conversation_id = $2
       ORDER BY occurred_at, id`,
      [this.tenantId, conversationId],
    );
    const messages: NormalizedConversationMessage[] = [];
    for (const candidate of result.rows) {
      const row = candidate as Record<string, unknown>;
      const contentType = String(row.content_type) as NormalizedConversationMessage["contentType"];
      const asset = row.media_asset_id ? await this.findMedia(String(row.media_asset_id)) : null;
      messages.push({
        id: String(row.id),
        provider: "EVOLUTION",
        providerMessageId: String(row.provider_message_id),
        direction: String(row.direction) as NormalizedConversationMessage["direction"],
        occurredAt: iso(row.occurred_at),
        receivedAt: iso(row.received_at),
        contentType,
        text: String(row.body_text),
        media: asset ? { assetId: asset.id, mimeType: asset.mimeType, fileName: asset.fileName,
          sizeBytes: asset.sizeBytes, width: asset.width, height: asset.height } : null,
        evidenceRef: String(row.evidence_ref),
        sourceKind: String(row.source_kind) as NonNullable<NormalizedConversationMessage["sourceKind"]>,
        fixtureOnly: String(row.source_kind) === "FIXTURE",
      });
    }
    return messages;
  }

  private assertTenant(tenantId: string): void {
    if (tenantId !== this.tenantId) throw new Error("commercial_store_tenant_mismatch");
  }
}

export class PostgresCommercialReplayStore implements CommercialReplayStore {
  private readonly pool: Pool;
  private readonly tables: CommercialTables;

  constructor(
    private readonly config: SportexConfig,
    private readonly onTimelineProjectionFailure: TimelineProjectionFailureObserver = () => undefined,
  ) {
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
      const result = await operation(new PostgresCommercialTransaction(
        client,
        tenantId,
        this.tables,
        this.onTimelineProjectionFailure,
      ));
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async checkReady(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      if (this.config.databaseRole) await client.query(`SET LOCAL ROLE ${this.config.databaseRole}`);
      await client.query("SELECT set_config('app.tenant_id', $1, true)", ["00000000-0000-4000-8000-000000000000"]);
      await client.query(
        `SELECT opportunity.workspace_id
         FROM ${this.tables.opportunities} opportunity
         JOIN ${this.tables.conversations} conversation
           ON conversation.tenant_id = opportunity.tenant_id
          AND conversation.id = opportunity.conversation_id
         LIMIT 0`,
      );
      await client.query(
        `SELECT event_id, tenant_id, conversation_id, event_type, actor_kind, origin,
                correlation_id, evidence_message_id, label, detail, occurred_at
         FROM ${this.tables.timelineEvents}
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
