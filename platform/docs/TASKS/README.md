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
- `updated_at`: fecha del ultimo checkpoint material;
- objetivo, alcance permitido/prohibido, entradas, salidas, validacion,
  evidencia, rollback, deuda restante, registro de avances y decisiones.

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
- Cada checkpoint material debe ser la primera entrada de `recentChanges`,
  coincidir con `updatedBy` y `latestEvidence`, y cerrar con
  `SPORTEX_CLOSE=PASS`.
- `recentChanges` conserva hasta cinco checkpoints; antes de excederlos usar
  `npm run history:compact`. El resto queda en
  `docs/historico/PROJECT_HISTORY.json`.

## Git y worktrees

- El repositorio Git es la fuente; una copia manual no crea otra verdad.
- Ejecutar `npm run task:doctor` antes de abrir trabajo nuevo.
- Antes del cierre, `npm run worktree:check` exige clasificación completa.
- `npm run worktree:close` retira sólo worktrees `INTEGRADO`, limpios y ya
  contenidos en la rama objetivo; `PRESERVAR` y `BLOQUEADO` quedan intactos.
- Obtener el siguiente ID con `npm run task:next-id`.
- Cada release usa commit remoto y scope explicito.

## Cierre de checkpoint

```powershell
npm run workflow:close -- TASK-AAAAMMDD-NNN --profile=auto
```

La tarea puede seguir activa despues del checkpoint. Cuando el objetivo este
cumplido, se mueve a `closed/<anio>/`, `currentTask` pasa a `null`, se registra
la siguiente accion y se ejecuta el mismo cierre.
