# Remediar vulnerabilidades de dependencias del Core

id: TASK-20260801-002
owner: Codex
requester: Fito
estado: draft
lifecycle: queued
work_type: fix
campaign: none
context_focus: quality
development_guide_impact: none

## objetivo

Actualizar de forma controlada las dependencias afectadas por tres avisos de
severidad alta sin romper API, frontend estatico, routing ni build.

## alcance_permitido

- confirmar el arbol exacto con `npm audit` y `npm explain`;
- actualizar versiones directas y lockfile de forma minima;
- agregar regresiones para rutas estaticas y routing si corresponde;
- ejecutar suite completa y repetir auditoria.

## alcance_prohibido

- usar `npm audit fix --force` sin revisar el cambio;
- desplegar o modificar `PILOTO_DELTA`;
- cambiar arquitectura o comportamiento de negocio;
- aceptar vulnerabilidades altas sin decision explicita y compensaciones.

## entradas

- audit del 2026-08-01: `@fastify/static`, `find-my-way` y `brace-expansion`;
- `package.json` y `package-lock.json` actuales;
- suite de 16 tests y build existentes.

## salidas

- dependencias y lockfile corregidos o decision de riesgo documentada;
- regresiones aplicables;
- audit y suite completa posteriores.

## validacion

- `npm audit --json` sin vulnerabilidades altas dentro del scope;
- `npm run validate`;
- pruebas focales de rutas estaticas y traversal;
- `git diff --check`.

## evidencia

Pendiente en una tarea aprobada.

## rollback

Revertir solamente el commit atomico de dependencias y lockfile si las pruebas
detectan regresion; no desplegar hasta validar.

## deuda_restante

Pendiente de aprobacion y ejecucion.
