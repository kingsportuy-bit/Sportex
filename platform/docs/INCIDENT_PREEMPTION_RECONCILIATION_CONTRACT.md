# Contrato de preemption, hotfix y reconciliacion

## Proposito

Este contrato conserva una sola linea material activa durante incidentes y
evita que un hotfix recuperado fuera de la linea local quede perdido al retomar
el desarrollo. No autoriza acciones remotas.

## Diagnostico inmediato

Ante una senal de incidente se permite diagnostico read-only inmediato. Leer
estado, logs sanitizados, version y salud no cambia la task activa. Antes de la
primera mutacion se exige preemption formal y una task incidente unica.

## Preemption formal

La task material queda `PAUSED_BY_INCIDENT` con snapshot inmutable de:

- task, rama, worktree y HEAD;
- candidato vigente y entorno objetivo;
- fecha, motivo y task incidente.

El worktree pausado se clasifica `PRESERVAR`. Si existia candidato, cambia a
`STALE_AFTER_HOTFIX`; no puede reanudarse ni promoverse hasta contener el fix.
Solo una task incidente puede permanecer activa.

## Hotfix en PILOTO_DELTA

`PILOTO_DELTA` es produccion restringida. El hotfix parte del commit y digest
exactos observados en ese runtime. Toda mutacion exige GO exacto de Fito,
rollback identificable, alcance, evidencia y observacion posterior. Diagnostico
read-only no equivale a GO. Una recuperacion externa tampoco demuestra que el
fix exista en Git canonico.

## Reconciliacion obligatoria

Tras recuperar el servicio, el incidente queda
`RECOVERED_RECONCILIATION_PENDING`. No puede cerrarse ni reanudarse la task
pausada hasta probar conjuntamente:

1. el fix existe como commit en Git canonico;
2. la rama pausada y todo candidato renovado contienen ese commit;
3. la linea local fue revalidada en PASS;
4. task, indice, estado, release/version y worktrees coinciden;
5. el worktree preservado mantiene sus cambios y ref.

Recién entonces el estado pasa a `RECONCILED` y puede emitirse el retorno owner.
Un candidato anterior que no contiene el hotfix queda bloqueado.

## Modelo de entornos

### PILOT_ONLY actual

Hoy no existe STAGING separado. La reconciliacion no puede exigir ni registrar
una certificacion STAGING ficticia. La referencia real es `PILOTO_DELTA`, con
los gates de produccion restringida.

### Transicion futura

La aceptacion humana de la primera version usable solo cambia la transicion a
`REQUIRED`; no despliega, migra ni separa recursos. Una task especifica futura,
con alcance, GO, rollback y evidencia propios, debe crear y certificar STAGING y
PRODUCCION/PILOTO separados antes de cambiar el modelo a
`SEPARATED_STAGING_PRODUCTION`.

Después de esa task, el flujo normal sera local -> STAGING -> artefacto
certificado -> GO -> PRODUCCION. El gate `ENVIRONMENT_RECONCILIATION` exigira
STAGING certificado antes de cerrar un incidente o promover un release.

## Estado y herramientas

- `docs/state/INCIDENT_RECONCILIATION_STATE.json`: estado canonico operativo.
- `npm run incident:check`: valida invariantes sin mutar entornos.
- `workflow:close`: bloquea cierre con reconciliacion pendiente.
- `worktree:close`: bloquea retiro o clasificacion incoherente del worktree
  pausado.

## Owner return a SARA

El retorno es documental, no un mensaje externo. Debe incluir task, commits,
validaciones, `SPORTEX_CLOSE`, modelo de entornos, acciones externas realizadas
(normalmente ninguna) y proxima decision owner.
