# Eliminar empresa del laboratorio

id: TASK-20261020-003
owner: Codex
requester: Fito
estado: in_progress
lifecycle: active
work_type: operacion
campaign: CAMP-20260803-001
context_focus: infrastructure
development_guide_impact: none
plan_authorization: PLAN_APPROVED_AUTHORIZED
updated_at: 2026-10-20

## objetivo

Eliminar empresas desde el panel con confirmacion propia y purga de datos activos.

## alcance_permitido

Publicar 01e6797 en sportex_bocetos_app; backup, rollback y QA sin borrados.
Cambios de release solo documentales; codigo aprobado intacto.

## alcance_prohibido

Sin borrar empresas reales, modificar CRM/legado ni consumir IA.

## entradas

Fito: «go» para publicar 01e6797 con backup y rollback.

## salidas

Comando protegido y boton Eliminar empresa, aislamiento y evidencia local.

## validacion

Permisos, version, confirmacion, sesiones, blobs, concurrencia y aislamiento.
QA responsive y validacion general.

## evidencia

docs/evidencias/TASK-20261020-003_ELIMINAR_EMPRESA.md

## rollback

Volver a imagen 69739bb, mismo volumen. Borrados confirmados requieren respaldo.

## deuda_restante

Completar despliegue y observacion; sin eliminaciones reales de QA.

## registro_de_avances

20/10: alcance y conservacion de respaldos confirmados por Fito.
195 bocetos y validacion general PASS; QA responsive sin borrados reales.

## decisiones

Purga activa con confirmacion propia; respaldos conservados. Sin borrados reales.
