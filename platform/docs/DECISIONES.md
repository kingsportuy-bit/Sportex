# Decisiones tecnicas vigentes de SPORTEX

Registro durable; las decisiones reemplazadas se marcan y el negocio queda en DELTA.

## SPORTEX-DEC-001 - Fuente canonica unica y vistas derivadas

- 2026-08-02 · `VIGENTE`. `docs/state/PROJECT_STATE.json` es la única fuente
  del contexto vivo; las vistas generadas no se editan y el workflow bloquea
  si están desactualizadas o contradicen tareas/estado.

## SPORTEX-DEC-002 - Cierre proporcional al desarrollo de software

- Fecha: 2026-08-02
- Estado: `VIGENTE`
- Decision: un checkpoint material exige tarea, estado, decision, evidencia y
  pendientes. La suite se elige entre `docs`, `local` y `pilot-release` segun
  tipo de tarea y archivos; puede escalar, nunca degradar el riesgo inferido.
- Motivo: un proyecto de software necesita probar tanto la continuidad
  documental como la ausencia de regresiones de codigo.
- Impacto: un PASS local no certifica runtime ni concede permiso de migracion,
  deploy, integracion, mensajes o uso de datos reales.

## SPORTEX-DEC-003 - La campaña comercial no se abre implicitamente

- Fecha: 2026-08-02
- Estado: `REEMPLAZADA_POR_SPORTEX_DEC_004`
- Registro: inicialmente la campaña no se abrió implícitamente; Fito la inició
  después de instalar el OS. `SPORTEX-DEC-004` gobierna el estado vigente.

## SPORTEX-DEC-004 - Primera vertical comercial local y sin efectos externos

- Fecha: 2026-08-02
- Estado: `VIGENTE`
- Decisión: `CAMP-20260803-001` comienza con conversación, atribución, Lead,
  Oportunidad, etapa y próxima acción sobre datos ficticios locales.
- Atribución: `META_EXACTO` exige `externalAdReply.sourceId`; si falta, el Core
  registra `DESCONOCIDO` sin inferir.
- Límite: sin webhooks, datos reales, mensajes, migraciones, deploy ni piloto.

## SPORTEX-DEC-005 - Persistencia CRM local de fixtures gobernada por el Core

- Fecha: 2026-08-03
- Estado: `VIGENTE`
- Decisión: 18 expedientes ficticios persisten en JSON local atómico y aislado;
  etapas, versiones, próxima acción, seguimientos y reset pertenecen al Core.
- Guard: solo `development|test + memory + SPORTEX_DEV_AUTH=true`; corrupción
  falla cerrada. `SEÑA_VALIDADA` no certifica pagos ni crea pedidos reales.

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
- Decisión: `DELTA-DEC-007/010/011` gobiernan la V1 por etapas. La conversión
  objetivo es `SEÑA_VALIDADA -> Cliente + exactamente un Pedido`, idempotente.
- Gate: preservar Core, persistencia y 18 leads; conexiones requieren otro GO.

## SPORTEX-DEC-008 - Tableros primero para Leads y Pedidos

- Fecha: 2026-08-03
- Estado: `VIGENTE`
- Fuente: `DELTA-DEC-012`.
- Decisión: `Leads` y `Pedidos` abren en tableros por etapas; una tarjeta abre
  conversación y ficha. `Clientes` enlaza historias, oportunidades y pedidos.
- Gate: preservar 18 leads y agregar 6 clientes y 8 pedidos relacionados.
- Estado: PASS técnico preservado; producto no aprobado y sin autorizar código.

## SPORTEX-DEC-009 - WhatsApp es una superficie operativa separada

- Fecha: 2026-08-13
- Estado: `VIGENTE`
- Decisión: SPORTEX será un tercer cliente sincronizado de WhatsApp. `WhatsApp`
  muestra chats; `Leads` y `Pedidos` conservan tableros distintos; `Clientes`
  enlaza la historia sin duplicarla.
- Primer corte: `conversación -> contexto -> próxima acción -> evidencia`, con
  control humano. El Core conserva reglas, permisos, cálculos e idempotencia.
- Límite: local y ficticio; Evolution, datos, mensajes y deploy requieren GO remoto.

## SPORTEX-DEC-010 - Integración del WhatsApp de Delta

- Fecha: 2026-08-14
- Estado: `VIGENTE`
- Decisión: reutilizar UI/Core y conectar Delta por gates; `SEÑA_VALIDADA` crea
  un Pedido único. Toda operación remota exige rollback y GO exacto.
- Evidencia: `TASK-20260814-001`.

## SPORTEX-DEC-011 - Mensajes y eventos separados; asistente solo compatible

- 2026-08-15 · `VIGENTE`. Mensajes y eventos se persisten separados; la API
  solo los reúne para lectura y la UI conserva burbujas y separadores.
- `ASSISTANT` es dato pasivo, sin ejecución. Ocultar la cronología no toca
  mensajes ni fuentes del Core.
- Imagenes manuales son assets privados tenant-aware; lectura es un cursor por
  actor/conversacion separado de receipts. Ambas capacidades quedan apagadas
  por defecto y no introducen IA.

## SPORTEX-DEC-012 - WhatsApp define el sistema visual transversal

- 2026-08-16 · `VIGENTE`. WhatsApp define jerarquía, superficies y estados de
  toda la aplicación mediante tokens claro/noche con contraste estable.
- SPORTEX y `#DCFF52` se conservan como marca y señal.

## SPORTEX-DEC-013 - Contexto compacto y selectores focales

- 2026-08-16 · `VIGENTE`. El estado vivo conserva como maximo cinco cambios;
  el historial restante vive en `docs/historico/PROJECT_HISTORY.json`.
- Biblioteca y errores se consultan con ranking OR y top acotado; una falta de
  coincidencia se explicita y no amplia silenciosamente el contexto.
- El router informa caracteres y tokens estimados. Ninguna optimizacion reduce
  gates de PILOTO_DELTA ni agrega una ronda de STAGING.

## SPORTEX-DEC-014 - Puesto operativo mínimo de Delta

- 2026-08-16 · `VIGENTE`. El próximo corte deja a Delta operar desde
  SPORTEX, no una demostración aislada: WhatsApp, Leads, Clientes y Pedidos
  forman una experiencia continua.
- Los tableros y tarjetas son proyecciones: el Core conserva las transiciones,
  permisos, versión, auditoría e idempotencia. El frontend nunca decide una
  regla ni escribe la base directamente.
- El origen de un contacto es `META_EXACTO` cuando el mensaje trae referencia
  verificable del anuncio, o `DESCONOCIDO` cuando no la trae; no se infiere.
- El flujo mínimo de pedido es `INGRESO -> BOCETO -> LISTO_PARA_PRODUCCION ->
  EN_PRODUCCION -> FINALIZADO`. Cada transición debe estar autorizada,
  persistida y auditada. El diseño conserva versiones y una sola vigente.

## SPORTEX-DEC-015 - Tableros configurables y lectura focal

- 2026-08-19 · `VIGENTE`. Leads y Pedidos usan columnas tenant-aware;
  renombrar, ordenar o borrar conserva reasignación y auditoría en Core.
- WhatsApp carga resumen y detalle por separado; sus cambios refrescan sólo el
  elemento afectado. El navegador no guarda conversaciones ni adjuntos.

## SPORTEX-DEC-016 - Leads administra; WhatsApp atiende

- 2026-08-19 · `VIGENTE`. `Leads` es el tablero Kanban de oportunidades; sus
  tarjetas abren una ficha administrativa, no el chat de WhatsApp.
- La ficha muestra el contexto comercial, el próximo paso, los últimos
  mensajes y una respuesta breve. El historial y la atención completa siguen
  en `WhatsApp` y se abren solamente mediante una acción explícita.
- La respuesta breve usa el mismo comando manual y el mismo outbox del Core;
  el frontend no decide etapas, permisos ni estados de envío.

## SPORTEX-DEC-017 - Tema oscuro único

- 2026-08-19 · `VIGENTE`. SPORTEX opera únicamente en modo oscuro; no expone
  selector, preferencia persistida ni ruta de retorno al tema claro.
- La interfaz fija el tema antes de cargar la app y las superficies oscuras usan
  grafito explícito cuando no deben depender de un token de texto.

## SPORTEX-DEC-018 - Cierre gobernado de worktrees

- 2026-08-20 · `VIGENTE`. Cada worktree físico se clasifica `INTEGRADO`,
  `PRESERVAR` o `BLOQUEADO`; un checkout no clasificado bloquea el cierre.
- El retiro automático se limita a `INTEGRADO`, limpio y contenido en la rama
  objetivo. No usa `--force`, no borra refs y poda por separado metadatos
  fantasma `prunable`.

## SPORTEX-DEC-019 - Preemption y reconciliacion obligatoria de hotfixes

- 2026-08-20 · `VIGENTE`. El diagnostico de incidentes comienza read-only; la
  primera mutacion exige una unica task incidente y pausa formal de la task
  material con snapshot completo, worktree `PRESERVAR` y candidato
  `STALE_AFTER_HOTFIX`.
- Recuperar el servicio deja `RECOVERED_RECONCILIATION_PENDING`. El cierre y
  la reanudacion requieren fix en Git canonico, rama/candidato actualizados y
  revalidacion local PASS.

## SPORTEX-DEC-020 - Evolucion explicita del modelo de entornos

- 2026-08-20 · `VIGENTE`. Hoy rige `PILOT_ONLY`: `PILOTO_DELTA` es produccion
  restringida y no existe STAGING separado.
- La aceptacion de la primera version usable no despliega ni migra. Requiere
  una task futura especifica para separar y certificar los entornos.
- Solo despues de esa transicion rige local -> STAGING -> artefacto certificado
  -> GO -> PRODUCCION y el gate `ENVIRONMENT_RECONCILIATION` exige STAGING.
