# Reconciliar portabilidad del worktree SPORTEX

id: TASK-20260926-001
owner: Codex
requester: Fito
estado: done
lifecycle: closed
work_type: documentacion
campaign: CAMP-20260803-001
context_focus: documentation
development_guide_impact: required
updated_at: 2026-09-26

## objetivo

Permitir que el arranque gobernado de SPORTEX funcione desde ambas PC sin tratar una ruta absoluta del checkout como invariante del proyecto.

## alcance_permitido

- Reconciliar el guard local de Git con invariantes portables del repositorio y de `platform/`.
- Actualizar la guia de desarrollo, estado documental, pruebas y evidencia del cambio.
- Validar el arranque y cerrar esta tarea con perfil documental.

## alcance_prohibido

- No cambiar rama, contratos funcionales, comportamiento de producto ni estado operativo de PILOTO_DELTA.
- No desplegar, ejecutar migraciones, operar servicios reales ni modificar secretos.

## entradas

- Falla reproducida: el worktree real de esta PC no coincidia con la ruta absoluta persistida por la PC principal.
- Rama `sportex-governance-20260801`, checkout limpio y campaña vigente.

## salidas

- `git.worktree` portable como `.` relativo al Git root.
- Guard de arranque basado en `projectRoot`, rama y remote.
- Inventario de worktrees capaz de resolver entradas relativas al repositorio.
- Regresiones automatizadas, guia y evidencia de cierre.

## validacion

- `npm run scan:text`: PASS.
- `npm run context -- documentation`: `SPORTEX_CONTEXT=PASS` desde la segunda PC.
- `node --test scripts/tests/sportex-workflow.test.mjs scripts/tests/worktree-close.test.mjs`: 17/17 PASS.
- `npm run workflow:close -- TASK-20260926-001 --profile=docs`.
- `git diff --check`.

## evidencia

- `docs/evidencias/TASK-20260926-001_PORTABILIDAD_WORKTREE.md`

## rollback

- Revertir exclusivamente los cambios documentales y del guard de portabilidad de esta tarea.

## deuda_restante

- Ninguna de portabilidad conocida. No se evaluo ni modifico runtime.

## registro_de_avances

### 2026-09-26 - Cierre documental

- La falla se reprodujo y quedo cubierta por una regresion que inicializa el repositorio en una ruta temporal distinta.
- El arranque devolvio `SPORTEX_CONTEXT=PASS` con `WORKTREE=.`.
- La rama, contratos funcionales y estado de PILOTO_DELTA permanecieron sin cambios.
- No hubo deploy, migraciones ni contacto con servicios reales.

## decisiones

- `SPORTEX-DEC-022`: la identidad del checkout se valida por Git root, `projectRoot`, rama y remote; la ruta absoluta es evidencia local, no invariante compartido.
