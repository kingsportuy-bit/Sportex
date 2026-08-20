# Contexto actual SPORTEX

> GENERADO. No editar manualmente.

Actualizado: 2026-08-20.

## Trabajo

- Intencion: `idle`.
- Entorno actual: `DOCUMENTACION`.
- Entornos permitidos: `DOCUMENTACION, DESARROLLO_LOCAL, PILOTO_DELTA`.
- Objetivo operativo: `PILOTO_DELTA`.
- Campaña activa: `CAMP-20260803-001` - SPORTEX — Sistema Comercial Asistido de Delta.
- Tarea: no cargada para esta consulta.
- Worktree: `C:/Users/Fito/Documents/CODEX/SPORTEX`.
- Rama: `sportex-governance-20260801`.
- Presupuesto potencial: 12188/20000 caracteres.
- Tokens estimados: 3047 (aproximacion de 4 caracteres por token).
- Documentos unicos: 4.

## Objetivo, alcance y riesgo

- Objetivo: Mantener el Project OS listo para trabajo local y proteger cualquier hotfix con preemption y reconciliacion fail-closed.
- Permitido: Modificar documentacion, estado, tooling y tests del Project OS. | Integrar gates locales con workflow:close y worktree:close.
- Prohibido: No tocar runtime, PILOTO_DELTA, produccion, deploys, mensajes, migraciones, datos, secretos, proveedores, remotos ni push.
- Riesgos: Las transiciones comerciales y de pedido requieren validación punta a punta antes de presentarse como operativas. | 4 vulnerabilidades altas siguen en TASK-20260801-002. | El primer envio manual desde SPORTEX todavia no fue realizado; no se contacto a un destinatario real durante el corte. | Los contactos ambiguos se rechazan correctamente, pero el logger aun los presenta con severidad de error.
- Proxima accion: Retornar a SARA el cierre owner de TASK-20260820-001 y sus commits locales.

## Regla de uso

Leer los documentos seleccionados en orden de autoridad. `guidance` es una
consulta read-only: no crea tarea ni modifica el estado.

## Documentos seleccionados

- `docs/ENVIRONMENTS_CONTRACT.md` — owner `release-governance`, autoridad 100.
- `docs/INICIAL.md` — owner `development-system`, autoridad 100.
- `docs/OPERADOR_PROYECTO.md` — owner `product-owner`, autoridad 100.
- `docs/SESSION_STATE.md` — owner `development-system`, autoridad 100.
