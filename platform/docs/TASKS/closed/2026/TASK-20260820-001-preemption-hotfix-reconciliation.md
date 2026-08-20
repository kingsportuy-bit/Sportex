# Protocolo de preemption, hotfix y reconciliacion de entornos

id: TASK-20260820-001
owner: Codex
requester: Fito
estado: done
lifecycle: closed
work_type: documentacion
campaign: CAMP-20260803-001
context_focus: documentation
development_guide_impact: required
updated_at: 2026-08-20

## objetivo

Adaptar al Project OS de SPORTEX el protocolo de diagnostico de incidentes,
preemption, hotfix y reconciliacion, manteniendo honesta la realidad actual de
`PILOTO_DELTA` como produccion restringida sin STAGING separado.

## alcance_permitido

- Documentacion, estado estructurado, tooling y tests del Project OS.
- Gates locales de `workflow:close` y `worktree:close`.
- Contrato de evolucion futura hacia STAGING y PRODUCCION/PILOTO separados.
- Commits locales y owner return documental a SARA.

## alcance_prohibido

- Runtime, `PILOTO_DELTA`, produccion, deploys, mensajes, migraciones o datos.
- Secretos, proveedores, remotos, push o cambios de ramas remotas.
- Crear o fingir un STAGING que hoy no existe.

## entradas

- Autorizacion owner de Fito del 2026-08-20.
- `docs/ENVIRONMENTS_CONTRACT.md` y gobernanza vigente de releases/worktrees.
- Estado canonico limpio en `sportex-governance-20260801`.

## salidas

- Contrato canonico y estado machine-readable de incidentes/reconciliacion.
- Validadores y regresiones positivas/negativas.
- Integracion con cierre de workflow y worktrees.
- Evidencia final y retorno owner a SARA.

## validacion

- `npm run validate:docs`
- `npm run validate-docs`
- `npm run incident:check`
- `npm run worktree:check`
- `npm run workflow:close -- --task=TASK-20260820-001`
- `git diff --check`

## evidencia

- `docs/evidencias/TASK-20260820-001_PREEMPTION_HOTFIX_RECONCILIATION.md`

## rollback

Revertir exclusivamente los commits locales de esta task. No existe rollback
remoto porque la task no autoriza ni realiza acciones externas.

## deuda_restante

La separacion STAGING/PRODUCCION-PILOTO requiere una task futura especifica y
GO propio luego de la primera version usable aceptada.

## registro_de_avances

### 2026-08-20 - apertura

- `task:doctor` PASS y `task:next-id` asigno `TASK-20260820-001`.
- Alcance limitado a OS, documentacion, tooling, tests y commits locales.

### 2026-08-20 - implementacion y cierre

- Contrato y estado estructurado incorporados en `7ae6e49`.
- `workflow:close` y `worktree:close` aplican los gates fail-closed.
- 26 regresiones PASS, incluidas rutas positivas y negativas del protocolo.
- `PILOT_ONLY` permanece vigente; no se creo ni fingio STAGING.
- Owner return listo para SARA, sin ninguna accion externa.

## decisiones

- La aceptacion de la primera version usable habilita planificar la transicion;
  no despliega, migra ni crea entornos por si sola.
- El gate futuro de STAGING se activa solo tras una task de transicion
  completada que cambie el modelo de entornos.
