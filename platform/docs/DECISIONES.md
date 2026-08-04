# Decisiones tecnicas vigentes de SPORTEX

Registro durable del sistema. Las tareas referencian sus IDs; una decisión
nueva marca la anterior como `REEMPLAZADA`. El negocio permanece en DELTA.

## SPORTEX-DEC-001 - Fuente canonica unica y vistas derivadas

- Fecha: 2026-08-02
- Estado: `VIGENTE`
- Decision: `docs/state/PROJECT_STATE.json` es la unica fuente canonica del
  contexto vivo. `SESSION_STATE.md`, `TASKS/INDEX.md`, `CURRENT_CONTEXT.md`,
  `errors/index.json` y `CAMPAIGN_STATE.json` son vistas regenerables.
- Motivo: evitar estados paralelos y permitir que un hilo nuevo detecte tarea,
  campaña, entorno, Git, riesgos y siguiente accion sin memoria del chat.
- Impacto: las vistas no se editan manualmente y el workflow bloquea si estan
  desactualizadas o contradicen el estado y las tareas.

## SPORTEX-DEC-002 - Cierre proporcional al desarrollo de software

- Fecha: 2026-08-02
- Estado: `VIGENTE`
- Decision: un checkpoint material exige tarea, estado, decision, evidencia,
  pendientes y validacion local completa de documentacion, tipos, tests, SQL y
  build antes de emitir `SPORTEX_CLOSE=PASS`.
- Motivo: un proyecto de software necesita probar tanto la continuidad
  documental como la ausencia de regresiones de codigo.
- Impacto: un PASS local no certifica runtime ni concede permiso de migracion,
  deploy, integracion, mensajes o uso de datos reales.

## SPORTEX-DEC-003 - La campaña comercial no se abre implicitamente

- Fecha: 2026-08-02
- Estado: `VIGENTE`
- Decision: `SPORTEX — Sistema Comercial Asistido de Delta` queda como proxima
  accion con estado `NOT_STARTED`; esta tarea no crea campaña tecnica ni tareas
  de producto asociadas.
- Motivo: Fito pidio instalar primero el sistema operativo documental.
- Impacto: abrir la campaña requerira una accion posterior explicita y una
  nueva tarea compatible con el handoff de DELTA.

## SPORTEX-DEC-004 - Primera vertical comercial local y sin efectos externos

- Fecha: 2026-08-02
- Estado: `VIGENTE`
- Decisión: abrir `CAMP-20260803-001` con una primera vertical limitada a
  fixtures ficticios, persistencia efímera en memoria y visualización local de
  conversación, atribución, lead, oportunidad, etapa y próxima acción.
- Regla de atribución: `META_EXACTO` requiere el `sourceId` entregado en
  `externalAdReply`; si falta esa evidencia, el Core registra `DESCONOCIDO` y
  no intenta inferir un anuncio.
- Límite: esta vertical no habilita webhooks, canales, datos reales, mensajes,
  migraciones, `PILOTO_DELTA`, deploy ni producción.
- Motivo: probar la cadena de negocio más pequeña de punta a punta antes de
  definir persistencia real, IA o automatizaciones.
- Impacto: la campaña queda activa después de cerrar la tarea, pero una tarea
  posterior requiere autorización nueva de Fito.

## SPORTEX-DEC-005 - Persistencia CRM local de fixtures gobernada por el Core

- Fecha: 2026-08-03
- Estado: `VIGENTE`
- Decision: la demo CRM usa una semilla canonica de 18 expedientes ficticios y un archivo JSON local atomico, tenant-aware e ignorado por Git. Etapas, transiciones, versiones, proxima accion, seguimientos y reset pertenecen al Core; el frontend solo solicita comandos especificos.
- Guard: solo existe con `development|test + memory + SPORTEX_DEV_AUTH=true`; una configuracion corrupta falla cerrada.
- Limite: `SENA_VALIDADA` es una etapa fixture y nunca certifica un pago. La demo no envia mensajes, conecta integraciones, usa datos reales ni crea pedidos o produccion.
- Motivo: permitir que Fito comprenda y valide el flujo comercial navegable sin fingir infraestructura ni operacion real.
- Impacto: reiniciar conserva cambios ficticios y el reset explicito repone la semilla; cualquier persistencia real requiere otra tarea y autorizacion.

## SPORTEX-DEC-006 - Validación técnica y validación de producto son gates separados

- Fecha: 2026-08-03
- Estado: `VIGENTE`
- Decisión: el PASS técnico no implica aprobación de experiencia. La devolución
  de producto no falla el Core, la persistencia ni los contratos ya probados.
- Gate: `TASK-20260803-005` preserva funcionalidad y fixtures; no hay código de
  rediseño antes de que Fito apruebe el wireframe.

## SPORTEX-DEC-007 - CAMP-20260803-001 entrega la V1 Operativa por etapas

- Fecha: 2026-08-03
- Estado: `VIGENTE`
- Decisión: incorporar `DELTA-DEC-007/010/011` a la campaña existente. Etapa 0
  aprueba el recorrido completo de Operación, Marketing y Administración.
- Conversión objetivo: el Core idempotente vincula o crea Cliente y genera
  exactamente un Pedido al validar una seña; aún no está implementado.
- Gate: preservar Core, persistencia y 18 leads; aprobar el wireframe y luego
  autorizar el versionado pendiente antes de ampliar código o conexiones.
