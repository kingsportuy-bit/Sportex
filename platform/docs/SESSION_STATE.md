# Estado vivo SPORTEX

Actualizado: 2026-07-19.

## Modo

- `STAGING`.

## Objetivo actual

Desplegar el nuevo SPORTEX en un STAGING aislado y utilizable para Delta.

## Tarea actual

- `TASK-20260719-007`: `in_progress`.

## Decisiones vigentes

- Core único y modular.
- Una empresa equivale a una marca; no hay sucursales.
- Arquitectura multitenant con aislamiento obligatorio.
- WhatsApp es la entrada principal del negocio.
- IA propone hechos; Core valida y ejecuta.
- Frontend sin lógica de negocio ni acceso directo a base.
- Seguridad y observabilidad son módulos transversales.
- Delta Sport es el piloto.
- VPS compartido `31.97.28.4`, con servicios SPORTEX aislados.
- Supabase autoalojado compartido con separación lógica certificada.
- Tablas legado `sportex_*`, nuevo STAGING `sportex_staging_*` y nueva producción `sports_*`.
- Evolution API directa; n8n fuera de la arquitectura.
- El runtime legado será reemplazado mediante despliegue paralelo, migración y cutover reversible.
- Durante la transición, el repositorio conserva el legado en raíz y la nueva plataforma bajo `platform/`.

## Estado técnico

- Runtime legado: `sportex_sportex` operativo `1/1` en producción y sin cambios.
- Nuevo Core: autenticación Supabase, membresía tenant-aware y primera vertical implementadas localmente.
- Frontend: login, pedidos, clientes y nueva venta confirmada implementados; smoke visual escritorio/móvil PASS.
- Pruebas: 16/16 PASS; check, build y validación SQL local PASS.
- Base de datos objetivo: migración v1 para 9 tablas `sportex_staging_*`, no ejecutada.
- Git: worktree de transición creado desde `main` en rama `sportex-task007-staging`; commit y push pendientes.
- Despliegue: artefacto y stack preparados; imagen, digest, migración y dominio pendientes.
- Gate de capacidad: FAIL por carga aproximada 8/4 vCPU, swap 2/2 GiB y bucle de los collectors `supabase_vector` y `supabase_staging_vector`.
- Producción: fuera de alcance.

## Bloqueo operativo

Reiniciar los dos collectors de logs compartidos excede el alcance SPORTEX y requiere autorización explícita de Fito. No se despliega un nuevo servicio mientras el gate cero siga fallando.

## Siguiente paso

Con autorización, reiniciar solamente los collectors Vector, repetir capacidad y continuar con commit remoto, migración, secretos, usuarios de prueba y despliegue STAGING.
