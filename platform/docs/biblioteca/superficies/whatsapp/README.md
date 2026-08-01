# Superficie WhatsApp

## Responsabilidad

Recibir y enviar mensajes mediante un proveedor sin poseer reglas del negocio.

## Entrada

Webhooks autenticados y solicitudes de outbox.

## Salida

Eventos normalizados y resultados verificables del proveedor.

## Reglas

- Resolver tenant por integración confiable.
- Deduplicar por evento del proveedor.
- No certificar pagos ni mover fases.
- No registrar contenido sensible en logs.
- `PILOTO_DELTA` usa destinos y outbound explicitamente autorizados.

## Contratos

`../../../WHATSAPP_EVENT_CONTRACT.md`, `../../../SECURITY.md` y `../../../OBSERVABILITY.md`.

## Estado

NO_INICIADO.
