# Estado vivo SPORTEX

> GENERADO desde `docs/state/PROJECT_STATE.json`. No editar manualmente.

Actualizado: 2026-08-14.

## Entorno de trabajo

- Entorno actual: `DESARROLLO_LOCAL`.
- Entornos permitidos: `DOCUMENTACION, DESARROLLO_LOCAL`.
- Entornos prohibidos: `PILOTO_DELTA, PRODUCCION_COMERCIAL`.
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

- Migraciones: `MIGRACION_COMERCIAL_DEFINIDA_NO_EJECUTADA`; ejecutadas 0; pendientes 1.
- Pruebas: `PASS`; ultima ejecucion `2026-08-14`.
- Despliegues: `SIN_CAMBIOS_EN_ESTA_TAREA`; registros 0.
- Integraciones: GitHub=`REMOTE_COMMIT_VERIFICADO` | Supabase=`NO_ACCEDIDA_EN_ESTA_TAREA` | Evolution API=`NO_ACCEDIDA_EN_ESTA_TAREA` | VPS / runtime=`NO_ACCEDIDA_EN_ESTA_TAREA`
- Datos sensibles: `NO_ACCEDIDA_NI_ALMACENADA`. Secretos, tokens, credenciales, telefonos, conversaciones y datos reales permanecen fuera de Git, tareas, evidencias y la demo.

## Ultima evidencia verificable

- Tarea: `TASK-20260814-001`.
- Fecha: `2026-08-14`.
- Fuente: `docs/evidencias/TASK-20260814-001_INVENTARIO_Y_PLAN.md`.
- Gate 1A integra la ficha comercial y el Core transaccional: seña validada crea Cliente, Pago y Pedido único desde Detalles de WhatsApp.

## Riesgos

- El corte UI y Gate 1 permanecen locales; aún no tienen push ni autorización remota.
- TASK-20260801-002 mantiene pendientes tres vulnerabilidades altas de dependencias.
- Los snapshots remotos no autorizan escrituras.

## Bloqueos

- TASK-20260719-007 debe replantearse al nuevo modelo PILOTO_DELTA antes de cualquier operacion.
- El estado runtime de julio de 2026 es historico y requiere revalidacion.
- npm audit detecto tres vulnerabilidades altas; TASK-20260801-002 esta en cola.

## Siguientes acciones

- Implementar Gate 2 con Evolution simulado, idempotencia, ordering, receipts, backfill y worker falso.
- Probar la conexión continua y el envío manual falso antes de solicitar cualquier GO remoto.
- Mantener TASK-20260801-002 y TASK-20260719-007 en cola hasta nueva prioridad.
