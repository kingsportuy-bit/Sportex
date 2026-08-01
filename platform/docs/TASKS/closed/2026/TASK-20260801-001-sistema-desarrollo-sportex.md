# Sistema de desarrollo gobernado para SPORTEX

id: TASK-20260801-001
owner: Codex
requester: Fito
estado: done
lifecycle: closed
completion_kind: ready_for_task
work_type: documentacion
campaign: none
context_focus: documentation
development_guide_impact: required

## objetivo

Adaptar a SPORTEX el sistema reutilizable de documentacion, arquitectura,
continuidad, tareas, Biblioteca, validacion y release estudiado en BARBEROX,
sin copiar reglas de barberias ni depender de memoria conversacional.

## alcance_permitido

- auditar BARBEROX en modo read-only;
- consolidar SPORTEX en un worktree Git independiente;
- crear estado canonico, vistas generadas y router de contexto;
- normalizar el ciclo de vida de tareas preservando historia;
- adaptar contratos de trabajo, entornos y releases a `PILOTO_DELTA`;
- agregar validadores, scan de integridad y doctor de worktrees;
- documentar la interfaz de direccion DELTA -> SPORTEX;
- validar documentacion y regresiones locales.

## alcance_prohibido

- modificar BARBEROX;
- borrar las copias anteriores de SPORTEX;
- desplegar, migrar o reiniciar servicios;
- usar o revelar secretos;
- enviar mensajes reales;
- declarar el runtime actual sin revalidacion;
- habilitar `PRODUCCION_COMERCIAL`.

## entradas

- sistema documental y de gobernanza vigente de BARBEROX;
- rama publicada `sportex-task007-staging` en commit `ea02fc0`;
- contratos y codigo existentes bajo `platform/`;
- decisiones de Fito sobre Delta como piloto y ausencia de STAGING separado.

## salidas

- worktree independiente `C:\Users\Fito\Documents\CODEX\SPORTEX`;
- guia maestra y contratos Sportex adaptados;
- estado JSON canonico y vistas regenerables;
- tareas normalizadas en active, queued y closed;
- validadores documentales y guards de Git/release;
- evidencia de validacion y plan de consolidacion no destructivo.

## validacion

- BARBEROX `validate-docs` full en PASS como fuente estudiada;
- SPORTEX scan anti-NUL;
- generador idempotente y `--check`;
- consistencia de tareas y estado;
- sincronizacion de guia maestra;
- `npm run validate-docs`;
- tests y build existentes de SPORTEX para detectar regresiones;
- `git diff --check` y revision de archivos cambiados.

## evidencia

- resultados de comandos en la sesion;
- `docs/evidencias/TASK-20260801-001_SISTEMA_DESARROLLO.md`.

## rollback

Eliminar solamente el nuevo worktree/rama revierte la instalacion sin tocar
`main`, `sportex-task007-staging`, BARBEROX ni las copias manuales. No se hara
esa eliminacion durante esta tarea.

## deuda_restante

- `TASK-20260801-002`: remediar tres vulnerabilidades altas de dependencias.
- `TASK-20260719-007`: replantear el despliegue heredado para `PILOTO_DELTA`.
- Elegir la primera vertical de producto despues de revisar estas prioridades.
