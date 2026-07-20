# Evidencia TASK-20260719-005

Fecha: 2026-07-19.

Modo: documentación e inspección read-only.

## Decisión vigente

SPORTEX utilizará la instancia Supabase autoalojada actual con estas fronteras:

- legado: `sportex_*`;
- nuevo STAGING: `sportex_staging_*`;
- nueva producción: `sports_*`.

La separación se complementa con roles de base, grants, RLS, migraciones, buckets y credenciales de aplicación diferenciados.

## Verificación actual

La consulta de catálogo encontró 13 tablas `sportex_*` y ninguna tabla `sportex_staging_*` o `sports_*`. No se leyeron filas ni datos de clientes.

## Supersede

Esta decisión reemplaza la propuesta de stacks `sportex_supabase_staging` y `sportex_supabase_prod` documentada en `TASK-20260719-004`.

## Mutaciones

Ninguna. No se crearon tablas, roles, políticas, buckets, servicios o migraciones.

## Validación

- `npm run validate-docs`: PASS con 38 documentos requeridos, 16 módulos y 5 tareas.
- auditoría de referencias: las menciones a Supabase dedicado quedaron solamente como antecedente `superseded`.
- no se guardaron credenciales.
