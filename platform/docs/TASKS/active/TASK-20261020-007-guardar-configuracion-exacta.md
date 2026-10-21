# Conservar configuracion exacta de mockups

id: TASK-20261020-007
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

Guardar/reabrir configuracion exacta: tamanos, fuentes, posiciones y opciones sin imagenes.

## alcance_permitido

Corregir configurador desplegado f4386fb; Git, candidato remoto, backup y release.

## alcance_prohibido

Sin cuellos, IA paga, cuentas de QA, datos de otras empresas, CRM, legado ni DNS.

## entradas

Fito pide trabajar sobre el desplegado y autoriza publicar la correccion.

## salidas

Geometria reproducible sin archivos privados y configuraciones previas preservadas.

## validacion

Guardar/recargar/publicar en candidato remoto con fixtures; HTTP y hashes desplegados.

## evidencia

docs/evidencias/TASK-20261020-007_CONFIGURACION_EXACTA.md

## rollback

Volver a imagen f4386fb en mismo volumen; snapshot consistente previo y restore verificado.

## deuda_restante

Falta publicar candidato y verificar HTTPS. Navegador interno deshabilitado; sin QA visual inventada.

## registro_de_avances

Runtime f4386fb healthy. Borrador conserva escalas/fuentes; muestras usan proporcion fija.
RED en imagen actual y GREEN remoto con correccion: conservar aspecto y fuentes explicitas.

## decisiones

No guardar bytes de logos/escudos; conservar geometria de referencia y preferencias.
