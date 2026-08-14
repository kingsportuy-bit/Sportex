BEGIN;

UPDATE public.sportex_staging_orders
SET status = 'intake_pending',
    version = version + 1,
    updated_at = now()
WHERE status = 'production_ready';

ALTER TABLE public.sportex_staging_orders
  DROP CONSTRAINT sportex_staging_orders_status_check;

ALTER TABLE public.sportex_staging_orders
  ADD CONSTRAINT sportex_staging_orders_status_check
  CHECK (status = 'intake_pending');

COMMIT;
