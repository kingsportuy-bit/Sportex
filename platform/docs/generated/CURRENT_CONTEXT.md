# Contexto actual SPORTEX

> GENERADO. No editar manualmente.

Actualizado: 2026-08-15.

## Trabajo

- Intencion: `quality`.
- Entorno actual: `PILOTO_DELTA`.
- Entornos permitidos: `DOCUMENTACION, DESARROLLO_LOCAL, PILOTO_DELTA`.
- Objetivo operativo: `PILOTO_DELTA`.
- Campaña activa: `CAMP-20260803-001` - SPORTEX — Sistema Comercial Asistido de Delta.
- Tarea: no cargada para esta consulta.
- Worktree: `C:/Users/Fito/Documents/CODEX/SPORTEX`.
- Rama: `sportex-governance-20260801`.
- Presupuesto potencial: 33534/75000 caracteres.

## Objetivo, alcance y riesgo

- Objetivo: Cerrar con evidencia honesta el puesto operativo WhatsApp de Delta y preparar la siguiente mejora focal sin inventar un envío real.
- Permitido: Implementar y validar localmente el modelo comercial normalizado, persistencia, adaptadores simulados, proyecciones y funciones internas. | Reutilizar Core, UI, contratos, migraciones y tests existentes cuando cumplan su contrato. | Preparar gates, rollback y manifiesto para la conexión real posterior.
- Prohibido: Sin GO remoto exacto: integraciones reales, datos reales, mensajes, deploy, migraciones remotas, PILOTO_DELTA o producción comercial.
- Riesgos: 4 vulnerabilidades altas siguen en TASK-20260801-002. | El primer envio manual desde SPORTEX todavia no fue realizado; no se contacto a un destinatario real durante el corte. | Los contactos ambiguos se rechazan correctamente, pero el logger aun los presenta con severidad de error.
- Proxima accion: Abrir la siguiente task focal para cronología operativa y compatibilidad pasiva del asistente.

## Regla de uso

Leer los documentos seleccionados en orden de autoridad. `guidance` es una
consulta read-only: no crea tarea ni modifica el estado.

## Documentos seleccionados

- `docs/ENVIRONMENTS_CONTRACT.md` — owner `release-governance`, autoridad 100.
- `docs/INICIAL.md` — owner `development-system`, autoridad 100.
- `docs/OPERADOR_PROYECTO.md` — owner `product-owner`, autoridad 100.
- `docs/SESSION_STATE.md` — owner `development-system`, autoridad 100.
- `docs/MULTITENANCY_CONTRACT.md` — owner `security`, autoridad 95.
- `docs/RELEASE_GOVERNANCE_CONTRACT.md` — owner `release-governance`, autoridad 95.
- `docs/CORE_CONTRACT.md` — owner `core`, autoridad 90.
- `docs/GIT_RELEASE_CONTRACT.md` — owner `release-governance`, autoridad 90.
- `docs/API_CONTRACT_V1.md` — owner `api`, autoridad 85.
- `docs/biblioteca/MODULE_COMMON_CONTRACT.md` — owner `architecture-library`, autoridad 85.
- `docs/biblioteca/README.md` — owner `architecture-library`, autoridad 85.
- `docs/OBSERVABILITY.md` — owner `observability`, autoridad 85.
- `docs/ERROR_REGISTRY.md` — owner `quality`, autoridad 70.
- `docs/evidencias/README.md` — owner `quality`, autoridad 60.
