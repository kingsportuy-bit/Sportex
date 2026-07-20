# Evidencia TASK-20260719-007 — SPORTEX STAGING utilizable

Estado: `EN_PROGRESO`.

Fecha: 2026-07-19.

## Alcance completado localmente

- Supabase Auth mediante Bearer token y endpoint `/auth/v1/user`.
- Tenant desde metadata firmada y capacidades desde membresía activa.
- Rechazo cross-tenant probado.
- Frontend sin acceso directo a base: login, clientes, pedidos y venta confirmada.
- Seña y pedido creados con comandos separados e idempotentes.
- Saldo calculado por el Core.
- Dockerfile sin secretos y ejecución como usuario no root.
- Stack STAGING con recursos limitados, filesystem read-only y secretos externos.
- E2E STAGING preparado para dos tenants.
- Rama Git de transición creada preservando el legado.

## Validación local observada

- `npm run check`: PASS.
- `npm test`: PASS, 16/16.
- `npm run build`: PASS.
- `npm run validate-sql`: PASS, 9 tablas, RLS forzado y rollback.
- `node --check frontend/app.js`: PASS.
- `docker compose config`: PASS; advertencia de versión obsoleta corregida.
- Smoke visual login escritorio y móvil: PASS.
- Docker build local: no ejecutado porque Docker Desktop no está activo; no se usa como evidencia de release.

## Gate de capacidad observado

- carga: aproximadamente `8.0 / 8.0 / 8.0` sobre 4 vCPU;
- swap: `2047/2047 MiB`;
- disco disponible: aproximadamente 55 GiB;
- CPU steal: entre 15 % y 27 % durante la muestra;
- `supabase_vector`: alrededor de 68 % CPU;
- `supabase_staging_vector`: alrededor de 43 % CPU;
- `dockerd`: alrededor de 165 % CPU.

Los collectors repiten eventos `Stopped watching` / `Started watching` sobre logs y Docker registra `Error decoding log file` por NUL. El gate cero queda `FAIL` hasta corregir o contener la incidencia.

## Pendiente para certificación

- autorización y contención de Vector;
- segunda medición de capacidad;
- commit y push remoto;
- imagen y digest;
- migración y rollback ensayados en Supabase STAGING;
- dos usuarios y tenants ficticios;
- despliegue observado;
- E2E API y visual en dominio STAGING;
- verificación de legado y producción sin cambios.
