# Integrar WhatsApp real de Delta con SPORTEX

id: TASK-20260814-001
owner: Codex
requester: Fito
estado: in_progress
lifecycle: active
work_type: feature
campaign: CAMP-20260803-001
context_focus: architecture
development_guide_impact: none
updated_at: 2026-08-15

## objetivo

Convertir la interfaz WhatsApp-first aprobada en el puesto operativo real de
Delta, reutilizando la base existente de SPORTEX y completando solamente las
brechas necesarias para operar conversación, contacto, oportunidad, seña,
cliente, pedido y producción mínima con trazabilidad.

## resultado_final

Un único inbox real de Delta aparece continuamente en SPORTEX y permite:

`ver conversación -> responder manualmente -> clasificar -> definir próximo paso -> validar seña -> crear/vincular cliente y pedido -> entregar a producción mínima -> medir origen y resultado`

La captura funciona con la UI cerrada. Los fallos son visibles y recuperables.
Evolution y Meta aportan evidencia; SPORTEX conserva la historia operativa;
DELTA define reglas y valida negocio.

## entradas

- interfaz y evidencia cerradas por `TASK-20260803-005`;
- `HANDOFF-20260814-003` aprobado por Fito;
- Core, contratos, migraciones, tests y fixtures vigentes;
- fuentes comerciales DELTA en modo lectura;
- inventario de la Mesa `reutilizar | adaptar | falta`.

## salidas

- modelo comercial normalizado e integrado con la vertical transaccional;
- persistencia y migraciones ensayadas localmente;
- adaptador Evolution y workers probados primero con transporte falso;
- interfaz conectada a proyecciones reales del Core;
- paquete exacto de preflight/rollback para captura pasiva;
- evidencia por gate hasta el piloto operativo autorizado.

## decisiones_confirmadas

- No reconstruir módulos que ya cumplen contrato.
- Auditar cada capacidad como `reutilizar | adaptar | falta`.
- Mantener Contacto, Conversación, Oportunidad, Cliente y Pedido relacionados
  pero separados.
- Un Contacto puede tener varias conversaciones, oportunidades y pedidos.
- `SEÑA_DETECTADA` no crea Pedido.
- `SEÑA_VALIDADA` permite vincular o crear Cliente y exactamente un Pedido.
- La interfaz actual se conserva y consume proyecciones del Core.
- Evolution es adaptador; Meta es lectura; frontend no decide negocio.
- El primer outbound es manual, individual, confirmado y reversible mediante
  kill switch.
- La task ADS activa de DELTA permanece sin cambios.

## secuencia

1. **Modelo/persistencia local:** entidades separadas, varias oportunidades,
   seña, Cliente/Pedido único, RLS, auditoría y rollback ensayado.
2. **Evolution simulado:** ambos sentidos, receipts, duplicados, ordering,
   backfill, cuarentena, worker falso y captura con UI cerrada.
3. **Mesa local:** API/proyecciones, acciones internas, aprobación registrada,
   producción mínima y trazabilidad ficticia de punta a punta.
4. **Preparación remota:** seguridad, dependencias, inventario, Auth, DB,
   backup, migración, rollback, observabilidad y kill switches.
5. **Captura pasiva:** un canal, backfill pequeño, Meta en lectura y outbound
   `DENY_ALL`, sin pérdidas ni atribución inventada.
6. **Envío manual:** preview, confirmación individual, outbox, worker, receipts,
   reintentos, reconciliación, takeover y kill switch.
7. **Operación inicial:** seña, Cliente/Pedido, producción mínima y lote real de
   7–14 días sin registro paralelo.

## alcance_permitido

- documentación, arquitectura, código, migraciones no ejecutadas y pruebas en
  `DESARROLLO_LOCAL`;
- refactor focal necesario para separar las entidades comerciales;
- fixtures, adaptadores y transportes falsos;
- UI y API de las funciones enumeradas;
- preparación de seguridad, migración, rollback y manifiesto remoto;
- lectura focal de las fuentes comerciales DELTA.

## alcance_prohibido

- cambiar campañas, anuncios, presupuesto o estado ADS;
- modificar Evolution, webhook, Chatwoot, Meta, VPS o base remota;
- acceder/copiar datos reales o secretos;
- desplegar o ejecutar migraciones remotas;
- enviar WhatsApp real;
- bots, follow-ups automáticos, mensajes masivos o empresas externas.

## bloqueos_reales

- no poder reconciliar/versionar el baseline vigente;
- modelo o migración incapaz de aislar tenant;
- idempotencia/replay no determinista;
- necesidad de sobrescribir o borrar fuente real;
- interferencia con la tarea ADS activa;
- operación remota sin recurso exacto, backup, rollback o permiso.

## validacion

- tests unitarios, integración, permisos y cross-tenant;
- duplicados, ordering, restart, backfill solapado y receipts;
- migración/rollback ensayados localmente;
- E2E completo por gate;
- frontend responsive y estados de fallo;
- diff focal, documentación y `SPORTEX_CLOSE=PASS` por checkpoint;
- aceptación humana antes de ampliar cada gate real.

## evidencia

- `docs/evidencias/TASK-20260814-001_INVENTARIO_Y_PLAN.md`;
- `docs/evidencias/TASK-20260814-001_CONTINUIDAD_WHATSAPP_UI.md`;
- `docs/evidencias/TASK-20260814-001_CONTINUIDAD_WHATSAPP_UI_PROD.md`;
- `docs/evidencias/TASK-20260814-001_IDENTIDAD_SPORTEX.md`;
- evidencia focal nueva por cada gate;
- manifiesto, migración, rollback y observación cuando corresponda.

## rollback

- commits y artefactos por gate;
- cambios de esquema aditivos y proyecciones reconstruibles;
- kill switches separados para ingesta, proyección, acciones internas y outbound;
- nunca borrar fuente real como forma de rollback;
- volver al canal actual ante incidente de envío.

## deuda_postergada

- bots y respuestas autónomas;
- importación histórica completa;
- múltiples canales/inboxes;
- scoring, dashboards avanzados y atribución multicanal;
- producción detallada, inventario, contabilidad y facturación;
- personalización total del pipeline;
- salida comercial para terceros.

## deuda_restante

- Cada gate no iniciado permanece deuda explícita de esta misma task/campaña.
- Los gates remotos quedan bloqueados hasta inventario vivo, rollback y GO exacto.
- Las capacidades postergadas no bloquean el primer recorrido operativo.

## decisiones

- `SPORTEX-DEC-010` gobierna la integración progresiva.
- Se conserva toda implementación existente que pase contrato y pruebas.
- Un fallo focal no autoriza un refactor general ni cambio silencioso de estados.
- La captura pasiva precede acciones internas reales y outbound.
- El envío manual real es el último gate y requiere confirmación humana.

## registro_de_avances

### 2026-08-14 - Piloto productivo utilizable

- El candidato exacto `f6a9277` quedo `1/1` y paso el smoke focal de eventos
  fuera de alcance con respuesta `422`.
- `sportex.codexa.uy` ahora apunta al piloto, con snapshot previo y rollback
  conservado; health y readiness responden el release exacto.
- El administrador DELTA fue verificado por login real. El alta publica de
  usuarios permanece cerrada.
- La interfaz mostro 6 conversaciones y 18 mensajes reales. Detalles convive
  con el chat y el compositor esta habilitado para envio manual.
- Outbound manual quedo activo, pero no se envio ningun mensaje real durante el
  corte: outbox y tabla outbound permanecen en cero.
- Quedan como deuda de presentacion tres textos heredados de demo y como
  aceptacion humana el primer envio que Fito decida realizar desde SPORTEX.

### 2026-08-14 - Receipts activos y captura real observada

- `d871d2e` se desplego, `MESSAGES_UPDATE` se reactivo y el receipt plano paso
  `202 -> 200 duplicate` sin crear burbuja ni outbox.
- Se capturaron 2 contactos, 2 conversaciones y 7 mensajes reales; outbound
  SPORTEX sigue apagado.
- Tres eventos no textuales provocaron reintentos `500`. El candidato
  `f6a9277` responde `422` para exclusiones conocidas y paso `43/43`, build,
  tipos y SQL. Espera GO exacto.

### 2026-08-14 - Gate 5 captura pasiva ejecutado y contenido

- `34c9664` se desplego despues de backup/restore, migraciones `002/003/004`,
  seed, RLS y aislamiento PASS.
- Evolution `DELTA` quedo conectado por red privada; `MESSAGES_UPSERT` activo
  y outbound `false`.
- Smoke idempotente: `202 -> 200 duplicate`, una proyeccion y cero outbox.
- El trafico real revelo el formato plano de `MESSAGES_UPDATE`; se retiro ese
  evento temporalmente sin relajar seguridad.
- El fix `d871d2e` paso `42/42`, build, tipos y SQL y espera GO exacto. El
  dominio de interfaz tambien sigue sin DNS.
- Evidencia: `docs/evidencias/TASK-20260814-001_GATE_5_CAPTURA_PASIVA.md`.

### 2026-08-14 — inicio autorizado

- Fito autorizó el resultado final y pidió ejecutar sin consultas por decisiones
  menores.
- La Mesa produjo el inventario `reutilizar | adaptar | falta` y confirmó que
  las dos verticales existentes deben integrarse, no reemplazarse.
- `HANDOFF-20260814-003` define autoridad, gates, aceptación y límites.
- La ejecución comienza en Gate 1 después de cerrar/versionar el corte UI.

### 2026-08-14 — checkpoint Gate 1A

- Una seña validada ahora crea y vincula Cliente, Pago certificado y un único
  Pedido con claves idempotentes por oportunidad.
- La ficha conserva IDs, pedido, importes, actor, momento y `ORDER_CREATED`.
- La acción vive en Detalles de WhatsApp sin ocultar el chat.
- Pasaron reintento sin duplicación, rechazo sin seña, conflicto y API completa.
- Browser local: Lucas R. pasó de seña ficticia a `SPX-2026-00001`; los contadores
  visibles cambiaron a 1 Cliente y 1 Pedido y la próxima acción quedó en preparar
  producción. No hubo red, datos reales ni outbound.
- Gate 1 continúa: falta normalizar Contacto como entidad reutilizable, persistencia
  objetivo/migración y prueba de varias conversaciones/oportunidades por contacto.

### 2026-08-14 — checkpoint Gate 1B

- Contacto ya es una raíz separada y Conversación, Lead y Oportunidad lo
  referencian sin cambiar la proyección consumida por la UI.
- Se agregó la migración aditiva y reversible `20260814_002` para Contactos,
  Conversaciones, Mensajes, Oportunidades y vínculos al Core.
- Las 14 tablas objetivo exigen tenant, RLS forzado y rollback; no se ejecutó la
  migración en ninguna base.
- Falta implementar el store PostgreSQL comercial y ensayar up/down local antes
  de dar Gate 1 por terminado.

### 2026-08-14 — checkpoint Gate 1C cerrado

- El store PostgreSQL comercial persiste Contacto, Conversación, Mensajes,
  atribución, Lead, Oportunidad, actividad e idempotencia usando tenant y RLS.
- La proyección comercial se habilita con PostgreSQL, pero las rutas locales de
  replay, reset y mutación de fixtures permanecen físicamente ausentes fuera
  del triple gate local.
- PostgreSQL 16 aislado ejecutó `001 up -> 002 up -> 002 down -> 002 up` y luego
  `002 down` con datos; el rollback dejó cero tablas comerciales.
- El ensayo de store creó un expediente por tenant, reejecutó el mismo mensaje
  sin duplicarlo y confirmó aislamiento entre dos tenants.
- Gate 1 queda cerrado. El siguiente corte es Gate 2 Evolution simulado, sin
  conexión, datos ni mensajes reales.

### 2026-08-14 — checkpoint Gate 2A

- El adaptador Evolution simulado normaliza mensajes entrantes, salientes y
  receipts en el sobre canónico WhatsApp, conservando tenant, tiempos, origen,
  dirección, evidencia y correlación.
- El journal deduplica por tenant/evento y el worker procesa por tiempo de
  ocurrencia aunque live y backfill lleguen desordenados.
- Los errores de proyección quedan en cuarentena sin detener el resto; un worker
  reconstruido reanuda las entradas pendientes del journal compartido.
- El transporte saliente falso nace con kill switch activo, exige confirmación
  humana, es idempotente y evita regresiones de receipts.
- Gate 2 continúa: falta persistir el journal/outbox objetivo y conectar el
  handler simulado a la proyección comercial PostgreSQL.

### 2026-08-14 — checkpoint Gate 2B cerrado

- La migración reversible `20260814_003` agrega journal de ingreso y outbox
  WhatsApp con tenant, RLS forzado, permisos mínimos e índices de trabajo.
- El store PostgreSQL persiste primero el sobre, deduplica por tenant/evento,
  recupera pendientes, registra procesados/cuarentena y aísla el outbox.
- El worker simulado proyecta backfill, inbound y outbound en una conversación
  ordenada aun cuando la UI no existe o está cerrada.
- El outbox durable permanece pendiente detrás del kill switch, exige
  confirmación, envía una sola vez mediante transporte falso y aplica receipts
  sin regresión.
- PostgreSQL 16 ensayó las 16 tablas, dos tenants, journal, proyección, outbox y
  rollback con datos; se retiraron 7 tablas extendidas y quedaron intactas las
  9 del Core base.
- Gate 2 queda cerrado. El siguiente corte es Gate 3: API/proyecciones y acciones
  internas de la mesa local, todavía sin integración real.

### 2026-08-14 — checkpoint Gate 3A

- El compositor del chat local ya ejecuta un envío manual simulado desde la
  interfaz, con permiso `commercial.manage`, `Idempotency-Key` y resolución del
  contacto dentro del tenant.
- La intención pasa por outbox falso, transporte Evolution simulado, journal,
  worker y proyector; el mensaje vuelve a la misma conversación como salida de
  Delta sin conectarse a WhatsApp.
- La capacidad nace físicamente ausente fuera del triple guard local. La UI
  informa `Simulación local · no llega a WhatsApp` y no habilita adjuntos.
- Se agregó compatibilidad segura para expedientes JSON locales anteriores que
  todavía no incluían la entidad Contacto separada; el contacto se reconstruye
  desde la conversación ficticia, sin modificar datos reales.
- Browser local: el mensaje apareció en la lista y en el hilo; al abrir Detalles,
  el chat y el compositor siguieron disponibles. Core `34/34` PASS.
- Gate 3 continúa: faltan las acciones internas y la producción mínima del
  recorrido antes de preparar cualquier conexión remota.

### 2026-08-14 — checkpoint Gate 3B cerrado

- El Core incorpora `production.release`: `intake_pending -> production_ready`
  con confirmación, versión, idempotencia, auditoría y outbox.
- La acción `Entregar a producción` vive dentro de Detalles de WhatsApp. El
  chat sigue disponible y la proyección cambia a `Listo para producción` con
  próxima acción y registro de actividad.
- La lista Pedidos refleja el mismo estado y el chip productivo fue corregido
  para conservar contraste en modo oscuro.
- PostgreSQL 16 aplicó `001/002/003/004`; rollback `004` conservó el pedido como
  `intake_pending`, incrementó versión y restauró el constraint anterior.
- Core `34/34` PASS. Browser local: creación desde seña, entrega a producción,
  historial y listado final observados de punta a punta.
- Deuda: JSON persiste la proyección y el Core local usa memoria. PostgreSQL
  debe demostrar consistencia tras reinicio antes de captura real.
- Gate 3 queda cerrado. El siguiente paso es preparar Gate 4 en lectura y sin
  tocar Evolution, Supabase remoto, VPS, datos reales, mensajes ni deploy.

### 2026-08-14 — checkpoint Gate 4 preparado localmente

- El inventario remoto de solo lectura confirmo Evolution `2.3.7`, instancia
  `DELTA` conectada y sin webhook, Core STAGING antiguo `ea02fc0`, runtime
  legado publico caido y migraciones `002/003/004` todavia ausentes.
- STAGING conserva 9 tablas base con RLS forzado y no hay backup SPORTEX
  localizado; crear y verificar uno es obligatorio antes de migrar.
- El adaptador real cubre texto individual, salidas manuales observadas y
  receipts, con identidad server-side, deduplicacion y cuarentena.
- El webhook exige un secreto por header y persiste antes de proyectar. La UI
  ahora carga la proyeccion comercial tambien fuera de la demo local.
- El workspace real admite clasificacion, proxima accion y seguimiento; sena y
  conversion real siguen fail-closed.
- El envio manual real quedo implementado con confirmacion literal, permiso,
  idempotency key, outbox y transporte Evolution v2, pero apagado por defecto.
- Core `41/41`, typecheck, build, SQL y browser oscuro PASS. Detalles y compositor
  convivieron sin overflow ni errores de consola.
- Runtime versionado en `34c9664607e9e0483f5a1dfb6164c7b572b676cb`;
  paquete remoto versionado en `fff8a72` y documentado en
  `SPORTEX-PILOTO-DELTA-20260814-PREPARED.md`.
- No se creo webhook, no se migro, no se desplego, no se leyo contenido real y
  no se envio ningun mensaje. El siguiente paso es formar el candidato exacto y
  pedir GO para backup + migracion + deploy + captura pasiva con outbound off.

### 2026-08-14 — continuidad WhatsApp y correcciones de interfaz

- Se verifico el recorrido real de entrada: Evolution autentica y normaliza,
  el journal PostgreSQL persiste antes de proyectar, y el panel lee la
  conversacion durable en vez del payload del webhook.
- Las salidas hechas desde WhatsApp Web ya ingresan como eventos live
  `fromMe=true`. Las salidas hechas desde SPORTEX ahora se proyectan con el ID
  confirmado por Evolution y el eco posterior no duplica la burbuja.
- Un fallo de proyeccion posterior a un envio confirmado no cambia `SENT` a
  `UNKNOWN`; se evita el reintento ciego y el eco live queda como reconciliador.
- WhatsApp consulta la base cada dos segundos mientras la vista esta abierta y
  al volver a la pestana, conservando conversacion, borrador, foco y scroll.
- Todos los botones Cancelar/Cerrar de formularios con validacion HTML omiten
  esa validacion al cerrar. Browser local confirmo dialogo abierto `1 -> 0` con
  campos obligatorios vacios.
- La superficie clara usa blanco real en canvas y chat; el login conserva
  fondo grafito en ambos temas. `USER` fue reemplazado por `IMPRESION` y se
  retiro el texto que afirmaba falsamente que WhatsApp no estaba conectado.
- Typecheck, `git diff --check` y Core `44/44` PASS. La inspeccion local de
  WhatsApp claro/oscuro no mostro overflow ni ruptura de la firma grafito,
  blanco y lima.
- El corte queda local y sin mensajes reales. Falta formar commit exacto y
  solicitar GO de deploy para actualizar PILOTO_DELTA.
- El corte funcional fue versionado y publicado como
  `1cc2c96fe8f8e0f8215ce5a804dd1ad775982c45`. El runtime publico permanece en
  `f6a9277`; el unico gate pendiente es el GO exacto de despliegue.

### 2026-08-14 — continuidad desplegada en el piloto productivo

- Fito autorizo desplegar para probar directamente en el piloto productivo.
  El guard resolvio el commit exacto `1cc2c96fe8f8e0f8215ce5a804dd1ad775982c45`
  desde origin y el bundle reproducible dio SHA256
  `7af3ad6c14151ba29a6a6d309f33bb0d723e0ebc61ad62d5acf285ed27529c76`.
- Antes del corte se guardo la especificacion del servicio con SHA256
  `52d5cb6e3d8d823cf4803dacd3f3b1b3341faf18aceb298b4d62fbe49b47d066`.
  No hubo migraciones ni cambios de datos.
- Swarm promovio `sportex-staging:1cc2c96fe8f8e0f` en modo `start-first` y
  confirmo convergencia. Rollback: `sportex-staging:f6a92770b2539975`.
- URL publica, `/health`, `/ready` y release exacto PASS; Evolution conserva
  ingreso y outbound manual activos. Cero mensajes fueron enviados durante el
  despliegue y los logs iniciales dieron cero errores.
- Browser productivo sin sesion: login grafito, `IMPRESION` y copy de WhatsApp
  conectado PASS. La revision autenticada de Fito queda como siguiente accion,
  no como condicion retroactiva del deploy tecnico.
- Evidencia: `docs/evidencias/TASK-20260814-001_CONTINUIDAD_WHATSAPP_UI_PROD.md`.

### 2026-08-14 — identidad visual SPORTEX

- Fito definio que SPORTEX es la unica marca visual del sistema. Delta Sport
  permanece solamente como nombre de la empresa/tenant y contenido operativo.
- Se reutilizo sin redibujar el archivo entregado `logo-sportex.png`; la copia
  servida por el frontend conserva SHA256
  `9b413b59d4c47d3d170cd1e119cbe6ba12f8a46de51b188d143aa7323bcf10b8`.
- Login y sidebar usan el wordmark SPORTEX horizontal. El encuadre y el modo de
  mezcla eliminan visualmente el rectangulo negro sin alterar el archivo fuente.
- El asset `frontend/assets/delta-logo.png` fue retirado y no quedan referencias
  `delta-logo` ni `/assets/delta` en el frontend.
- Browser local oscuro PASS: logo legible, sin caja negra, tenant subordinado y
  navegacion sin desplazamiento.
- El candidato `a7ceb9b73d53777b7c3a5a5beda9d84f794fe8f9` fue promovido al piloto
  productivo como `sportex-staging:a7ceb9b73d53777b`; Swarm 1/1, health,
  readiness, asset y browser productivo PASS.
- El HTML productivo no referencia `delta-logo`; Delta Sport permanece como
  tenant operativo. No hubo migraciones, cambios de datos ni mensajes.
- Rollback inmediato: `sportex-staging:1cc2c96fe8f8e0f`.
- Evidencia: `docs/evidencias/TASK-20260814-001_IDENTIDAD_SPORTEX.md`.

### 2026-08-15 - logo SPORTEX con transparencia real

- Fito pidio retirar el fondo del logo. La fuente original quedo intacta y el
  asset servido se reemplazo por un PNG ARGB con alpha real.
- Se retiro `mix-blend-mode: screen`; la marca ya no depende de un truco CSS
  ligado al fondo oscuro.
- Validacion de imagen: `1916x821`, esquina alpha `0`, centro alpha `255` y
  SHA256 `d726c53c6537f34911e6c8be46a5a9e8d551eba4247d818c7091a2151b82b628`.
- Browser local oscuro PASS: logo visible, limpio y con el mismo encuadre.
- Pendiente: versionar el candidato exacto y promoverlo a `PILOTO_DELTA` con
  rollback al runtime `a7ceb9b`.
