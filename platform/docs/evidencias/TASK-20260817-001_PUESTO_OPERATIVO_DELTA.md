# Evidencia — Puesto operativo Delta desde SPORTEX

task: TASK-20260817-001
estado: incidente de login corregido; listo para reintentar con la cuenta Delta
updated_at: 2026-08-19
candidate: 9250d3a

## Recorrido cubierto

- WhatsApp mantiene la conversación de Delta como fuente única y el chat abre
  en el último mensaje.
- Leads y Pedidos son tableros Kanban independientes con tarjetas, movimiento
  accesible y drag and drop.
- Las columnas empiezan con etapas útiles y cada tenant puede agregar,
  renombrar, ordenar y eliminar; el borrado reasigna tarjetas y queda auditado.
- Los cambios de etapa se validan contra la configuración del tenant, versión,
  permiso y auditoría del Core.
- La conversión conserva el origen `DESCONOCIDO` o `META_EXACTO` y reutiliza
  los datos conocidos al crear cliente y pedido.
- El pedido conserva el boceto vigente elegido por el comercial, sin borrar
  las imágenes anteriores.

## Rendimiento y medios

- Arranque por pestaña: la bandeja solicita 25 conversaciones resumidas y pide
  más al llegar al final; el historial se obtiene al abrir el chat.
- Un stream autenticado notifica sólo referencias de cambios; cada referencia
  refresca la conversación afectada y ya no existe polling global cada dos
  segundos.
- El envío muestra una burbuja local `Enviando…`, se concilia con Core y no
  recarga todo el escritorio ni muestra un aviso de éxito.
- Imagen privada con dimensiones persistidas, `ETag`, cache HTTP privada,
  visor dentro del panel y descarga autenticada.

## Pruebas locales

- `node --check frontend/app.js` PASS.
- `npm run check` PASS.
- `npm test` PASS: 57/57.
- `npm run validate-sql` PASS: RLS y rollback presentes.
- `npm run build` PASS.
- Navegador local: bandeja sin conversación seleccionada al entrar; al abrir
  chat el scroll queda abajo; Leads muestra 6 columnas y 18 tarjetas; la página
  no tiene scroll horizontal.

## Despliegue PILOTO_DELTA

- Guard de release y bundle inmutable PASS para `9250d3a`.
- Backup `pre-deploy.dump` con SHA256
  `73f376961e9b369d245469470e72186dd2b826b3d68db5669b541cc159e7d681`
  restaurado en una base aislada y luego eliminado.
- Migraciones 008--010 aplicadas antes de la imagen. La tabla nueva mantiene
  RLS forzado y las dimensiones de media quedan disponibles; no se borraron
  datos.
- Runtime final `sportex-staging:9250d3ac680549b7`, `1/1`, con `/health` y
  `/ready` en PASS. El envío manual sigue habilitado para Delta.
- Incidente de login confirmado: la primera página comercial comparaba cursor
  de texto con `workspace_id` UUID. Se tipó y validó el cursor; la consulta de
  primera y segunda página pasó contra PILOTO_DELTA en transacción de solo
  lectura y no reapareció el error en los logs del release.
- Navegador local: recargar conserva la pestaña Leads, no hay pantalla de
  carga ni scroll horizontal y el chat abre en su último mensaje. La sesión
  existente se refresca antes de mostrar login. El navegador de prueba no
  conserva una sesión de Delta, por lo que el recorrido real queda para la
  cuenta normal, sin inventar una autenticación ni enviar mensajes.

## Límites y rollout

- No se alteró Evolution ni Barberox y no se mandaron mensajes de prueba.
- Rollback inmediato: `sportex-staging:23aa757d23108a0c`; las migraciones se
  conservan por ser aditivas.
