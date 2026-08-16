# Contexto actual SPORTEX

> GENERADO. No editar manualmente.

Actualizado: 2026-08-16.

## Trabajo

- Intencion: `operation`.
- Entorno actual: `PILOTO_DELTA`.
- Entornos permitidos: `DOCUMENTACION, DESARROLLO_LOCAL, PILOTO_DELTA`.
- Objetivo operativo: `PILOTO_DELTA`.
- Campaña activa: `CAMP-20260803-001` - SPORTEX — Sistema Comercial Asistido de Delta.
- Tarea: `TASK-20260816-003`.
- Worktree: `C:/Users/Fito/Documents/CODEX/SPORTEX`.
- Rama: `sportex-governance-20260801`.
- Presupuesto potencial: 48701/90000 caracteres.

## Objetivo, alcance y riesgo

- Objetivo: Promover imagenes y no leidos al PILOTO_DELTA sin mensajes reales.
- Permitido: Crear candidato exacto, backup/restore, migrar 006, activar flags/Base64 y desplegar. | Verificar runtime, RLS, UI y cero mensajes/outbound nuevos.
- Prohibido: No enviar mensajes reales ni tocar otros tenants, servicios, Meta o PRODUCCION_COMERCIAL.
- Riesgos: Cambiar etapas o estados comerciales desde WhatsApp todavia no esta verificado ni debe prometerse al operador. | 4 vulnerabilidades altas siguen en TASK-20260801-002. | El primer envio manual desde SPORTEX todavia no fue realizado; no se contacto a un destinatario real durante el corte. | Los contactos ambiguos se rechazan correctamente, pero el logger aun los presenta con severidad de error.
- Proxima accion: Fito debe hacer clic en Entrar a SPORTEX en la pestaña productiva visible; luego completar QA autenticada claro/noche y desktop/mobile sin adjuntar ni enviar.

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
- `docs/SECURITY.md` — owner `security`, autoridad 95.
- `docs/CODEX_WORKFLOW.md` — owner `development-system`, autoridad 90.
- `docs/DEPLOYMENT_PROTOCOL.md` — owner `release-governance`, autoridad 90.
- `docs/EVOLUTION_CONTRACT.md` — owner `evolution-adapter`, autoridad 90.
- `docs/GIT_RELEASE_CONTRACT.md` — owner `release-governance`, autoridad 90.
- `docs/INFRASTRUCTURE_CONTRACT.md` — owner `infrastructure`, autoridad 90.
- `docs/SUPABASE_CONTRACT.md` — owner `persistence`, autoridad 90.
- `docs/TASKS/README.md` — owner `development-system`, autoridad 90.
- `docs/OBSERVABILITY.md` — owner `observability`, autoridad 85.
- `docs/CONNECTIONS.md` — owner `infrastructure`, autoridad 80.
- `docs/CURRENT_RUNTIME_BASELINE.md` — owner `runtime-observation`, autoridad 60.
- `docs/evidencias/README.md` — owner `quality`, autoridad 60.
- `docs/TASKS/active/TASK-20260816-003-promover-whatsapp-media-no-leidos-piloto.md` — owner `active-task`, autoridad 100.
