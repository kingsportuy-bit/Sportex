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

Conversaciones, participantes, mensajes referenciados y eventos operativos
separados, propuestas y vínculos a pedidos. La cronología es una proyección;
no convierte eventos en mensajes.

## Auditoría

Vinculaciones, desambiguaciones, propuestas aceptadas/rechazadas y envíos.

## Side effects

Publicar propuestas o comandos autorizados; crear outbox de respuesta.

## Workers

Interpretación diferida, archivos, debounce y salida WhatsApp.

## Tests

Replay, firma inválida, varios pedidos activos, prompt injection, cuarentena e aislamiento.

## Evidencia

`TASK-20260814-001` certificó el proveedor real y el puesto operativo en
`PILOTO_DELTA`. `TASK-20260815-001` agrega localmente una cronología
discriminada, migración reversible, backfill, RLS y compatibilidad pasiva de
actor `ASSISTANT`, sin bot ni outbound IA.

## Rollback

Desvincular propuesta o pedido sin borrar el evento original.

## Estado

PILOTO_DELTA_WHATSAPP_OPERATIVO_CRONOLOGIA_CANDIDATA_LOCAL.

## Cierre documental

Requiere proveedor elegido, contrato de almacenamiento, E2E de `PILOTO_DELTA`
y outbound explicitamente autorizado.
