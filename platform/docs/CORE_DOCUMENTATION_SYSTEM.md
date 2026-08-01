# Sistema documental del Core SPORTEX

## Componentes

- Estado canonico: `state/PROJECT_STATE.json`.
- Registro documental: `state/DOCUMENT_REGISTRY.json`.
- Contratos de tarea: `TASKS/active`, `queued` y `closed`.
- Generador: `scripts/documentation/generate-documentation-views.mjs`.
- Vistas: `SESSION_STATE.md`, `TASKS/INDEX.md` y
  `generated/CURRENT_CONTEXT.md`.
- Validadores: estructura, tareas, guia, links, encoding y contexto.

## Regla de escritura

Las vistas generadas no se editan. Para cambiar el estado se actualiza el JSON
canonico o la tarea, se regenera y se valida.

## Regla de continuidad

Antes de compactacion, cambio de computadora o fin de una tarea larga:

1. actualizar `PROJECT_STATE.json`;
2. actualizar tarea y evidencia;
3. ejecutar `npm run generate-docs`;
4. ejecutar `npm run validate-docs`;
5. dejar commit y estado Git identificables.

Si el chat contradice el estado canonico, se detiene la mutacion y se resuelve
la diferencia con evidencia.

## Contexto focal

`DOCUMENT_REGISTRY.json` define autoridad, owner, intenciones y presupuesto. El
router carga fuentes vigentes, no historia completa. Ampliar el presupuesto no
es un atajo: requiere justificar por que no puede resolverse la duplicacion.
