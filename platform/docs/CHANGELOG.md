# Changelog SPORTEX

## 2026-07-19

- Se creó la carpeta del nuevo proyecto.
- Se analizó la arquitectura documental de BARBEROX.
- Se definió la dirección: Core modular, WhatsApp, multitenancy, seguridad, observabilidad y frontend sin lógica.
- Se inició la estructura documental y la tarea fundacional `TASK-20260719-001`.
- La tarea fundacional quedó `done` con `npm run validate-docs` PASS: 30 documentos requeridos, 16 módulos y 1 tarea.
- Se verificaron read-only el repositorio Git y el VPS compartido.
- Se definieron Supabase autoalojado y Evolution API directa; n8n fue retirado de la arquitectura activa.
- La tarea `TASK-20260719-002` quedo `done` con evidencia de Git, VPS, Supabase y Evolution.
- `npm run validate-docs` finalizo `PASS`: 35 documentos requeridos, 16 modulos y 2 tareas.
- Se corrigió el estado del entorno: ya existe `/opt/sportex`, el stack `sportex` y el servicio legado `sportex_sportex` en producción.
- Se documentó el baseline del monolito Next.js, su checkout, dominio, conexión directa a Supabase y estado de RLS.
- Se registraron riesgos críticos del legado sin copiar secretos ni modificar producción.
- Se decidió que SPORTEX tendrá Supabase autoalojado exclusivo, separado de otros servicios y entre STAGING/producción.
- Se documentó el protocolo de despliegue, manifiesto de release, migración, cutover y rollback del runtime legado.
- La instalación de nuevos stacks quedó bloqueada por capacidad: 4 vCPU, swap completa y carga superior al margen seguro.
- Fito reemplazó la decisión anterior: no se instalarán nuevos stacks Supabase.
- La instancia actual alojará `sportex_staging_*` para STAGING y `sports_*` para la nueva producción; `sportex_*` queda como legado de migración.
- `TASK-20260719-004` quedó `superseded` y `TASK-20260719-005` documentó la decisión vigente.
- La documentación validó PASS con 38 documentos requeridos, 16 módulos y 5 tareas.
- Se implementó la primera vertical local del Core SPORTEX: cliente, seña certificada y nuevo pedido.
- Se agregaron idempotencia, capacidades, auditoría, outbox, health/readiness, correlación y persistencia PostgreSQL.
- Se creó una migración STAGING de 9 tablas `sportex_staging_*` con RLS forzado y rollback, sin ejecutarla.
- `TASK-20260719-006` cerró con 13/13 pruebas, build, check, SQL y documentación en PASS.
