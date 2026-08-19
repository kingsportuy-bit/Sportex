# Estado vivo SPORTEX

> GENERADO desde `docs/state/PROJECT_STATE.json`. No editar manualmente.

Actualizado: 2026-08-19.

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
- Verificado: `2026-08-19`.

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
- PASS tecnico y aprobacion de producto son gates separados; Fito acepto el concepto WhatsApp primero y la interfaz local sigue en iteracion.
- CAMP-20260803-001 entrega la V1 por etapas; la Etapa 0 aprueba navegacion y recorrido antes de codigo.
- DELTA-DEC-012: Leads y Pedidos abren en tableros con detalles relacionados.
- SPORTEX-DEC-009: WhatsApp es una superficie separada; el primer corte operativo une conversacion, contexto y proxima accion.
- SPORTEX-DEC-011: mensajes y eventos operativos permanecen separados; el asistente futuro solo existe como contrato pasivo apagado.
- SPORTEX-DEC-014: el corte operativo de Delta conserva módulos y capas separadas; Leads y Pedidos son tableros derivados del Core.

## Estado operativo registrado

- Migraciones: `MIGRACIONES_002_003_004_005_006_008_009_010_APLICADAS_PILOTO_DELTA_PASS`; ejecutadas 8; pendientes 0.
- Pruebas: `PASS`; ultima ejecucion `2026-08-19`.
- Despliegues: `PILOTO_DELTA_9A570C3_SESSION_RESTORE_LOGIN_FLASH_FIXED`; registros 17.
- Integraciones: GitHub=`REMOTE_CANDIDATE_72E0FC2_DEPLOYED_VERIFIED` | Supabase=`PILOTO_DELTA_19_TABLAS_RLS_FORZADO_MEDIA_UNREAD_006` | Evolution API=`DELTA_OPEN_UPSERT_UPDATE_BASE64_ACTIVE_MANUAL_OUTBOUND_ON` | VPS / runtime=`PILOTO_DELTA_RUNTIME_C6B3B5B_PUBLIC_HEALTHY`
- Datos sensibles: `METADATA_REMOTA_MINIMIZADA_SIN_CONTENIDO`. Consulta remota sanitizada; sin valores de secretos, telefonos, conversaciones ni datos reales en Git.

## Ultima evidencia verificable

- Tarea: `TASK-20260816-004`.
- Fecha: `2026-08-16`.
- Fuente: `docs/evidencias/TASK-20260816-004_OPTIMIZACION_WORKFLOW.md`.
- Contexto guidance reducido 50,9 %, estado vivo 53,1 % al cierre y selectores/perfiles validados sin tocar runtime.

## Riesgos

- Las transiciones comerciales y de pedido requieren validación punta a punta antes de presentarse como operativas.
- 4 vulnerabilidades altas siguen en TASK-20260801-002.
- El primer envio manual desde SPORTEX todavia no fue realizado; no se contacto a un destinatario real durante el corte.
- Los contactos ambiguos se rechazan correctamente, pero el logger aun los presenta con severidad de error.

## Bloqueos

- Ninguno.

## Siguientes acciones

- Implementar y validar TASK-20260817-001 por capas, con tableros de Leads y Pedidos como proyecciones del Core.
- Preparar release PILOTO_DELTA y ejecutar solo la prueba controlada autorizada, sin outbound.
- Mantener TASK-20260801-002 y TASK-20260719-007 en cola hasta nueva prioridad.
