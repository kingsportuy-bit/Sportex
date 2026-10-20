# Contexto actual SPORTEX

> GENERADO. No editar manualmente.

Actualizado: 2026-10-20.

## Trabajo

- Intencion: `operation`.
- Entorno actual: `PILOTO_DELTA`.
- Entornos permitidos: `DOCUMENTACION, DESARROLLO_LOCAL, PILOTO_DELTA`.
- Objetivo operativo: `PILOTO_DELTA`.
- Campaña activa: `CAMP-20260803-001` - SPORTEX — Sistema Comercial Asistido de Delta.
- Tarea: `TASK-20261020-002`.
- Worktree: `C:/Users/Fito/Documents/CODEX/SPORTEX`.
- Rama: `codex/desplegar-bocetos-20261020`.
- Presupuesto potencial: 54384/90000 caracteres.
- Tokens estimados: 13596 (aproximacion de 4 caracteres por token).
- Documentos unicos: 21.

## Objetivo, alcance y riesgo

- Objetivo: Publicar el candidato autorizado 6b6f5f2 y verificar cuentas, base y login.
- Permitido: Actualizar solo sportex_bocetos_app; backup y rollback del volumen propio.
- Prohibido: Sin CRM, legado, DNS, Evolution, nuevas cuentas ni llamadas IA.
- Riesgos: El release observado 8823a773 no aparece en los refs remotos actuales; su imagen ejecutada se preserva como rollback y la deuda de trazabilidad queda registrada. | Las transiciones comerciales y de pedido requieren validación punta a punta antes de presentarse como operativas. | 4 vulnerabilidades altas siguen en TASK-20260801-002. | El primer envio manual desde SPORTEX todavia no fue realizado; no se contacto a un destinatario real durante el corte. | Los contactos ambiguos se rechazan correctamente, pero el logger aun los presenta con severidad de error.
- Proxima accion: Construir release, respaldar SQLite y actualizar solo el laboratorio autorizado.

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
- `docs/TASKS/active/TASK-20261020-002-base-inicial-empresas-bocetos.md` — owner `active-task`, autoridad 100.
