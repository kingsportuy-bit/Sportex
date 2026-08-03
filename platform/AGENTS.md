# Reglas de agentes SPORTEX

## Objetivo

Permitir que Codex u otro agente trabaje sobre SPORTEX sin depender de la
memoria del chat y sin mezclar producto, codigo, runtime ni evidencia.

Fito es owner de producto. DELTA define necesidades y prioridades del piloto;
SPORTEX mantiene su propia fuente de verdad tecnica, tareas, Git y releases.

## Entrada obligatoria

Antes de analizar, editar u operar:

1. leer `docs/INICIAL.md`;
2. declarar `DOCUMENTACION`, `DESARROLLO_LOCAL`, `PILOTO_DELTA` o
   `PRODUCCION_COMERCIAL`;
3. inferir la intencion indicada en `docs/MODOS_DE_TRABAJO.md`;
4. ejecutar `npm run scan:text`;
5. ejecutar `npm run context -- <intencion>`;
6. exigir `SPORTEX_CONTEXT=PASS` y leer todos los archivos bajo `READ:`;
7. confirmar campaña, tarea, objetivo, alcance, entorno, riesgos, worktree,
   rama y proxima accion informados por el comando;
8. ejecutar un preflight focal antes de la primera accion con riesgo.

Fito no necesita escribir `lee INICIAL.md`, recordar el ID vigente ni explicar
lo ocurrido en otros hilos. Si el contexto devuelve `SPORTEX_WORKFLOW=FAIL`, no
se hacen cambios materiales. Si las fuentes son coherentes y solamente las
vistas estan desactualizadas, ejecutar `npm run workflow:sync`; una
contradiccion semantica debe corregirse dentro de una tarea.

La guia maestra es `docs/GUIA_TRABAJO_DESARROLLO_SPORTEX.md`.

## Contrato de trabajo

- Todo cambio material requiere una tarea aprobada en `docs/TASKS/active/`.
- Solo puede existir una tarea activa.
- Las tareas bloqueadas o futuras viven en `docs/TASKS/queued/`.
- Las tareas cerradas viven en `docs/TASKS/closed/<anio>/`.
- Una consulta `guidance` es read-only y no crea una tarea.
- Si el pedido contradice la tarea activa, el agente informa el conflicto antes
  de cambiar prioridad o ampliar el alcance.
- No se declara un modulo listo sin evidencia verificable.
- Cada cambio material actualiza tarea, `PROJECT_STATE.json`, decisiones,
  evidencia y los contratos o fichas afectados.
- `CAMPAIGN_STATE.json`, `SESSION_STATE.md`, `TASKS/INDEX.md`,
  `CURRENT_CONTEXT.md` y `errors/index.json` son vistas generadas.

## Arquitectura bloqueante

- Una empresa es una marca; SPORTEX no modela sucursales.
- Todo dato operativo pertenece a un `tenant_id` o `empresa_id`.
- El Core es la autoridad de reglas, estados, permisos y transiciones.
- El frontend presenta y solicita comandos; no decide negocio ni escribe en DB.
- WhatsApp y Evolution son adaptadores; no son la fuente de verdad.
- La IA propone hechos; el Core valida antes de cualquier efecto sensible.
- Seguridad, auditoria, idempotencia y observabilidad son transversales.
- Cada responsabilidad ejecutable tiene owner, contrato, tests y rollback.

## Entornos y autorizaciones

`PILOTO_DELTA` reemplaza el STAGING separado: es el sistema real usado por
Delta mientras se construye y valida. Por contener potencialmente datos y
operaciones reales, se gobierna con controles de produccion.

Ninguna tarea, test o estado documental autoriza por si solo:

- desplegar o cambiar `PILOTO_DELTA`;
- enviar mensajes reales;
- ejecutar migraciones o mutaciones remotas;
- activar costos, automatizaciones o integraciones;
- habilitar `PRODUCCION_COMERCIAL`.

Cada accion remota exige permiso explicito de Fito, alcance exacto, version,
preflight, rollback y explicacion previa. `PRODUCCION_COMERCIAL` requiere un GO
nuevo y especifico de salida al mercado.

## Validacion y cierre

Antes de cerrar una tarea:

1. ejecutar validaciones focales y generales aplicables;
2. actualizar contratos y fichas afectadas;
3. actualizar `docs/state/PROJECT_STATE.json`;
4. regenerar vistas con `npm run workflow:sync`;
5. registrar migraciones, pruebas, despliegues, integraciones, datos sensibles,
   ultima evidencia y pendientes en el estado canonico;
6. ejecutar `npm run validate` y las pruebas focales aplicables;
7. registrar evidencia y deuda restante;
8. ejecutar `npm run workflow:close -- <TASK-ID>`;
9. no declarar el checkpoint terminado sin `SPORTEX_CLOSE=PASS`;
10. dejar Git versionado y publicado solamente si la tarea lo exige.

Para una consulta sin cambios, ejecutar `npm run workflow:check` antes de la
respuesta final. Un cierre es un checkpoint y puede mantener la tarea activa;
cerrar una tarea exige ademas moverla y sincronizar el estado.

Un PASS local o un healthcheck no prueban por si solos una capacidad de negocio.

## Subagentes

Solo se usan cuando Fito o la tarea lo autorizan explicitamente. El agente
principal conserva la responsabilidad de decidir, editar, validar y cerrar.
