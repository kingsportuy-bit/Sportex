# Evidencia TASK-20260719-002

Fecha: 2026-07-19.

Modo: `DOCUMENTACION` y verificacion `read-only`.

## Repositorio Git

- repositorio existente: `https://github.com/kingsportuy-bit/sportex.git`;
- rama observada: `main`;
- commit local y remoto observado: `a62e5edb326c5b54a0d78c03ffed78227610ed77`;
- acceso de lectura al remoto: verificado;
- checkout anterior inspeccionado: `C:\Users\Fito\Documents\APP\SPORTEX`;
- no se realizaron commits, pushes, cambios de rama ni modificaciones sobre ese checkout.

## VPS compartido

- host observado: `root@31.97.28.4`;
- hostname: `codexa`;
- Docker Swarm: `active`;
- nodo observado: `codexa`, estado `Ready`, disponibilidad `Active`, rol `Leader`;
- Traefik observado en ejecucion;
- redes compartidas relevantes observadas: `barberox_net`, `barberox_staging_net` y `codexanet`;
- no se crearon ni modificaron servicios, redes, secretos, volumenes o configuraciones.

## Supabase autoalojado

- stack de produccion observado con servicios `supabase_*`;
- stack de STAGING observado con servicios `supabase_staging_*`;
- los servicios principales de base, API, autenticacion, almacenamiento y tiempo real se observaron en ejecucion;
- SPORTEX debera aislar sus datos, roles, migraciones, secretos y buckets por entorno y dominio;
- no se crearon schemas, bases, roles, migraciones ni buckets.

## Evolution API

- servicios de produccion observados: `evolution_evolution_api` y `evolution_evolution_redis`;
- servicios de STAGING observados: `evolution_staging_evolution_api` y `evolution_staging_evolution_staging_redis`;
- se adopta integracion directa `Evolution API -> Core SPORTEX`;
- n8n queda fuera de la arquitectura activa;
- no se creo ninguna instancia de WhatsApp ni se modifico Evolution.

## Contratos resultantes

- `docs/INFRASTRUCTURE_CONTRACT.md`;
- `docs/CONNECTIONS.md`;
- `docs/GIT_RELEASE_CONTRACT.md`;
- `docs/SUPABASE_CONTRACT.md`;
- `docs/EVOLUTION_CONTRACT.md`.

## Validacion

Comando: `npm run validate-docs`.

Resultado: `PASS` — 35 documentos requeridos, 16 modulos y 2 tareas.

## Limites y vigencia

Esta evidencia es una fotografia read-only del 2026-07-19. El estado operativo del VPS puede cambiar y debera verificarse nuevamente antes de cualquier despliegue. La frase "no se crearon servicios" se refiere a las acciones de la tarea: posteriormente se confirmó que ya existía un runtime SPORTEX legado previo. Ver `TASK-20260719-003_RUNTIME_LEGADO_VPS.md`.

## Siguiente paso recomendado

Abrir una tarea separada para definir dominio, entidades, aislamiento de datos y migraciones. La incorporacion de esta fundacion al repositorio Git existente tambien debera realizarse mediante una tarea controlada y una rama propia.
