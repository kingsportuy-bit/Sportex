# Incorporar imágenes y no leídos a WhatsApp

id: TASK-20260816-002
owner: Codex
requester: Fito
estado: done
lifecycle: closed
work_type: feature
campaign: CAMP-20260803-001
context_focus: architecture
development_guide_impact: required
updated_at: 2026-08-16

## objetivo

Completar el puesto manual de WhatsApp con imágenes entrantes/salientes y el
comportamiento convencional de no leídos de WhatsApp Web, sin IA.

## alcance_permitido

- JPEG, PNG y WebP privados, tenant-aware, máximo 5 MB.
- Normalización `imageMessage`, `sendMedia`, preview y confirmación humana.
- Cursor durable por operador/conversación, badge y filtro de no leídos.
- Migración aditiva, flags, API, Core, UI, fixtures y pruebas locales.

## alcance_prohibido

- IA, OCR, automatizaciones u otros tipos de archivo.
- URL pública permanente o archivos sin validación.
- Deploy, migración, configuración Evolution, mensajes reales o push.
- Marcar leído al listar, seleccionar automáticamente o enviar.

## entradas

- Aprobación explícita de Fito del 2026-08-16.
- Contratos Evolution v2 de `imageMessage`, Base64 y `sendMedia`.

## salidas

- Contratos, migración 006 reversible, endpoints autenticados y UI manual.
- `docs/evidencias/TASK-20260816-002_WHATSAPP_MEDIA_NO_LEIDOS.md`.

## validacion

- Imagen entrante/saliente idempotente, privada y persistente.
- Abrir marca leído; entrada posterior vuelve a marcar no leído.
- Claro/noche y desktop/mobile sin regresión.
- 55/55 tests, SQL 19 tablas, build y cierre PASS.

## evidencia

- `docs/evidencias/TASK-20260816-002_WHATSAPP_MEDIA_NO_LEIDOS.md`.

## rollback

- Flags apagadas por defecto; migración 006 no aplicada y reversible.

## deuda_restante

- Activar Base64, migrar y promover al piloto requieren otro GO.
- Evaluar object storage si el volumen supera el piloto.
- Audio, video, documentos, stickers, grupos y broadcasts quedan fuera.

## registro_de_avances

### 2026-08-16 - cierre local

- Preview, envio simulado, render privado y persistencia tras reinicio PASS.
- No leídos permanecen cerrados hasta abrir; filtro y badge PASS.
- No se tocó producción ni se envió un mensaje real.

## decisiones

- Los bytes pertenecen al Core privado; el mensaje expone metadatos y referencia.
- Lectura del operador y receipt del proveedor son estados diferentes.
- Las capacidades quedan apagadas por defecto y no incorporan IA.
