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

`CERTIFICADO_PILOTO`. Recepcion Evolution, persistencia cronologica, outbound
manual con aprobacion, imagenes privadas y cursor de no leidos estan activos en
`PILOTO_DELTA` sobre el candidato `c6b3b5b`. El primer mensaje real enviado
desde SPORTEX sigue pendiente y no se infiere de la certificacion tecnica.
