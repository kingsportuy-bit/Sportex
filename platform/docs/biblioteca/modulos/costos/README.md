# Módulo costos

## Responsabilidad

Calcular y versionar costos estimados y reales, precio, ganancia y margen por pedido e ítem.

## Fuente/decisión

`../../../../../negocio/dashboard/modelo-costos.md`.

## Owner

Core SPORTEX, dominio financiero operativo.

## Permisos

Ventas puede ver precio; costos y margen requieren capacidades específicas.

## Contrato de entrada

Tenant, producto, cantidad, variantes, consumos, proveedores y versión de precios.

## Contrato de salida

Desglose por concepto, costo total/unitario, campos pendientes, precio, ganancia y margen.

## Persistencia

Catálogo de costos, consumos, versiones, estimaciones, reales y ajustes.

## Auditoría

Fuente, fórmula, versión, actor, cambios manuales y diferencia estimado/real.

## Side effects

Alertas por margen bajo o desviación anormal.

## Workers

Actualización de precios y recálculo explícito de borradores.

## Tests

Equipo completo, vivos, golero, importados, faltantes, moneda y redondeo.

## Evidencia

Modelo Delta documentado; implementación pendiente.

## Rollback

Restaurar versión de catálogo sin reescribir estimaciones históricas.

## Estado

EN_DEFINICION.

## Cierre documental

Requiere catálogo inicial, fórmulas versionadas y comparación con pedidos reales.
