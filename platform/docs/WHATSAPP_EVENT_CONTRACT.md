# Contrato de eventos WhatsApp SPORTEX

## Principio

WhatsApp es la entrada principal del negocio, pero no modifica directamente el dominio.

## Recorrido

```text
proveedor WhatsApp
  -> adaptador autenticado
  -> evento normalizado
  -> deduplicación
  -> resolución de tenant y conversación
  -> interpretación IA o regla técnica
  -> hecho propuesto
  -> validación del Core o humana
  -> comando de módulo
  -> evento de dominio
  -> notificación/outbox si corresponde
```

## Sobre normalizado

Cada evento de ingreso debe incluir:

- `event_id`;
- `provider_event_id`;
- `tenant_id` resuelto por integración;
- `environment`;
- `occurred_at` y `received_at`;
- `channel`;
- `sender_ref` y `conversation_ref` normalizados;
- tipo de contenido;
- referencia segura al contenido;
- `correlation_id`;
- metadata permitida;
- versión del contrato.

## Hechos propuestos

La interpretación puede proponer:

- lead nuevo;
- consulta de producto;
- cotización aceptada;
- pago posible;
- cambio de talle o cantidad;
- diseño aprobado;
- proveedor informa trabajo pronto;
- taller informa incidencia o finalización;
- coordinación de envío;
- reclamo o satisfacción.

Cada propuesta conserva:

- evidencia de origen;
- fragmento o referencia relevante;
- confianza;
- entidad candidata;
- campos extraídos;
- riesgos y datos faltantes;
- estado `proposed`, `accepted`, `rejected` o `expired`.

## Resolución de pedido

Si existe un solo pedido activo compatible, el Core puede proponer vinculación. Si existen varios o la evidencia es ambigua, debe pedir selección o confirmación.

## Mutaciones automáticas

Las automatizaciones se clasifican:

- técnicas seguras: deduplicar, vincular evento, actualizar última actividad;
- reversibles: crear borrador o tarea;
- sensibles: certificar pago, aprobar diseño, liberar producción, comprar o enviar.

Las sensibles nunca se ejecutan solamente por inferencia de IA.

## Salida WhatsApp

Todo mensaje saliente se crea en outbox con:

- tenant y conversación;
- audiencia y propósito;
- plantilla o versión de prompt;
- contenido final o referencias seguras;
- permiso y confirmación requeridos;
- idempotency key;
- estado e intentos;
- resultado del proveedor.

El worker relee el estado del pedido y la autorización antes de enviar.

## Integración directa

Evolution API entrega webhooks directamente al adaptador del Core. Los mensajes salientes se ejecutan desde workers del Core mediante outbox. SPORTEX no utiliza n8n.
