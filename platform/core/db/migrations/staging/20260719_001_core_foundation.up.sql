BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sportex_staging_app') THEN
    CREATE ROLE sportex_staging_app
      NOLOGIN
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOINHERIT;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sportex_staging_runtime') THEN
    CREATE ROLE sportex_staging_runtime
      LOGIN
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOINHERIT;
  END IF;
END
$$;

GRANT sportex_staging_app TO sportex_staging_runtime;

CREATE TABLE public.sportex_staging_tenants (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE public.sportex_staging_memberships (
  tenant_id uuid NOT NULL REFERENCES public.sportex_staging_tenants(id),
  actor_id uuid NOT NULL,
  capabilities text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, actor_id)
);

CREATE TABLE public.sportex_staging_clients (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.sportex_staging_tenants(id),
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 120),
  team_name text CHECK (team_name IS NULL OR char_length(team_name) BETWEEN 2 AND 120),
  primary_phone text CHECK (primary_phone IS NULL OR primary_phone ~ '^\+[1-9][0-9]{7,14}$'),
  status text NOT NULL DEFAULT 'active' CHECK (status = 'active'),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (tenant_id, id)
);

CREATE UNIQUE INDEX sportex_staging_clients_phone_unique
  ON public.sportex_staging_clients (tenant_id, primary_phone)
  WHERE primary_phone IS NOT NULL;

CREATE TABLE public.sportex_staging_certified_payments (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.sportex_staging_tenants(id),
  client_id uuid NOT NULL,
  evidence_reference text NOT NULL CHECK (char_length(evidence_reference) BETWEEN 3 AND 160),
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL CHECK (currency IN ('UYU', 'USD')),
  status text NOT NULL DEFAULT 'certified' CHECK (status = 'certified'),
  certified_by uuid NOT NULL,
  certified_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  UNIQUE (tenant_id, id),
  CONSTRAINT sportex_staging_payments_client_fk
    FOREIGN KEY (tenant_id, client_id)
    REFERENCES public.sportex_staging_clients(tenant_id, id)
);

CREATE UNIQUE INDEX sportex_staging_payments_evidence_unique
  ON public.sportex_staging_certified_payments (tenant_id, lower(evidence_reference));

CREATE TABLE public.sportex_staging_order_counters (
  tenant_id uuid PRIMARY KEY REFERENCES public.sportex_staging_tenants(id),
  last_value bigint NOT NULL CHECK (last_value > 0)
);

CREATE TABLE public.sportex_staging_orders (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.sportex_staging_tenants(id),
  order_number text NOT NULL,
  client_id uuid NOT NULL,
  certified_payment_id uuid NOT NULL,
  team_name text NOT NULL CHECK (char_length(team_name) BETWEEN 2 AND 120),
  status text NOT NULL DEFAULT 'intake_pending' CHECK (status = 'intake_pending'),
  quoted_total_cents bigint NOT NULL CHECK (quoted_total_cents > 0),
  deposit_cents bigint NOT NULL CHECK (deposit_cents > 0 AND deposit_cents <= quoted_total_cents),
  currency text NOT NULL CHECK (currency IN ('UYU', 'USD')),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, order_number),
  UNIQUE (tenant_id, certified_payment_id),
  CONSTRAINT sportex_staging_orders_client_fk
    FOREIGN KEY (tenant_id, client_id)
    REFERENCES public.sportex_staging_clients(tenant_id, id),
  CONSTRAINT sportex_staging_orders_payment_fk
    FOREIGN KEY (tenant_id, certified_payment_id)
    REFERENCES public.sportex_staging_certified_payments(tenant_id, id)
);

CREATE TABLE public.sportex_staging_idempotency (
  tenant_id uuid NOT NULL REFERENCES public.sportex_staging_tenants(id),
  scope text NOT NULL CHECK (char_length(scope) BETWEEN 3 AND 120),
  idempotency_key text NOT NULL CHECK (char_length(idempotency_key) BETWEEN 1 AND 200),
  request_hash text NOT NULL CHECK (request_hash ~ '^[a-f0-9]{64}$'),
  response_status integer NOT NULL CHECK (response_status BETWEEN 200 AND 599),
  response_body jsonb NOT NULL,
  resource_id uuid NOT NULL,
  created_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, scope, idempotency_key)
);

CREATE TABLE public.sportex_staging_audit_events (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.sportex_staging_tenants(id),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  result text NOT NULL CHECK (result IN ('succeeded', 'denied')),
  correlation_id text NOT NULL CHECK (char_length(correlation_id) BETWEEN 1 AND 128),
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL
);

CREATE INDEX sportex_staging_audit_tenant_created_idx
  ON public.sportex_staging_audit_events (tenant_id, created_at DESC);

CREATE TABLE public.sportex_staging_outbox (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.sportex_staging_tenants(id),
  event_type text NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  payload jsonb NOT NULL,
  correlation_id text NOT NULL CHECK (char_length(correlation_id) BETWEEN 1 AND 128),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'succeeded', 'retry_scheduled', 'failed_terminal', 'cancelled')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  processed_at timestamptz
);

CREATE INDEX sportex_staging_outbox_pending_idx
  ON public.sportex_staging_outbox (status, available_at, created_at)
  WHERE status IN ('pending', 'retry_scheduled');

ALTER TABLE public.sportex_staging_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_tenants FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_clients FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_certified_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_certified_payments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_order_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_order_counters FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_orders FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_idempotency FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_audit_events FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_outbox FORCE ROW LEVEL SECURITY;

CREATE POLICY sportex_staging_tenants_isolation ON public.sportex_staging_tenants
  USING (id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY sportex_staging_memberships_isolation ON public.sportex_staging_memberships
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY sportex_staging_clients_isolation ON public.sportex_staging_clients
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY sportex_staging_payments_isolation ON public.sportex_staging_certified_payments
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY sportex_staging_order_counters_isolation ON public.sportex_staging_order_counters
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY sportex_staging_orders_isolation ON public.sportex_staging_orders
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY sportex_staging_idempotency_isolation ON public.sportex_staging_idempotency
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY sportex_staging_audit_isolation ON public.sportex_staging_audit_events
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY sportex_staging_outbox_isolation ON public.sportex_staging_outbox
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

REVOKE ALL ON TABLE
  public.sportex_staging_tenants,
  public.sportex_staging_memberships,
  public.sportex_staging_clients,
  public.sportex_staging_certified_payments,
  public.sportex_staging_order_counters,
  public.sportex_staging_orders,
  public.sportex_staging_idempotency,
  public.sportex_staging_audit_events,
  public.sportex_staging_outbox
FROM PUBLIC;

GRANT USAGE ON SCHEMA public TO sportex_staging_app;
GRANT SELECT ON public.sportex_staging_tenants, public.sportex_staging_memberships TO sportex_staging_app;
GRANT SELECT, INSERT, UPDATE ON public.sportex_staging_clients TO sportex_staging_app;
GRANT SELECT, INSERT ON public.sportex_staging_certified_payments TO sportex_staging_app;
GRANT SELECT, INSERT, UPDATE ON public.sportex_staging_order_counters TO sportex_staging_app;
GRANT SELECT, INSERT, UPDATE ON public.sportex_staging_orders TO sportex_staging_app;
GRANT SELECT, INSERT ON public.sportex_staging_idempotency TO sportex_staging_app;
GRANT SELECT, INSERT ON public.sportex_staging_audit_events TO sportex_staging_app;
GRANT SELECT, INSERT, UPDATE ON public.sportex_staging_outbox TO sportex_staging_app;

COMMIT;
