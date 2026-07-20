# Plantilla de manifiesto de despliegue SPORTEX

## Identidad

- `release_id`:
- `task_id`:
- `entorno`: `STAGING | PRODUCCION`;
- `estado`: `planned`;
- `solicitado_por`:
- `aprobado_por`:
- `ventana`:

## Fuente

- repositorio:
- rama:
- commit remoto:
- árbol limpio verificado:
- alcance/paths:

## Artefactos

- servicio:
- imagen:
- digest:
- fecha de build:
- dependencias o SBOM:

## Base y archivos

- instancia Supabase:
- prefijo/catálogo permitido:
- rol de base:
- versión de esquema inicial:
- migraciones:
- checksums:
- backup/snapshot previo:
- restauración probada:
- buckets afectados:

## Infraestructura

- servicios y réplicas:
- redes:
- volúmenes:
- dominios y routers:
- nombres de secretos requeridos, sin valores:
- límites CPU/RAM:

## Gates previos

- [ ] capacidad del host aprobada;
- [ ] tarea y entorno autorizados;
- [ ] commit remoto y digest verificados;
- [ ] migraciones ensayadas;
- [ ] backup y rollback disponibles;
- [ ] seguridad y aislamiento verificados;
- [ ] observabilidad activa;
- [ ] Evolution correcto para el entorno;

## Ejecución

Registrar hora, actor, acción, resultado y evidencia por cada paso, sin secretos.

## Validación

- health:
- readiness:
- migraciones:
- aislamiento multitenant:
- autenticación y permisos:
- Core y workers:
- outbox:
- WhatsApp/Evolution:
- frontend escritorio/móvil:
- logs, métricas y alertas:

## Producción

- autorización explícita de Fito:
- digest idéntico al certificado en STAGING:
- freeze legado:
- delta y reconciliación:
- cambio Traefik:
- ventana de observación:

## Rollback

- disparadores:
- imagen/servicio anterior:
- router anterior:
- snapshot a restaurar:
- tratamiento del delta:
- resultado del ensayo o ejecución:

## Cierre

- versión observada en runtime:
- resultado final:
- alertas pendientes:
- evidencia:
- documentación actualizada:
- aprobado por:
