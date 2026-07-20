# Contrato Git y releases SPORTEX

## Repositorio

Se reutilizará `https://github.com/kingsportuy-bit/sportex.git`, preservando su historial.

El checkout del VPS está en la rama local `master`, en el mismo commit que `origin/main`, mientras `origin/master` quedó atrás. La tarea de integración deberá normalizar esta situación mediante una rama nueva y revisión explícita, nunca con force-push.

## Incorporación de la nueva base

La carpeta documental nueva no se mezclará mediante copia ciega sobre `main`.

La tarea de migración deberá:

1. partir del commit remoto vigente;
2. crear una rama de reconstrucción;
3. inventariar el código anterior;
4. incorporar la nueva documentación;
5. conservar lo reutilizable y aislar lo legacy;
6. validar antes de integrar a `main`;
7. documentar rollback.

Quedan prohibidos force-push, reescritura de historial y reemplazo destructivo del checkout anterior.

## Commits

Cada commit debe corresponder a una tarea y alcance revisable. Cambios ajenos se conservan y no se mezclan silenciosamente.

## Release

Un release requiere:

- tarea aprobada;
- commit remoto;
- entorno;
- imagen o artefacto inmutable;
- migraciones;
- validaciones;
- evidencia observada;
- rollback;
- actualización documental.

El manifiesto y los gates operativos se definen en `DEPLOYMENT_PROTOCOL.md`.

Un build local, healthcheck o imagen sin despliegue observado no certifican un release.

## Promoción

STAGING y producción son despliegues distintos. La evidencia no se hereda entre versiones ni entornos.

Producción usa exactamente el digest certificado en STAGING y requiere autorización explícita nueva.
