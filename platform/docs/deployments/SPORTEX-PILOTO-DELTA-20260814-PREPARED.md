# SPORTEX PILOTO_DELTA — paquete preparado

- Estado: `PILOTO_DELTA_PUBLIC_OPERATIONAL`
- Fecha: 2026-08-14
- Task: `TASK-20260814-001`
- Commit de runtime: `34c9664607e9e0483f5a1dfb6164c7b572b676cb`
- Destino: `sportex_staging_core`
- URL: `https://sportex.codexa.uy`
- Evolution: version `2.3.7`, instancia `DELTA`
- Tenant: `08c2b814-2722-44f0-b40a-0271ad8a918b` (`delta-sport`)
- Actor tecnico/operador: `477880cf-8d44-4cb7-aed2-b8fe211fb0b0`
- Outbound actual: `true`, exclusivamente manual y con confirmacion humana
- Imagen desplegada: `sportex-staging:34c9664607e9e048`
- Image ID: `sha256:79ed9f869499780dc6ff864a9e02e14367ef8a904a86657c9a5107b30b7dba3a`
- Hotfix desplegado: `d871d2eea627d6a65b7721feaa6a53d0c1c0e487`
- Siguiente candidato: `f6a92770b2539975216e81f96fcffc00b4afcb03`
- Candidato desplegado: `f6a92770b2539975216e81f96fcffc00b4afcb03`
- Imagen desplegada final: `sportex-staging:f6a92770b2539975`
- Image ID final: `sha256:6663af0f404b7481612dd42950d85336259573cf6b62fba3e7866602543e59f7`
- Candidato de continuidad desplegado: `1cc2c96fe8f8e0f8215ce5a804dd1ad775982c45`
- Imagen de continuidad: `sportex-staging:1cc2c96fe8f8e0f`
- Image ID de continuidad: `sha256:f114b0f75d84c5b67b714a457bd935eb4faae806d554243e600c25a1d8f16846`
- Rollback inmediato de este corte: `sportex-staging:f6a92770b2539975`
- Candidato de identidad SPORTEX desplegado: `a7ceb9b73d53777b7c3a5a5beda9d84f794fe8f9`
- Imagen de identidad: `sportex-staging:a7ceb9b73d53777b`
- Image ID de identidad: `sha256:0a83a6d730afb1e126e78e68fb1928d9c97e64f2ec3e16dbcbdd55785246fe13`
- Rollback inmediato de identidad: `sportex-staging:1cc2c96fe8f8e0f`
- Candidato de logo transparente desplegado: `c375e58cfc19f894623a9a4cf8caa9a43723b395`
- Imagen transparente: `sportex-staging:c375e58cfc19f894`
- Image ID transparente: `sha256:6dcd081e23201d89c9a25d0637cdb2b0a7637e59c73bd694e8152e93493161ec`
- Rollback inmediato de transparencia: `sportex-staging:a7ceb9b73d53777b`
- Candidato de favicon desplegado: `3c8c9da25ba1fae38f4d60d4ef37253ddf69edcf`
- Imagen de favicon: `sportex-staging:3c8c9da25ba1fae3`
- Image ID de favicon: `sha256:c4490a80809ea55df5c4a4814d4102d0a3381b7fb94e4f6f7a793f4bc7e356da`
- Rollback inmediato de favicon: `sportex-staging:c375e58cfc19f894`

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

## Addendum TASK-20260815-001 — cronología operativa

- Estado: tercer candidato corregido local pendiente de re-review; no publicado.
- Migración requerida antes de la imagen: `20260815_005_conversation_timeline`.
- Preflight: backup/restore, legado válido, rol app y RLS cross-tenant.
- Smoke migration-first: tabla `005`, workspace comercial y `/ready=200` antes
  de aceptar tráfico; el flag visual `OFF` no oculta la dependencia.
- Activación propuesta: flag visual `true` solo después del smoke.
- Rollback inmediato de imagen: `sportex-staging:3c8c9da25ba1fae3`.
- Orden de rollback: volver primero a esa imagen y verificarla; conservar la
  tabla aditiva. Un eventual `down` posterior necesita otro gate y nunca toca
  mensajes, journal, outbox ni `activity_data`.
