# Contrato de cierre de worktrees SPORTEX

## Objetivo

Todo worktree físico del repositorio debe quedar clasificado antes de cerrar un
checkpoint. La clasificación vive en
`docs/state/WORKTREE_CLASSIFICATIONS.json` y usa solamente:

- `INTEGRADO`: su `HEAD` está contenido en la rama objetivo y no tiene cambios;
- `PRESERVAR`: sigue siendo una fuente o checkout intencional;
- `BLOQUEADO`: contiene trabajo exclusivo, cambios locales o una duda que impide retirarlo.

## Gate de cierre

`npm run worktree:check` falla si encuentra un worktree físico sin clasificar,
si un `INTEGRADO` está sucio o si su commit no pertenece a la rama objetivo.
Los registros fantasma se informan como `prunable`, pero no se confunden con
un directorio físico.

`npm run workflow:close` ejecuta este gate antes de declarar
`SPORTEX_CLOSE=PASS`.

## Retiro seguro

`npm run worktree:close` retira automáticamente únicamente worktrees físicos
clasificados `INTEGRADO`, limpios y contenidos en la rama objetivo. Nunca usa
`--force`, no borra ramas ni refs y no retira el checkout desde el que se
ejecuta. Después de cada retiro verifica que ningún `PRESERVAR` o `BLOQUEADO`
haya cambiado y se detiene si detecta una dependencia compartida. Al final
poda metadatos `prunable`.

`PRESERVAR` y `BLOQUEADO` permanecen intactos. Un cambio exclusivo se commitea,
se integra o se mantiene bloqueado; nunca se descarta para limpiar.

## Evidencia

El cierre registra el inventario final, la rama objetivo y
`WORKTREE_CLOSE=PASS`. Las limitaciones de sandbox o `EPERM` se distinguen de
una falla del repositorio.
