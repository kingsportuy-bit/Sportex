# Contexto actual SPORTEX

> GENERADO. No editar manualmente.

Actualizado: 2026-08-14.

## Trabajo

- Intencion: `product`.
- Entorno actual: `PILOTO_DELTA`.
- Entornos permitidos: `DOCUMENTACION, DESARROLLO_LOCAL, PILOTO_DELTA`.
- Objetivo operativo: `PILOTO_DELTA`.
- Campaña activa: `CAMP-20260803-001` - SPORTEX — Sistema Comercial Asistido de Delta.
- Tarea: `TASK-20260814-001`.
- Worktree: `C:/Users/Fito/Documents/CODEX/SPORTEX`.
- Rama: `sportex-governance-20260801`.
- Presupuesto potencial: 51079/60000 caracteres.

## Objetivo, alcance y riesgo

- Objetivo: Conectar la interfaz WhatsApp-first aprobada al WhatsApp real de Delta y habilitar el recorrido comercial-productivo mínimo reutilizando la base existente.
- Permitido: Implementar y validar localmente el modelo comercial normalizado, persistencia, adaptadores simulados, proyecciones y funciones internas. | Reutilizar Core, UI, contratos, migraciones y tests existentes cuando cumplan su contrato. | Preparar gates, rollback y manifiesto para la conexión real posterior.
- Prohibido: Sin GO remoto exacto: integraciones reales, datos reales, mensajes, deploy, migraciones remotas, PILOTO_DELTA o producción comercial.
- Riesgos: 4 vulnerabilidades altas siguen en TASK-20260801-002. | Eventos no textuales esperan f6a9277 para responder 422. | La interfaz no tiene DNS aprobado. | Falta prueba fisica posterior al hotfix.
- Proxima accion: Pedir GO para f6a9277.

## Regla de uso

Leer los documentos seleccionados en orden de autoridad. `guidance` es una
consulta read-only: no crea tarea ni modifica el estado.

## Documentos seleccionados

- `docs/ENVIRONMENTS_CONTRACT.md` — owner `release-governance`, autoridad 100.
- `docs/INICIAL.md` — owner `development-system`, autoridad 100.
- `docs/OPERADOR_PROYECTO.md` — owner `product-owner`, autoridad 100.
- `docs/SESSION_STATE.md` — owner `development-system`, autoridad 100.
- `docs/BIBLIA_SPORTEX.md` — owner `product`, autoridad 90.
- `docs/BUSINESS.md` — owner `product`, autoridad 90.
- `docs/DELTA_PROJECT_INTERFACE.md` — owner `product-owner`, autoridad 90.
- `docs/WHATSAPP_EVENT_CONTRACT.md` — owner `whatsapp-conversations`, autoridad 90.
- `docs/biblioteca/README.md` — owner `architecture-library`, autoridad 85.
- `docs/DOCUMENTS_CONTRACT.md` — owner `documents`, autoridad 85.
- `docs/DOMAIN_MODEL_V1.md` — owner `domain`, autoridad 85.
- `docs/NOTIFICATIONS_CONTRACT.md` — owner `notifications`, autoridad 85.
- `docs/ROADMAP.md` — owner `product`, autoridad 65.
- `docs/BACKLOG.md` — owner `product`, autoridad 55.
- `docs/TASKS/active/TASK-20260814-001-integrar-whatsapp-real-delta.md` — owner `active-task`, autoridad 100.
