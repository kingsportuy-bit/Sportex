\set ON_ERROR_STOP on

BEGIN;

INSERT INTO public.sportex_staging_tenants (id, slug, name, status, created_at, updated_at)
VALUES (
  :'tenant_id'::uuid,
  :'tenant_slug',
  :'tenant_name',
  'active',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    status = 'active',
    updated_at = now();

INSERT INTO public.sportex_staging_memberships (
  tenant_id,
  actor_id,
  capabilities,
  status,
  created_at,
  updated_at
)
VALUES (
  :'tenant_id'::uuid,
  :'actor_id'::uuid,
  ARRAY[
    'clients.create',
    'clients.read',
    'commercial.read',
    'commercial.replay',
    'commercial.manage',
    'company.read',
    'company.manage',
    'payments.certify',
    'orders.create',
    'orders.read',
    'production.release'
  ]::text[],
  'active',
  now(),
  now()
)
ON CONFLICT (tenant_id, actor_id) DO UPDATE
SET capabilities = EXCLUDED.capabilities,
    status = 'active',
    updated_at = now();

COMMIT;
