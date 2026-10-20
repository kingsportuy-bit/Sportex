# Corregir base inicial de bocetos

id: TASK-20261020-004
owner: Codex
requester: Fito
estado: in_progress
lifecycle: active
work_type: fix
campaign: CAMP-20260803-001
context_focus: frontend
development_guide_impact: none
plan_authorization: PLAN_APPROVED_AUTHORIZED
updated_at: 2026-10-20

## objetivo

Base con vivos apagados y un solo nombre arriba del numero.

## alcance_permitido

Parametros iniciales y cache de base, pruebas y candidato local.
Conservar bocetos existentes y archivos del usuario.

## alcance_prohibido

Sin deploy, datos remotos, borrados reales, CRM, legado ni IA.

## entradas

Fito reporta vivos activos/texto extra; confirma nombre arriba del numero.

## salidas

Base corregida y actualizacion focal del valor anterior en cache.

## validacion

Reproducir duplicado/vivos, cache antigua, nuevo boceto y guardado posterior.

## evidencia

docs/evidencias/TASK-20261020-004_BASE_BOCETOS.md

## rollback

Revertir candidato local; sin cambios remotos ni documentos guardados.

## deuda_restante

Publicacion requiere GO operativo especifico.

## registro_de_avances

Base publicada incluye cuatro vivos activos y texto NOMBRE adicional.
Corregido:197 bocetos, validacion general y QA navegador PASS; sin IA.

## decisiones

Nombre normal arriba; eliminar solo el duplicado de la base inicial.
