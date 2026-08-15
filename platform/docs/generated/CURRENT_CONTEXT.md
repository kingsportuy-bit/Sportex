# Contexto actual SPORTEX

> GENERADO. No editar manualmente.

Actualizado: 2026-08-15.

## Trabajo

- Intencion: `documentation`.
- Entorno actual: `PILOTO_DELTA`.
- Entornos permitidos: `DOCUMENTACION, DESARROLLO_LOCAL, PILOTO_DELTA`.
- Objetivo operativo: `PILOTO_DELTA`.
- Campaña activa: `CAMP-20260803-001` - SPORTEX — Sistema Comercial Asistido de Delta.
- Tarea: no cargada para esta consulta.
- Worktree: `C:/Users/Fito/Documents/CODEX/SPORTEX`.
- Rama: `sportex-governance-20260801`.
- Presupuesto potencial: 33838/65000 caracteres.

## Objetivo, alcance y riesgo

- Objetivo: Verificar antes de prometer que el panel WhatsApp puede cambiar etapas o estados comerciales.
- Permitido: Registrar el estado real del piloto y el criterio de verificacion de transiciones comerciales. | Conservar cronologia, mensajes y runtime 72e0fc2 sin cambios.
- Prohibido: No implementar, desplegar, migrar, enviar mensajes ni cambiar estados reales en este checkpoint.
- Riesgos: Cambiar etapas o estados comerciales desde WhatsApp todavia no esta verificado ni debe prometerse al operador. | 4 vulnerabilidades altas siguen en TASK-20260801-002. | El primer envio manual desde SPORTEX todavia no fue realizado; no se contacto a un destinatario real durante el corte. | Los contactos ambiguos se rechazan correctamente, pero el logger aun los presenta con severidad de error.
- Proxima accion: Verificar sin asumir soporte el recorrido chat -> detalle -> cambio de etapa -> persistencia -> auditoria; si falta, abrir una feature separada.

## Regla de uso

Leer los documentos seleccionados en orden de autoridad. `guidance` es una
consulta read-only: no crea tarea ni modifica el estado.

## Documentos seleccionados

- `docs/ENVIRONMENTS_CONTRACT.md` — owner `release-governance`, autoridad 100.
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
- `docs/TASKS/TEMPLATE.md` — owner `development-system`, autoridad 80.
