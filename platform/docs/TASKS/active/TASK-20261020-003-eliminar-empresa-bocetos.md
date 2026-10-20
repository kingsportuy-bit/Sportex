# Eliminar empresa del laboratorio

id: TASK-20261020-003
owner: Codex
requester: Fito
estado: in_progress
lifecycle: active
work_type: feature
campaign: CAMP-20260803-001
context_focus: frontend
development_guide_impact: none
plan_authorization: PLAN_APPROVED_AUTHORIZED
updated_at: 2026-10-20

## objetivo

Eliminar empresas desde el panel con confirmacion propia y purga de datos activos.

## alcance_permitido

Core, persistencia, HTTP, panel, candidato Git y pruebas locales ficticias.
Borrar cuenta, sesiones, archivos, configuracion y consumo asociados.
Conservar respaldos anteriores por decision explicita de Fito.

## alcance_prohibido

Sin borrar empresas reales, desplegar, modificar CRM/legado ni consumir IA.

## entradas

Pedido directo de Fito y respuesta: borrar datos activos, conservar respaldos.

## salidas

Comando protegido y boton Eliminar empresa, aislamiento y evidencia local.

## validacion

Permisos, version, confirmacion, sesiones, blobs, concurrencia y aislamiento.
QA responsive y validacion general.

## evidencia

docs/evidencias/TASK-20261020-003_ELIMINAR_EMPRESA.md

## rollback

Revertir codigo antes de publicar. Una eliminacion confirmada requiere restaurar
un respaldo; no es reversible desde el panel.

## deuda_restante

Publicacion requiere GO especifico; sin eliminaciones reales de QA.

## registro_de_avances

20/10: alcance y conservacion de respaldos confirmados por Fito.
195 bocetos y validacion general PASS; QA responsive sin borrados reales.

## decisiones

Purga activa con confirmacion propia; respaldos conservados. Sin borrados reales.
