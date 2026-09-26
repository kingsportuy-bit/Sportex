# Evidencia TASK-20260926-001 - Portabilidad del worktree

Fecha: 2026-09-26
Entorno de trabajo: DOCUMENTACION
Rama: `sportex-governance-20260801`
Runtime objetivo preservado: `PILOTO_DELTA`

## Problema reproducido

El arranque fallaba en la segunda PC porque comparaba el Git root real con una
ruta absoluta persistida por la PC principal. La rama, el remote y el contenido
del repositorio eran correctos.

## Cambio

- `git.worktree` pasa a ser `.` relativo al Git root.
- `git.projectRoot` identifica `platform/` dentro del repositorio.
- El guard valida ubicacion relativa, rama y remote, sin depender del usuario,
  unidad o directorio absoluto del equipo.
- El inventario de worktrees resuelve entradas relativas desde el Git root y
  conserva entradas absolutas historicas como evidencia local.

## Validacion

- Integridad de texto: PASS.
- Pruebas focales de workflow y worktrees: 17/17 PASS.
- Regresion con repositorio temporal ubicado en otra ruta: PASS.
- `SPORTEX_SYNC=PASS`.
- `SPORTEX_CONTEXT=PASS`, intencion `documentation`, `WORKTREE=.` y rama
  `sportex-governance-20260801`.
- Cierre documental: registrado por `SPORTEX_CLOSE=PASS`.

## Limites

- Sin cambios de contratos funcionales, Core de negocio o producto.
- Sin cambios de migraciones, despliegues, integraciones ni runtime.
- Sin operacion de PILOTO_DELTA, PRODUCCION_COMERCIAL o servicios reales.

## Rollback

Revertir solamente los cambios de esta tarea en el guard, pruebas y fuentes
documentales. El estado operativo de PILOTO_DELTA no forma parte del rollback.
