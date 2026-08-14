# Evidencia - Gate 5 captura pasiva PILOTO_DELTA

- Fecha: 2026-08-14
- Tarea: `TASK-20260814-001`
- Entorno: `PILOTO_DELTA`
- GO: candidato `34c9664607e9e0483f5a1dfb6164c7b572b676cb`
- Outbound: `false`

## Resultado ejecutado

- Guard de release PASS; bundle `git archive` SHA256
  `5c8c311f5837dc4f79ff56d0389a424e1ad76c20f99273ba63da900f57e3d05f`.
- Backup `/var/backups/sportex/task-20260814-001-pre-migrations.dump`, SHA256
  `80d1264d8c95750444d70d897973a56ad2f0dbf067add4c25a495540af57f694`.
- Restore aislado PASS sobre las 9 tablas de origen; la base temporal se retiro.
- Migraciones `002/003/004` y seed DELTA PASS: 16 tablas, RLS forzado,
  tenant/membresia correctos y las 13 tablas legadas intactas.
- Imagen `sportex-staging:34c9664607e9e048`, ID
  `sha256:79ed9f869499780dc6ff864a9e02e14367ef8a904a86657c9a5107b30b7dba3a`.
- `sportex_staging_core` quedo `1/1`; health, readiness y release PASS.
- SPORTEX usa `codexanet` para la ruta privada Evolution -> Core.
- Evolution `2.3.7`, instancia `DELTA`, conserva estado `open` y webhook con
  header secreto. El secreto no fue impreso ni persistido en Git.

## Pruebas

- Payload Evolution QA ficticio: primera entrega `202`, repeticion
  `200 duplicate=true`, journal `1`, procesado `1`, mensaje `1`, outbox `0`.
- Header incorrecto: `401`.
- Endpoint de envio con outbound apagado: `409`.
- Cero WhatsApp saliente y cero cambio Meta/Ads.

## Hallazgo real y contencion

Evolution entrega `MESSAGES_UPDATE` plano (`keyId`, `remoteJid`, `status`) y el
candidato esperaba `data.key`. Los receipts se rechazaron antes de persistir,
sin salida, cruce de tenant ni corrupcion.

El webhook quedo temporalmente suscrito solo a `MESSAGES_UPSERT`. La captura
entrante permanece activa y outbound apagado. El fix focal publicado en
`d871d2eea627d6a65b7721feaa6a53d0c1c0e487` paso Core `42/42`, TypeScript,
build y SQL, pero aun no fue desplegado porque requiere GO ligado a ese SHA.

## Pendientes reales

- Promover `d871d2eea627d6a65b7721feaa6a53d0c1c0e487` y reactivar
  `MESSAGES_UPDATE`.
- `sportex-staging.codexa.uy` no tiene DNS. El Core funciona por red interna;
  no se usara `sportex.codexa.uy` legado sin decision explicita.
- El build reporta 4 vulnerabilidades altas de dependencias.
- Falta una entrada fisica o natural posterior al fix para aceptacion visible.

## Rollback disponible

- Deshabilitar webhook/ingreso y mantener outbound en `false`.
- Volver a `sportex-staging:ea02fc0`.
- Conservar journal/proyecciones; no ejecutar down tras datos reales.
