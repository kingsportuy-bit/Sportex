BEGIN;

ALTER TABLE public.sportex_staging_whatsapp_media_assets
  ADD COLUMN width integer CHECK (width IS NULL OR width BETWEEN 1 AND 10000),
  ADD COLUMN height integer CHECK (height IS NULL OR height BETWEEN 1 AND 10000);

COMMIT;
