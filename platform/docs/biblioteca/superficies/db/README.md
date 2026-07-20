# Superficie base de datos

## Responsabilidad

Persistir datos de módulos con integridad, transacciones y aislamiento multitenant.

## Reglas

- `tenant_id` en entidades operativas.
- Constraints e índices coherentes con tenant.
- Migraciones aditivas y reversibles cuando sea posible.
- Sin acceso directo desde frontend.
- Auditoría y outbox transaccionales.
- Backups y restauración probados antes de producción.

## Estado

IMPLEMENTADO_NO_VALIDADO. Migración `sportex_staging_*` validada estáticamente; no ejecutada en Supabase.
