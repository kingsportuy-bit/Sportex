BEGIN;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.sportex_staging_commercial_messages WHERE content_type = 'IMAGE') THEN
    RAISE EXCEPTION 'cannot remove WhatsApp media while image messages exist';
  END IF;
END $$;

ALTER TABLE public.sportex_staging_whatsapp_outbound_messages
  DROP CONSTRAINT sportex_staging_whatsapp_outbound_media_check,
  DROP CONSTRAINT sportex_staging_whatsapp_outbound_messages_body_text_check,
  DROP COLUMN media_mime_type, DROP COLUMN media_file_name, DROP COLUMN media_size_bytes,
  DROP COLUMN media_sha256, DROP COLUMN media_data, DROP COLUMN media_width, DROP COLUMN media_height,
  ADD CONSTRAINT sportex_staging_whatsapp_outbound_messages_body_text_check CHECK (char_length(body_text) BETWEEN 1 AND 4000);

DROP TABLE public.sportex_staging_conversation_read_states;

ALTER TABLE public.sportex_staging_commercial_messages
  DROP CONSTRAINT sportex_staging_commercial_messages_content_check,
  DROP CONSTRAINT sportex_staging_commercial_messages_media_fk,
  DROP CONSTRAINT sportex_staging_commercial_messages_content_type_check,
  DROP CONSTRAINT sportex_staging_commercial_messages_body_text_check,
  DROP COLUMN media_asset_id,
  ADD CONSTRAINT sportex_staging_commercial_messages_content_type_check CHECK (content_type = 'TEXT'),
  ADD CONSTRAINT sportex_staging_commercial_messages_body_text_check CHECK (char_length(body_text) BETWEEN 1 AND 4000);

DROP TABLE public.sportex_staging_whatsapp_media_assets;

COMMIT;
