# Evidencia TASK-20260801-001 - Sistema de desarrollo SPORTEX

Fecha: 2026-08-01.

## Fuente estudiada

- BARBEROX fue auditado read-only desde
  `C:\Users\Fito\Documents\CODEX\BARBEROX`.
- Scan anti-NUL: PASS.
- Validacion documental BARBEROX `fast`: PASS.
- Validacion documental BARBEROX `full`: PASS.
- Se separo el nucleo reutilizable de contratos propios de barberias, n8n,
  despliegues y runtime BARBEROX.

## Repositorio y consolidacion

- `DELTA\sportex` era una copia sin Git de `sportex-rebuild\platform`.
- Los 125 archivos fuente coincidian; la copia manual agregaba 30 builds
  locales bajo `core/dist*`.
- Fuente previa: worktree limpio `sportex-rebuild`, rama remota
  `sportex-task007-staging`, commit `ea02fc0`.
- Nuevo worktree independiente:
  `C:\Users\Fito\Documents\CODEX\SPORTEX`.
- Rama de migracion: `sportex-governance-20260801`.
- No se borraron ni movieron las carpetas anteriores.

## Sistema instalado

- entrada unica y guia maestra;
- estado canonico `PROJECT_STATE.json`;
- registro documental y presupuestos de contexto;
- vistas de sesion, contexto, tareas y errores generadas;
- ciclo `active/queued/closed` y una tarea activa como maximo;
- Biblioteca con contrato comun de modulos;
- router por intencion y modo guidance read-only;
- scan de integridad, validador documental, consistencia de tareas y sync de
  guia;
- doctor de ramas/worktrees e ID global de tareas;
- gates de release por task, commit remoto, scope, GO, bundle y rollback;
- interfaz de direccion DELTA -> SPORTEX;
- entornos `DESARROLLO_LOCAL`, `PILOTO_DELTA` y
  `PRODUCCION_COMERCIAL` bloqueado.

## Validaciones SPORTEX

- scan anti-NUL: PASS;
- documentacion fast/full: PASS, 61 archivos obligatorios y 16 modulos;
- consistencia inicial: PASS, 8 tareas y 1 activa;
- doctor de worktrees: PASS; siguiente ID `TASK-20260801-002`;
- preflight de error conocido VPS/capacidad: PASS, hallazgo recuperado;
- parse PowerShell: PASS en cinco scripts;
- TypeScript check: PASS;
- tests Core: 16/16 PASS;
- SQL: PASS, 9 tablas transitorias con RLS forzado y rollback;
- build Core: PASS;
- `git diff --check`: PASS.
- cierre documental: PASS, 9 tareas, 0 activas y siguiente ID
  `TASK-20260801-003`;
- consulta `guidance` verificada como read-only e idempotente.

Durante la validacion se detecto que la primera implementacion de
`--print-context` sobrescribia la vista persistida. Se corrigio, se agrego una
segunda comprobacion `--check` despues de la consulta y se registro
`SPX-ERR-20260801-001`.

## Hallazgo no oculto

`npm audit` detecto tres vulnerabilidades altas con fix disponible:

- `@fastify/static`: bypass/path traversal;
- `find-my-way`: riesgo DDoS HTTP/2;
- `brace-expansion`: expansion sin limite/agotamiento de memoria.

No se ejecuto un fix automatico fuera de alcance. Quedo creada
`TASK-20260801-002` para remediacion controlada.

## Limites respetados

- BARBEROX no fue modificado.
- No se accedio ni modifico runtime, VPS, Supabase o Evolution.
- No se desplego, migro, reinicio ni envio ningun mensaje.
- No se leyeron ni almacenaron secretos.
- Esta evidencia prueba el sistema local, no el runtime actual.
