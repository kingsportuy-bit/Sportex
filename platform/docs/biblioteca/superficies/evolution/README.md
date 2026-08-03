# Superficie Evolution API

## Responsabilidad

Adaptar webhooks y envíos de Evolution al contrato WhatsApp del Core.

## Entrada

Webhooks autenticados y jobs de outbox autorizados.

## Salida

Eventos normalizados, identificadores del proveedor y resultados verificables.

## Reglas

- Una instancia pertenece a tenant y entorno.
- Sin lógica de pedidos.
- Sin escrituras directas de dominio.
- Ingreso deduplicado.
- Salida mediante worker.
- `PILOTO_DELTA` con instancia, destinos y outbound autorizados.

## Contratos

`../../../EVOLUTION_CONTRACT.md`, `../../../WHATSAPP_EVENT_CONTRACT.md` y `../../../SECURITY.md`.

## Estado

REPLAY_LOCAL_IMPLEMENTADO. El adaptador real permanece `NO_INICIADO`; no hay
webhook, sesión, consulta ni envío autorizado.
