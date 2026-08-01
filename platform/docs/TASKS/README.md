# Tareas SPORTEX

## Ciclo de vida

- `active/`: exactamente una tarea `approved` o `in_progress`, o ninguna.
- `queued/`: tareas `draft`, `blocked` o `review`.
- `closed/<anio>/`: tareas `done` con evidencia y deuda explicita.

`INDEX.md` es una vista generada. No se edita manualmente.

## Campos obligatorios

- `id`, `owner`, `requester`, `estado`, `lifecycle`;
- `work_type`: `fix`, `feature`, `operacion` o `documentacion`;
- `campaign`: `none` o ID;
- `context_focus`;
- `development_guide_impact`: `required` o `none`;
- objetivo, alcance permitido/prohibido, entradas, salidas, validacion,
  evidencia, rollback y deuda restante.

## Reglas

- Sin tarea activa no se ejecuta un cambio material.
- Solo existe una tarea activa global.
- `guidance` no crea ni modifica tareas.
- Una tarea incompatible no se reemplaza sin explicar el conflicto.
- `done` exige evidencia verificable; no significa necesariamente deploy.
- Una tarea bloqueada vuelve a la cola con causa y siguiente decision.
- Cambiar el sistema de desarrollo exige
  `development_guide_impact: required` y actualizar la guia maestra.
- La tarea no autoriza runtime; las operaciones reales requieren un GO aparte.

## Git y worktrees

- El repositorio Git es la fuente; una copia manual no crea otra verdad.
- Ejecutar `npm run task:doctor` antes de abrir trabajo nuevo.
- Obtener el siguiente ID con `npm run task:next-id`.
- Cada release usa commit remoto y scope explicito.
