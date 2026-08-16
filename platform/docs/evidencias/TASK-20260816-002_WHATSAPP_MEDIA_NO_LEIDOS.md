# Evidencia — WhatsApp con imagenes y no leidos

## Resultado

El candidato local permite recibir y enviar manualmente JPEG, PNG y WebP,
mostrar preview antes del envio y conservar bytes privados por tenant. Los
mensajes entrantes quedan no leidos hasta que el operador abre el chat; listar,
seleccionar automaticamente o enviar no mueve el cursor.

## Controles

- MIME permitido, firma binaria, checksum y maximo de 5 MB validados en servidor.
- Descarga autenticada; la lista y el JSON de mensajes no contienen Base64.
- Lectura durable por tenant, actor y conversacion; receipts permanecen separados.
- Outbox idempotente y `sendMedia` exacto; confirmacion humana obligatoria.
- Flags `SPORTEX_WHATSAPP_MEDIA_ENABLED` y `SPORTEX_WHATSAPP_UNREAD_ENABLED`
  apagadas por defecto.
- Migracion 006 aditiva con RLS y rollback; no fue aplicada.

## Pruebas reproducibles

- `npm test`: 55/55 PASS, incluyendo adaptador de imagen, integridad, aislamiento,
  cursor de lectura y payload `sendMedia`.
- `npm run validate-sql`: 19 tablas declaradas, RLS forzado y rollback PASS.
- Demo local: preview, envio simulado, render privado y persistencia de imagen y
  lectura luego de detener/reiniciar el proceso PASS.
- Browser: escritorio 1440x900 y movil 390x844, claro/noche, overflow horizontal
  cero y fondos blancos visibles en noche cero.
- `npm run validate`, `git diff --check` y cierre ejecutable: PASS.

## Limites reales

No hubo deploy, migracion, cambio de webhook/configuracion Evolution, push ni
mensaje real. Activar Base64, migracion 006 y flags en PILOTO_DELTA requiere un
GO separado con backup, rollback y verificacion posterior.
