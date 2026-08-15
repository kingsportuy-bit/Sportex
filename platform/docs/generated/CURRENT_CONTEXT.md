# Contexto actual SPORTEX

> GENERADO. No editar manualmente.

Actualizado: 2026-08-15.

## Trabajo

- Intencion: `feature`.
- Entorno actual: `PILOTO_DELTA`.
- Entornos permitidos: `DOCUMENTACION, DESARROLLO_LOCAL, PILOTO_DELTA`.
- Objetivo operativo: `PILOTO_DELTA`.
- Campaña activa: `CAMP-20260803-001` - SPORTEX — Sistema Comercial Asistido de Delta.
- Tarea: no cargada para esta consulta.
- Worktree: `C:/Users/Fito/Documents/CODEX/SPORTEX`.
- Rama: `sportex-governance-20260801`.
- Presupuesto potencial: 64429/70000 caracteres.

## Objetivo, alcance y riesgo

- Objetivo: Intercalar hitos operativos del Core en el chat WhatsApp sin convertirlos en mensajes y dejar compatibilidad pasiva para un asistente futuro apagado.
- Permitido: Implementar y validar localmente el modelo comercial normalizado, persistencia, adaptadores simulados, proyecciones y funciones internas. | Reutilizar Core, UI, contratos, migraciones y tests existentes cuando cumplan su contrato. | Preparar gates, rollback y manifiesto para la conexión real posterior.
- Prohibido: Sin GO remoto exacto: integraciones reales, datos reales, mensajes, deploy, migraciones remotas, PILOTO_DELTA o producción comercial.
- Riesgos: 4 vulnerabilidades altas siguen en TASK-20260801-002. | El primer envio manual desde SPORTEX todavia no fue realizado; no se contacto a un destinatario real durante el corte. | Los contactos ambiguos se rechazan correctamente, pero el logger aun los presenta con severidad de error.
- Proxima accion: Someter el nuevo candidato local de TASK-20260815-001 a segunda revisión antes de publicarlo o promoverlo.

## Regla de uso

Leer los documentos seleccionados en orden de autoridad. `guidance` es una
consulta read-only: no crea tarea ni modifica el estado.

## Documentos seleccionados

- `docs/ENVIRONMENTS_CONTRACT.md` — owner `release-governance`, autoridad 100.
- `docs/INICIAL.md` — owner `development-system`, autoridad 100.
- `docs/OPERADOR_PROYECTO.md` — owner `product-owner`, autoridad 100.
- `docs/SESSION_STATE.md` — owner `development-system`, autoridad 100.
- `docs/MULTITENANCY_CONTRACT.md` — owner `security`, autoridad 95.
- `docs/SECURITY.md` — owner `security`, autoridad 95.
- `docs/ARCHITECTURE.md` — owner `core-architecture`, autoridad 90.
- `docs/BIBLIA_SPORTEX.md` — owner `product`, autoridad 90.
- `docs/BUSINESS.md` — owner `product`, autoridad 90.
- `docs/CORE_CONTRACT.md` — owner `core`, autoridad 90.
- `docs/EVOLUTION_CONTRACT.md` — owner `evolution-adapter`, autoridad 90.
- `docs/SUPABASE_CONTRACT.md` — owner `persistence`, autoridad 90.
- `docs/TASKS/README.md` — owner `development-system`, autoridad 90.
- `docs/WHATSAPP_EVENT_CONTRACT.md` — owner `whatsapp-conversations`, autoridad 90.
- `docs/API_CONTRACT_V1.md` — owner `api`, autoridad 85.
- `docs/biblioteca/MODULE_COMMON_CONTRACT.md` — owner `architecture-library`, autoridad 85.
- `docs/biblioteca/README.md` — owner `architecture-library`, autoridad 85.
- `docs/DOCUMENTS_CONTRACT.md` — owner `documents`, autoridad 85.
- `docs/DOMAIN_MODEL_V1.md` — owner `domain`, autoridad 85.
- `docs/NOTIFICATIONS_CONTRACT.md` — owner `notifications`, autoridad 85.
- `docs/OBSERVABILITY.md` — owner `observability`, autoridad 85.
