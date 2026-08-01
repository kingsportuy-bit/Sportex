# Fundación documental SPORTEX

id: TASK-20260719-001
owner: Codex
requester: Fito
estado: done
lifecycle: closed
work_type: documentacion
campaign: none
context_focus: documentation
development_guide_impact: none

## objetivo

Crear una base documental profesional y validable para reconstruir SPORTEX como Core modular, multitenant, seguro, observable y dirigido por eventos de WhatsApp.

## alcance_permitido

- `sportex/` dentro del proyecto Delta;
- documentos rectores;
- biblioteca de capas, módulos y superficies;
- tarea e índice;
- validador documental;
- READMEs de Core y frontend futuro.

## alcance_prohibido

- modificar BARBEROX;
- modificar o copiar el código del SPORTEX anterior;
- diseñar todavía la base de datos definitiva;
- implementar runtime, API, frontend o integraciones;
- operar staging o producción.

## entradas

- análisis documental de BARBEROX;
- documentación operativa de Delta;
- decisiones de Fito sobre Core, WhatsApp, multitenancy, seguridad y observabilidad.

## salidas

- estructura documental inicial;
- contratos rectores;
- biblioteca modular;
- validador `npm run validate-docs`;
- estado y roadmap consistentes.

## validacion

- `npm run validate-docs`;
- revisión de archivos UTF-8 sin BOM ni NUL;
- comprobación de módulos y tareas indexados.

## evidencia

## rollback

La fundacion queda preservada en Git; cualquier reemplazo debe ser aditivo y
conservar sus tareas y evidencias.

## deuda_restante

Absorbida por la migracion de gobernanza de agosto de 2026.
- `docs/evidencias/TASK-20260719-001_FUNDACION_DOCUMENTAL.md`.
- `npm run validate-docs`: PASS con 30 documentos requeridos, 16 módulos y 1 tarea.
