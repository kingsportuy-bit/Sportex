# Evidencia — cronología operativa en PILOTO_DELTA

- Fecha: 2026-08-15
- Tarea: `TASK-20260815-001`
- Entorno: `PILOTO_DELTA`
- URL: `https://sportex.codexa.uy`
- Rama: `sportex-governance-20260801`
- Commit remoto y desplegado:
  `72e0fc2a7abfdecd1293e9b3b3aa44acec5ca35e`
- GO exacto:
  `GO SPORTEX TASK-20260815-001 72e0fc2a7abfdecd1293e9b3b3aa44acec5ca35e PILOTO_DELTA`

## Fuente y artefacto

- Release guard: PASS contra `origin` y worktree desprendido limpio.
- Bundle `git archive`:
  `f0cb3b492f1e71047b6b430e891e52ac083b8a41821b8c92df4ac177007f6f2f`.
- Imagen: `sportex-staging:72e0fc2a7abfdecd`.
- Image ID/digest local de Swarm:
  `sha256:81d4d89919b94090881bff621d441257f561206fb1fc8c506fb525972ca4aeac`.
- La imagen conserva etiquetas con commit y hash del bundle exactos.
- Build TypeScript PASS. La deuda conocida de cuatro vulnerabilidades altas de
  dependencias permanece en `TASK-20260801-002`.

## Backup y migración 005

- Inventario anterior: 16 tablas `sportex_staging_*`, las 16 con RLS forzado;
  rol `sportex_staging_app` presente y tabla de cronología ausente.
- Backup:
  `/var/backups/sportex/task-20260815-001-72e0fc2/pre-005.dump`.
- SHA256 del backup:
  `752e52660aa786a602b6f6883abe7899a53aee0ef2cacca6127f23fdcc92dea5`.
- Restore aislado PASS: 16 tablas restauradas y 16 con RLS; el contenedor
  efímero fue retirado.
- Migración aplicada primero:
  `20260815_005_conversation_timeline.up.sql`.
- Resultado: 17 tablas, 17 con RLS, tabla nueva con `ENABLE` y `FORCE RLS`, una
  policy tenant-aware y permisos acotados al rol de aplicación.
- Backfill: 21 actividades fuente y 21 eventos persistidos.
- Mensajes antes/después de migrar: `146 -> 146`.
- Prueba directa con rol de aplicación: tenant propio `21`; tenant ajeno `0`.

## Promoción y flags

- Especificación previa respaldada en:
  `/var/backups/sportex/task-20260815-001-72e0fc2/pre-deploy-service.json`.
- SHA256 de la especificación previa:
  `35895658edae8ca1cb7ad7e53a0da7359d7e49547d05b85c37736f64da4566fe`.
- La imagen se promovió primero con
  `SPORTEX_CONVERSATION_TIMELINE_ENABLED=false`.
- Con el flag apagado pasaron `/health`, `/ready`, config pública, readiness de
  la tabla 005 y lectura de workspace: 21 items, 146 mensajes y 21 eventos.
- Solo después del smoke se activó el flag en `true`; Swarm volvió a converger
  `1/1`, `update_state=completed` y contenedor `healthy`.
- Ingreso Evolution y envío manual existente permanecieron en `true`; no se
  activó bot, LLM, respuesta automática ni outbound IA.

## Smokes y observación

- `/health=200` con el release exacto.
- `/ready=200` con PostgreSQL, tabla 005 y Supabase disponibles.
- `/v1/public-config=200`, cronología `true` e ingreso Evolution `true`.
- `/v1/commercial/workspace` sin sesión devuelve `401`; falla cerrada PASS.
- Lectura service-level con el Core desplegado: 21 items, 146 mensajes y 21
  eventos operativos, sin exponer contenido en la evidencia.
- Evolution `DELTA`: consulta read-only `200`, estado `open`.
- URL pública: health, readiness, config, HTML y marca SPORTEX PASS.
- Observación: cuatro muestras consecutivas con `1/1`, update `completed`,
  contenedor `healthy`, readiness `200` y flag `true`.
- Logs: cero coincidencias `error|fatal|unhandled` en diez minutos.
- Desde el inicio del release: cero filas nuevas en outbox Core y cero filas
  nuevas en outbound WhatsApp; no se envió ningún mensaje.
- El control del navegador de la sesión no estaba disponible. La validación
  autenticada visual queda como aceptación humana posterior; no se sustituyó
  por una sesión o token privilegiado inventado.

## Rollback

1. Volver primero el servicio a
   `sportex-staging:3c8c9da25ba1fae3`, image ID
   `sha256:c4490a80809ea55df5c4a4814d4102d0a3381b7fb94e4f6f7a793f4bc7e356da`.
2. Verificar `1/1`, `/health`, `/ready`, Evolution y lectura WhatsApp.
3. Conservar `sportex_staging_conversation_timeline_events`; es aditiva y no
   bloquea la imagen anterior.
4. Un eventual `down` es un gate destructivo separado y nunca antecede al
   rollback de imagen ni elimina mensajes, journal, outbox o `activity_data`.

## Límites y pendientes

- No se tocó DELTA ADS ni `PRODUCCION_COMERCIAL`.
- No se configuró proveedor, prompt, job, worker, propuesta o envío IA.
- No se enviaron mensajes reales como prueba.
- El primer recorrido visual autenticado por Fito sigue siendo aceptación
  humana, no una deuda técnica del deployment.
