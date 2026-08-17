BEGIN;

-- The details column is intentionally retained: removing it would destroy
-- operator-entered order information. Reverting the release is only safe
-- before any order has moved into one of its new workflow states.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.sportex_staging_orders
    WHERE status IN ('design_pending', 'in_production', 'completed')
  ) THEN
    RAISE EXCEPTION 'cannot roll back order workflow while new order stages exist';
  END IF;
END $$;

ALTER TABLE public.sportex_staging_orders DROP CONSTRAINT sportex_staging_orders_status_check;
ALTER TABLE public.sportex_staging_orders
  ADD CONSTRAINT sportex_staging_orders_status_check
  CHECK (status IN ('intake_pending', 'production_ready'));

COMMIT;
