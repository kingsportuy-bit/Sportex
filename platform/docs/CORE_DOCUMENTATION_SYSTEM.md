# Sistema documental del Core SPORTEX

## Componentes

- Estado canonico: `state/PROJECT_STATE.json`.
- Registro documental: `state/DOCUMENT_REGISTRY.json`.
- Registro durable de decisiones: `DECISIONES.md`.
- Contratos de tarea: `TASKS/active`, `queued` y `closed`.
- Workflow: `scripts/sportex-workflow.mjs` y su wrapper PowerShell.
- Generador con lock: `scripts/documentation/generate-documentation-views.mjs`.
- Vistas: `SESSION_STATE.md`, `TASKS/INDEX.md` y
  `generated/CURRENT_CONTEXT.md`, `state/CAMPAIGN_STATE.json` y
  `errors/index.json`.
- Validadores: estructura, tareas, guia, links, encoding y contexto.
- Tests propios: `scripts/tests/sportex-workflow.test.mjs`.
- Historial compacto: `historico/PROJECT_HISTORY.json`; el estado vivo conserva
  como maximo cinco checkpoints y se compacta con `npm run history:compact`.
- Selectores focales: `scripts/library-context.mjs` y
  `scripts/error-search.mjs`.

## Regla de escritura

Las vistas generadas no se editan. `CAMPAIGN_STATE.json` tampoco es una segunda
fuente: se deriva de `PROJECT_STATE.json`. Para cambiar el estado se actualiza
el JSON canonico o la tarea, se regenera y se valida.

El estado canonico registra como minimo campaña y tarea activas, objetivo,
alcance, entornos permitidos, rama/worktree, migraciones, pruebas, despliegues,
integraciones externas, politica de datos sensibles, ultima evidencia, riesgos,
pendientes y proxima accion. No guarda secretos ni reemplaza una observacion
actual del runtime.

El historial completo no se duplica en el estado vivo. `recentChanges` conserva
hasta cinco checkpoints y `history` enlaza el archivo historico versionado.

## Regla de continuidad

Antes de compactacion, cambio de computadora o fin de una tarea larga:

1. actualizar `PROJECT_STATE.json`;
2. actualizar tarea y evidencia;
3. actualizar `DECISIONES.md` cuando exista una decision durable;
4. ejecutar `npm run workflow:sync`;
5. ejecutar `npm run workflow:close -- <TASK-ID>`;
6. dejar commit y estado Git identificables si la tarea lo exige.

Si el chat contradice el estado canonico, se detiene la mutacion y se resuelve
la diferencia con evidencia.

## Contexto focal

`DOCUMENT_REGISTRY.json` define autoridad, owner, intenciones y presupuesto. El
router carga fuentes vigentes, no historia completa. Ampliar el presupuesto no
es un atajo: requiere justificar por que no puede resolverse la duplicacion.

## Comandos

```powershell
npm run context -- documentation
npm run workflow:check
npm run context:library -- 5 "whatsapp"
npm run errors:preflight -- "guidance workflow"
npm run workflow:sync
npm run workflow:close -- TASK-AAAAMMDD-NNN --profile=auto
```

Los marcadores esperados son `SPORTEX_CONTEXT=PASS`, `SPORTEX_CHECK=PASS`,
`SPORTEX_SYNC=PASS` y `SPORTEX_CLOSE=PASS`.
