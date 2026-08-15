BEGIN;

CREATE TABLE public.sportex_staging_conversation_timeline_events (
  event_id text NOT NULL CHECK (char_length(event_id) BETWEEN 12 AND 640),
  tenant_id uuid NOT NULL REFERENCES public.sportex_staging_tenants(id),
  conversation_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'OPPORTUNITY_CREATED',
    'STAGE_CHANGED',
    'NEXT_ACTION_UPDATED',
    'FOLLOW_UP_RECORDED',
    'ORDER_CREATED',
    'PRODUCTION_RELEASED'
  )),
  actor_kind text NOT NULL CHECK (actor_kind IN ('HUMAN', 'SYSTEM', 'ASSISTANT')),
  actor_ref text NOT NULL CHECK (char_length(actor_ref) BETWEEN 1 AND 160),
  origin text NOT NULL CHECK (origin IN ('OPERATOR', 'CORE', 'INTEGRATION', 'ASSISTANT')),
  correlation_id text NOT NULL CHECK (char_length(correlation_id) BETWEEN 1 AND 200),
  evidence_message_id text CHECK (
    evidence_message_id IS NULL OR char_length(evidence_message_id) BETWEEN 1 AND 200
  ),
  label text NOT NULL CHECK (char_length(label) BETWEEN 3 AND 160),
  detail text NOT NULL CHECK (char_length(detail) BETWEEN 1 AND 1000),
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, event_id),
  CONSTRAINT sportex_staging_conversation_timeline_events_conversation_fk
    FOREIGN KEY (tenant_id, conversation_id)
    REFERENCES public.sportex_staging_commercial_conversations(tenant_id, id)
);

CREATE INDEX sportex_staging_conversation_timeline_events_order_idx
  ON public.sportex_staging_conversation_timeline_events
  (tenant_id, conversation_id, occurred_at, event_id);

INSERT INTO public.sportex_staging_conversation_timeline_events
  (event_id, tenant_id, conversation_id, event_type, actor_kind, actor_ref,
   origin, correlation_id, evidence_message_id, label, detail, occurred_at)
SELECT
  concat(
    'activity:',
    activity.value->>'correlationId', ':',
    activity.value->>'type', ':',
    activity.value->>'occurredAt', ':',
    coalesce(activity.value->>'evidenceMessageId', 'none')
  ),
  opportunity.tenant_id,
  opportunity.conversation_id,
  activity.value->>'type',
  CASE
    WHEN activity.value->>'actorKind' IN ('HUMAN', 'SYSTEM', 'ASSISTANT')
      THEN activity.value->>'actorKind'
    WHEN activity.value->>'type' = 'OPPORTUNITY_CREATED' THEN 'SYSTEM'
    ELSE 'HUMAN'
  END,
  activity.value->>'actorId',
  CASE
    WHEN activity.value->>'origin' IN ('OPERATOR', 'CORE', 'INTEGRATION', 'ASSISTANT')
      THEN activity.value->>'origin'
    WHEN activity.value->>'type' = 'OPPORTUNITY_CREATED' THEN 'CORE'
    ELSE 'OPERATOR'
  END,
  activity.value->>'correlationId',
  nullif(activity.value->>'evidenceMessageId', ''),
  CASE activity.value->>'type'
    WHEN 'OPPORTUNITY_CREATED' THEN 'Consulta incorporada al proceso comercial'
    WHEN 'STAGE_CHANGED' THEN 'Etapa comercial actualizada'
    WHEN 'NEXT_ACTION_UPDATED' THEN 'Próximo paso actualizado'
    WHEN 'FOLLOW_UP_RECORDED' THEN 'Seguimiento registrado'
    WHEN 'ORDER_CREATED' THEN 'Cliente y pedido creados'
    WHEN 'PRODUCTION_RELEASED' THEN 'Pedido entregado a producción'
  END,
  activity.value->>'detail',
  (activity.value->>'occurredAt')::timestamptz
FROM public.sportex_staging_commercial_opportunities opportunity
CROSS JOIN LATERAL jsonb_array_elements(opportunity.activity_data) AS activity(value)
WHERE activity.value->>'type' IN (
  'OPPORTUNITY_CREATED',
  'STAGE_CHANGED',
  'NEXT_ACTION_UPDATED',
  'FOLLOW_UP_RECORDED',
  'ORDER_CREATED',
  'PRODUCTION_RELEASED'
)
ON CONFLICT (tenant_id, event_id) DO NOTHING;

ALTER TABLE public.sportex_staging_conversation_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sportex_staging_conversation_timeline_events FORCE ROW LEVEL SECURITY;

CREATE POLICY sportex_staging_conversation_timeline_events_isolation
ON public.sportex_staging_conversation_timeline_events
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

REVOKE ALL ON TABLE public.sportex_staging_conversation_timeline_events FROM PUBLIC;
GRANT SELECT, INSERT ON public.sportex_staging_conversation_timeline_events TO sportex_staging_app;

COMMIT;
