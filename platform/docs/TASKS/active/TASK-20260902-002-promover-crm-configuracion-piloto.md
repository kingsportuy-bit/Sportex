# Promover CRM y configuración de empresa al piloto

id: TASK-20260902-002
owner: Codex
requester: Fito
estado: in_progress
lifecycle: active
work_type: operacion
campaign: CAMP-20260803-001
context_focus: deploy
development_guide_impact: none
updated_at: 2026-09-02
plan_authorization: PLAN_APPROVED_AUTHORIZED

## objetivo

Promover a `PILOTO_DELTA` el CRM reorganizado y la configuración tenant-aware
de empresa implementados en `TASK-20260902-001`, con migración aditiva,
capacidades mínimas, artefacto inmutable, backup, rollback y verificación.

## alcance_permitido

- Versionar y publicar el candidato exacto derivado del trabajo local aprobado.
- Inventariar el runtime, la base, el tenant y las capacidades vigentes sin
  exponer secretos ni contenido de clientes.
- Respaldar y ensayar la restauración de objetos `sportex_staging_*` antes de
  aplicar `20260902_011_company_configuration`.
- Aplicar la migración 011, verificar RLS/aislamiento y otorgar solamente
  `company.read`/`company.manage` a los operadores Delta ya autorizados.
- Desplegar el Core/frontend exactos, observar y verificar health, ready, login,
  Leads, Clientes, Pedidos y Mi empresa sin generar mensajes ni pedidos.

## alcance_prohibido

- Enviar mensajes, responder conversaciones, crear pedidos, certificar pagos o
  modificar datos comerciales reales durante la verificación.
- Cambiar Evolution, webhooks, outbound, Meta Ads, DNS, secretos, otros tenants,
  servicios compartidos o `PRODUCCION_COMERCIAL`.
- Ejecutar el `down` de 011, restaurar datos o eliminar tablas sin un gate
  destructivo posterior y autorización específica.
- Incluir cambios ajenos al alcance de `TASK-20260902-001` y esta operación.

## entradas

- Aprobación de Fito del 2026-09-02 para aplicar los cambios y probarlos en la
  producción restringida `PILOTO_DELTA`.
- `TASK-20260902-001` cerrada con suite completa y QA local PASS.
- Runtime observado sano en release `8823a77365f78f25db9fbf7afb5decd21e59f547`,
  imagen `sportex-staging:8823a77365f78f25` y servicio 1/1.

## salidas

- Commit remoto, bundle e imagen inmutables identificados.
- Backup/restore, migración, capacidades, smoke y observación registrados.
- `docs/evidencias/TASK-20260902-002_PILOTO_DELTA_CRM_CONFIGURACION.md`.

## validacion

- Release guard PASS desde commit remoto y scope exacto.
- Backup con hash y restore aislado; migración 011 ensayada y aplicada antes de
  la imagen; 25 tablas esperadas con RLS forzado y aislamiento negativo.
- Servicio 1/1 healthy, `/health` y `/ready` 200, release exacto y cero errores
  atribuibles al despliegue.
- Login y navegación autenticada de solo lectura en desktop/móvil; Mi empresa
  visible únicamente con capacidades correctas.
- No invocar endpoints de envío, conversión, pago ni escritura comercial.

## criterio_de_detencion

Detener y no promover si falla el backup/restore, la migración aislada, RLS,
aislamiento, release guard o build. Revertir la imagen si Swarm no converge,
health/ready fallan, aparece una regresión de login/navegación o surgen errores
repetidos atribuibles al candidato.

## evidencia

`docs/evidencias/TASK-20260902-002_PILOTO_DELTA_CRM_CONFIGURACION.md`.

## rollback

- Volver primero a `sportex-staging:8823a77365f78f25` y verificar servicio 1/1,
  `/health` y `/ready`.
- Restaurar las capacidades previas desde el respaldo si la autorización queda
  incorrecta.
- Conservar las tablas aditivas de 011; `down` o restore real requieren otra
  autorización por ser destructivos.

## deuda_restante

- Esta promoción no certifica envíos reales, conversión comercial, reposiciones
  ni uso por empresas distintas de Delta.
- La trazabilidad del release previo 8823a773 no aparece en los refs remotos
  observados y queda registrada como deuda histórica, sin impedir usar su imagen
  actualmente ejecutada como rollback operativo.

## registro_de_avances

### 2026-09-02 - autorización y preflight inicial

- Fito autorizó aplicar el cambio en la producción restringida del piloto.
- Runtime público observado con health/ready 200 y servicio 1/1.
- Se fijó rollback image-first a la imagen actualmente ejecutada.
- No se modificaron aún DB, runtime, capacidades, Evolution ni datos reales.

### 2026-09-02 - certificación local del candidato

- El readiness PostgreSQL ahora referencia las cinco tablas de configuración y
  falla si la migración 011 no está realmente disponible para el rol runtime.
- El seed controlado de Delta incorpora `company.read` y `company.manage`.
- `git diff --check` PASS con aviso informativo de normalización CRLF/LF.
- `npm run validate` PASS inicial: 26/26 workflow, 59/59 Core/API; el inventario
  remoto detectó que el gate SQL debía contar 25 tablas incluyendo
  `stage_definitions`, por lo que se corrigió y recertificó antes del deploy.
- RLS forzado, documentación completa, TypeScript y build.
- No hubo todavía mutación remota.

## decisiones

- La verificación será de solo lectura y sin mensajes reales.
- La migración aditiva precede a la imagen; el rollback vuelve primero a la
  imagen anterior y conserva las tablas nuevas.
