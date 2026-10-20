# Base inicial de empresas del laboratorio

id: TASK-20261020-002
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

Sin pendientes de esta tarea. Claves de respaldo/admin siguen fuera de alcance.

## registro_de_avances

20/10: 187 bocetos y cierre local PASS; QA de altas, reemplazos y login responsive.
20/10 03:06 UTC: 69739bb publicado, healthy1/1; HTTPS/assets/cuenta Delta PASS.
Backup real restaurado. Dos rollbacks de verificacion y despliegue final
con imagen explicita y readiness del commit. CRM conservado, cero gasto IA.

## decisiones

Archivos de identidad propios por empresa; otras pestañas conservan sus imagenes.
