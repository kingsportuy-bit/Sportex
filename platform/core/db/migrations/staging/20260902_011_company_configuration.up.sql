BEGIN;

CREATE TABLE public.sportex_staging_company_profiles (
  tenant_id uuid PRIMARY KEY REFERENCES public.sportex_staging_tenants(id),
  brand_name text NOT NULL CHECK (char_length(brand_name) BETWEEN 2 AND 120),
  legal_name text CHECK (legal_name IS NULL OR char_length(legal_name) BETWEEN 2 AND 160),
  primary_phone text CHECK (primary_phone IS NULL OR primary_phone ~ '^\+[1-9][0-9]{7,14}$'),
  primary_email text CHECK (primary_email IS NULL OR char_length(primary_email) BETWEEN 3 AND 254),
  website text CHECK (website IS NULL OR (char_length(website) BETWEEN 3 AND 300 AND website ~ '^https?://')),
  description text CHECK (description IS NULL OR char_length(description) BETWEEN 2 AND 1000),
  default_currency text NOT NULL CHECK (default_currency IN ('UYU', 'USD')),
  deposit_percentage integer NOT NULL CHECK (deposit_percentage BETWEEN 0 AND 100),
  default_quote_validity_days integer NOT NULL CHECK (default_quote_validity_days BETWEEN 1 AND 100000),
  default_lead_time_days integer NOT NULL CHECK (default_lead_time_days BETWEEN 1 AND 100000),
  payment_methods jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(payment_methods) = 'array'),
  delivery_methods jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(delivery_methods) = 'array'),
  sales_terms text CHECK (sales_terms IS NULL OR char_length(sales_terms) BETWEEN 2 AND 2000),
  production_notes text CHECK (production_notes IS NULL OR char_length(production_notes) BETWEEN 2 AND 2000),
  version integer NOT NULL CHECK (version > 0),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE public.sportex_staging_company_size_charts (
  id uuid NOT NULL,
  tenant_id uuid NOT NULL REFERENCES public.sportex_staging_tenants(id),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  audience text NOT NULL CHECK (audience IN ('CHILD', 'ADULT', 'UNISEX')),
  notes text CHECK (notes IS NULL OR char_length(notes) BETWEEN 2 AND 1000),
  rows jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(rows) = 'array'),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE public.sportex_staging_catalog_products (
  id uuid NOT NULL,
  tenant_id uuid NOT NULL REFERENCES public.sportex_staging_tenants(id),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  category text NOT NULL CHECK (char_length(category) BETWEEN 2 AND 80),
  description text CHECK (description IS NULL OR char_length(description) BETWEEN 2 AND 1000),
  active boolean NOT NULL DEFAULT true,
  minimum_quantity integer NOT NULL CHECK (minimum_quantity BETWEEN 1 AND 100000),
  default_lead_time_days integer NOT NULL CHECK (default_lead_time_days BETWEEN 1 AND 100000),
  size_chart_id uuid,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, id),
  CONSTRAINT sportex_staging_catalog_products_size_chart_fk
    FOREIGN KEY (tenant_id, size_chart_id)
    REFERENCES public.sportex_staging_company_size_charts(tenant_id, id)
);

CREATE TABLE public.sportex_staging_catalog_product_price_tiers (
  id uuid NOT NULL,
  tenant_id uuid NOT NULL REFERENCES public.sportex_staging_tenants(id),
  product_id uuid NOT NULL,
  min_quantity integer NOT NULL CHECK (min_quantity BETWEEN 1 AND 100000),
  max_quantity integer CHECK (max_quantity IS NULL OR max_quantity BETWEEN min_quantity AND 100000),
  unit_price_cents bigint NOT NULL CHECK (unit_price_cents BETWEEN 1 AND 1000000000),
  currency text NOT NULL CHECK (currency IN ('UYU', 'USD')),
  PRIMARY KEY (tenant_id, id),
  CONSTRAINT sportex_staging_catalog_price_tiers_product_fk
    FOREIGN KEY (tenant_id, product_id)
    REFERENCES public.sportex_staging_catalog_products(tenant_id, id)
    ON DELETE CASCADE
);

CREATE INDEX sportex_staging_catalog_price_tiers_product_idx
  ON public.sportex_staging_catalog_product_price_tiers (tenant_id, product_id, min_quantity);

CREATE TABLE public.sportex_staging_company_resources (
  id uuid NOT NULL,
  tenant_id uuid NOT NULL REFERENCES public.sportex_staging_tenants(id),
  kind text NOT NULL CHECK (kind IN ('FABRIC_PHOTO', 'SIZE_GUIDE', 'PRODUCT_IMAGE', 'DOCUMENT')),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  description text CHECK (description IS NULL OR char_length(description) BETWEEN 2 AND 1000),
  reference text CHECK (reference IS NULL OR char_length(reference) BETWEEN 2 AND 500),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, id)
);

ALTER TABLE public.sportex_staging_company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_company_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_company_size_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_company_size_charts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_catalog_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_catalog_products FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_catalog_product_price_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_catalog_product_price_tiers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_company_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_company_resources FORCE ROW LEVEL SECURITY;

CREATE POLICY sportex_staging_company_profiles_isolation ON public.sportex_staging_company_profiles
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY sportex_staging_company_size_charts_isolation ON public.sportex_staging_company_size_charts
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY sportex_staging_catalog_products_isolation ON public.sportex_staging_catalog_products
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY sportex_staging_catalog_product_price_tiers_isolation ON public.sportex_staging_catalog_product_price_tiers
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY sportex_staging_company_resources_isolation ON public.sportex_staging_company_resources
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

REVOKE ALL ON TABLE
  public.sportex_staging_company_profiles,
  public.sportex_staging_company_size_charts,
  public.sportex_staging_catalog_products,
  public.sportex_staging_catalog_product_price_tiers,
  public.sportex_staging_company_resources
FROM PUBLIC;

GRANT SELECT, INSERT, UPDATE ON public.sportex_staging_company_profiles TO sportex_staging_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sportex_staging_company_size_charts TO sportex_staging_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sportex_staging_catalog_products TO sportex_staging_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sportex_staging_catalog_product_price_tiers TO sportex_staging_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sportex_staging_company_resources TO sportex_staging_app;

COMMIT;
