BEGIN;

REVOKE ALL ON TABLE
  public.sportex_staging_whatsapp_outbound_messages,
  public.sportex_staging_whatsapp_ingress_events
FROM sportex_staging_app;

DROP TABLE public.sportex_staging_whatsapp_outbound_messages;
DROP TABLE public.sportex_staging_whatsapp_ingress_events;

COMMIT;
