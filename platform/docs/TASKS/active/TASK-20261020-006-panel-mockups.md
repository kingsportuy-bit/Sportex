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

Core/catalogo admin, panel/editor, opciones/vivos/version. Fixtures y Git.

## alcance_prohibido

Sin deploy, datos reales, IA paga, CRM, legado ni importador PSD arbitrario.

## entradas

Fito aprueba comenzar con el mockup actual y configurar su base.

## salidas

Administracion funcional del primer mockup con bases versionadas y opciones.

## validacion

Permisos admin/tenant/origen, validacion de configuracion, version concurrente,
durabilidad de borrador/publicacion, nuevos bocetos y conservacion de anteriores.
QA interna de guardar, probar, publicar, recargar y error/concurrencia.

## evidencia

docs/evidencias/TASK-20261020-006_PANEL_MOCKUPS.md

## rollback

Revertir commits de esta task; runtime a95850f permanece sin cambios.
Catalogo es aditivo; conservar datos publicados al volver a version anterior.

## deuda_restante

QA visual final pendiente por control de navegador deshabilitado. Sin deploy.

## registro_de_avances

Revisado editor fijo, exportador PSD y panel actual. Se reutiliza lienzo actual.
Catalogo, panel y setup implementados.205 tests PASS; QA guardar/recargar PASS.

## decisiones

Catalogo global pertenece a administracion; empresas leen solo publicaciones.
Borrador aislado y sin API paga. Cada boceto conserva snapshot y version base.
