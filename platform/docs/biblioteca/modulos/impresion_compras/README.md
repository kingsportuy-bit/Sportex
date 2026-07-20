# Módulo impresión y compras

## Responsabilidad

Coordinar USER, telas lisas, prendas importadas, medias, cadetes y recepción de materiales.

## Fuente/decisión

Proceso Delta, proveedores y modelo de costos.

## Owner

Producción/compras mediante Core SPORTEX.

## Permisos

Crear solicitud, aprobar gasto, registrar pago y recibir materiales son capacidades separadas.

## Contrato de entrada

Liberación técnica, archivos, consumos, productos, proveedores, colores y fechas.

## Contrato de salida

Órdenes de proveedor, costos, estados, materiales recibidos, incidencias y trabajos listos para taller.

## Persistencia

Proveedores, órdenes, ítems, pagos, fechas, números externos, materiales y controles.

## Auditoría

Solicitud, aprobación, pago, cambio, recepción, falla y actor.

## Side effects

Mensajes a proveedores, cargas externas, cadetes y notificaciones autorizadas.

## Workers

Seguimiento, sincronización, vencimientos y reintentos.

## Tests

Tela impresa, lisa, importado, varias ramas, material fallado, gasto no autorizado e idempotencia.

## Evidencia

Proceso y precios Delta documentados; ficha de etapa pendiente.

## Rollback

Cancelar orden si el proveedor lo permite o crear ajuste compensatorio.

## Estado

EN_DEFINICION.

## Cierre documental

Requiere catálogo de proveedores, ficha de impresión y primera integración controlada.
