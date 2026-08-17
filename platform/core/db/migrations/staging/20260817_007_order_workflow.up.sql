BEGIN;

ALTER TABLE public.sportex_staging_orders
  DROP CONSTRAINT sportex_staging_orders_status_check;

ALTER TABLE public.sportex_staging_orders
  ADD CONSTRAINT sportex_staging_orders_status_check
  CHECK (status IN ('intake_pending', 'design_pending', 'production_ready', 'in_production', 'completed'));

ALTER TABLE public.sportex_staging_orders
  ADD COLUMN details jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMIT;
