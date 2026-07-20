# Manifiesto SPORTEX STAGING 20260719-001

## Identidad

- `release_id`: `SPORTEX-STAGING-20260719-001`;
- `task_id`: `TASK-20260719-007`;
- `entorno`: `STAGING`;
- `estado`: `planned`;
- `solicitado_por`: Fito;
- `aprobado_por`: Fito para STAGING;
- `ventana`: pendiente de gate de capacidad.

## Fuente

- repositorio: `https://github.com/kingsportuy-bit/sportex.git`;
- rama: `sportex-task007-staging`;
- commit remoto: pendiente;
- árbol limpio verificado: pendiente;
- alcance: `platform/`.

## Artefactos

- servicio: `sportex_staging_core`;
- imagen: pendiente;
- digest: pendiente;
- fecha de build: pendiente.

## Base y archivos

- instancia: Supabase STAGING compartido;
- catálogo permitido: 9 tablas `public.sportex_staging_*`;
- roles: `sportex_staging_runtime` y `sportex_staging_app`;
- migración: `20260719_001_core_foundation.up.sql`;
- checksum: pendiente;
- backup/snapshot: pendiente;
- restauración/rollback: `20260719_001_core_foundation.down.sql`, ensayo pendiente;
- buckets: ninguno en esta versión.

## Infraestructura

- stack: `sportex_staging`;
- servicio: un artefacto liviano Core + frontend;
- red privada: `sportex_staging_net`;
- dependencia de Supabase: `barberox_staging_net` con aislamiento por rol/RLS;
- dominio: `sportex-staging.codexa.uy`;
- secretos requeridos: database URL y anon key, ambos externos a Git;
- límite: `0.35 CPU`, `256 MiB`.

## Gates previos

- [ ] capacidad del host aprobada;
- [x] tarea y entorno autorizados;
- [ ] commit remoto y digest verificados;
- [x] migración validada estáticamente;
- [ ] migración ensayada y backup disponible;
- [x] autenticación y aislamiento probados localmente;
- [x] health, readiness, correlación y logs estructurados;
- [x] Evolution fuera de alcance y sin cambios.

## Rollback

- detener/eliminar únicamente el stack `sportex_staging`;
- conservar legado y `sportex.codexa.uy` sin cambios;
- ejecutar down migration solo después de detener Core y si la tarea requiere restauración total;
- preservar logs, manifiesto y datos de prueba para diagnóstico.

## Cierre

- resultado: pendiente;
- evidencia: `../evidencias/TASK-20260719-007_STAGING_DELTA_UTILIZABLE.md`.
