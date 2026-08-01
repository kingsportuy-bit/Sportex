# Modos de trabajo SPORTEX

## Regla

La intencion selecciona contexto y tipo de tarea. No concede permisos de
runtime ni permite abrir una segunda tarea activa.

## Guidance

Preguntas sobre proceso, fuentes, arquitectura o proximo paso. Es read-only,
carga la guia maestra y no crea tarea.

## Documentation

Cambia fuentes documentales, estado, router o gobernanza. Usa
`work_type: documentacion`. No autoriza cambios de runtime.

## Architecture

Define o modifica owners, fronteras, contratos, datos o integraciones. Usa
`work_type: feature` o `documentacion` segun incluya codigo.

## Feature

Agrega una capacidad. Exige contrato, permisos, datos, tests, evidencia y
rollback. Usa `work_type: feature`.

## Fix

Corrige un fallo reproducible sin ampliar el objetivo. Debe demostrar fallo
previo, causa raiz, prueba posterior y regresion. Usa `work_type: fix`.

## Operation

Migraciones, secretos, deploy, infraestructura, backups o recuperacion. Usa
`work_type: operacion`. Toda mutacion en `PILOTO_DELTA` o
`PRODUCCION_COMERCIAL` requiere permiso explicito para la accion exacta.

## Incident

Primero diagnostico acotado y read-only. Si se necesita mutar runtime, se
convierte en operacion autorizada con criterio de detencion y rollback.

## Product

Aclara reglas de negocio. Una consulta puede ser read-only; si cambia una
fuente canonica, abre tarea documental o feature.

## Quality

Audita tests, evidencia o certificacion. No puede declarar runtime ni cerrar un
modulo sin pruebas ligadas a la version correcta.

## Campaign

Contenedor opcional para un objetivo multi-task. No reemplaza tareas ni concede
permisos. Solo una campana y una tarea pueden estar activas globalmente.

## Conflictos

Si existe una tarea activa incompatible, Codex informa objetivo, diferencia y
riesgo antes de cambiar prioridad. Nunca mezcla trabajo por conveniencia.
