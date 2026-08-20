# Evidencia — Puesto operativo Delta desde SPORTEX

task: TASK-20260817-001
estado: 8823a773 desplegado en PILOTO_DELTA con verificación técnica y Mesa PASS; aceptación visual humana pendiente
updated_at: 2026-08-20
candidate: 8823a77365f78f25db9fbf7afb5decd21e59f547

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

## Tema oscuro único PILOTO_DELTA (2026-08-19)

- Candidato `4f324db0448d5345a0c723a974370027c66fa028`; bundle SHA-256
  `1b61a92edb6f325e0f7effcbbc9d04f93f65723dbb3c721364ef1baf106ee3c6`.
- HTML inicia oscuro; no quedan toggle ni preferencia de tema. El carril
  WhatsApp usa grafito fijo y no invierte el modo.
- Servicio `1/1`; health/ready, inicio oscuro, toggle ausente y CSS público
  `c783e1f1867ac89bdd81559235696e731b7b60c5d0b33dc20174835b67683b80` PASS.
- Sin migraciones, datos ni mensajes. Backup remoto y rollback `f40a7c5`.

## Contraste de acciones verdes PILOTO_DELTA (2026-08-19)

- Candidato `92084ba5d10001a926fe73a38e14b2b5f36790cb`; bundle SHA-256
  `8e4ee41bf1558bb447b573c08bc9bd3125dd32fe2985da242f5fa2f537d947b1`.
- `button--signal`, enviar WhatsApp y cerrar ficha usan `#18221c` sobre verde.
- Servicio `1/1`, health/ready y CSS público
  `267e9457c219b69a047377385fdc6869100f20f7306d7a951fbae7b3fffec927` PASS.
- Sin migraciones, datos ni mensajes. Rollback `4f324db`.

## Apertura al último mensaje PILOTO_DELTA (2026-08-19)

- Candidato `e845927e36d6c34f9e1c1a0fbd44216659e88333`; bundle SHA-256
  `697d40a2d8f38ee76ca4d255480d34f9cc822438ac52cf99e4c4a54904f67ded`.
- Al abrir una conversación, la carga inicial y la respuesta actualizada del
  Core desplazan el historial al último mensaje. Las actualizaciones dentro de
  un chat abierto conservan la posición que ya eligió el operador.
- `npm run validate` PASS (57/57, tipos, SQL y build). Servicio `1/1`,
  `/health` y `/ready` PASS; el JavaScript público contiene la corrección.
- Sin migraciones, datos ni mensajes. Rollback inmediato:
  `sportex-staging:d7150d7f989c3fd8`.

## Pestañas superiores y configuración de etapas PILOTO_DELTA (2026-08-19)

- Candidato `3f2962610d2a4da6dc969eb8f5fda04f4c7abfa0`; bundle SHA-256
  `f8e4469d9a2d95737dcbb2f891f4e6e7be5d74ec520276af181f07ea3829cd5f`.
- Las pestañas de etapa quedan en una franja horizontal sobre WhatsApp; el chat
  conserva todo el alto restante. HTML y CSS públicos confirman esa estructura.
- La gestión de columnas ya está habilitada en Leads y Pedidos: editar,
  agregar, reordenar y eliminar. Eliminar exige destino, reasigna tarjetas o
  pedidos y audita; requiere el permiso correspondiente. No se cambió ninguna
  columna real durante este release.
- Servicio `1/1`, `/health` y `/ready` PASS. Sin migraciones, datos ni
  mensajes. Rollback inmediato: `sportex-staging:e845927e36d6c34f`.

## Acceso al editor de etapas PILOTO_DELTA (2026-08-19)

- Candidato `a0be896fc194500734104d5af5e0246bc77fba41`; botón `Editar etapas`
  público junto a las pestañas de WhatsApp.
- Servicio `1/1`, `/health` y `/ready` PASS. Sin migraciones, datos ni
  mensajes. Rollback inmediato: `sportex-staging:3f2962610d2a4da6`.

## Solapas de etapas PILOTO_DELTA (2026-08-19)

- Candidato `9ff30856c69fddae3140bc6840537e3b131f3fdc`; solapas activas
  delineadas en lima y las demás integradas al borde superior del panel.
- Servicio `1/1`, `/health`, `/ready` y CSS público PASS. Sin migraciones,
  datos ni mensajes. Rollback inmediato: `sportex-staging:a0be896fc1945007`.

## Candidato local — contorno único de pestaña y panel (2026-08-19)

- Alcance autorizado: sólo `DESARROLLO_LOCAL`. No hubo commit, despliegue,
  migración, mensaje, operación sobre `PILOTO_DELTA` ni cambio de datos reales.
- `frontend/index.html` conserva los controles y el espacio de trabajo, pero
  reemplaza `whatsapp-panel-fill`, `whatsapp-panel-outline` y
  `whatsapp-stage-frame` por el único SVG
  `#whatsapp-tabbed-panel-frame`.
- `frontend/app.js` usa un solo `panelContour` para superficie y contorno. La
  activa se eleva desde el propio borde del panel; las seis inactivas son rutas
  oscuras adicionales dentro del mismo SVG. Los botones permanecen como
  controles transparentes con `aria-pressed` y foco visible.
- La Mesa 2 previa queda revocada: midió el panel central y no detectó que la
  cabecera anexa seguía en `#1a211c`. La corrección local la iguala a
  `#111914`, sin cambiar controles ni listas.
- Navegador local, 1440x792: primera, intermedia y última activas verifican un
  único SVG. Activa, cabecera inmediata y panel central dan `#111914`; 122,
  123 y 122 píxeles interiores, respectivamente, no contienen línea bajo la
  activa.
- Navegador local: las siete etapas, filtros, `Space`, editor y apertura
  del chat al último mensaje PASS. No hubo errores ni requests posteriores a
  la carga durante el cambio de etapas. Responsive PASS en 1280x720,
  1024x768, 768x1024 y 390x844, incluida la última pestaña visible en móvil.
- `npm run validate` PASS: NUL limpio, 13/13 workflow, documentación, tipos,
  57/57 Core, SQL/RLS y build. `git diff --check` PASS.
- La Mesa automática no pudo iniciarse por límite de capacidad; no existe
  aprobación de Mesa. QA local confirma resize en la misma página: `viewBox`
  666→594 y unión `0px` tras 1440x792→1440x720.
- Gate pendiente: aceptación visual humana. Este bloque no autoriza release.

## Release PILOTO_DELTA — activa fusionada con panel (2026-08-20)

- Fito autorizó explícitamente el despliegue de
  `4898d557cf0fa6788bab5ec4f45db187d73c3c8c` para `PILOTO_DELTA`. El bundle
  inmutable del `git archive` completo tuvo SHA-256
  `fbb794f8077268658f075b9d2e99c643cd8b3cca1ce74d23f2106280912036c9`.
- Respaldo remoto previo validado mediante lectura: `pre-4898d55.dump`,
  SHA-256 `404df748b2a0e0de4a6bf118c5441b726170b20230e2356c520ba47196c1bce0`.
  No hubo migraciones ni escritura de datos durante el release.
- Runtime `sportex_staging_core` quedó `1/1`; `/health` y `/ready` públicos
  respondieron `200`. Los recursos públicos coincidieron exactamente con el
  artefacto: CSS
  `47a878fcf14d964b99801439ecda6fc94dfd67c2b6ae03e99e1d5522041fe00e` y JS
  `a0f4211d7283d8acbbaa1ec07443b89a0ea008b321693b519e2d2e2d28b521fc`.
- El estado outbound existente se preservó sin crear ni enviar mensajes:
  `SENT 16→16`, mensajes pendientes `0→0` y outbox listo `0→0`.
- Rollback disponible: `sportex-staging:9ff30856c69fddae`. La Mesa automática
  no pudo ejecutarse por límite de capacidad y no existe aprobación de Mesa;
  el GO de release no sustituye la aceptación visual humana en la sesión
  autenticada.

## Release PILOTO_DELTA — silueta constante y halo continuo (2026-08-20)

- El plan aprobado autorizó el candidato exacto
  `8823a77365f78f25db9fbf7afb5decd21e59f547`. La rama remota coincide con ese
  SHA y el guard de release dio PASS para `frontend/app.js` y
  `frontend/styles.css`.
- El `git archive` completo y sellado tuvo SHA-256
  `7ea10a04d364854cace6b8f1d0dcf243b963a9a367722b761c5885a1f668631c`.
  La imagen inmutable es `sportex-staging:8823a77365f78f25`.
- Respaldo remoto previo validado mediante lectura: `pre-8823a77.dump`,
  SHA-256 `d7f24a694a5a8714c711afc190d59c342ee095d75e63fd7692a88dae6eac0e95`.
  No hubo migraciones ni escritura de datos durante el release.
- `sportex_staging_core` quedó con actualización `completed`, `1/1`, un task y
  un contenedor. `/health` y `/ready` respondieron `200`; no hubo eventos
  fatales en los logs del servicio durante la observación.
- Los recursos públicos coincidieron exactamente con el artefacto: CSS
  `efd75ebd8190d59a6976cec06acb7c55a5a301136b28e1a74bacd208bbc3ecf7`
  y JS
  `65ba971a2f36c32fb6e16fb634aae31e63f1805e013ef21e3eeaa6334fb4b253`.
- En la sesión autenticada del navegador Codex, `ALL`, `COTIZADO` y `PERDIDO`
  conservaron pestañas `180×67` y superficie activa `186×68`; la unión con el
  panel fue `0px`, ambos fills dieron `rgb(20,25,22)`, la activa quedó en capa
  `2` y las inactivas en `1`.
- El gradiente mantuvo máximo lima sobre la activa y continuó por el borde
  superior del panel con desvanecimiento lateral. No apareció una línea bajo
  la activa. Arrow, Home, End, Enter y Space conservaron foco y activación.
- Las capturas autenticadas permanecen locales por contener datos reales. Sus
  SHA-256 son: `ALL`
  `2df1fe2076a5599b4a13b14e056595e72735082aef4c843ef09b702c1619cc16`,
  central `05187b2d68e32727ef3e4d750e0d4d475c0b03049d9014624f820ad735f19e98`
  y última `606e98dbf20c745e92c7a43f1246ce119763c9a0579103b23914edf83147de2c`.
- La Mesa visual independiente y la revisión frontend/QA dieron PASS sin
  brechas bloqueantes. La aceptación visual humana de Fito sigue siendo un
  gate separado.
- El estado outbound se preservó sin crear ni enviar mensajes: total
  `16→16`, pendientes `0→0` y outbox listo `0→0`.
- Rollback inmediato y revalidado: `sportex-staging:4898d557cf0fa678`.

## Límites y rollout

- No se alteró Evolution ni Barberox y no se mandaron mensajes de prueba.
- Rollback inmediato: `sportex-staging:4898d557cf0fa678`; las migraciones se
  conservan por ser aditivas.
