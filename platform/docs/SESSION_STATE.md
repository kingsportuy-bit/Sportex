# Estado vivo SPORTEX

> GENERADO desde `docs/state/PROJECT_STATE.json`. No editar manualmente.

Actualizado: 2026-08-14.

## Entorno de trabajo

- Entorno actual: `PILOTO_DELTA`.
- Entornos permitidos: `DOCUMENTACION, DESARROLLO_LOCAL, PILOTO_DELTA`.
- Entornos prohibidos: `PRODUCCION_COMERCIAL`.
- Objetivo operativo futuro: `PILOTO_DELTA`.
- Intencion actual: `product`.

## Git

- Worktree: `C:/Users/Fito/Documents/CODEX/SPORTEX`.
- Rama: `sportex-governance-20260801`.
- Remote: `https://github.com/kingsportuy-bit/Sportex.git`.
- Verificado: `2026-08-14`.

## Campaña y tarea

- Campaña activa: `CAMP-20260803-001` - SPORTEX — Sistema Comercial Asistido de Delta.
- Proxima campaña: ninguna definida.
- Tarea tecnica: `TASK-20260814-001`: `in_progress` (docs/TASKS/active/TASK-20260814-001-integrar-whatsapp-real-delta.md).

## Objetivo actual

Conectar la interfaz WhatsApp-first aprobada al WhatsApp real de Delta y habilitar el recorrido comercial-productivo mínimo reutilizando la base existente.

## Alcance actual

- Permitido: Implementar y validar localmente el modelo comercial normalizado, persistencia, adaptadores simulados, proyecciones y funciones internas. | Reutilizar Core, UI, contratos, migraciones y tests existentes cuando cumplan su contrato. | Preparar gates, rollback y manifiesto para la conexión real posterior.
- Prohibido: Sin GO remoto exacto: integraciones reales, datos reales, mensajes, deploy, migraciones remotas, PILOTO_DELTA o producción comercial.

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

## Estado operativo registrado

- Migraciones: `MIGRACIONES_002_003_004_APLICADAS_PILOTO_DELTA_PASS`; ejecutadas 3; pendientes 0.
- Pruebas: `PASS`; ultima ejecucion `2026-08-14`.
- Despliegues: `PILOTO_DELTA_1CC2C96_PUBLIC_OPERATIONAL`; registros 4.
- Integraciones: GitHub=`REMOTE_CANDIDATE_F6A9277_VERIFIED` | Supabase=`PILOTO_DELTA_16_TABLAS_RLS_FORZADO` | Evolution API=`DELTA_OPEN_UPSERT_UPDATE_ACTIVE_MANUAL_OUTBOUND_ON` | VPS / runtime=`PILOTO_DELTA_RUNTIME_1CC2C96_PUBLIC_HEALTHY`
- Datos sensibles: `METADATA_REMOTA_MINIMIZADA_SIN_CONTENIDO`. Consulta remota sanitizada; sin valores de secretos, telefonos, conversaciones ni datos reales en Git.

## Ultima evidencia verificable

- Tarea: `TASK-20260814-001`.
- Fecha: `2026-08-14`.
- Fuente: `docs/evidencias/TASK-20260814-001_CONTINUIDAD_WHATSAPP_UI_PROD.md`.
- Continuidad WhatsApp/UI desplegada en PILOTO_DELTA sobre 1cc2c96; verificacion tecnica y login visual PASS, revision autenticada de Fito pendiente.

## Riesgos

- 4 vulnerabilidades altas siguen en TASK-20260801-002.
- El primer envio manual desde SPORTEX todavia no fue realizado; no se contacto a un destinatario real durante el corte.
- Los contactos ambiguos se rechazan correctamente, pero el logger aun los presenta con severidad de error.

## Bloqueos

- Ninguno.

## Siguientes acciones

- Usar sportex.codexa.uy como puesto operativo de Delta.
- Observar el primer envio manual elegido por Fito y confirmar SENT o DELIVERED sin duplicado.
- Fito revisa la experiencia autenticada y prueba el primer mensaje manual que elija.
- Mantener TASK-20260801-002 y TASK-20260719-007 en cola hasta nueva prioridad.
