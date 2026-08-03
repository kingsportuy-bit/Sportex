# Decisiones tecnicas vigentes de SPORTEX

Este registro conserva decisiones durables del sistema de desarrollo. Una
tarea referencia sus IDs; si una decision cambia, se agrega otra y la anterior
se marca como `REEMPLAZADA`. Las decisiones de negocio permanecen en DELTA.

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
