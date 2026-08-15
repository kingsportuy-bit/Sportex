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

## Mensajes y eventos operativos

- El mensaje conserva identidad, contenido, dirección y receipt del proveedor.
- Un hito del Core se proyecta como evento operativo separado y nunca se
  inserta en la tabla de mensajes ni se envía a WhatsApp.
- La nota canónica de seguimiento conserva sus 1000 caracteres; su detalle
  derivado admite 1015 para sumar el resultado sin pérdida.
- La escritura derivada usa una frontera recuperable: si falla, la mutación
  principal y `activity_data` confirman igual; el fallo queda observable y la
  cronología se reconstruye desde esa fuente.
- La API puede combinarlos en una cronología de lectura con orden estable.
- Deduplicación, reintentos y webhooks técnicos permanecen en observabilidad,
  no como eventos visibles para el operador.
- Un origen futuro `ASSISTANT` sigue sometido a permisos, Core y outbox. En el
  corte vigente solo puede representarse como dato histórico: no existe camino
  autónomo ejecutable.

## Integración directa

Evolution API entrega webhooks directamente al adaptador del Core. Los mensajes salientes se ejecutan desde workers del Core mediante outbox. SPORTEX no utiliza n8n.

## Replay ficticio de desarrollo

La primera vertical usa un adaptador de replay reducido que existe únicamente
con `development|test`, store en memoria y autenticación de desarrollo.

- acepta solo `LOCAL_FIXTURE`, `msg-ficticio-*` y
  `contacto-ficticio-*`;
- normaliza texto entrante, fechas, conversación y evidencia;
- deduplica por tenant y `providerMessageId`;
- crea una proyección local de lead y oportunidad;
- clasifica `META_EXACTO` solo con `externalAdReply.sourceId`;
- clasifica `DESCONOCIDO` sin inventar campaña o anuncio;
- no configura webhooks, no consulta Evolution y no produce outbound.

Este replay prueba el contrato; no es el adaptador real de `PILOTO_DELTA`.
