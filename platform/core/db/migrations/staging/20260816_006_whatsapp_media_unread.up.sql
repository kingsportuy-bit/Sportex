BEGIN;

CREATE TABLE public.sportex_staging_whatsapp_media_assets (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.sportex_staging_tenants(id),
  mime_type text NOT NULL CHECK (mime_type IN ('image/jpeg','image/png','image/webp')),
  file_name text NOT NULL CHECK (char_length(file_name) BETWEEN 1 AND 120),
  size_bytes integer NOT NULL CHECK (size_bytes BETWEEN 1 AND 5242880),
  sha256 text NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'),
  data bytea NOT NULL CHECK (octet_length(data) = size_bytes),
  created_at timestamptz NOT NULL,
  fixture_only boolean NOT NULL DEFAULT false,
  UNIQUE (tenant_id, id)
);

ALTER TABLE public.sportex_staging_commercial_messages
  DROP CONSTRAINT sportex_staging_commercial_messages_content_type_check,
  DROP CONSTRAINT sportex_staging_commercial_messages_body_text_check,
  ADD COLUMN media_asset_id uuid,
  ADD CONSTRAINT sportex_staging_commercial_messages_content_type_check CHECK (content_type IN ('TEXT','IMAGE')),
  ADD CONSTRAINT sportex_staging_commercial_messages_body_text_check CHECK (char_length(body_text) BETWEEN 0 AND 4000),
  ADD CONSTRAINT sportex_staging_commercial_messages_media_fk FOREIGN KEY (tenant_id, media_asset_id)
    REFERENCES public.sportex_staging_whatsapp_media_assets(tenant_id, id),
  ADD CONSTRAINT sportex_staging_commercial_messages_content_check CHECK (
    (content_type = 'TEXT' AND char_length(body_text) > 0 AND media_asset_id IS NULL)
    OR (content_type = 'IMAGE' AND media_asset_id IS NOT NULL)
  );

CREATE TABLE public.sportex_staging_conversation_read_states (
  tenant_id uuid NOT NULL REFERENCES public.sportex_staging_tenants(id),
  actor_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  last_read_message_id uuid NOT NULL,
  last_read_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, actor_id, conversation_id),
  CONSTRAINT sportex_staging_read_state_conversation_fk FOREIGN KEY (tenant_id, conversation_id)
    REFERENCES public.sportex_staging_commercial_conversations(tenant_id, id),
  CONSTRAINT sportex_staging_read_state_message_fk FOREIGN KEY (tenant_id, last_read_message_id)
    REFERENCES public.sportex_staging_commercial_messages(tenant_id, id)
);

ALTER TABLE public.sportex_staging_whatsapp_outbound_messages
  DROP CONSTRAINT sportex_staging_whatsapp_outbound_messages_body_text_check,
  ADD COLUMN media_mime_type text,
  ADD COLUMN media_file_name text,
  ADD COLUMN media_size_bytes integer,
  ADD COLUMN media_sha256 text,
  ADD COLUMN media_data bytea,
  ADD COLUMN media_width integer,
  ADD COLUMN media_height integer,
  ADD CONSTRAINT sportex_staging_whatsapp_outbound_messages_body_text_check CHECK (char_length(body_text) BETWEEN 0 AND 4000),
  ADD CONSTRAINT sportex_staging_whatsapp_outbound_media_check CHECK (
    (media_sha256 IS NULL AND media_mime_type IS NULL AND media_data IS NULL AND char_length(body_text) > 0)
    OR (media_sha256 ~ '^[a-f0-9]{64}$' AND media_mime_type IN ('image/jpeg','image/png','image/webp')
        AND media_file_name IS NOT NULL AND media_size_bytes BETWEEN 1 AND 5242880
        AND octet_length(media_data) = media_size_bytes)
  );

ALTER TABLE public.sportex_staging_whatsapp_media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_whatsapp_media_assets FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_conversation_read_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_conversation_read_states FORCE ROW LEVEL SECURITY;

CREATE POLICY sportex_staging_whatsapp_media_isolation ON public.sportex_staging_whatsapp_media_assets
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY sportex_staging_conversation_read_isolation ON public.sportex_staging_conversation_read_states
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

REVOKE ALL ON TABLE public.sportex_staging_whatsapp_media_assets,
  public.sportex_staging_conversation_read_states FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE ON public.sportex_staging_whatsapp_media_assets TO sportex_staging_app;
GRANT SELECT, INSERT, UPDATE ON public.sportex_staging_conversation_read_states TO sportex_staging_app;

COMMIT;
