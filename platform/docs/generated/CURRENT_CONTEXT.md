# Contexto actual SPORTEX

> GENERADO. No editar manualmente.

Actualizado: 2026-09-03.

## Trabajo

- Intencion: `operation`.
- Entorno actual: `PILOTO_DELTA`.
- Entornos permitidos: `DOCUMENTACION, DESARROLLO_LOCAL, PILOTO_DELTA`.
- Objetivo operativo: `PILOTO_DELTA`.
- Campaña activa: `CAMP-20260803-001` - SPORTEX — Sistema Comercial Asistido de Delta.
- Tarea: `TASK-20260903-001`.
- Worktree: `C:/Users/Fito/Documents/CODEX/SPORTEX`.
- Rama: `sportex-governance-20260801`.
- Presupuesto potencial: 56475/90000 caracteres.
- Tokens estimados: 14119 (aproximacion de 4 caracteres por token).
- Documentos unicos: 21.

## Objetivo, alcance y riesgo

- Objetivo: Restaurar las vinetas WhatsApp del artefacto aprobado 8823a773 sin perder las funciones de 51c2dfe y publicar la correccion autorizada en PILOTO_DELTA.
- Permitido: Restaurar exclusivamente SVG/CSS de vinetas desde 8823a773 preservando el CRM actual. | Versionar, probar y desplegar el fix visual autorizado con rollback 51c2dfe.
- Prohibido: No cambiar DB, Core, secretos, membresias, Evolution, Ads ni PRODUCCION_COMERCIAL. | No enviar mensajes ni crear pedidos/pagos; no modificar conversaciones reales.
- Riesgos: El release observado 8823a773 no aparece en los refs remotos actuales; su imagen ejecutada se preserva como rollback y la deuda de trazabilidad queda registrada. | Las transiciones comerciales y de pedido requieren validación punta a punta antes de presentarse como operativas. | 4 vulnerabilidades altas siguen en TASK-20260801-002. | El primer envio manual desde SPORTEX todavia no fue realizado; no se contacto a un destinatario real durante el corte. | Los contactos ambiguos se rechazan correctamente, pero el logger aun los presenta con severidad de error.
- Proxima accion: Recuperar renderer/CSS originales, probar paridad y desplegar el fix visual.

## Regla de uso

Leer los documentos seleccionados en orden de autoridad. `guidance` es una
consulta read-only: no crea tarea ni modifica el estado.

## Documentos seleccionados

- `docs/ENVIRONMENTS_CONTRACT.md` — owner `release-governance`, autoridad 100.
- `docs/INCIDENT_PREEMPTION_RECONCILIATION_CONTRACT.md` — owner `release-governance`, autoridad 100.
- `docs/INICIAL.md` — owner `development-system`, autoridad 100.
- `docs/OPERADOR_PROYECTO.md` — owner `product-owner`, autoridad 100.
- `docs/SESSION_STATE.md` — owner `development-system`, autoridad 100.
- `docs/MULTITENANCY_CONTRACT.md` — owner `security`, autoridad 95.
- `docs/RELEASE_GOVERNANCE_CONTRACT.md` — owner `release-governance`, autoridad 95.
- `docs/SECURITY.md` — owner `security`, autoridad 95.
- `docs/CODEX_WORKFLOW.md` — owner `development-system`, autoridad 90.
- `docs/DEPLOYMENT_PROTOCOL.md` — owner `release-governance`, autoridad 90.
- `docs/EVOLUTION_CONTRACT.md` — owner `evolution-adapter`, autoridad 90.
- `docs/GIT_RELEASE_CONTRACT.md` — owner `release-governance`, autoridad 90.
- `docs/INFRASTRUCTURE_CONTRACT.md` — owner `infrastructure`, autoridad 90.
- `docs/SUPABASE_CONTRACT.md` — owner `persistence`, autoridad 90.
- `docs/TASKS/README.md` — owner `development-system`, autoridad 90.
- `docs/WORKTREE_LIFECYCLE_CONTRACT.md` — owner `release-governance`, autoridad 90.
- `docs/OBSERVABILITY.md` — owner `observability`, autoridad 85.
- `docs/CONNECTIONS.md` — owner `infrastructure`, autoridad 80.
- `docs/CURRENT_RUNTIME_BASELINE.md` — owner `runtime-observation`, autoridad 60.
- `docs/evidencias/README.md` — owner `quality`, autoridad 60.
- `docs/TASKS/active/TASK-20260903-001-restaurar-vinetas-whatsapp.md` — owner `active-task`, autoridad 100.
