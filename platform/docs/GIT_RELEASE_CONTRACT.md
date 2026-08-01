# Contrato Git y releases SPORTEX

## Fuente canonica

El repositorio Git remoto es la fuente de codigo y contratos. Un worktree es
una carpeta del mismo repositorio; una copia manual no crea una segunda verdad.

## Reglas

- Cada cambio material pertenece a una tarea y rama identificables.
- No se borran ni revierten cambios ajenos para limpiar un worktree.
- El siguiente ID de tarea se obtiene con `npm run task:next-id`.
- Antes de abrir trabajo, `npm run task:doctor` muestra ramas y worktrees.
- Un release usa un commit remoto y un scope explicito.
- El artefacto se construye desde `git archive` o mecanismo equivalente del
  commit aprobado, nunca desde archivos locales sueltos.
- Evidencia, migraciones y rollback pertenecen a esa misma version.

## Ramas actuales

La rama de gobernanza nace de `sportex-task007-staging` para preservar el Core
y frontend ya versionados. El nombre historico de esa rama no define el entorno
objetivo.

La integracion a `main` se decide en una tarea propia despues de revisar el
alcance y no implica deploy automatico.

## Release

`scripts/release-governance-guard.ps1` verifica commit, remoto, scope, limpieza
y la aprobacion exacta de Fito. `scripts/new-release-bundle.ps1` crea un bundle
inmutable. Ninguno despliega por si mismo.

`PILOTO_DELTA` y `PRODUCCION_COMERCIAL` son gates distintos. La evidencia del
piloto puede ser requisito, pero nunca permiso automatico para salir al mercado.
