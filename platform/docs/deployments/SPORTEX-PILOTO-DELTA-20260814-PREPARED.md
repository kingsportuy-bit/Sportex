# SPORTEX PILOTO_DELTA — paquete preparado

- Estado: `DEPLOYED_RECEIPTS_ACTIVE_UNSUPPORTED_EVENT_FIX_PENDING`
- Fecha: 2026-08-14
- Task: `TASK-20260814-001`
- Commit de runtime: `34c9664607e9e0483f5a1dfb6164c7b572b676cb`
- Destino: `sportex_staging_core`
- URL: `https://sportex-staging.codexa.uy`
- Evolution: version `2.3.7`, instancia `DELTA`
- Tenant: `08c2b814-2722-44f0-b40a-0271ad8a918b` (`delta-sport`)
- Actor tecnico/operador: `477880cf-8d44-4cb7-aed2-b8fe211fb0b0`
- Outbound actual: `false`
- Imagen desplegada: `sportex-staging:34c9664607e9e048`
- Image ID: `sha256:79ed9f869499780dc6ff864a9e02e14367ef8a904a86657c9a5107b30b7dba3a`
- Hotfix desplegado: `d871d2eea627d6a65b7721feaa6a53d0c1c0e487`
- Siguiente candidato: `f6a92770b2539975216e81f96fcffc00b4afcb03`

## Orden exacto propuesto

1. Revalidar commit, servicios, instancia `DELTA`, tenant y cero drift nuevo.
2. Crear `pg_dump` de los objetos `sportex_staging_*`, verificar hash y ensayar
   restore en una base aislada antes de tocar STAGING.
3. Aplicar, en orden, `20260814_002`, `20260814_003` y `20260814_004`.
4. Ejecutar `delta_pilot.sql` con los IDs anteriores para agregar capacidades
   comerciales sin crear otro tenant ni otro actor.
5. Construir una imagen inmutable desde el commit de runtime y registrar digest.
6. Crear los secretos Docker `sportex_delta_webhook_secret_v1` y
   `sportex_delta_evolution_api_key_v1`; nunca imprimir sus valores.
7. Desplegar `sportex_staging_core` con ingreso `true`, outbound `false`, tenant,
   actor, release y digest exactos.
8. Verificar `/health`, `/ready`, `/v1/public-config`, login, tenant, tablas, RLS
   y que el compositor indique recepcion activa con envio deshabilitado.
9. Configurar en `DELTA` el webhook
   `https://sportex-staging.codexa.uy/v1/webhooks/evolution`, header secreto y
   eventos `MESSAGES_UPSERT` + `MESSAGES_UPDATE`.
10. Enviar desde un telefono controlado un unico mensaje entrante a DELTA y
    comprobar journal -> proyeccion -> bandeja. No responder desde SPORTEX.
11. Observar duplicados, cuarentena, lag, tenant y estado de Evolution. Mantener
    Meta/ADS y otros inboxes sin cambios.

## PASS captura pasiva

- runtime reporta el digest desplegado;
- migrations `002/003/004` y RLS PASS;
- `DELTA` conserva estado `open` y un solo webhook esperado;
- evento repetido no duplica mensaje ni oportunidad;
- una conversacion entrante aparece en la interfaz con contacto correcto;
- clasificacion, proxima accion y seguimiento interno funcionan;
- outbound sigue `false` y no existe mensaje saliente SPORTEX;
- cero cambio en Ads, otros tenants, instancias o servicios.

## Rollback

1. Poner ingreso y outbound en `false` y retirar el webhook de `DELTA`.
2. Conservar journal y proyecciones para auditoria; no borrar conversaciones.
3. Replegar el artefacto anterior `sportex-staging:ea02fc0` si el esquema nuevo
   no impide su arranque.
4. Las migraciones son aditivas. No ejecutar down tras capturar datos reales;
   restaurar el dump solo ante corrupcion demostrada y con una autorizacion
   destructiva separada.

Disparadores: tenant/destinatario incorrecto, duplicado, webhook repetido,
secreto expuesto, perdida de trazabilidad, outbound inesperado o migracion sin
restore verificado.

## Gate posterior separado

El envio manual desde SPORTEX esta implementado pero no autorizado. Su canary
requiere otro GO con destinatario controlado, texto visible, outbound `true`
solo durante la prueba y verificacion de `SENT/DELIVERED` sin duplicados.
