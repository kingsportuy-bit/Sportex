# Evidencia TASK-20260802-001 - Workflow documental automatico

Fecha: 2026-08-02.
Entorno: `DOCUMENTACION` y validaciones en `DESARROLLO_LOCAL`.
Rama: `sportex-governance-20260801`.
Worktree: `C:\Users\Fito\Documents\CODEX\SPORTEX`.
Base Git observada: `a5535ca8671ccf2ea1b0e29b12202aff7c6587ef`.

## Auditoria inicial confirmada

- estado inicial de Git: limpio;
- tareas activas antes del cambio: cero;
- `npm run scan:text`: PASS;
- `npm run task:doctor`: PASS;
- `npm run validate-docs`: PASS, 61 archivos requeridos y 16 modulos;
- ya existian estado canonico, router, tareas, vistas y validadores;
- faltaban un comando unico de cierre, PASS explicitos, campos operativos
  completos y tests propios del workflow.

## Implementacion

- `scripts/sportex-workflow.mjs`: contexto, check, sync y cierre;
- `scripts/sportex-workflow.ps1`: interfaz PowerShell equivalente a DELTA;
- `PROJECT_STATE.json` schema 2 con campaña/tarea, objetivo, alcance, entornos,
  Git, migraciones, pruebas, despliegues, integraciones, datos sensibles,
  evidencia, riesgos y pendientes;
- `CAMPAIGN_STATE.json` convertido en vista generada desde la fuente canonica;
- `DECISIONES.md` como registro durable;
- reglas de entrada y cierre sincronizadas en AGENTS, guia y contratos;
- `scripts/tests/sportex-workflow.test.mjs` con siete regresiones.

Durante la prueba se encontro que una sola regeneracion podia dejar
`CURRENT_CONTEXT.md` desactualizado porque su presupuesto media la version
anterior de `SESSION_STATE.md`. El generador ahora calcula con la vista nueva y
la quinta prueba demuestra idempotencia en una sola pasada.

El primer cierre completo tambien detecto dos diferencias de CLI antes de
ejecutar validaciones: npm no reenvio `--task=...` como argumento y Node no pudo
lanzar `npm.cmd` directamente en Windows. El comando usa ahora un TASK-ID
posicional y ejecuta npm mediante `cmd.exe`; ambas rutas quedaron cubiertas.

## Validaciones finales

- `SPORTEX_CONTEXT=PASS`: campaña `none`, tarea correcta, objetivo, alcance,
  entorno, worktree, rama, riesgos y proxima accion;
- `SPORTEX_CLOSE_GUARD_TEST=PASS`: el cierre incompleto fue bloqueado;
- `npm run test:workflow`: 7/7 PASS;
- `npm run validate-docs`: PASS, 65 archivos requeridos y 16 modulos;
- `npm run check`: TypeScript PASS;
- `npm test`: 16/16 PASS;
- `npm run validate-sql`: PASS, 9 tablas transitorias, RLS forzado y rollback;
- `npm run build`: PASS;
- `npm run validate`: PASS;
- `git diff --check`: PASS.

- `npm run workflow:close -- TASK-20260802-001`: `SPORTEX_CLOSE=PASS`;
- salida final: campaña activa `none`, tarea activa `none` y proxima accion
  `Abrir SPORTEX — Sistema Comercial Asistido de Delta`.

## Pendientes

- abrir `SPORTEX — Sistema Comercial Asistido de Delta` como nueva campaña y
  tarea, sin haberla iniciado durante este trabajo;
- mantener en cola `TASK-20260801-002` y `TASK-20260719-007`;
- commit/push de estos cambios solamente en un paso Git posterior si se pide.

## Rollback

Revertir unicamente los archivos de gobernanza, workflow, pruebas y vistas de
`TASK-20260802-001`. No existe rollback remoto porque no hubo migraciones,
deploys, mensajes ni escrituras externas.

## Limites verificados

- campaña comercial no iniciada;
- Core y frontend sin cambios;
- cero migraciones y despliegues;
- cero escrituras en Supabase, Evolution o VPS;
- ningun secreto o dato real accedido o almacenado.
