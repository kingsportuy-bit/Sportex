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

`CERTIFICADO_PILOTO`. Migraciones `002` a `006` aplicadas; 19 tablas declaradas
con RLS forzado y cruce tenant cero en la ultima evidencia. El nombre tecnico
`staging` es legado y no crea un entorno separado.
