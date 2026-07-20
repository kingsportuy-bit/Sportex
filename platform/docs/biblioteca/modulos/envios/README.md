# Módulo envíos

## Responsabilidad

Coordinar control final, saldo, retiro, dirección, cadete, seguimiento y confirmación de entrega.

## Fuente/decisión

Proceso Delta y futura ficha de taller a envío.

## Owner

Logística mediante Core SPORTEX.

## Permisos

Producción libera; logística programa; cliente o transportista confirman recepción.

## Contrato de entrada

Pedido listo, paquetes, control final, modalidad, contacto, dirección, saldo y fecha.

## Contrato de salida

Envío programado, retirado, en tránsito, entregado, fallido o reprogramado.

## Persistencia

Envíos, paquetes, direcciones versionadas, cadetes, costos, estados y comprobantes.

## Auditoría

Liberación, programación, cambios, entrega, fallo y actor.

## Side effects

Notificaciones al cliente, cadete y apertura de postventa.

## Workers

Recordatorios, tracking y reintentos de aviso.

## Tests

Retiro, cadete, saldo pendiente, dirección cambiada, entrega parcial y fallo.

## Evidencia

Pendiente definir ficha de etapa.

## Rollback

Cancelar o reprogramar antes de entrega; luego usar evento compensatorio.

## Estado

EN_DEFINICION.

## Cierre documental

Requiere ficha, estados y prueba de entrega controlada.
