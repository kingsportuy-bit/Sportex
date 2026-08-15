# Transcript PostgreSQL/RLS — TASK-20260815-001

Fecha: 2026-08-15
Motor: PostgreSQL 16 Alpine temporal
Datos: dos tenants y mensajes ficticios

## Ensayo comercial y degradación controlada

```text
SPORTEX_COMMERCIAL_POSTGRES_REHEARSAL=PASS
TENANT_A_ITEMS=1
TENANT_B_ITEMS=1
PROVIDER_REPLAYED=true
WHATSAPP_JOURNAL_PROCESSED=1
WHATSAPP_OUTBOX_IDEMPOTENT=true
CONVERSATION_TIMELINE_SEPARATED=true
TIMELINE_DEGRADED_MAIN_MUTATION_PRESERVED=true
FOLLOW_UP_MAX_NOTE_LENGTH=1000
FOLLOW_UP_MAX_DETAIL_LENGTH=1015
TIMELINE_PROJECTION_FAILURES=read,write
RLS_APP_TENANT_A_OWN=2
RLS_APP_TENANT_A_CROSS=0
RLS_APP_TENANT_B_OWN=1
```

La consulta RLS se ejecutó dentro de transacciones con
`SET LOCAL ROLE sportex_staging_app` y `set_config('app.tenant_id', ...)`. No
se usó una aserción de servicio como sustituto del rol PostgreSQL.

## Down, preflight y re-up

```text
MESSAGES_BEFORE_DOWN=3
MESSAGES_AFTER_DOWN=3
PREFLIGHT_NULL_ACTOR=PASS
PREFLIGHT_CORRELATION_201=PASS
PREFLIGHT_INVALID_TIMESTAMP=PASS
REUP_EVENTS=5
REUP_MAX_NOTE_RECONSTRUCTED=true
REUP_FREE_TEXT_TOKENS_PRESERVED=true
SPORTEX_TIMELINE_POSTGRES_HARNESS=PASS
```

Salida reproducible con `npm run test:postgres:timeline`. El harness versionado
crea PostgreSQL 16 temporal, aplica `001..005`, ejecuta servicio, readiness,
degradación y RLS; baja `005`, inyecta y rechaza cada fuente inválida, vuelve a
aplicar `005` y prueba la reconstrucción exacta de la nota máxima. El contenedor
se elimina siempre y no usa secretos ni datos reales.

La nota de 1000 caracteres contiene repetidos todos los tokens de etapa y
resultado. El detalle reconstruido cambia únicamente `SIN_RESPUESTA` antes del
primer `: ` y conserva literalmente el resto; el harness compara la proyección
contra la actividad fuente.
