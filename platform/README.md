# SPORTEX Platform

Sistema operativo y comercial multitenant para marcas de indumentaria
deportiva. Delta Sport es el piloto de producto.

## Proyecto autoritativo

- Worktree de desarrollo: `C:\Users\Fito\Documents\CODEX\SPORTEX`.
- Proyecto tecnico: `platform/`.
- Git: repositorio `kingsportuy-bit/Sportex`.
- DELTA administra prioridades y validacion; SPORTEX administra codigo,
  arquitectura, tareas, releases y evidencia.

Las carpetas manuales dentro de DELTA no son fuentes paralelas.

## Inicio para Codex

```powershell
cd C:\Users\Fito\Documents\CODEX\SPORTEX\platform
npm run scan:text
npm run context -- guidance
```

`AGENTS.md` ejecuta este protocolo automaticamente en cada hilo. El comando
debe devolver `SPORTEX_CONTEXT=PASS`; luego se leen los archivos bajo `READ:`.

## Arquitectura

- `core/`: dominio, aplicacion, permisos, persistencia y API.
- `frontend/`: superficie sin autoridad de negocio.
- `docs/`: fuentes rectoras, tareas, Biblioteca y evidencia.
- `scripts/`: validacion, continuidad y gobernanza de releases.
- `deploy/`: artefactos heredados/transitorios; no prueban un deployment.

El monolito anterior permanece en la raiz del repositorio como fuente de
migracion. La plataforma nueva vive bajo `platform/` hasta que una tarea de
cutover defina otra cosa.

## Entornos

- `DESARROLLO_LOCAL`: fixtures y pruebas sin datos reales.
- `PILOTO_DELTA`: unico entorno real durante construccion y validacion.
- `PRODUCCION_COMERCIAL`: bloqueado hasta validacion Delta y GO de Fito.

No hay STAGING permanente separado. Los nombres `staging` existentes en codigo,
migraciones o deploy son artefactos de julio de 2026 y deben replantearse antes
de operar.

## Validacion

```powershell
npm run validate
```

Validaciones focales:

```powershell
npm run validate-docs:fast
npm run validate-tasks
npm run task:doctor
npm run task:next-id
npm run test:workflow
npm run workflow:check
```

Despues de un cambio material:

```powershell
npm run workflow:close -- TASK-AAAAMMDD-NNN
```

No hay cierre verificable sin `SPORTEX_CLOSE=PASS`.

## Estado

La fuente viva es `docs/state/PROJECT_STATE.json`. `docs/SESSION_STATE.md`,
`docs/TASKS/INDEX.md`, `docs/generated/CURRENT_CONTEXT.md`,
`docs/errors/index.json` y `docs/state/CAMPAIGN_STATE.json` son vistas
generadas.
