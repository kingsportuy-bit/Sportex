# Primera vertical comercial local de SPORTEX

id: TASK-20260803-001
owner: Codex
requester: Fito
estado: done
lifecycle: closed
completion_kind: local_vertical_usable
work_type: feature
campaign: CAMP-20260803-001
context_focus: feature
development_guide_impact: required
updated_at: 2026-08-02

## objetivo

Entregar una primera vertical utilizable en `DESARROLLO_LOCAL` que transforme
un evento ficticio estilo Evolution en conversación normalizada, atribución
`META_EXACTO` o `DESCONOCIDO`, lead, oportunidad, etapa comercial y próxima
acción visibles, sin conectar canales, datos ni infraestructura reales.

## alcance_permitido

- abrir la campaña técnica `CAMP-20260803-001`;
- reconciliar el handoff funcional aprobado en DELTA con los contratos y el
  estado implementado de SPORTEX;
- definir el contrato mínimo de conversación, atribución, lead y oportunidad;
- implementar replay local en memoria con fixtures ficticios;
- exponer comandos y consultas locales mediante API del Core;
- mostrar etapa y próxima acción en la superficie web local;
- probar atribución exacta, origen desconocido, deduplicación, permisos,
  aislamiento por tenant y regresiones;
- actualizar tareas, estado, decisiones, contratos, fichas y evidencia.

## alcance_prohibido

- datos, teléfonos, conversaciones, IDs publicitarios o credenciales reales;
- configurar o consultar Evolution, Meta, Chatwoot, Supabase o VPS;
- enviar mensajes o ejecutar efectos externos;
- IA, cotizaciones, pagos, pedidos, producción o automatización comercial;
- migraciones PostgreSQL, `PILOTO_DELTA`, deploy o `PRODUCCION_COMERCIAL`;
- modificar el legado de la raíz, otras ramas o el handoff fuente de DELTA;
- commit, push o apertura de una tarea posterior.

## entradas

- `DELTA-20260801-002` y `DELTA-DEC-007`;
- `negocio/procesos/campana-sportex-sistema-comercial-asistido.md`;
- `negocio/procesos/handoff-sportex-inteligencia-conversacional.md`;
- contratos rectores, estado y módulos vigentes de SPORTEX;
- autorización explícita de Fito para `DOCUMENTACION` y
  `DESARROLLO_LOCAL` únicamente.

## salidas

- campaña técnica activa y estado canónico reconciliado;
- contrato mínimo de la primera vertical;
- replay local seguro de dos eventos ficticios;
- proyección comercial consultable por API;
- mesa comercial local con atribución, etapa y próxima acción visibles;
- pruebas, evidencia, deuda restante y siguiente acción documentadas.

## validacion

- un evento con `externalAdReply.sourceId` conserva el `ad_id` exacto;
- un evento sin evidencia publicitaria queda `DESCONOCIDO` sin inferencias;
- repetir el mismo `provider_message_id` no duplica mensaje, conversación,
  lead ni oportunidad;
- tenant y capacidades se resuelven desde contexto confiable;
- replay disponible solo en `development` o `test`, con store en memoria y
  autenticación de desarrollo;
- la web muestra conversación, origen, lead, oportunidad, etapa `NUEVO` y
  próxima acción;
- pruebas focales, `npm run validate`, QA visual y `SPORTEX_CLOSE=PASS`.

## evidencia

- `docs/evidencias/TASK-20260803-001_PRIMERA_VERTICAL_COMERCIAL_LOCAL.md`;
- resultados reproducibles de pruebas de servicio, API y navegador local.

## rollback

Revertir solamente los contratos, código, frontend, pruebas, tarea, estado y
vistas enumerados por este expediente. Detener el proceso local elimina todos
los datos del replay porque el store es efímero. No existe rollback remoto.

## deuda_restante

- persistencia PostgreSQL y migraciones quedan fuera de esta tarea;
- no existe integración real con Evolution, Meta o Chatwoot;
- no se implementan IA, respuesta, cotización, seguimiento programado ni
  resultados comerciales;
- la siguiente tarea requiere autorización nueva de Fito.

## registro_de_avances

### 2026-08-02 - vertical local validada

- El Core normaliza eventos ficticios estilo Evolution y crea una proyección
  tenant-aware de conversación, atribución, lead y oportunidad.
- `META_EXACTO` conserva el `ad_id`; la ausencia de evidencia queda
  `DESCONOCIDO` con campos publicitarios nulos.
- El mismo `providerMessageId` no duplica entidades y una clave HTTP reutilizada
  con otro payload falla por conflicto.
- La API local queda ausente fuera de `development|test + memory + dev auth`.
- La mesa comercial carga ambos fixtures y muestra `NUEVO` y la próxima acción.
- QA visual: escritorio y móvil sin overflow, 2 tarjetas visibles, métricas
  `02/01/01/02` y cero errores o warnings del navegador.
- `npm run validate` pasó: workflow 8/8, documentación full, TypeScript,
  Core 20/20, SQL estático y build.
- El cierre detectó primero el presupuesto `guidance` excedido por 141 y luego
  por 3 caracteres. Se compactó la misma regla sin subir el presupuesto; el
  cierre final devolvió `SPORTEX_CLOSE=PASS`.
- El demo se detuvo al terminar y `127.0.0.1:8080` quedó libre.

### 2026-08-02 - apertura y preflight

- `SPORTEX_CONTEXT=PASS` para intención `feature`.
- `task:doctor` confirmó cero tareas activas y asignó `TASK-20260803-001`.
- Se leyeron el handoff DELTA, los contratos rectores, módulos, superficies y
  el código real vigente antes de editar.
- No se accedió a datos sensibles ni sistemas externos.

## decisiones

- `SPORTEX-DEC-004`: abrir la campaña con una vertical local, efímera y sin
  efectos externos.
- La primera etapa visible será `NUEVO`; la próxima acción inicial será revisar
  la conversación y calificar la consulta.
- `META_EXACTO` requiere `externalAdReply.sourceId`; sin esa evidencia el
  origen es `DESCONOCIDO`.

## cierre

- Resultado: primera vertical comercial utilizable en desarrollo local.
- Campaña activa: `CAMP-20260803-001`.
- Tarea activa siguiente: ninguna.
- Próxima acción: esperar autorización explícita de Fito antes de abrir otra
  tarea de la campaña.
