# Entorno e infraestructura SPORTEX

id: TASK-20260719-002
owner: Codex
requester: Fito
estado: done
lifecycle: closed
work_type: operacion
campaign: none
context_focus: runtime
development_guide_impact: none

## objetivo

Definir y verificar el entorno objetivo de SPORTEX: repositorio existente, VPS compartido, Supabase autoalojado, Evolution API directa y ausencia de n8n.

## alcance_permitido

- inspección read-only del remoto Git y VPS;
- documentos y biblioteca dentro de `sportex/`;
- archivo histórico de la superficie n8n;
- validador documental.

## alcance_prohibido

- crear o modificar servicios en el VPS;
- crear instancias Evolution;
- crear schemas, bases, roles o buckets;
- copiar o modificar el SPORTEX anterior;
- commits, pushes o cambios de repositorio;
- operar producción.

## entradas

- decisión de Fito sobre infraestructura;
- repositorio SPORTEX anterior;
- estado read-only del VPS;
- contratos documentales existentes.

## salidas

- contratos de infraestructura, Git, Supabase y Evolution;
- conexiones sin secretos;
- n8n fuera de la arquitectura activa;
- superficies Evolution y VPS;
- documentación validada.

## validacion

- acceso read-only a Git remoto;
- lectura read-only de Swarm y servicios;
- `npm run validate-docs`;
- consistencia de biblioteca, tarea y sesión.

## evidencia

## rollback

Trabajo read-only; no requirio rollback de runtime.

## deuda_restante

Toda informacion de infraestructura debe revalidarse antes de operar.
- `docs/evidencias/TASK-20260719-002_ENTORNO_INFRAESTRUCTURA.md`;
- `npm run validate-docs`: `PASS` con 35 documentos requeridos, 16 modulos y 2 tareas.
