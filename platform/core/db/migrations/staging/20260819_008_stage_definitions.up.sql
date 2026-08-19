BEGIN;

ALTER TABLE public.sportex_staging_orders
  DROP CONSTRAINT sportex_staging_orders_status_check;

ALTER TABLE public.sportex_staging_orders
  ADD CONSTRAINT sportex_staging_orders_status_check
  CHECK (status ~ '^[A-Za-z][A-Za-z0-9_]{1,79}$');

CREATE TABLE public.sportex_staging_stage_definitions (
  id text NOT NULL CHECK (id ~ '^[A-Za-z0-9_-]{2,80}$'),
  tenant_id uuid NOT NULL REFERENCES public.sportex_staging_tenants(id),
  board text NOT NULL CHECK (board IN ('lead', 'order')),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  position integer NOT NULL CHECK (position > 0),
  terminal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, board, id),
  UNIQUE (tenant_id, board, position)
);

ALTER TABLE public.sportex_staging_stage_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_stage_definitions FORCE ROW LEVEL SECURITY;

CREATE POLICY sportex_staging_stage_definitions_isolation ON public.sportex_staging_stage_definitions
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

REVOKE ALL ON TABLE public.sportex_staging_stage_definitions FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sportex_staging_stage_definitions TO sportex_staging_app;

COMMIT;
