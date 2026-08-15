BEGIN;

CREATE FUNCTION pg_temp.sportex_timeline_readable_detail(event_type text, source_detail text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
STRICT
AS $$
DECLARE
  first_separator integer;
  second_separator integer;
  controlled_first text;
  controlled_second text;
  remainder text;
  readable_first text;
  readable_second text;
BEGIN
  IF event_type = 'OPPORTUNITY_CREATED' THEN
    RETURN 'Ya forma parte del seguimiento comercial.';
  END IF;

  IF event_type = 'FOLLOW_UP_RECORDED' THEN
    first_separator := strpos(source_detail, ': ');
    IF first_separator = 0 THEN RETURN source_detail; END IF;
    controlled_first := left(source_detail, first_separator - 1);
    readable_first := CASE controlled_first
      WHEN 'SIN_CAMBIOS' THEN 'Sin cambios'
      WHEN 'AVANZO' THEN 'Avanzó'
      WHEN 'SIN_RESPUESTA' THEN 'Sin respuesta'
      WHEN 'NO_CONTINUA' THEN 'No continúa'
      ELSE NULL
    END;
    RETURN CASE
      WHEN readable_first IS NULL THEN source_detail
      ELSE readable_first || substr(source_detail, first_separator)
    END;
  END IF;

  IF event_type = 'STAGE_CHANGED' THEN
    first_separator := strpos(source_detail, ' → ');
    IF first_separator = 0 THEN RETURN source_detail; END IF;
    controlled_first := left(source_detail, first_separator - 1);
    remainder := substr(source_detail, first_separator + 3);
    second_separator := strpos(remainder, ': ');
    IF second_separator = 0 THEN RETURN source_detail; END IF;
    controlled_second := left(remainder, second_separator - 1);
    readable_first := CASE controlled_first
      WHEN 'NUEVO' THEN 'Contacto inicial'
      WHEN 'EN_CALIFICACION' THEN 'Calificación'
      WHEN 'COTIZADO' THEN 'Cotización enviada'
      WHEN 'EN_SEGUIMIENTO' THEN 'Seguimiento'
      WHEN 'PERDIDO' THEN 'Cerrado sin venta'
      WHEN 'SENA_VALIDADA' THEN 'Seña validada'
      ELSE NULL
    END;
    readable_second := CASE controlled_second
      WHEN 'NUEVO' THEN 'Contacto inicial'
      WHEN 'EN_CALIFICACION' THEN 'Calificación'
      WHEN 'COTIZADO' THEN 'Cotización enviada'
      WHEN 'EN_SEGUIMIENTO' THEN 'Seguimiento'
      WHEN 'PERDIDO' THEN 'Cerrado sin venta'
      WHEN 'SENA_VALIDADA' THEN 'Seña validada'
      ELSE NULL
    END;
    RETURN CASE
      WHEN readable_first IS NULL OR readable_second IS NULL THEN source_detail
      ELSE readable_first || ' → ' || readable_second || substr(remainder, second_separator)
    END;
  END IF;

  RETURN source_detail;
END $$;

DO $$
DECLARE
  activity jsonb;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.sportex_staging_commercial_opportunities
    WHERE activity_data IS NULL OR jsonb_typeof(activity_data) <> 'array'
  ) THEN
    RAISE EXCEPTION 'timeline_preflight_activity_data_not_array';
  END IF;

  FOR activity IN
    SELECT entry.value
    FROM public.sportex_staging_commercial_opportunities opportunity
    CROSS JOIN LATERAL jsonb_array_elements(opportunity.activity_data) AS entry(value)
    WHERE entry.value->>'type' IN (
      'OPPORTUNITY_CREATED', 'STAGE_CHANGED', 'NEXT_ACTION_UPDATED',
      'FOLLOW_UP_RECORDED', 'ORDER_CREATED', 'PRODUCTION_RELEASED'
    )
  LOOP
    IF jsonb_typeof(activity) <> 'object'
      OR coalesce(char_length(activity->>'actorId'), 0) NOT BETWEEN 1 AND 160
      OR coalesce(char_length(activity->>'correlationId'), 0) NOT BETWEEN 1 AND 200
      OR coalesce(char_length(pg_temp.sportex_timeline_readable_detail(
        activity->>'type', activity->>'detail'
      )), 0) NOT BETWEEN 1 AND 1015
      OR (activity ? 'evidenceMessageId'
          AND activity->>'evidenceMessageId' IS NOT NULL
          AND char_length(activity->>'evidenceMessageId') NOT BETWEEN 1 AND 200)
      OR coalesce(activity->>'occurredAt', '') !~
        '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}'
    THEN
      RAISE EXCEPTION 'timeline_preflight_legacy_contract_invalid';
    END IF;

    BEGIN
      PERFORM (activity->>'occurredAt')::timestamptz;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'timeline_preflight_legacy_timestamp_invalid';
    END;
  END LOOP;
END $$;

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
  detail text NOT NULL CHECK (char_length(detail) BETWEEN 1 AND 1015),
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
  'activity:' || md5(concat(
    octet_length(activity.value->>'correlationId'), ':', activity.value->>'correlationId', '|',
    octet_length(activity.value->>'type'), ':', activity.value->>'type', '|',
    octet_length(activity.value->>'occurredAt'), ':', activity.value->>'occurredAt', '|',
    octet_length(coalesce(activity.value->>'evidenceMessageId', 'none')), ':',
    coalesce(activity.value->>'evidenceMessageId', 'none')
  )),
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
  pg_temp.sportex_timeline_readable_detail(
    activity.value->>'type', activity.value->>'detail'
  ),
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
