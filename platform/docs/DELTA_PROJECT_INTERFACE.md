# Interfaz DELTA -> SPORTEX

## Proposito

Separar direccion de producto y ejecucion tecnica sin perder continuidad.

## DELTA conserva

- problema u oportunidad de negocio;
- prioridad y resultado esperado;
- reglas comerciales y criterio de aceptacion;
- aprobaciones de producto y operaciones reales;
- feedback del piloto.

## SPORTEX conserva

- arquitectura, contratos y decisiones tecnicas;
- tareas, ramas, commits y releases;
- estado vivo del desarrollo;
- tests, evidencia, rollback e incidentes;
- backlog tecnico y deuda.

## Handoff minimo

Cada pedido desde DELTA debe indicar:

1. problema y usuario afectado;
2. resultado visible esperado;
3. reglas de negocio conocidas;
4. datos o superficies involucradas;
5. que queda fuera;
6. criterio de aceptacion;
7. si autoriza solo diagnostico, desarrollo local u operacion real.

SPORTEX responde con un ID de tarea. Desde ese momento, el detalle tecnico vive
en el repositorio SPORTEX y DELTA solo necesita referenciar ese ID.

## Regla contra copias

Las carpetas copiadas pueden servir como respaldo temporal, pero nunca como
fuente paralela. La fuente valida es el worktree Git de SPORTEX y su commit.
