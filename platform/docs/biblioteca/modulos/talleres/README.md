# Módulo talleres

## Responsabilidad

Administrar talleres, órdenes de trabajo, materiales entregados, ficha vigente, estados productivos, incidencias, costos y finalización.

## Fuente/decisión

Guía y skill de ficha de taller Delta.

## Owner

Producción SPORTEX; cada trabajo se asigna a un taller responsable.

## Permisos

Producción asigna y libera; taller actualiza trabajos autorizados; costos pueden estar restringidos.

## Contrato de entrada

Pedido, trabajo, taller, materiales, versión de ficha, cantidades, fechas y dependencias cumplidas.

## Contrato de salida

Trabajo aceptado, en proceso, bloqueado, terminado o rechazado; materiales, incidencias, costo y evidencia.

## Persistencia

Talleres, contactos, capacidades, trabajos, estados, materiales, documentos, incidencias y fechas.

## Auditoría

Asignación, recepción, cambio de estado, material faltante, reproceso, costo y finalización.

## Side effects

Notificaciones, solicitud de cadete, control final y actualización del proceso.

## Workers

Recordatorios, vencimientos y preparación de paquetes documentales.

## Tests

Varios talleres, trabajo dependiente, ficha reemplazada, material incompleto, atraso e incidencia.

## Evidencia

`../../../../../.agents/skills/crear-ficha-taller-delta/SKILL.md` y fichas Delta verificadas.

## Rollback

Reasignar trabajo o reabrir mediante comando auditado; no borrar entrega ni incidencia.

## Estado

EN_DEFINICION_CON_FICHA_DISPONIBLE.

## Cierre documental

Requiere modelo de trabajo, acceso de taller, integración de la skill y E2E de un pedido.
