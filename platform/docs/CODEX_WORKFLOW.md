# Workflow Codex SPORTEX

## Inicio

Leer `INICIAL.md`, declarar entorno, escanear integridad y ejecutar
`npm run context -- <intencion>`. Continuar solamente con
`SPORTEX_CONTEXT=PASS`, leyendo todas las fuentes bajo `READ:`. El resultado
identifica campaña, tarea, objetivo, alcance, entorno, riesgos, worktree, rama y
proxima accion. Una consulta de orientacion no altera estado.

## Trabajo local

Codex puede editar y validar dentro de una tarea aprobada. Preserva trabajo
ajeno, evita cambios no relacionados y registra tarea, estado, decisiones,
evidencia y contratos afectados. `PROJECT_STATE.json` registra tambien
migraciones, pruebas, despliegues, integraciones, datos sensibles y pendientes.

## Trabajo remoto

Antes de datos reales, mensajes, migraciones, costos o deploys, Codex informa:

- accion exacta;
- entorno y recursos;
- impacto esperado;
- preflight;
- rollback;
- criterio de detencion.

Luego solicita permiso explicito. La aprobacion de la feature no sustituye ese
permiso operativo.

## Hilos largos

Actualizar estado, tarea y evidencia antes de perder contexto. Tras una
compactacion, releer las fuentes generadas; no continuar solo desde memoria.

## Cierre

El cierre debe incluir resultado, archivos, pruebas, evidencia, deuda restante,
estado Git y siguiente paso. Ejecutar:

```powershell
npm run workflow:close -- TASK-AAAAMMDD-NNN
```

El comando regenera vistas, valida documentacion, workflow, tipos, tests, SQL,
build, pendientes y evidencia. Solamente `SPORTEX_CLOSE=PASS` habilita declarar
el checkpoint terminado. No ejecuta deploys ni autoriza operaciones remotas.

Para una consulta sin cambios se usa `npm run workflow:check`.
