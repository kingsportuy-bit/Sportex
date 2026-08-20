# Contexto actual SPORTEX

> GENERADO. No editar manualmente.

Actualizado: 2026-08-20.

## Trabajo

- Intencion: `documentation`.
- Entorno actual: `DOCUMENTACION`.
- Entornos permitidos: `DOCUMENTACION, DESARROLLO_LOCAL, PILOTO_DELTA`.
- Objetivo operativo: `PILOTO_DELTA`.
- Campaña activa: `CAMP-20260803-001` - SPORTEX — Sistema Comercial Asistido de Delta.
- Tarea: `TASK-20260820-001`.
- Worktree: `C:/Users/Fito/Documents/CODEX/SPORTEX`.
- Rama: `sportex-governance-20260801`.
- Presupuesto potencial: 50026/65000 caracteres.
- Tokens estimados: 12507 (aproximacion de 4 caracteres por token).
- Documentos unicos: 16.

## Objetivo, alcance y riesgo

- Objetivo: Adaptar el protocolo de preemption, hotfix, reconciliacion y evolucion de entornos al Project OS SPORTEX.
- Permitido: Modificar documentacion, estado, tooling y tests del Project OS. | Integrar gates locales con workflow:close y worktree:close.
- Prohibido: No tocar runtime, PILOTO_DELTA, produccion, deploys, mensajes, migraciones, datos, secretos, proveedores, remotos ni push.
- Riesgos: Las transiciones comerciales y de pedido requieren validación punta a punta antes de presentarse como operativas. | 4 vulnerabilidades altas siguen en TASK-20260801-002. | El primer envio manual desde SPORTEX todavia no fue realizado; no se contacto a un destinatario real durante el corte. | Los contactos ambiguos se rechazan correctamente, pero el logger aun los presenta con severidad de error.
- Proxima accion: Completar contratos, gates, regresiones y cierre owner local.

## Regla de uso

Leer los documentos seleccionados en orden de autoridad. `guidance` es una
consulta read-only: no crea tarea ni modifica el estado.

## Documentos seleccionados

- `docs/ENVIRONMENTS_CONTRACT.md` — owner `release-governance`, autoridad 100.
- `docs/INCIDENT_PREEMPTION_RECONCILIATION_CONTRACT.md` — owner `release-governance`, autoridad 100.
- `docs/INICIAL.md` — owner `development-system`, autoridad 100.
- `docs/OPERADOR_PROYECTO.md` — owner `product-owner`, autoridad 100.
- `docs/SESSION_STATE.md` — owner `development-system`, autoridad 100.
- `docs/CORE_DOCUMENTATION_SYSTEM.md` — owner `development-system`, autoridad 95.
- `docs/DECISIONES.md` — owner `development-system`, autoridad 95.
- `docs/DOCUMENTATION_ARCHITECTURE.md` — owner `development-system`, autoridad 95.
- `docs/GUIA_TRABAJO_DESARROLLO_SPORTEX.md` — owner `development-system`, autoridad 95.
- `docs/MODOS_DE_TRABAJO.md` — owner `development-system`, autoridad 95.
- `docs/CODEX_WORKFLOW.md` — owner `development-system`, autoridad 90.
- `docs/DELTA_PROJECT_INTERFACE.md` — owner `product-owner`, autoridad 90.
- `docs/TASKS/README.md` — owner `development-system`, autoridad 90.
- `docs/WORKTREE_LIFECYCLE_CONTRACT.md` — owner `release-governance`, autoridad 90.
- `docs/TASKS/TEMPLATE.md` — owner `development-system`, autoridad 80.
- `docs/TASKS/active/TASK-20260820-001-preemption-hotfix-reconciliation.md` — owner `active-task`, autoridad 100.
