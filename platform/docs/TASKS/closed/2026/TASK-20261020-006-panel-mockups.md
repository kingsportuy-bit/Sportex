# Administrar configuracion de mockups

id: TASK-20261020-006
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

Panel Mockups: borrador, prueba y publicacion de defaults. Conservar bocetos.

## alcance_permitido

Publicar configurador de33a54 en sportex_bocetos_app, backup y rollback a95850f.

## alcance_prohibido

Sin cuellos experimentales, IA paga, mutaciones de cuentas, CRM, legado ni DNS.

## entradas

Fito pausa cuellos y confirma GO produccion para el configurador del panel.

## salidas

Administracion funcional del primer mockup con bases versionadas y opciones.

## validacion

Permisos/versiones, durabilidad y preservacion de bocetos; guardar/probar/publicar.
Prototipo: igualdad del cuerpo entre cuellos, mascaras y color.

## evidencia

docs/evidencias/TASK-20261020-006_PANEL_MOCKUPS.md

## rollback

Volver a imagen a95850f en el mismo volumen; conservar backup y catalogo aditivo.

## deuda_restante

Cuellos en pausa y excluidos. Fito usa Mockups en el panel; QA visual final manual.

## registro_de_avances

Panel/setup PASS. Cuellos locales sobre kit actual; anclajes editables y JSON.
224 tests;6 checks de montaje PASS. QA navegador pendiente.
JSON frontal de Fito aplicado como defaults; espalda original fija.
Material V/polo local en pausa. GO de Fito para publicar solo configurador.
f4386fb publicado healthy1/1;27 pruebas en imagen y HTTP admin PASS.
2 empresas preservadas, backup restaurado. Sin IA paga ni escrituras de negocio.

## decisiones

Catalogo global pertenece a administracion; empresas leen solo publicaciones.
Borrador aislado y sin API paga. Cada boceto conserva snapshot y version base.
