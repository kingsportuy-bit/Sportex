BEGIN;

CREATE INDEX sportex_staging_commercial_conversations_page_idx
  ON public.sportex_staging_commercial_conversations (tenant_id, last_activity_at DESC, id DESC);

CREATE INDEX sportex_staging_commercial_messages_unread_idx
  ON public.sportex_staging_commercial_messages (tenant_id, conversation_id, direction, occurred_at, id);

COMMIT;
