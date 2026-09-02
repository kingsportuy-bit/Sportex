# Estado vivo SPORTEX

> GENERADO desde `docs/state/PROJECT_STATE.json`. No editar manualmente.

Actualizado: 2026-09-02.

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
- Verificado: `2026-09-02`.

## Campaña y tarea

- Campaña activa: `CAMP-20260803-001` - SPORTEX — Sistema Comercial Asistido de Delta.
- Proxima campaña: ninguna definida.
- Tarea tecnica: `TASK-20260902-002`: `in_progress` (docs/TASKS/active/TASK-20260902-002-promover-crm-configuracion-piloto.md).

## Objetivo actual

Promover a PILOTO_DELTA el CRM reorganizado y Mi empresa tenant-aware con migracion aditiva, capacidades minimas, artefacto inmutable, backup, rollback y verificacion sin mensajes reales.

## Alcance actual

- Permitido: Versionar y publicar el candidato exacto de TASK-20260902-001. | Respaldar, ensayar y aplicar 20260902_011 en PILOTO_DELTA; otorgar company.read/company.manage solo a operadores Delta autorizados. | Desplegar y verificar health, ready, login, Leads, Clientes, Pedidos y Mi empresa en modo solo lectura.
- Prohibido: No enviar mensajes, crear pedidos, certificar pagos ni mutar conversaciones durante la verificacion. | No cambiar Evolution, Meta Ads, DNS, secretos, otros tenants, servicios compartidos ni PRODUCCION_COMERCIAL. | No ejecutar down, restore destructivo ni eliminar tablas sin otro gate y autorizacion.

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

- Migraciones: `MIGRACIONES_002_003_004_005_006_008_009_010_APLICADAS_PILOTO_DELTA_PASS`; ejecutadas 8; pendientes 1.
- Pruebas: `PASS`; ultima ejecucion `2026-09-02`.
- Despliegues: `PILOTO_DELTA_8823A77_OBSERVED_HEALTHY`; registros 29.
- Integraciones: GitHub=`REMOTE_CANDIDATE_72E0FC2_DEPLOYED_VERIFIED` | Supabase=`PILOTO_DELTA_19_TABLAS_RLS_FORZADO_MEDIA_UNREAD_006` | Evolution API=`DELTA_OPEN_UPSERT_UPDATE_BASE64_ACTIVE_MANUAL_OUTBOUND_ON` | VPS / runtime=`PILOTO_DELTA_RUNTIME_8823A77_PUBLIC_HEALTHY`
- Datos sensibles: `METADATA_REMOTA_MINIMIZADA_SIN_CONTENIDO`. Consulta remota sanitizada; sin valores de secretos, telefonos, conversaciones ni datos reales en Git.

## Ultima evidencia verificable

- Tarea: `TASK-20260902-002`.
- Fecha: `2026-09-02`.
- Fuente: `docs/evidencias/TASK-20260902-002_PILOTO_DELTA_CRM_CONFIGURACION.md`.
- Operacion autorizada; runtime 8823a773 sano y rollback fijado. Candidato local PASS con readiness estricto para migracion 011.

## Riesgos

- El release observado 8823a773 no aparece en los refs remotos actuales; su imagen ejecutada se preserva como rollback y la deuda de trazabilidad queda registrada.
- Las transiciones comerciales y de pedido requieren validación punta a punta antes de presentarse como operativas.
- 4 vulnerabilidades altas siguen en TASK-20260801-002.
- El primer envio manual desde SPORTEX todavia no fue realizado; no se contacto a un destinatario real durante el corte.
- Los contactos ambiguos se rechazan correctamente, pero el logger aun los presenta con severidad de error.

## Bloqueos

- Ninguno.

## Siguientes acciones

- Publicar el candidato exacto de TASK-20260902-002 y ejecutar el release guard.
- Completar backup/restore aislado antes de aplicar 20260902_011 y desplegar en PILOTO_DELTA.
- Modelar reposiciones explicitas y asistencia de ventas en cortes posteriores; no hacer push, deploy, migracion ni mensaje sin nuevo GO.
