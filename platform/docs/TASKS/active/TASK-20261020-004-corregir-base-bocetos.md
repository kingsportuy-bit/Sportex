# Corregir base inicial de bocetos

id: TASK-20261020-004
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

Base con vivos apagados, nombre/numero centrados y numero frontal apagado.

## alcance_permitido

Publicar codigo9a21e31 en sportex_bocetos_app; backup, rollback y QA.
Cambios de release solo documentales. Conservar cuentas y bocetos.

## alcance_prohibido

Sin borrar cuentas/bocetos, CRM, legado, DNS ni IA.

## entradas

Fito responde «go» para publicar la base alineada9a21e31.

## salidas

Base corregida y actualizacion focal del valor anterior en cache.

## validacion

Reproducir duplicado/vivos, cache antigua, nuevo boceto y guardado posterior.

## evidencia

docs/evidencias/TASK-20261020-004_BASE_BOCETOS.md

## rollback

Volver a imagen14de41c, mismo volumen. Conservar respaldo previo.

## deuda_restante

Completar publicacion autorizada y observacion.

## registro_de_avances

Base publicada incluye cuatro vivos activos y texto NOMBRE adicional.
Corregido:197 bocetos, validacion general y QA navegador PASS; sin IA.

## decisiones

Nombre normal arriba; eliminar solo el duplicado de la base inicial.
