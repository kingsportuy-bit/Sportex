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
3. resolver la intencion indicada en `docs/MODOS_DE_TRABAJO.md`;
4. ejecutar `npm run scan:text`;
5. leer `docs/state/PROJECT_STATE.json` y las vistas generadas;
6. leer la tarea activa cuando el modo la requiera;
7. cargar solo los contratos seleccionados por la intencion;
8. ejecutar un preflight focal antes de la primera accion con riesgo.

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
4. regenerar vistas con `npm run generate-docs`;
5. ejecutar `npm run validate-docs` y los tests de producto aplicables;
6. registrar evidencia y deuda restante;
7. dejar Git versionado y publicado si la tarea lo exige.

Un PASS local o un healthcheck no prueban por si solos una capacidad de negocio.

## Subagentes

Solo se usan cuando Fito o la tarea lo autorizan explicitamente. El agente
principal conserva la responsabilidad de decidir, editar, validar y cerrar.
