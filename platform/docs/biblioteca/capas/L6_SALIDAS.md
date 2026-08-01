# L6 - Salidas

## Responsabilidad

Ejecutar efectos autorizados: notificaciones, documentos, proveedores, archivos, webhooks y proyecciones.

## Permitido

- consumir outbox o jobs;
- reintentar con política;
- releer estado antes del efecto;
- registrar resultado normalizado.

## Prohibido

- declarar éxito sin respuesta verificable;
- enviar desde `PILOTO_DELTA` sin alcance y permiso explicitos;
- ejecutar job de otro tenant;
- cambiar dominio por inferencia del proveedor.

## Tests documentales

- reintento idempotente;
- error terminal visible;
- job cancelado no produce efecto;
- autorización revocada bloquea envío pendiente.
