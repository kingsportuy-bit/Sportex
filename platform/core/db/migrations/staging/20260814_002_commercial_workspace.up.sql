BEGIN;

CREATE TABLE public.sportex_staging_commercial_contacts (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.sportex_staging_tenants(id),
  provider text NOT NULL CHECK (provider = 'EVOLUTION'),
  provider_instance text NOT NULL CHECK (char_length(provider_instance) BETWEEN 1 AND 120),
  provider_contact_ref text NOT NULL CHECK (char_length(provider_contact_ref) BETWEEN 3 AND 160),
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 120),
  normalized_phone text CHECK (normalized_phone IS NULL OR normalized_phone ~ '^\+[1-9][0-9]{7,14}$'),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, provider, provider_instance, provider_contact_ref)
);

CREATE TABLE public.sportex_staging_commercial_conversations (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.sportex_staging_tenants(id),
  contact_id uuid NOT NULL,
  channel text NOT NULL CHECK (channel = 'WHATSAPP'),
  provider text NOT NULL CHECK (provider = 'EVOLUTION'),
  provider_instance text NOT NULL CHECK (char_length(provider_instance) BETWEEN 1 AND 120),
  provider_conversation_ref text NOT NULL CHECK (char_length(provider_conversation_ref) BETWEEN 3 AND 160),
  first_contact_at timestamptz NOT NULL,
  last_activity_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, provider, provider_instance, provider_conversation_ref),
  CONSTRAINT sportex_staging_commercial_conversations_contact_fk
    FOREIGN KEY (tenant_id, contact_id)
    REFERENCES public.sportex_staging_commercial_contacts(tenant_id, id)
);

CREATE TABLE public.sportex_staging_commercial_messages (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.sportex_staging_tenants(id),
  conversation_id uuid NOT NULL,
  provider text NOT NULL CHECK (provider = 'EVOLUTION'),
  provider_instance text NOT NULL CHECK (char_length(provider_instance) BETWEEN 1 AND 120),
  provider_message_id text NOT NULL CHECK (char_length(provider_message_id) BETWEEN 1 AND 160),
  direction text NOT NULL CHECK (direction IN ('CLIENTE', 'DELTA')),
  content_type text NOT NULL CHECK (content_type = 'TEXT'),
  body_text text NOT NULL CHECK (char_length(body_text) BETWEEN 1 AND 4000),
  evidence_ref text NOT NULL CHECK (char_length(evidence_ref) BETWEEN 3 AND 240),
  occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL,
  source_kind text NOT NULL CHECK (source_kind IN ('LIVE', 'BACKFILL', 'FIXTURE')),
  created_at timestamptz NOT NULL,
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, provider, provider_instance, provider_message_id),
  CONSTRAINT sportex_staging_commercial_messages_conversation_fk
    FOREIGN KEY (tenant_id, conversation_id)
    REFERENCES public.sportex_staging_commercial_conversations(tenant_id, id)
);

CREATE INDEX sportex_staging_commercial_messages_timeline_idx
  ON public.sportex_staging_commercial_messages (tenant_id, conversation_id, occurred_at, id);

CREATE TABLE public.sportex_staging_commercial_opportunities (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.sportex_staging_tenants(id),
  contact_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  stage text NOT NULL CHECK (stage IN ('NUEVO', 'EN_CALIFICACION', 'COTIZADO', 'EN_SEGUIMIENTO', 'PERDIDO', 'SENA_VALIDADA')),
  lead_data jsonb NOT NULL,
  attribution_data jsonb NOT NULL,
  workflow_data jsonb NOT NULL,
  activity_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (tenant_id, id),
  CONSTRAINT sportex_staging_commercial_opportunities_contact_fk
    FOREIGN KEY (tenant_id, contact_id)
    REFERENCES public.sportex_staging_commercial_contacts(tenant_id, id),
  CONSTRAINT sportex_staging_commercial_opportunities_conversation_fk
    FOREIGN KEY (tenant_id, conversation_id)
    REFERENCES public.sportex_staging_commercial_conversations(tenant_id, id)
);

CREATE INDEX sportex_staging_commercial_opportunities_stage_idx
  ON public.sportex_staging_commercial_opportunities (tenant_id, stage, updated_at DESC);

CREATE TABLE public.sportex_staging_commercial_core_links (
  tenant_id uuid NOT NULL REFERENCES public.sportex_staging_tenants(id),
  opportunity_id uuid NOT NULL,
  client_id uuid NOT NULL,
  certified_payment_id uuid NOT NULL,
  order_id uuid NOT NULL,
  evidence_reference text NOT NULL CHECK (char_length(evidence_reference) BETWEEN 3 AND 160),
  linked_by uuid NOT NULL,
  linked_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, opportunity_id),
  UNIQUE (tenant_id, order_id),
  CONSTRAINT sportex_staging_commercial_core_links_opportunity_fk
    FOREIGN KEY (tenant_id, opportunity_id)
    REFERENCES public.sportex_staging_commercial_opportunities(tenant_id, id),
  CONSTRAINT sportex_staging_commercial_core_links_client_fk
    FOREIGN KEY (tenant_id, client_id)
    REFERENCES public.sportex_staging_clients(tenant_id, id),
  CONSTRAINT sportex_staging_commercial_core_links_payment_fk
    FOREIGN KEY (tenant_id, certified_payment_id)
    REFERENCES public.sportex_staging_certified_payments(tenant_id, id),
  CONSTRAINT sportex_staging_commercial_core_links_order_fk
    FOREIGN KEY (tenant_id, order_id)
    REFERENCES public.sportex_staging_orders(tenant_id, id)
);

ALTER TABLE public.sportex_staging_commercial_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_commercial_contacts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_commercial_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_commercial_conversations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_commercial_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_commercial_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_commercial_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_commercial_opportunities FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_commercial_core_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_commercial_core_links FORCE ROW LEVEL SECURITY;

CREATE POLICY sportex_staging_commercial_contacts_isolation ON public.sportex_staging_commercial_contacts
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY sportex_staging_commercial_conversations_isolation ON public.sportex_staging_commercial_conversations
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY sportex_staging_commercial_messages_isolation ON public.sportex_staging_commercial_messages
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY sportex_staging_commercial_opportunities_isolation ON public.sportex_staging_commercial_opportunities
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY sportex_staging_commercial_core_links_isolation ON public.sportex_staging_commercial_core_links
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

REVOKE ALL ON TABLE
  public.sportex_staging_commercial_contacts,
  public.sportex_staging_commercial_conversations,
  public.sportex_staging_commercial_messages,
  public.sportex_staging_commercial_opportunities,
  public.sportex_staging_commercial_core_links
FROM PUBLIC;

GRANT SELECT, INSERT, UPDATE ON public.sportex_staging_commercial_contacts TO sportex_staging_app;
GRANT SELECT, INSERT, UPDATE ON public.sportex_staging_commercial_conversations TO sportex_staging_app;
GRANT SELECT, INSERT, UPDATE ON public.sportex_staging_commercial_messages TO sportex_staging_app;
GRANT SELECT, INSERT, UPDATE ON public.sportex_staging_commercial_opportunities TO sportex_staging_app;
GRANT SELECT, INSERT ON public.sportex_staging_commercial_core_links TO sportex_staging_app;

COMMIT;
