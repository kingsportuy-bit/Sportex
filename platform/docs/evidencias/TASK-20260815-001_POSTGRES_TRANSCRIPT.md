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
PREFLIGHT_NULL=PASS
ERROR: timeline_preflight_legacy_contract_invalid
PREFLIGHT_LENGTH=PASS
ERROR: timeline_preflight_legacy_contract_invalid
PREFLIGHT_TIMESTAMP=PASS
ERROR: timeline_preflight_legacy_timestamp_invalid
REUP_EVENTS=5
```

El entorno fue temporal, sin secretos ni datos reales. Tras reponer las fuentes
válidas se aplicó re-up correctamente y el contenedor se eliminó.
