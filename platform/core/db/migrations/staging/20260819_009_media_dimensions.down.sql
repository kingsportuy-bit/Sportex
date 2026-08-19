BEGIN;

ALTER TABLE public.sportex_staging_whatsapp_media_assets
  DROP COLUMN height,
  DROP COLUMN width;

COMMIT;
