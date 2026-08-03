# Módulo WhatsApp y conversaciones

## Responsabilidad

Vincular eventos normalizados con empresa, contacto, conversación y pedido; mantener historial operativo y propuestas IA.

## Fuente/decisión

`WHATSAPP_EVENT_CONTRACT.md`.

## Owner

Core SPORTEX; adaptador WhatsApp solo transporta.

## Permisos

Lectura y envío dependen de rol, tenant y política de audiencia.

## Contrato de entrada

Evento autenticado, deduplicado, con tenant, remitente, conversación y referencia de contenido.

## Contrato de salida

Evento persistido, conversación vinculada, hechos propuestos y correlación.

## Persistencia

Conversaciones, participantes, eventos, mensajes referenciados, propuestas y vínculos a pedidos.

## Auditoría

Vinculaciones, desambiguaciones, propuestas aceptadas/rechazadas y envíos.

## Side effects

Publicar propuestas o comandos autorizados; crear outbox de respuesta.

## Workers

Interpretación diferida, archivos, debounce y salida WhatsApp.

## Tests

Replay, firma inválida, varios pedidos activos, prompt injection, cuarentena e aislamiento.

## Evidencia

Replay local ficticio de `TASK-20260803-001`: normalización, orden,
deduplicación, atribución exacta/desconocida y aislamiento por tenant. Sin
evidencia de proveedor, PostgreSQL o `PILOTO_DELTA`.

## Rollback

Desvincular propuesta o pedido sin borrar el evento original.

## Estado

IMPLEMENTADO_LOCAL_NO_PERSISTENTE.

## Cierre documental

Requiere proveedor elegido, contrato de almacenamiento, E2E de `PILOTO_DELTA`
y outbound explicitamente autorizado.
