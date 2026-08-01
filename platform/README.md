# SPORTEX Platform

Sistema operativo y comercial multitenant para marcas de indumentaria
deportiva. Delta Sport es el piloto de producto.

## Proyecto autoritativo

- Worktree de desarrollo: `C:\Users\Fito\Documents\CODEX\SPORTEX`.
- Proyecto tecnico: `platform/`.
- Git: repositorio `kingsportuy-bit/sportex`.
- DELTA administra prioridades y validacion; SPORTEX administra codigo,
  arquitectura, tareas, releases y evidencia.

Las carpetas manuales dentro de DELTA no son fuentes paralelas.

## Inicio para Codex

```powershell
cd C:\Users\Fito\Documents\CODEX\SPORTEX\platform
npm run scan:text
npm run context -- guidance
```

Leer `docs/INICIAL.md` antes de cambiar el proyecto.

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
```

## Estado

La fuente viva es `docs/state/PROJECT_STATE.json`; `docs/SESSION_STATE.md` y
`docs/generated/CURRENT_CONTEXT.md` son vistas generadas.
