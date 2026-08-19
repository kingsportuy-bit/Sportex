# Evidencia — Puesto operativo Delta desde SPORTEX

task: TASK-20260817-001
estado: Pestañas de WhatsApp publicadas en PILOTO_DELTA; aceptación visual humana pendiente
updated_at: 2026-08-19
candidate: a7964f3

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
- Leads conserva su tablero Kanban de administración: una tarjeta abre ficha
  comercial con resumen, próximo paso, últimos mensajes y respuesta rápida.
  No abre ni reemplaza WhatsApp; `Abrir WhatsApp` es una acción explícita para
  entrar al historial y atención completos.

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
- Guardia de arranque: `FRONTEND_RELOAD_GUARD=PASS`; el acceso inicia oculto,
  sólo se muestra sin sesión y los assets usan la revisión `session-reload-3`.
- Navegador local: bandeja sin conversación seleccionada al entrar; al abrir
  chat el scroll queda abajo; Leads muestra 6 columnas y 18 tarjetas; la página
  no tiene scroll horizontal.
- Navegador local: una tarjeta abre la ficha administrativa de Leads, con
  últimos mensajes, respuesta rápida y enlace explícito a WhatsApp; el tablero
  sigue con 18 tarjetas y sin scroll horizontal de página. No se envió mensaje.

## Despliegue PILOTO_DELTA

- Guard de release y bundle inmutable PASS para `3040659`
  (SHA256 `89cd1d0d6c9bd8d7a3060cd9c91479f9a16e5a430bdf403b3f6cb0747b062219`).
- Backup `pre-deploy.dump` con SHA256
  `73f376961e9b369d245469470e72186dd2b826b3d68db5669b541cc159e7d681`
  restaurado en una base aislada y luego eliminado.
- Migraciones 008--010 aplicadas antes de la imagen. La tabla nueva mantiene
  RLS forzado y las dimensiones de media quedan disponibles; no se borraron
  datos.
- Runtime final `sportex-staging:9a570c3b33ab2fcd`, `1/1`, con `/health` y
  `/ready` en PASS. El envío manual sigue habilitado para Delta.
- Incidente de login confirmado: la primera página comercial comparaba cursor
  de texto con `workspace_id` UUID. Se tipó y validó el cursor; la consulta de
  primera y segunda página pasó contra PILOTO_DELTA en transacción de solo
  lectura y no reapareció el error en los logs del release.
- La recarga ya no elimina una sesión válida por una falla de carga; solo lo
  hace cuando Core confirma autenticación inválida.
- La página, JavaScript y estilos se revalidan al recargar; las imágenes
  conservan caché corta. El acceso empieza con `hidden` en HTML, por lo que
  una sesión existente no lo muestra antes de que la aplicación se restaure.
- Smoke estático público: `index.html`, `app.js` y `styles.css` responden con
  `Cache-Control: no-store`; el índice referencia la revisión vigente de
  `app.js`
  y empieza con el acceso oculto. Sin sesión, el navegador público muestra el
  acceso correctamente y no registra errores. El recorrido con sesión Delta
  queda para la cuenta normal, sin inventar una autenticación ni enviar mensajes.
- Release de Leads: runtime `sportex-staging:304065966a7ef2a0`, `1/1`, con
  `/health` y `/ready` PASS. El índice público referencia
  `app.js?v=session-reload-4` y `styles.css?v=session-reload-4`, ambos `200`
  y `Cache-Control: no-store`.
- Ajuste publicado anterior: el activo conservaba mayor tamaño y un indicador verde,
  mientras que los inactivos quedaban neutros como el menú. Runtime
  `sportex-staging:2933ff227196e536`, `1/1`, con `/health` y `/ready` PASS;
  `styles.css?v=session-reload-5` responde `200` y `no-store`.

## Despliegue PILOTO_DELTA

- Candidato `a7964f3479fb47cc2925cf617abccd39783dbf56`, publicado desde bundle
  SHA-256 `78a2d2089d3668377f5e0057d618162fbc2511b5177425d90ab6e3d3f51292c9`.
- Servicio `sportex_staging_core` estable en `1/1`; `/health` reporta ese
  release y `/ready` responde `200`. El CSS público coincide byte a byte con
  el candidato (`e0a81a546569984f8d1202ee7e4290fd4ab570d927b8d7351e83e3bae44c3953`).
- No hubo migraciones, escrituras de datos ni mensajes. Rollback inmediato:
  `sportex-staging:2933ff227196e536` con respaldo de la especificación previa.

## Corrección visual PILOTO_DELTA (2026-08-19)

- Candidato `f40a7c50ccaef02f0e65e0a16f981c170725b7c8`; bundle SHA-256
  `e4f95317681c813287bf3b51c83fd412b10db4b6998445103bdbedc4e04c3170`.
- Regla literal del menú: radio `7px`, hover gris, activo `#ffffff12` e
  indicador lima `inset 3px` a la izquierda.
- Servicio `1/1`; health/ready PASS y CSS público
  `0574890f26fa5b7a2575df08387530b052ce7ee8461d9a3b581699448f878f82`.
- Sin migraciones, datos ni mensajes. Backup remoto y rollback `8a83ac4`.
- Pendiente: aceptación visual.

## Límites y rollout

- No se alteró Evolution ni Barberox y no se mandaron mensajes de prueba.
- Rollback inmediato: `sportex-staging:2933ff227196e536`; las migraciones se
  conservan por ser aditivas.
