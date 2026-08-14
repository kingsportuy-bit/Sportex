# Evidencia — inventario y plan de integración real SPORTEX / DELTA

- Fecha: 2026-08-14
- Entorno: `DESARROLLO_LOCAL`
- Tarea: `TASK-20260814-001`
- Handoff: `SARA/HANDOFF-20260814-003`

## Conclusión

SPORTEX no parte de cero. Existen dos verticales locales separadas:

1. conversación, atribución, lead/oportunidad, etapa, próxima acción y seguimiento;
2. cliente, seña certificada y pedido idempotente con auditoría y outbox.

La implementación debe normalizar e integrar ambas, conservar las reglas y
tests que pasan y agregar persistencia e integraciones reales por gates.

## Inventario

La matriz completa vive en la task. Resumen:

- reutilizar: UI, fixtures, Core transaccional, idempotencia, autorización,
  auditoría, outbox base, atribución y seguimientos;
- adaptar: modelo comercial agregado, persistencia, Cliente/Contacto, API,
  eventos, auth y migraciones;
- falta: Evolution real, workers, backfill, receipts, Meta lectura, múltiples
  oportunidades, asistencia registrada, proceso mínimo y piloto real.

## Riesgo principal

Crear varias historias incompatibles entre Evolution, Chatwoot, captura
provisional y SPORTEX. La defensa es una única historia operativa normalizada en
SPORTEX, con evidencia externa inmutable, idempotencia y captura pasiva antes de
outbound.

## Próxima prueba

Gate 1: demostrar localmente el recorrido completo con fixtures y persistencia
objetivo, incluyendo aislamiento tenant y creación única de Cliente/Pedido a
partir de una seña validada.

## Acciones no ejecutadas

- No se accedió a Evolution, Meta, Chatwoot, VPS, Supabase remoto ni datos reales.
- No se desplegó ni migró.
- No se enviaron mensajes.

## Checkpoint ejecutado — Gate 1A

Se cerró la primera brecha integrada sin reconstruir el Core:

`Conversación -> Oportunidad con seña validada -> Cliente -> Pago certificado -> Pedido`

Evidencia observable:

- endpoint local `convert-to-order` gobernado por etapa, versión y permisos;
- claves idempotentes estables por oportunidad para Cliente, Pago y Pedido;
- proyección `coreConversion` en la ficha y evento `ORDER_CREATED`;
- acción y resultado visibles dentro de Detalles de WhatsApp sin ocultar el chat;
- prueba de navegador: `SPX-2026-00001`, $ 10.000 de seña, $ 112.320 total,
  1 Cliente y 1 Pedido sobre fixtures locales;
- Core `27/27` PASS, incluido reintento sin duplicación y fail-closed sin seña.

El checkpoint prueba integración local. No prueba Evolution, persistencia remota,
datos reales, captura pasiva ni envío.

## Checkpoint ejecutado — Gate 1B

- Contacto se separó de Conversación, Lead y Oportunidad con relaciones explícitas.
- La migración aditiva `20260814_002` define cinco tablas comerciales normalizadas.
- Todas aplican aislamiento por tenant, RLS forzado, permisos mínimos y down migration.
- `validate-sql`: 14 tablas PASS. La migración permanece local y no ejecutada.

## Checkpoint ejecutado — Gate 1C

- Se implementó el store PostgreSQL comercial sobre las cinco tablas nuevas y
  la idempotencia canónica del Core.
- La migración conserva el `workspace_id` que consume la interfaz y aplica RLS
  forzado a las 14 tablas totales.
- Ensayo aislado PostgreSQL 16:
  - Core `up`: PASS;
  - comercial `up`: PASS;
  - comercial `down`: 0 tablas restantes;
  - reaplicación: 5 tablas comerciales;
  - rollback con datos: 0 tablas restantes.
- Ensayo funcional: dos tenants conservaron un expediente cada uno; repetir el
  mismo mensaje devolvió replay sin crear un segundo expediente.
- Core `28/28` PASS. PostgreSQL expone solo la lectura de la proyección; replay,
  reset y mutaciones locales continúan bloqueados fuera de desarrollo seguro.
- El contenedor temporal verificado fue eliminado. No se tocó ninguna base,
  integración o dato remoto.

## Checkpoint ejecutado — Gate 2A

- Adaptador local Evolution: mensajes en ambos sentidos y receipts normalizados.
- Journal: deduplicación tenant/evento, orden por `occurredAt`, mezcla controlada
  de backfill y live simulado, cuarentena y reanudación del worker.
- Transporte falso: outbound apagado por defecto, confirmación humana,
  idempotencia y receipts monotónicos (`SENT -> DELIVERED -> READ`).
- Core `32/32` PASS.
- Sigue faltando persistencia durable del journal/outbox y proyección integrada;
  no se creó webhook, no se consultó Evolution y no se envió ningún mensaje.

## Checkpoint ejecutado — Gate 2B

- Migración `20260814_003`: journal y outbox WhatsApp, RLS forzado y rollback.
- Ensayo PostgreSQL 16 con 16 tablas: PASS.
- Journal: persist-before-process, dedupe, backfill, ordering, cuarentena,
  reanudación y aislamiento entre dos tenants: PASS.
- Worker sin servidor/UI: proyectó backfill, inbound y outbound en una única
  conversación ordenada: PASS.
- Outbox: confirmación, kill switch, idempotencia, transporte falso y receipts
  monotónicos: PASS.
- Rollback con datos: 0 tablas comerciales/WhatsApp restantes; 9 tablas Core
  preservadas.
- Core `34/34` PASS. Los contenedores temporales verificados fueron eliminados.
- No hubo acceso a Evolution, Supabase remoto, Meta, VPS, datos ni mensajes reales.

## Checkpoint ejecutado — Gate 3A

- La interfaz local permite escribir y enviar un mensaje manual simulado desde
  el compositor de la conversación seleccionada.
- El recorrido observado fue
  `UI -> API local -> outbox falso -> transporte Evolution simulado -> journal -> worker -> proyección comercial -> UI`.
- El mensaje de prueba quedó visible como salida de Delta tanto en la lista de
  conversaciones como dentro del hilo.
- Detalles se abrió dentro del puesto operativo y el compositor continuó
  habilitado, por lo que el operador conserva contexto y capacidad de respuesta.
- La prueba visual detectó y corrigió compatibilidad con un JSON persistente
  anterior que no contenía Contacto separado; ahora se hidrata solo desde las
  referencias ficticias de la conversación.
- Core `34/34` PASS y typecheck PASS.
- No hubo webhook, conexión Evolution, dato real, outbound, deploy ni migración remota.

## Checkpoint ejecutado — Gate 3B

- Recorrido local observado:
  `seña validada -> Cliente/Pago/Pedido -> Entregar a producción -> Listo para producción`.
- El comando Core exige `production.release`, confirmación exacta, versión e
  idempotencia; emite auditoría y outbox `order.production_released`.
- La proyección comercial conserva `orderVersion`, actor y momento de entrega,
  incrementa la versión y registra `PRODUCTION_RELEASED`.
- Browser oscuro: Detalles permitió ejecutar la acción sin perder el chat; la
  lista Pedidos mostró `Listo para producción` con contraste corregido.
- PostgreSQL 16 efímero: migraciones `001/002/003/004` PASS; pedido de prueba
  `production_ready:2`; rollback `004` conservó la fila como
  `intake_pending:3` y rechazó volver a escribir el estado nuevo.
- Core `34/34`, validación SQL y typecheck PASS.
- Hallazgo no oculto: tras reiniciar solo la demo local, el JSON comercial puede
  conservar la conversión mientras el Core en memoria se reinicia. Esto no
  invalida el E2E de una misma ejecución, pero es una prueba obligatoria de
  consistencia para el store PostgreSQL antes de conexión real.
- No se accedió a Evolution, Supabase remoto, Meta, VPS, datos reales ni se
  enviaron mensajes o ejecutaron migraciones remotas.

## Checkpoint ejecutado — Gate 4 local + inventario remoto read-only

### Verdad remota observada

- VPS `codexa`: Docker Swarm activo.
- Evolution productivo: version `2.3.7`; instancia `DELTA` en estado `open`;
  webhook no configurado.
- SPORTEX legado: servicio `sportex_sportex` en `0/1` y artefacto antiguo.
- SPORTEX STAGING: `sportex_staging_core` en `1/1`, imagen
  `sportex-staging:ea02fc0`; no representa el candidato actual.
- Repositorio del VPS: `/opt/sportex` en `a62e5edb...`, limpio pero atrasado.
- Supabase STAGING: 9 tablas `sportex_staging_*` base con RLS forzado; faltan
  las 7 tablas de migraciones `002/003` y el constraint `004`.
- No se encontro evidencia de backup SPORTEX en las ubicaciones operativas
  inspeccionadas. Antes de toda migracion se exige backup nuevo y restauracion
  verificable.

La inspeccion fue de metadatos y conteos. No se copiaron conversaciones, PII,
credenciales ni valores de secretos; no hubo escritura, restart ni deploy.

### Candidato implementado localmente

- `EvolutionWebhookAdapter`: `messages.upsert` y `messages.update`, instancia
  exacta `DELTA`, texto individual, LID solo con alternativa telefonica segura,
  grupos/medios fuera de alcance, IDs deterministas y metadata minimizada.
- `POST /v1/webhooks/evolution`: secreto dedicado en header, tenant/actor
  vinculados en servidor, journal durable antes de proyeccion y respuesta
  idempotente.
- Proyeccion LIVE: Contacto, Conversacion, Lead y Oportunidad reales ya no se
  marcan como fixtures; inbound y outbound manual externo comparten historia.
- Workspace real: lectura, clasificacion no sensible, proxima accion y
  seguimiento. `SENA_VALIDADA` real continua bloqueada.
- Transporte manual: endpoint Evolution v2 `sendText`, payload `{number,text}`,
  API key solo en header, confirmacion `ENVIAR_A_WHATSAPP`, permiso, outbox e
  idempotencia. La bandera de outbound permanece `false` por defecto.
- Frontend: carga `commercialWorkspaceEnabled` tambien en STAGING; habilita el
  compositor real solo cuando el servidor publica outbound activo.

### Validacion

- Core: `41/41` PASS.
- TypeScript check/build: PASS.
- SQL: 16 tablas objetivo, RLS forzado y rollback: PASS.
- Browser local oscuro: 18 conversaciones, pestanas, chat, Detalles y compositor
  visibles a la vez; sin overflow horizontal ni errores de consola.
- `git diff --check` y NUL scan: PASS.

### Frontera pendiente

La preparacion local no equivale a conexion real. El proximo GO remoto debe
autorizar exactamente: crear backup y probar restore, aplicar `002/003/004`,
desplegar el artefacto exacto a `sportex_staging_core`, crear/montar secretos,
configurar el webhook de `DELTA` y observar captura pasiva. El outbound debe
permanecer `false`; su canary requiere un GO posterior y un destinatario exacto.
