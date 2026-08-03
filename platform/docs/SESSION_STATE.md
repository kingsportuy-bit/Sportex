# Estado vivo SPORTEX

> GENERADO desde `docs/state/PROJECT_STATE.json`. No editar manualmente.

Actualizado: 2026-08-03.

## Entorno de trabajo

- Entorno actual: `DESARROLLO_LOCAL`.
- Entornos permitidos: `DOCUMENTACION, DESARROLLO_LOCAL`.
- Entornos prohibidos: `PILOTO_DELTA, PRODUCCION_COMERCIAL`.
- Objetivo operativo futuro: `PILOTO_DELTA`.
- Intencion actual: `idle`.

## Git

- Worktree: `C:/Users/Fito/Documents/CODEX/SPORTEX`.
- Rama: `sportex-governance-20260801`.
- Remote: `https://github.com/kingsportuy-bit/Sportex.git`.
- Verificado: `2026-08-03`.

## Campaña y tarea

- Campaña activa: `CAMP-20260803-001` - SPORTEX — Sistema Comercial Asistido de Delta.
- Proxima campaña: ninguna definida.
- Tarea tecnica: ninguna tarea activa.

## Objetivo actual

CAMP-20260803-001 sigue activa con el commit remoto 66c4aad verificado y espera autorizacion de Fito para su siguiente tarea.

## Alcance actual

- Permitido: Lectura y verificacion local de la primera vertical y su evidencia remota. | Documentacion de continuidad de CAMP-20260803-001.
- Prohibido: Nueva tarea o ampliacion de CAMP-20260803-001 sin autorizacion de Fito. | Codigo o cambios funcionales fuera de una tarea aprobada. | PILOTO_DELTA, produccion, deploy, integraciones, mensajes o datos reales.

## Decisiones vigentes

- DELTA dirige producto y valida el piloto; SPORTEX conserva la verdad tecnica.
- SPORTEX usa un worktree Git independiente en C:/Users/Fito/Documents/CODEX/SPORTEX.
- No existe STAGING permanente separado: el entorno real previo al mercado es PILOTO_DELTA.
- PILOTO_DELTA usa controles de produccion y cada mutacion remota requiere permiso explicito.
- PRODUCCION_COMERCIAL queda bloqueado hasta validacion de Delta y GO especifico de Fito.
- El Core decide negocio; frontend, WhatsApp y Evolution son superficies o adaptadores.
- Solo puede existir una tarea activa y las vistas de estado son generadas.
- PROJECT_STATE.json es la unica fuente canonica del contexto vivo; CAMPAIGN_STATE.json es una vista generada.
- El cierre local valida documentacion, codigo, pruebas y pendientes, pero no autoriza operaciones remotas.
- La primera vertical comercial usa fixtures ficticios, memoria efimera y no expone replay fuera del guard local triple.

## Estado operativo registrado

- Migraciones: `NO_EJECUTADAS_EN_ESTA_TAREA`; ejecutadas 0; pendientes 1.
- Pruebas: `PASS`; ultima ejecucion `2026-08-03`.
- Despliegues: `SIN_CAMBIOS_EN_ESTA_TAREA`; registros 0.
- Integraciones: GitHub=`REMOTE_COMMIT_VERIFICADO` | Supabase=`NO_REVALIDADA_EN_ESTA_TAREA` | Evolution API=`NO_REVALIDADA_EN_ESTA_TAREA` | VPS / runtime=`NO_REVALIDADO_EN_ESTA_TAREA`
- Datos sensibles: `NO_ACCEDIDA_NI_ALMACENADA`. Secretos, tokens, credenciales, telefonos, conversaciones y datos reales permanecen fuera de Git, tareas, evidencias y salidas del workflow.

## Ultima evidencia verificable

- Tarea: `TASK-20260803-003`.
- Fecha: `2026-08-03`.
- Fuente: `docs/evidencias/TASK-20260803-003_PUSH_REMOTO_RECONCILIADO.md`.
- Estado y vistas reconciliados con el commit remoto 66c4aad; validacion integral en PASS y cambios funcionales 0.

## Riesgos

- La primera vertical es intencionalmente efimera y no demuestra persistencia ni operacion real.
- El commit remoto 66c4aad prueba codigo y documentacion versionados, no runtime ni operacion real.
- TASK-20260801-002 mantiene pendientes tres vulnerabilidades altas de dependencias.
- Los snapshots de integraciones y runtime envejecen y no autorizan escrituras.

## Bloqueos

- TASK-20260719-007 debe replantearse al nuevo modelo PILOTO_DELTA antes de cualquier operacion.
- El estado runtime de julio de 2026 es historico y requiere revalidacion.
- npm audit detecto tres vulnerabilidades altas; TASK-20260801-002 esta en cola.

## Siguientes acciones

- Esperar autorizacion explicita de Fito antes de abrir la siguiente tarea de CAMP-20260803-001.
- Mantener TASK-20260801-002 y TASK-20260719-007 en cola hasta una nueva prioridad explicita.
