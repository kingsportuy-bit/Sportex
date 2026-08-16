# Evidencia — imágenes y no leídos en PILOTO_DELTA

Fecha: 2026-08-16
Task: `TASK-20260816-003`
Destino: `PILOTO_DELTA`
URL: `https://sportex.codexa.uy`
Estado: `PASS`

## Autorización y candidato

- GO exacto: `GO SPORTEX TASK-20260816-003 c6b3b5b07c63704ab260f41b793f0a5449705262 PILOTO_DELTA`.
- Commit remoto y runtime: `c6b3b5b07c63704ab260f41b793f0a5449705262`.
- Release guard: PASS.
- Bundle de alcance: SHA256
  `bc0e44b5a5064f0aa68203b8ccc1a927bbd5129551798378e8d0702714f776e7`.
- El bundle de alcance omitía los archivos raíz requeridos por Docker. Se generó
  desde el mismo commit un contexto completo `platform/`, sin archivos ajenos,
  SHA256 `64c4f951d96136122d4bbc829e02c165ee0eb71ea82031bcd2a3db4eef506a8f`.
- `logo-sportex.png` no fue incluido ni modificado.

## Backup y migración 006

- Directorio remoto: `/var/backups/sportex/task-20260816-003-c6b3b5b`.
- Especificación previa: SHA256
  `8d7d9884044d0ae9224de18b9328987466907e0d41badb1325cea89c6f6aa63c`.
- Dump previo de objetos `sportex_staging_*`: SHA256
  `d3fc73fffe3fd75c1f76c842fc52f0a835203e5ddcc1c3add8687aa7758bff0a`.
- Restore aislado: PASS con 17 tablas y 17 RLS forzados.
- Ensayo aislado de `20260816_006`: PASS con 19 tablas y 19 RLS forzados.
- Migración real aplicada antes de la imagen: PASS; 19 tablas, 19 RLS
  forzados, dos políticas nuevas y seis grants esperados.
- El runtime anterior mantuvo `/ready=200` después de la migración.
- El rol de runtime accedió a las tablas nuevas con tenant Delta y devolvió
  cero filas con un tenant ajeno. La prueba temporal fallida no dejó sentinelas.

## Imagen, flags y Evolution

- Imagen: `sportex-staging:c6b3b5b07c63704`.
- Image ID:
  `sha256:62efc4bf66953cd8ed3f0e11ab67e25ca8403c7142d10ad8a4705a441d2a8c02`.
- Despliegue `start-first` primero con media/unread `false`: `1/1`, health y
  readiness PASS.
- Webhook Evolution previo respaldado sin exponer secretos.
- Se preservaron exactamente URL, headers, enabled, by-events y eventos; solo
  `webhookBase64` cambió de `false` a `true`.
- Instancia `DELTA`: `open`; eventos `MESSAGES_UPSERT` y `MESSAGES_UPDATE`.
- Después del smoke se activaron
  `SPORTEX_WHATSAPP_MEDIA_ENABLED=true` y
  `SPORTEX_WHATSAPP_UNREAD_ENABLED=true`.
- Config pública final: release exacto, ingreso `true`, outbound manual `true`,
  media `true` y unread `true`.

## Verificación sin mensajes reales

- `/health=200`, `/ready=200`, servicio `1/1` y contenedor `healthy`.
- Endpoints de media, lectura e imagen devolvieron `401` sin autenticación.
- Tres muestras posteriores: health/ready `200`, `1/1` y cero coincidencias
  `error|fatal|unhandled|uncaught`.
- Antes de activar: 271 mensajes comerciales, 4 outbound, outbox 0, media 0 y
  read states 0.
- Al finalizar: 271 mensajes comerciales, 4 outbound, outbox 0, media 0 y read
  states 0. No se llamó a ningún endpoint de envío ni se adjuntó un archivo.
- Durante el proceso ingresó un mensaje real de forma natural por el webhook
  (270 a 271); no fue generado ni respondido por este release.

## QA visual

- Login productivo en noche: fondo grafito, texto legible, cero bloques blancos
  y cero overflow horizontal a 1280x720.
- Fito confirmó el ingreso y se verificó la sesión productiva autenticada.
- WhatsApp desktop 1440x900 claro/noche: 24 conversaciones, badges visibles,
  compositor manual, adjunto habilitado, cero overflow y cero blanco ilegible.
- Hover de `No leídos`: contraste y cambio de estado visibles en modo claro.
- WhatsApp mobile 390x844 claro/noche: lista, chat, retorno a Chats, compositor
  y adjunto accesibles; cero overflow, blanco sobre blanco o fondo blanco en
  noche.
- Se abrió una conversación con 13 no leídos: el total bajó de 158 a 145, el
  badge desapareció y el estado persistió tras recargar. La base registró un
  único read state.
- No se escribió texto, no se adjuntó un archivo y no se pulsó enviar.
- La recepción/envío real de una imagen no se ejercitó por la prohibición de
  mensajes reales; contrato, flags, endpoint privado y PASS local cubren esa
  capacidad hasta un canary separado.

## Rollback

- Inmediato image-first: `sportex-staging:72e0fc2a7abfdecd` y flags en `false`.
- Restaurar `webhookBase64=false` desde el respaldo y verificar `/ready`.
- Conservar las tablas aditivas. No ejecutar down ni restore sin un GO
  destructivo separado.
