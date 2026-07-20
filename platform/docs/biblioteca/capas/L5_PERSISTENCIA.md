# L5 - Persistencia

## Responsabilidad

Guardar entidades, eventos, auditoría, outbox, archivos y versiones con aislamiento multitenant.

## Permitido

- repositorios por módulo;
- transacciones;
- locks e idempotency keys;
- proyecciones reconstruibles;
- políticas de retención.

## Prohibido

- repositorios sin tenant;
- escrituras cruzadas entre módulos;
- guardar secretos o archivos completos en auditoría;
- borrar historial para corregir estado.

## Tests documentales

- aislamiento cross-tenant;
- rollback transaccional;
- unicidad por tenant;
- outbox atómica con el cambio de dominio.
