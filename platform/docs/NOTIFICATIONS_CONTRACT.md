# Contrato de notificaciones SPORTEX

## Responsabilidad

Crear y entregar avisos derivados de eventos autorizados sin mezclar transporte con reglas del negocio.

## Audiencias

- operador de la marca;
- ventas;
- diseño;
- producción;
- taller;
- logística;
- cliente;
- soporte de plataforma.

## Flujo

Un módulo publica un evento. El módulo notificaciones evalúa reglas configuradas, crea una notificación y la coloca en outbox. El worker entrega y registra resultado.

## Reglas

- La notificación no cambia el estado del pedido.
- Cada envío tiene tenant, audiencia, motivo, correlación e idempotencia.
- Los mensajes al cliente requieren política y canal autorizado.
- Staging usa destinos allowlisted.
- Los fallos se reintentan con límite y terminan visibles.
- Un recordatorio relee el estado antes de enviarse.

## Ejemplos

- nueva seña detectada pendiente de certificar;
- pedido creado;
- diseño esperando archivos o aprobación;
- USER informa trabajo pronto;
- materiales incompletos;
- pedido próximo a fecha límite;
- taller informa incidencia;
- pedido listo para entregar;
- saldo pendiente;
- seguimiento postventa.
