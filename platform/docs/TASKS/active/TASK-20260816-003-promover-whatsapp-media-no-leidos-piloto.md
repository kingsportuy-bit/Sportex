# Promover imágenes y no leídos al piloto Delta

id: TASK-20260816-003
owner: Codex
requester: Fito
estado: in_progress
lifecycle: active
work_type: operacion
campaign: CAMP-20260803-001
context_focus: deploy
development_guide_impact: required
updated_at: 2026-08-16

## objetivo

Promover el candidato certificado de imágenes manuales y no leídos a
`PILOTO_DELTA` con backup restaurable, migración 006 primero, flags y Evolution
Base64, sin enviar mensajes reales.

## alcance_permitido

- Crear, validar, commitear y publicar un candidato exacto.
- Inventariar runtime, servicio, DB, Evolution y configuración previa.
- Tomar backup, verificar hash y ensayar restore aislado.
- Aplicar `20260816_006`, activar flags y Base64, desplegar y observar.
- Verificar health, ready, config, RLS, aislamiento, UI y cero outbound nuevo.

## alcance_prohibido

- Enviar mensajes reales, crear conversaciones o usar destinatarios como canary.
- Tocar Meta/ADS, otros tenants, instancias, servicios o `PRODUCCION_COMERCIAL`.
- Exponer secretos o contenido real en logs/documentación.
- Ejecutar down/restore destructivo sin un gate separado.
- Incluir `logo-sportex.png` ajeno al proyecto.

## entradas

- GO exacto de Fito del 2026-08-16 para backup, migración 006, Evolution,
  flags, deploy y verificación sin mensajes reales.
- `TASK-20260816-001` y `TASK-20260816-002` cerradas con PASS local.
- Runtime previo `72e0fc2a7abfdecd`, servicio `sportex_staging_core` 1/1.

## salidas

- Commit, bundle e imagen inmutables.
- Backup/restore, migración, flags, Evolution, smokes y observación registrados.
- `docs/evidencias/TASK-20260816-003_PILOTO_DELTA_MEDIA_NO_LEIDOS.md`.

## validacion

- Release guard PASS con commit remoto y GO ligado al SHA.
- Backup con hash y restore aislado; 19 tablas/RLS y cruce tenant cero.
- Migración antes de imagen; flags después de readiness.
- Servicio 1/1 healthy, endpoints PASS y cero outbound/mensajes nuevos.
- QA autenticada claro/noche y desktop/mobile sin regresión.

## evidencia

- `docs/evidencias/TASK-20260816-003_PILOTO_DELTA_MEDIA_NO_LEIDOS.md`.

## rollback

- Imagen primero a `sportex-staging:72e0fc2a7abfdecd` y verificar `/ready`.
- Apagar flags y Base64; conservar tablas aditivas.
- `down` o restore solo con autorización destructiva separada.

## deuda_restante

- Ejecución remota y observación técnica completas con PASS.
- Pendiente QA productiva autenticada claro/noche y desktop/mobile; el navegador
  espera el clic de ingreso de Fito con credenciales autocompletadas.
- El primer mensaje real sigue fuera de esta task.

## registro_de_avances

### 2026-08-16 - GO y preflight

- Fito autorizó el alcance remoto exacto sin mensajes reales.
- Runtime previo observado en `72e0fc2a7abfdecd`, 1/1.
- El release guard exige publicar primero el commit exacto.

### 2026-08-16 - release técnico

- Backup `d3fc73ff...` restaurado y migración 006 ensayada de 17 a 19 tablas.
- Migración real aplicada antes de la imagen; 19/19 tablas con RLS forzado.
- Imagen `sportex-staging:c6b3b5b07c63704`, flags activas y Evolution Base64
  activo preservando el resto del webhook.
- Runtime `1/1`, healthy, `DELTA=open`, tres muestras sin errores y cero
  outbound nuevo; el outbox permaneció vacío.
- Login productivo oscuro PASS sin blancos ni overflow. QA autenticada queda
  retenida hasta que Fito confirme el ingreso en la pestaña visible.

## decisiones

- Promoción production-first solo para el piloto único de Delta.
- Migración primero; rollback de imagen antes que cualquier down.
