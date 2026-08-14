BEGIN;

CREATE TABLE public.sportex_staging_whatsapp_ingress_events (
  tenant_id uuid NOT NULL REFERENCES public.sportex_staging_tenants(id),
  provider_event_id text NOT NULL CHECK (char_length(provider_event_id) BETWEEN 1 AND 160),
  event_id text NOT NULL CHECK (char_length(event_id) BETWEEN 1 AND 160),
  provider text NOT NULL CHECK (provider = 'EVOLUTION'),
  provider_instance text NOT NULL CHECK (char_length(provider_instance) BETWEEN 1 AND 120),
  environment text NOT NULL CHECK (environment IN ('DESARROLLO_LOCAL', 'PILOTO_DELTA')),
  occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL,
  source_kind text NOT NULL CHECK (source_kind IN ('SIMULATED_LIVE', 'BACKFILL', 'LIVE')),
  envelope_data jsonb NOT NULL,
  processing_state text NOT NULL DEFAULT 'PENDING'
    CHECK (processing_state IN ('PENDING', 'PROCESSED', 'QUARANTINED')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  last_error_code text CHECK (last_error_code IS NULL OR char_length(last_error_code) <= 160),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, provider_event_id)
);

CREATE INDEX sportex_staging_whatsapp_ingress_pending_idx
  ON public.sportex_staging_whatsapp_ingress_events
  (tenant_id, processing_state, occurred_at, received_at, provider_event_id)
  WHERE processing_state = 'PENDING';

CREATE TABLE public.sportex_staging_whatsapp_outbound_messages (
  tenant_id uuid NOT NULL REFERENCES public.sportex_staging_tenants(id),
  idempotency_key text NOT NULL CHECK (char_length(idempotency_key) BETWEEN 1 AND 200),
  conversation_ref text NOT NULL CHECK (char_length(conversation_ref) BETWEEN 3 AND 160),
  destination_ref text NOT NULL CHECK (char_length(destination_ref) BETWEEN 3 AND 160),
  body_text text NOT NULL CHECK (char_length(body_text) BETWEEN 1 AND 4000),
  correlation_id text NOT NULL CHECK (char_length(correlation_id) BETWEEN 1 AND 128),
  confirmed_by uuid NOT NULL,
  provider_message_id text CHECK (provider_message_id IS NULL OR char_length(provider_message_id) BETWEEN 1 AND 160),
  delivery_status text NOT NULL DEFAULT 'PENDING'
    CHECK (delivery_status IN ('PENDING', 'UNKNOWN', 'SENT', 'DELIVERED', 'READ', 'FAILED')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, idempotency_key)
);

CREATE UNIQUE INDEX sportex_staging_whatsapp_outbound_provider_message_idx
  ON public.sportex_staging_whatsapp_outbound_messages (tenant_id, provider_message_id)
  WHERE provider_message_id IS NOT NULL;

ALTER TABLE public.sportex_staging_whatsapp_ingress_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_whatsapp_ingress_events FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_whatsapp_outbound_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_whatsapp_outbound_messages FORCE ROW LEVEL SECURITY;

CREATE POLICY sportex_staging_whatsapp_ingress_isolation ON public.sportex_staging_whatsapp_ingress_events
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY sportex_staging_whatsapp_outbound_isolation ON public.sportex_staging_whatsapp_outbound_messages
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

REVOKE ALL ON TABLE
  public.sportex_staging_whatsapp_ingress_events,
  public.sportex_staging_whatsapp_outbound_messages
FROM PUBLIC;

GRANT SELECT, INSERT, UPDATE ON public.sportex_staging_whatsapp_ingress_events TO sportex_staging_app;
GRANT SELECT, INSERT, UPDATE ON public.sportex_staging_whatsapp_outbound_messages TO sportex_staging_app;

COMMIT;
