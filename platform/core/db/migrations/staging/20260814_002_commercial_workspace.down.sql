BEGIN;

REVOKE ALL ON TABLE
  public.sportex_staging_commercial_core_links,
  public.sportex_staging_commercial_opportunities,
  public.sportex_staging_commercial_messages,
  public.sportex_staging_commercial_conversations,
  public.sportex_staging_commercial_contacts
FROM sportex_staging_app;

DROP TABLE public.sportex_staging_commercial_core_links;
DROP TABLE public.sportex_staging_commercial_opportunities;
DROP TABLE public.sportex_staging_commercial_messages;
DROP TABLE public.sportex_staging_commercial_conversations;
DROP TABLE public.sportex_staging_commercial_contacts;

COMMIT;
