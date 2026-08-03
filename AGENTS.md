# Entrada de agentes del repositorio SPORTEX

Este repositorio contiene dos superficies distintas:

- raiz: aplicacion legado, conservada como fuente de migracion;
- `platform/`: proyecto tecnico nuevo y unica entrada para desarrollo nuevo.

Antes de analizar o modificar SPORTEX:

1. entrar en `platform/`;
2. leer `platform/AGENTS.md`;
3. leer `platform/docs/INICIAL.md`;
4. inferir la intencion y ejecutar el contexto automatico indicado alli;
5. leer todos los archivos enumerados bajo `READ:`.

Fito no necesita pedir `lee INICIAL.md`, recordar una tarea ni describir otro
hilo. Un contexto sano devuelve `SPORTEX_CONTEXT=PASS` e informa campaña,
tarea, objetivo, alcance, entorno, riesgos, worktree, rama y proxima accion.

No modificar, desplegar ni retirar el legado de la raiz salvo que una tarea
SPORTEX aprobada lo incluya expresamente. Una copia dentro de DELTA no es fuente
de verdad. Las operaciones reales requieren permiso explicito de Fito.
