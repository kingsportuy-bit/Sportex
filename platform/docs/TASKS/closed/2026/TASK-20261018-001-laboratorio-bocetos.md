# Incorporar laboratorio de bocetos y copia de colores

id: TASK-20261018-001
owner: Codex
requester: Fito
estado: done
lifecycle: closed
work_type: feature
campaign: CAMP-20260803-001
context_focus: product
development_guide_impact: none
updated_at: 2026-10-19

## objetivo

Editor en platform/bocetos y especificacion local del panel por empresa.

## alcance_permitido

Editor, assets, tests y docs locales. Colores de todas las prendas.
Pruebas GPT/Gemini autorizadas 18-19/10. Panel: solo especificacion.

## alcance_prohibido

Sin legado raiz, CRM, DB, piloto ni secretos versionados.

## entradas

Fito autorizo incorporar el editor DELTA a SPORTEX/platform.

## salidas

Laboratorio local canonico con pruebas y contrato; DELTA queda de respaldo.

## validacion

Sintaxis, regresiones, zoom, proveedor simulado y npm run validate.

## evidencia

docs/evidencias/TASK-20261018-001_LABORATORIO_BOCETOS.md

## rollback

Retirar superficie nueva y scripts. No borrar bocetos del navegador ni DELTA.

## deuda_restante

Integracion Core/tenant y QA visual humana pendientes; no certificado piloto.

## registro_de_avances

18-19/10: editor, vivos, logos y texturas imagen/PDF proporcionales; 164 tests.
Panel definido en docs/superpowers/specs/2026-10-19-panel-bocetos-design.md.
Spec aprobada por Fito. Implementacion en TASK-20261019-001.

## decisiones

Laboratorio local; Core decide negocio.
