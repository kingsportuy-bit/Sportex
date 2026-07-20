BEGIN;

REVOKE ALL ON TABLE
  public.sportex_staging_outbox,
  public.sportex_staging_audit_events,
  public.sportex_staging_idempotency,
  public.sportex_staging_orders,
  public.sportex_staging_order_counters,
  public.sportex_staging_certified_payments,
  public.sportex_staging_clients,
  public.sportex_staging_memberships,
  public.sportex_staging_tenants
FROM sportex_staging_app;

DROP TABLE public.sportex_staging_outbox;
DROP TABLE public.sportex_staging_audit_events;
DROP TABLE public.sportex_staging_idempotency;
DROP TABLE public.sportex_staging_orders;
DROP TABLE public.sportex_staging_order_counters;
DROP TABLE public.sportex_staging_certified_payments;
DROP TABLE public.sportex_staging_clients;
DROP TABLE public.sportex_staging_memberships;
DROP TABLE public.sportex_staging_tenants;

REVOKE sportex_staging_app FROM sportex_staging_runtime;
DROP ROLE IF EXISTS sportex_staging_runtime;

COMMIT;
