# Administrar configuracion de mockups

id: TASK-20261020-006
owner: Codex
requester: Fito
estado: in_progress
lifecycle: active
work_type: feature
campaign: CAMP-20260803-001
context_focus: runtime
development_guide_impact: none
plan_authorization: PLAN_APPROVED_AUTHORIZED
updated_at: 2026-10-20

## objetivo

Panel Mockups: borrador, prueba y publicacion de defaults. Conservar bocetos.

## alcance_permitido

Core/catalogo admin, panel/editor, opciones/vivos/version. Prototipo 2D propio.

## alcance_prohibido

Sin deploy, datos reales, API paga, CRM, legado ni importador PSD arbitrario.

## entradas

Fito aprueba comenzar con el mockup actual y configurar su base.
Aprueba prueba propia de frente/espalda y tres cuellos con imagegen integrado.

## salidas

Administracion funcional del primer mockup con bases versionadas y opciones.

## validacion

Permisos/versiones, durabilidad y preservacion de bocetos; guardar/probar/publicar.
Prototipo: igualdad del cuerpo entre cuellos, mascaras y color.

## evidencia

docs/evidencias/TASK-20261020-006_PANEL_MOCKUPS.md

## rollback

Revertir commits de esta task; runtime a95850f permanece sin cambios.
Catalogo es aditivo; conservar datos publicados al volver a version anterior.

## deuda_restante

QA visual final pendiente por control de navegador deshabilitado. Sin deploy.
Prototipo propio: aprobar encaje/costuras antes de integrarlo.

## registro_de_avances

Panel/setup y guardar/recargar PASS.209 tests; QA visual final pendiente.
Prototipo aislado:3 cuellos,2 vistas, mapas y8 checks render PASS.

## decisiones

Catalogo global pertenece a administracion; empresas leen solo publicaciones.
Borrador aislado y sin API paga. Cada boceto conserva snapshot y version base.
