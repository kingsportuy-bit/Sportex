# Conexiones SPORTEX

> SNAPSHOT HISTORICO observado el 2026-07-19. Revalidar cada dato antes de
> operar. Este documento no autoriza accesos ni contiene secretos.

## Git

- Repositorio canonico: `https://github.com/kingsportuy-bit/Sportex.git`.
- `main` observado en `a62e5ed` el 2026-07-19.
- desarrollo nuevo publicado en `sportex-task007-staging`, commit `ea02fc0`.
- worktree autoritativo actual:
  `C:\Users\Fito\Documents\CODEX\SPORTEX`.
- proyecto tecnico: `platform/`.

Las carpetas copiadas dentro de DELTA no son fuentes paralelas. El nombre
historico de una rama no define el entorno actual.

## VPS y runtime legado

En el snapshot se observo:

- VPS compartido `31.97.28.4`;
- stack `sportex`, servicio `sportex_sportex`;
- dominio `https://sportex.codexa.uy`;
- checkout `/opt/sportex`;
- imagen mutable `sportex:latest`;
- controles de seguridad insuficientes documentados en
  `CURRENT_RUNTIME_BASELINE.md`.

No se asume que estos datos sigan vigentes. El runtime legado no se reinicia,
modifica ni retira sin tarea, observacion actual, permiso y rollback.

## Supabase/PostgreSQL

En julio se observaron una plataforma compartida y tres convenciones:

- `sportex_*`: legado;
- `sportex_staging_*`: migracion nueva preparada, no asumida como ejecutada;
- `sports_*`: propuesta anterior para produccion, no certificada.

La frontera fisica de `PILOTO_DELTA` debe decidirse tras una auditoria actual.

## Evolution

Se observaron servicios de Evolution usados por otros entornos y una instancia
legado `DELTA` sin conexion aprobada para el nuevo Core. La instancia, numero,
webhook y outbound del piloto siguen pendientes de una tarea propia.

## Traefik y dominios

Se observo Traefik compartido y el dominio legado `sportex.codexa.uy`. El
dominio de `PILOTO_DELTA` no se decide desde este snapshot.

## n8n

SPORTEX no utiliza n8n en la arquitectura objetivo.
