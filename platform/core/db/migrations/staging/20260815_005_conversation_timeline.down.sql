BEGIN;

REVOKE ALL ON TABLE public.sportex_staging_conversation_timeline_events FROM sportex_staging_app;
DROP TABLE public.sportex_staging_conversation_timeline_events;

COMMIT;
