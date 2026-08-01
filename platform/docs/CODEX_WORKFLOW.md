# Workflow Codex SPORTEX

## Inicio

Leer `INICIAL.md`, escanear integridad, resolver intencion, cargar estado y
tarea, y entrar por la Biblioteca. Una consulta de orientacion no altera estado.

## Trabajo local

Codex puede editar y validar dentro de una tarea aprobada. Preserva trabajo
ajeno, evita cambios no relacionados y registra decisiones que afecten el
contrato.

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
estado Git y siguiente paso. Si falta una prueba real, usar un estado pendiente
en lugar de afirmar que esta listo.
