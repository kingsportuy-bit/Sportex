# Contrato de infraestructura SPORTEX

## Decisión

SPORTEX utilizará el mismo VPS físico que BARBEROX, con servicios, redes, secretos, datos y despliegues aislados.

El VPS verificado el 2026-07-19 es:

- host: `31.97.28.4`;
- hostname: `codexa`;
- orquestación: Docker Swarm activo;
- Docker Server: `29.3.0`;
- proxy público existente: Traefik.

Esta información es una fotografía operativa y debe verificarse antes de cualquier despliegue.

## Arquitectura objetivo

Servicios iniciales de STAGING:

- `sportex_core_api_staging`;
- `sportex_core_worker_staging`;
- `sportex_frontend_staging`;
- scheduler o worker especializado solamente si aparece una responsabilidad real.

Datos de STAGING:

- tablas `sportex_staging_*` en la instancia Supabase actual;
- rol, RLS, migraciones y buckets propios;
- red `sportex_staging_net`;
- backups y restauración identificables.

Producción tendrá `sportex_prod`, tablas `sports_*`, `sportex_prod_net`, rol, RLS, buckets y secretos de aplicación separados cuando exista autorización de promoción.

## Baseline legado existente

El VPS ya contiene `/opt/sportex` y el stack `sportex`. Su único servicio, `sportex_sportex`, ejecuta una aplicación Next.js monolítica en producción mediante `sportex:latest` y Traefik.

Este despliegue es una entrada de migración, no la implementación del Core objetivo. Debe preservarse hasta disponer de una sustitución certificada y rollback.

## Dependencias compartidas

- Supabase autoalojado actual como plataforma, con separación lógica certificada.
- Evolution API como proveedor de WhatsApp.
- Traefik como entrada HTTP/HTTPS.
- Docker Swarm como control de servicios.

Compartir Supabase, VPS, Evolution o Traefik no autoriza compartir tablas, permisos, datos, instancias de negocio, colas o redes internas con BARBEROX.

## Gate de capacidad

No se instalarán stacks Supabase adicionales. Aun así, antes de desplegar Core, workers y frontend se debe certificar CPU, carga, memoria, swap, disco y margen de rollback. La fotografía del 2026-07-19 mostró presión elevada y deberá repetirse en la ventana de despliegue.

## Redes

- SPORTEX debe tener redes propias por entorno.
- Solamente los servicios que necesitan exposición pública se conectan a la red de ingress correspondiente.
- Core, workers y dependencias internas no publican puertos directamente.
- STAGING y producción no comparten red privada de aplicación.

Los nombres y conexiones exactos se definirán en la tarea de despliegue inicial después de auditar las redes existentes.

## Secretos

Los secretos se administran fuera de Git y Markdown mediante Docker secrets, variables protegidas o un gestor futuro.

Se separan por entorno y servicio:

- acceso de base;
- JWT/Auth de Supabase;
- service role solamente del lado servidor;
- credenciales Evolution;
- firmas de webhook;
- claves de cifrado;
- tokens de soporte y observabilidad.

## Persistencia y backups

- Supabase conserva los datos canónicos.
- Archivos usan Storage privado por tenant.
- Backups de base y archivos se prueban en STAGING antes de producción.
- Los volúmenes persistentes no se comparten entre entornos.
- Todo cambio de esquema requiere migración versionada y rollback o restauración demostrable.

## Operación

Cada servicio debe declarar:

- imagen inmutable y digest;
- commit;
- task y scope;
- variables requeridas sin valores sensibles;
- redes y volúmenes;
- health/readiness;
- límites de recursos;
- logs y métricas;
- procedimiento de rollback.

Todo despliegue sigue `DEPLOYMENT_PROTOCOL.md`.

## Límite actual

No se creó, desplegó ni modificó ningún servicio como parte de esta documentación. Sí existe un runtime legado previo, registrado en `CURRENT_RUNTIME_BASELINE.md`. El nuevo Core modular todavía no fue desplegado.
