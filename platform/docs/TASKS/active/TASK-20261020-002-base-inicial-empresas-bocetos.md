# Base inicial de empresas del laboratorio

id: TASK-20261020-002
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

Base actual sin identidad Delta; reemplazos sin acumular archivos.
Login verde sin tarjeta, logo/subtitulo y formulario minimo.

## alcance_permitido

Publicar el candidato aprobado en sportex_bocetos_app; backup, rollback y QA.
Conservar geometria, fuentes, opciones, cuentas y bocetos.

## alcance_prohibido

Sin CRM, legado, Evolution, DNS, cuentas nuevas ni llamadas IA.

## entradas

Fito: «si autorizo», publicar 6b6f5f2. Solo documentos de operacion pueden cambiar
el commit de release; el codigo aprobado permanece identico.

## salidas

Base generica, bibliotecas sin acumulacion y candidato Git para revisar/publicar.

## validacion

Regresion de base, reemplazos, aislamiento y QA local sin IA.

## evidencia

docs/evidencias/TASK-20261020-002_BASE_EMPRESAS_BOCETOS.md

## rollback

Volver a imagen b8e1fc8, mismo volumen. Backup SQLite consistente antes del corte.

## deuda_restante

Publicacion autorizada, pendiente de ejecutar y verificar.

## registro_de_avances

20/10: 187 bocetos y cierre local PASS; QA de altas, reemplazos y login responsive.

## decisiones

Archivos de identidad propios por empresa; otras pestañas conservan sus imagenes.
