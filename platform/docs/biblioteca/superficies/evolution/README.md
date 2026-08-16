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

`CERTIFICADO_PILOTO`. La instancia Delta esta abierta; el webhook privado
procesa `MESSAGES_UPSERT/UPDATE`, el transporte manual se conserva y Base64
esta habilitado para media sobre `c6b3b5b`. Esto no autoriza mensajes nuevos ni
un asistente autonomo.
