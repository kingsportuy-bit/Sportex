# Estado vivo SPORTEX

> GENERADO desde `docs/state/PROJECT_STATE.json`. No editar manualmente.

Actualizado: 2026-08-16.

## Entorno de trabajo

- Entorno actual: `PILOTO_DELTA`.
- Entornos permitidos: `DOCUMENTACION, DESARROLLO_LOCAL, PILOTO_DELTA`.
- Entornos prohibidos: `PRODUCCION_COMERCIAL`.
- Objetivo operativo futuro: `PILOTO_DELTA`.
- Intencion actual: `guidance`.

## Git

- Worktree: `C:/Users/Fito/Documents/CODEX/SPORTEX`.
- Rama: `sportex-governance-20260801`.
- Remote: `https://github.com/kingsportuy-bit/Sportex.git`.
- Verificado: `2026-08-16`.

## Campaña y tarea

- Campaña activa: `CAMP-20260803-001` - SPORTEX — Sistema Comercial Asistido de Delta.
- Proxima campaña: ninguna definida.
- Tarea tecnica: ninguna tarea activa.

## Objetivo actual

Mantener estable el PILOTO_DELTA con media y no leidos activos, sin mensajes reales no autorizados.

## Alcance actual

- Permitido: Observar la salud y continuidad documental del piloto en solo lectura. | Preparar tareas locales separadas para mejoras futuras.
- Prohibido: No enviar mensajes reales ni mutar PILOTO_DELTA sin otra task y GO exacto.

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

## Estado operativo registrado

- Migraciones: `MIGRACIONES_002_003_004_005_006_APLICADAS_PILOTO_DELTA_PASS`; ejecutadas 5; pendientes 0.
- Pruebas: `PASS`; ultima ejecucion `2026-08-16`.
- Despliegues: `PILOTO_DELTA_C6B3B5B_MEDIA_UNREAD_TECHNICAL_PASS`; registros 9.
- Integraciones: GitHub=`REMOTE_CANDIDATE_72E0FC2_DEPLOYED_VERIFIED` | Supabase=`PILOTO_DELTA_19_TABLAS_RLS_FORZADO_MEDIA_UNREAD_006` | Evolution API=`DELTA_OPEN_UPSERT_UPDATE_BASE64_ACTIVE_MANUAL_OUTBOUND_ON` | VPS / runtime=`PILOTO_DELTA_RUNTIME_C6B3B5B_PUBLIC_HEALTHY`
- Datos sensibles: `METADATA_REMOTA_MINIMIZADA_SIN_CONTENIDO`. Consulta remota sanitizada; sin valores de secretos, telefonos, conversaciones ni datos reales en Git.

## Ultima evidencia verificable

- Tarea: `TASK-20260816-004`.
- Fecha: `2026-08-16`.
- Fuente: `docs/evidencias/TASK-20260816-004_OPTIMIZACION_WORKFLOW.md`.
- Contexto guidance reducido 50,9 %, estado vivo 53,1 % al cierre y selectores/perfiles validados sin tocar runtime.

## Riesgos

- Cambiar etapas o estados comerciales desde WhatsApp todavia no esta verificado ni debe prometerse al operador.
- 4 vulnerabilidades altas siguen en TASK-20260801-002.
- El primer envio manual desde SPORTEX todavia no fue realizado; no se contacto a un destinatario real durante el corte.
- Los contactos ambiguos se rechazan correctamente, pero el logger aun los presenta con severidad de error.

## Bloqueos

- Ninguno.

## Siguientes acciones

- Mantener el piloto observado; cualquier canary real de imagen o primer envio requiere otro GO con destinatario controlado.
- Verificar sin asumir soporte el recorrido chat -> detalle -> cambio de etapa -> persistencia -> auditoria; si falta, abrir una feature separada.
- Usar sportex.codexa.uy y validar visualmente la cronologia con la sesion autenticada de Fito, sin convertir eventos en mensajes.
- Observar el primer envio manual solo cuando Fito lo elija; este release no envio mensajes.
- Mantener TASK-20260801-002 y TASK-20260719-007 en cola hasta nueva prioridad.
