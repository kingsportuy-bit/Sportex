# Primera implementación vertical del Core

id: TASK-20260719-006
owner: Codex
requester: Fito
estado: done

## objetivo

Implementar localmente la primera vertical del nuevo Core SPORTEX: contexto multitenant, clientes, certificación manual de seña y creación idempotente de pedido con auditoría y outbox transaccionales.

## alcance_permitido

- código nuevo dentro de `sportex/core`;
- contratos de dominio y API v1;
- migración SQL exclusivamente para tablas `sportex_staging_*`;
- adaptadores PostgreSQL e in-memory;
- autenticación de desarrollo bloqueada fuera de development/test;
- health, readiness, logs estructurados y correlación;
- pruebas unitarias, de API, aislamiento, idempotencia y SQL;
- actualización documental y evidencia local.

## alcance_prohibido

- modificar el runtime legado;
- tocar tablas `sportex_*`, `sports_*` o de otros productos;
- ejecutar migraciones en Supabase;
- desplegar en VPS o STAGING;
- configurar Evolution;
- usar datos reales;
- modificar producción;
- realizar commit o push.

## entradas

- contratos rectores SPORTEX;
- `sportex_staging_*` como prefijo STAGING;
- flujo `pago_certificado -> nuevo_pedido`;
- patrones técnicos comprobados del Core BARBEROX.

## salidas

- Core TypeScript compilable;
- API v1 inicial;
- modelo de dominio v1;
- migración STAGING y rollback no ejecutados;
- pruebas automatizadas;
- evidencia de build y validación.

## validacion

- `npm run validate-docs`;
- `npm run check`;
- `npm test`;
- `npm run build`;
- `npm run validate-sql`;
- auditoría de secretos y prefijos prohibidos.

## evidencia

- `docs/evidencias/TASK-20260719-006_PRIMER_CORE_VERTICAL.md`;
- validación local completa PASS.
