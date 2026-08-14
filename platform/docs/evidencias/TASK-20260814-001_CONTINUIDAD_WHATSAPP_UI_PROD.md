# Evidencia — continuidad WhatsApp/UI en piloto productivo

Fecha: 2026-08-14
Task: `TASK-20260814-001`
Destino: `PILOTO_DELTA` productivo
URL: `https://sportex.codexa.uy`

## Artefacto y promocion

- Commit funcional: `1cc2c96fe8f8e0f8215ce5a804dd1ad775982c45`.
- Guard de release: PASS contra origin y worktree aislado.
- Bundle SHA256:
  `7af3ad6c14151ba29a6a6d309f33bb0d723e0ebc61ad62d5acf285ed27529c76`.
- Imagen: `sportex-staging:1cc2c96fe8f8e0f`.
- Image ID:
  `sha256:f114b0f75d84c5b67b714a457bd935eb4faae806d554243e600c25a1d8f16846`.
- Servicio: `sportex_staging_core`, `1/1`, convergencia `start-first` PASS.

## Proteccion y rollback

- Especificacion previa guardada en VPS; SHA256:
  `52d5cb6e3d8d823cf4803dacd3f3b1b3341faf18aceb298b4d62fbe49b47d066`.
- No hubo migraciones, escrituras manuales de datos ni cambios de secretos.
- Rollback exacto: `sportex-staging:f6a92770b2539975`.
- No se envio ningun WhatsApp durante la promocion.

## Verificacion viva

- `/health`: `ok=true`, release exacto PASS.
- `/ready`: `ok=true`, PostgreSQL y autenticacion Supabase PASS.
- Config publica: ingreso Evolution `true`, outbound manual `true`.
- Logs iniciales: cero lineas `error|fatal|unhandled` en cinco minutos.
- Assets productivos: refresco de la bandeja desde DB, cuatro cierres
  `formnovalidate`, `IMPRESION`, login grafito y retiro de los tres tonos crema
  focales PASS.
- Browser productivo sin sesion: login y linea visual PASS.

## Pendiente humano

Fito debe entrar con su cuenta y probar la bandeja real. El primer envio manual
real sigue siendo una accion elegida por Fito; no fue usado como smoke del
despliegue.
