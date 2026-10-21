# Corregir arranque del lienzo desplegado

id: TASK-20261020-008
owner: Codex
requester: Fito
estado: done
lifecycle: closed
work_type: operacion
campaign: CAMP-20260803-001
context_focus: infrastructure
development_guide_impact: none
plan_authorization: PLAN_APPROVED_AUTHORIZED
updated_at: 2026-10-20

## objetivo

Aplicar y dibujar configuracion al iniciar sin error ni accion manual posterior.

## alcance_permitido

Corregir arranque desplegado deee450, pruebas remotas, Git, backup y release.
Fito mantiene instruccion de trabajar sobre el desplegado del turno anterior.

## alcance_prohibido

No cambiar configuraciones guardadas, logos, fuentes ni bocetos. Sin IA paga,
cuellos, cuentas QA, CRM, legado ni DNS. No borrar cache para ocultar el fallo.

## entradas

Captura y reporte: arranque con base HTML y error; accion manual actualiza vista.
Guardado/publicacion confirmados correctos por Fito.

## salidas

Primer dibujo con parametros aplicados; opciones y guardado/publicacion conservados.

## validacion

Reproducir error con DOM derivado del HTML real; init/restore y primer render en
fixtures sin interaccion. Candidato remoto y hashes HTTPS, backup/restore.

## evidencia

docs/evidencias/TASK-20261020-008_ARRANQUE_LIENZO.md

## rollback

Volver a imagen deee450 en mismo volumen, snapshot consistente previo.

## deuda_restante

QA visual manual de Fito; navegador interno deshabilitado. Recargar pestaña para
obtener release; cache y parametros conservados, sin migracion de datos.

## registro_de_avances

Contexto operation PASS, sin tarea activa previa. Faltan tres ids de grupos de
vivos usados por applyMockupAvailability; interrumpe restore antes de updateFrame.
RED en imagen desplegada y GREEN: empresa/preview/configurador/cache/imagen ausente.
0fc5169 publicado healthy1/1;56 tests,HTTPS/assets/HTML y backup/restore PASS.
Borrador version6/publicacion revision2 y2 empresas preservadas; sin IA paga.

## decisiones

Corregir contrato HTML y arranque, sin migracion de configuraciones ni cache.
