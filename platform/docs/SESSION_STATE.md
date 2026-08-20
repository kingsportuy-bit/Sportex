# Estado vivo SPORTEX

> GENERADO desde `docs/state/PROJECT_STATE.json`. No editar manualmente.

Actualizado: 2026-08-20.

## Entorno de trabajo

- Entorno actual: `PILOTO_DELTA`.
- Entornos permitidos: `DOCUMENTACION, DESARROLLO_LOCAL, PILOTO_DELTA`.
- Entornos prohibidos: `PRODUCCION_COMERCIAL`.
- Objetivo operativo futuro: `PILOTO_DELTA`.
- Intencion actual: `feature`.

## Git

- Worktree: `C:/Users/Fito/Documents/CODEX/SPORTEX`.
- Rama: `sportex-governance-20260801`.
- Remote: `https://github.com/kingsportuy-bit/Sportex.git`.
- Verificado: `2026-08-20`.

## Campaña y tarea

- Campaña activa: `CAMP-20260803-001` - SPORTEX — Sistema Comercial Asistido de Delta.
- Proxima campaña: ninguna definida.
- Tarea tecnica: `TASK-20260817-001`: `in_progress` (docs/TASKS/active/TASK-20260817-001-puesto-operativo-delta.md).

## Objetivo actual

Dejar a Delta un puesto operativo mínimo en SPORTEX para trabajar desde WhatsApp, Leads, Pedidos y Clientes, sin mensajes reales no autorizados.

## Alcance actual

- Permitido: Construir y validar localmente el puesto operativo mínimo definido por TASK-20260817-001. | Preparar el candidato y la evidencia de despliegue para PILOTO_DELTA.
- Prohibido: No enviar mensajes reales ni mutar PILOTO_DELTA fuera del alcance exacto, release y prueba controlada de TASK-20260817-001.

## Decisiones vigentes

- DELTA decide producto; SPORTEX conserva la verdad tecnica.
- El Core decide negocio y toda informacion operativa pertenece a un tenant.
- Solo existe una tarea activa; PROJECT_STATE es canonico y las vistas son generadas.
- PILOTO_DELTA y PRODUCCION_COMERCIAL requieren autorizaciones independientes.
- La demo local preserva 18 leads, persistencia y comandos Core sin efectos externos.
- PASS técnico y producto son gates separados.
- CAMP entrega la V1 por etapas.
- Leads y Pedidos usan tableros derivados del Core.
- WhatsApp es una superficie separada.
- Mensajes y eventos siguen separados.
- Leads administra; WhatsApp concentra el chat completo.
- SPORTEX opera solamente en modo oscuro.

## Estado operativo registrado

- Migraciones: `MIGRACIONES_002_003_004_005_006_008_009_010_APLICADAS_PILOTO_DELTA_PASS`; ejecutadas 8; pendientes 0.
- Pruebas: `PASS`; ultima ejecucion `2026-08-20`.
- Despliegues: `PILOTO_DELTA_4898D55_WHATSAPP_TABBED_PANEL`; registros 28.
- Integraciones: GitHub=`REMOTE_CANDIDATE_72E0FC2_DEPLOYED_VERIFIED` | Supabase=`PILOTO_DELTA_19_TABLAS_RLS_FORZADO_MEDIA_UNREAD_006` | Evolution API=`DELTA_OPEN_UPSERT_UPDATE_BASE64_ACTIVE_MANUAL_OUTBOUND_ON` | VPS / runtime=`PILOTO_DELTA_RUNTIME_4898D55_PUBLIC_HEALTHY`
- Datos sensibles: `METADATA_REMOTA_MINIMIZADA_SIN_CONTENIDO`. Consulta remota sanitizada; sin valores de secretos, telefonos, conversaciones ni datos reales en Git.

## Ultima evidencia verificable

- Tarea: `TASK-20260817-001`.
- Fecha: `2026-08-20`.
- Fuente: `docs/evidencias/TASK-20260817-001_PUESTO_OPERATIVO_DELTA.md`.
- 4898d55 desplegado: SVG une activa, cabecera y panel; runtime y recursos públicos PASS; aceptación humana pendiente.

## Riesgos

- Las transiciones comerciales y de pedido requieren validación punta a punta antes de presentarse como operativas.
- 4 vulnerabilidades altas siguen en TASK-20260801-002.
- El primer envio manual desde SPORTEX todavia no fue realizado; no se contacto a un destinatario real durante el corte.
- Los contactos ambiguos se rechazan correctamente, pero el logger aun los presenta con severidad de error.

## Bloqueos

- Ninguno.

## Siguientes acciones

- Fito valida 4898d55 en su sesión autenticada antes de aceptarlo visualmente.
- No hacer otra acción remota ni prueba sin GO; mantener cero outbound nuevo.
- Mantener TASK-20260801-002 y TASK-20260719-007 en cola hasta nueva prioridad.
