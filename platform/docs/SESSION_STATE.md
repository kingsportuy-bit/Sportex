# Estado vivo SPORTEX

> GENERADO desde `docs/state/PROJECT_STATE.json`. No editar manualmente.

Actualizado: 2026-09-03.

## Entorno de trabajo

- Entorno actual: `PILOTO_DELTA`.
- Entornos permitidos: `DOCUMENTACION, DESARROLLO_LOCAL, PILOTO_DELTA`.
- Entornos prohibidos: `PRODUCCION_COMERCIAL`.
- Objetivo operativo futuro: `PILOTO_DELTA`.
- Intencion actual: `operation`.

## Git

- Worktree: `C:/Users/Fito/Documents/CODEX/SPORTEX`.
- Rama: `sportex-governance-20260801`.
- Remote: `https://github.com/kingsportuy-bit/Sportex.git`.
- Verificado: `2026-09-03`.

## Campaña y tarea

- Campaña activa: `CAMP-20260803-001` - SPORTEX — Sistema Comercial Asistido de Delta.
- Proxima campaña: ninguna definida.
- Tarea tecnica: `TASK-20260903-001`: `in_progress` (docs/TASKS/active/TASK-20260903-001-restaurar-vinetas-whatsapp.md).

## Objetivo actual

Restaurar las vinetas WhatsApp del artefacto aprobado 8823a773 sin perder las funciones de 51c2dfe y publicar la correccion autorizada en PILOTO_DELTA.

## Alcance actual

- Permitido: Restaurar exclusivamente SVG/CSS de vinetas desde 8823a773 preservando el CRM actual. | Versionar, probar y desplegar el fix visual autorizado con rollback 51c2dfe.
- Prohibido: No cambiar DB, Core, secretos, membresias, Evolution, Ads ni PRODUCCION_COMERCIAL. | No enviar mensajes ni crear pedidos/pagos; no modificar conversaciones reales.

## Decisiones vigentes

- DELTA decide producto; SPORTEX conserva la verdad tecnica.
- El Core decide negocio y toda informacion operativa pertenece a un tenant.
- Solo existe una tarea activa; PROJECT_STATE es canonico y las vistas son generadas.
- PILOTO_DELTA y PRODUCCION_COMERCIAL requieren autorizaciones independientes.
- La demo local preserva 18 leads, persistencia y comandos Core sin efectos externos.
- PASS técnico y producto son gates separados.
- CAMP entrega la V1 por etapas.
- Leads y Clientes reutilizan directamente el panel WhatsApp vigente sin modificar su diseno visual.
- Pedidos usa tablero y planilla derivados del Core.
- Mensajes y eventos siguen separados.
- Mi empresa concentra configuracion tenant-aware de marca, productos, precios, talles y recursos.
- SPORTEX opera solamente en modo oscuro.

## Estado operativo registrado

- Migraciones: `MIGRACIONES_002_003_004_005_006_008_009_010_011_APLICADAS_PILOTO_DELTA_PASS_25_RLS`; ejecutadas 9; pendientes 0.
- Pruebas: `PASS`; ultima ejecucion `2026-09-03`.
- Despliegues: `PILOTO_DELTA_51C2DFE_DEPLOYED_VERIFIED`; registros 30.
- Integraciones: GitHub=`REMOTE_CANDIDATE_51C2DFE_DEPLOYED_VERIFIED` | Supabase=`PILOTO_DELTA_25_TABLAS_RLS_FORZADO_CONFIGURACION_011` | Evolution API=`DELTA_OPEN_UPSERT_UPDATE_BASE64_ACTIVE_MANUAL_OUTBOUND_ON` | VPS / runtime=`PILOTO_DELTA_RUNTIME_51C2DFE_PUBLIC_HEALTHY`
- Datos sensibles: `METADATA_REMOTA_MINIMIZADA_SIN_CONTENIDO`. Consulta remota sanitizada; sin valores de secretos, telefonos, conversaciones ni datos reales en Git.

## Ultima evidencia verificable

- Tarea: `TASK-20260903-001`.
- Fecha: `2026-09-03`.
- Fuente: `docs/evidencias/TASK-20260903-001_RESTAURAR_VINETAS.md`.
- Regresion visual confirmada contra el artefacto previo; restauracion exacta autorizada.

## Riesgos

- El release observado 8823a773 no aparece en los refs remotos actuales; su imagen ejecutada se preserva como rollback y la deuda de trazabilidad queda registrada.
- Las transiciones comerciales y de pedido requieren validación punta a punta antes de presentarse como operativas.
- 4 vulnerabilidades altas siguen en TASK-20260801-002.
- El primer envio manual desde SPORTEX todavia no fue realizado; no se contacto a un destinatario real durante el corte.
- Los contactos ambiguos se rechazan correctamente, pero el logger aun los presenta con severidad de error.

## Bloqueos

- Ninguno.

## Siguientes acciones

- Restaurar renderer/CSS y validar paridad local contra 8823a773.
- Desplegar fix visual autorizado, verificar y solicitar validacion de Fito.
