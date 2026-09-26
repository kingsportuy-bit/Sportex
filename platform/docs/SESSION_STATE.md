# Estado vivo SPORTEX

> GENERADO desde `docs/state/PROJECT_STATE.json`. No editar manualmente.

Actualizado: 2026-09-26.

## Entorno de trabajo

- Entorno actual: `DOCUMENTACION`.
- Entornos permitidos: `DOCUMENTACION, DESARROLLO_LOCAL, PILOTO_DELTA`.
- Entornos prohibidos: `PRODUCCION_COMERCIAL`.
- Objetivo operativo futuro: `PILOTO_DELTA`.
- Intencion actual: `documentation`.

## Git

- Worktree: `.`.
- Rama: `sportex-governance-20260801`.
- Remote: `https://github.com/kingsportuy-bit/Sportex.git`.
- Verificado: `2026-09-26`.

## Campaña y tarea

- Campaña activa: `CAMP-20260803-001` - SPORTEX — Sistema Comercial Asistido de Delta.
- Proxima campaña: ninguna definida.
- Tarea tecnica: ninguna tarea activa.

## Objetivo actual

Analizar el informe integral de SPORTEX y definir con Fito el producto inicial y la arquitectura de una reestructuracion desde cero.

## Alcance actual

- Permitido: Inventariar producto, gobierno, arquitectura, tecnologias, codigo, infraestructura documentada, estado real, deuda y riesgos. | Entregar un documento Markdown autocontenido para analisis humano y por otra IA.
- Prohibido: No definir ni implementar todavia la arquitectura de reemplazo ni cambiar reglas de negocio o contratos funcionales. | No desplegar, migrar, enviar mensajes, consultar datos reales ni operar PILOTO_DELTA o PRODUCCION_COMERCIAL.

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
- La identidad compartida del checkout usa Git root, projectRoot relativo, rama y remote; nunca una ruta absoluta local.

## Estado operativo registrado

- Migraciones: `MIGRACIONES_002_003_004_005_006_008_009_010_011_APLICADAS_PILOTO_DELTA_PASS_25_RLS`; ejecutadas 9; pendientes 0.
- Pruebas: `PASS`; ultima ejecucion `2026-09-26`.
- Despliegues: `PILOTO_DELTA_D9C4F44_VISUAL_FIX_VERIFIED`; registros 31.
- Integraciones: GitHub=`REMOTE_D9C4F44_VISUAL_FIX_RECONCILED` | Supabase=`PILOTO_DELTA_25_TABLAS_RLS_FORZADO_CONFIGURACION_011` | Evolution API=`DELTA_OPEN_UPSERT_UPDATE_BASE64_ACTIVE_MANUAL_OUTBOUND_ON` | VPS / runtime=`PILOTO_DELTA_RUNTIME_D9C4F44_HEALTHY`
- Datos sensibles: `METADATA_REMOTA_MINIMIZADA_SIN_CONTENIDO`. Consulta remota sanitizada; sin valores de secretos, telefonos, conversaciones ni datos reales en Git.

## Ultima evidencia verificable

- Tarea: `TASK-20260926-002`.
- Fecha: `2026-09-26`.
- Fuente: `docs/evidencias/TASK-20260926-002_INFORME_INTEGRAL_REESTRUCTURACION.md`.
- Informe integral de producto, gobierno, arquitectura, tecnologias, implementacion, legado, deuda y decisiones de reestructuracion, sin operaciones remotas.

## Riesgos

- El release observado 8823a773 no aparece en los refs remotos actuales; su imagen ejecutada se preserva como rollback y la deuda de trazabilidad queda registrada.
- Las transiciones comerciales y de pedido requieren validación punta a punta antes de presentarse como operativas.
- 4 vulnerabilidades altas siguen en TASK-20260801-002.
- El primer envio manual desde SPORTEX todavia no fue realizado; no se contacto a un destinatario real durante el corte.
- Los contactos ambiguos se rechazan correctamente, pero el logger aun los presenta con severidad de error.

## Bloqueos

- Ninguno.

## Siguientes acciones

- Fito y la IA externa analizan el informe integral y delimitan el producto inicial.
- Abrir una tarea posterior para aprobar producto, contratos y arquitectura objetivo antes de implementar.
