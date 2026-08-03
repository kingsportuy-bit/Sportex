# Modelo de dominio SPORTEX v1

## Alcance

Vertical transaccional heredada:

```text
tenant + actor
      |
   cliente
      |
seña certificada
      |
 nuevo pedido
      +--> auditoría
      +--> outbox order.created
```

No incluye todavía productos, costos, procesos, documentos ni talleres.

`TASK-20260803-001` agrega una vertical comercial separada, exclusivamente
local y efímera:

```text
evento ficticio Evolution
  -> mensaje y conversación normalizados
  -> atribución META_EXACTO o DESCONOCIDO
  -> lead y oportunidad
  -> etapa NUEVO y próxima acción
```

Esta vertical no usa PostgreSQL ni modifica la migración transitoria. Existe
para probar el contrato y la experiencia de punta a punta antes de definir
persistencia o integraciones reales.

## Contexto confiable

Cada comando recibe un `RequestContext` resuelto antes de entrar al dominio:

- `tenantId`;
- `actorId`;
- capacidades;
- `correlationId`;
- entorno.

El tenant nunca se toma del payload del comando.

## Entidades

### Tenant

- `id` UUID;
- `slug` único;
- `name`;
- `status`: `active | suspended`;
- timestamps.

Una empresa equivale a un tenant/marca.

### Membership

- `tenantId`;
- `actorId` de la identidad externa;
- capacidades explícitas;
- `status`;
- timestamps.

### Client

- `id` UUID;
- `tenantId`;
- `displayName`;
- `teamName` opcional;
- `primaryPhone` E.164 opcional;
- `status`: `active`;
- `version` incremental;
- timestamps.

Un teléfono normalizado no se duplica dentro del mismo tenant. Puede existir en tenants distintos.

### CertifiedPayment

- `id` UUID;
- `tenantId`;
- `clientId`;
- `evidenceReference` única dentro del tenant;
- `amountCents` entero positivo;
- `currency`: inicialmente `UYU | USD`;
- `status`: `certified`;
- `certifiedBy`;
- `certifiedAt`;
- timestamps.

La IA no crea esta entidad. La primera versión permite certificación manual con capacidad `payments.certify`.

### Order

- `id` UUID;
- `tenantId`;
- `orderNumber` visible y único por tenant;
- `clientId`;
- `certifiedPaymentId` único por tenant;
- `teamName`;
- `status`: inicialmente `intake_pending`;
- `quotedTotalCents`;
- `depositCents` tomado de la seña;
- `currency`;
- `version`;
- timestamps.

Una seña certificada crea como máximo un pedido.

### IdempotencyRecord

- `tenantId`;
- `scope`;
- `key`;
- hash del request;
- código y cuerpo de respuesta estable;
- recurso resultante;
- timestamps.

Reutilizar una clave con otro payload produce conflicto.

### AuditEvent

Registra actor, tenant, acción, recurso, resultado, correlación y metadatos sin secretos.

### OutboxEvent

Registra eventos autorizados pendientes. En esta vertical se publica `order.created`; no se ejecutan efectos externos.

## Comandos iniciales

### `CreateClient`

- capacidad: `clients.create`;
- crea cliente dentro del tenant activo;
- rechaza teléfono duplicado dentro del tenant;
- idempotente por header `Idempotency-Key`.

### `CertifyPayment`

- capacidad: `payments.certify`;
- requiere referencia de evidencia y monto positivo;
- referencia única por tenant;
- registra auditoría;
- idempotente.

### `CreateOrderFromCertifiedPayment`

- capacidad: `orders.create`;
- requiere cliente y seña del mismo tenant;
- requiere seña certificada y todavía no consumida;
- el precio total no puede ser menor que la seña;
- crea pedido, auditoría y outbox en una transacción;
- idempotente.

## Eventos

- `client.created` para auditoría interna;
- `payment.certified` para auditoría interna;
- `order.created` en outbox.

## Vertical comercial local

### Conversation

- `tenantId` resuelto desde el contexto confiable;
- canal `WHATSAPP` y proveedor `EVOLUTION`;
- referencia ficticia estable de conversación;
- contacto ficticio;
- mensajes ordenados por fecha original;
- primer contacto y última actividad.

### NormalizedConversationMessage

- ID interno y `providerMessageId`;
- sentido inicial `CLIENTE`;
- fecha original y fecha de ingreso;
- contenido `TEXT` y evidencia `fixture:*`;
- deduplicación por tenant y mensaje del proveedor.

### CommercialAttribution

- `META_EXACTO` solamente cuando existe `externalAdReply.sourceId`;
- `DESCONOCIDO` cuando falta esa evidencia;
- `adId`, `sourceUrl`, `ctwaClid` y `ref` quedan nulos en la rama desconocida;
- la evidencia apunta al mensaje que originó la atribución.

### Lead y Opportunity

- un lead activo se crea para la conversación nueva;
- la oportunidad inicial pertenece al mismo tenant, lead y conversación;
- etapa inicial: `NUEVO`;
- próxima acción: `Revisar conversación y calificar la consulta`;
- estado de la próxima acción: `PENDIENTE`;
- cada creación y mensaje conserva actor, correlación y evidencia.

La primera vertical no convierte lead en cliente, no extrae producto mediante
IA y no ejecuta seguimientos ni mensajes.

## Tablas transitorias preparadas en julio de 2026

- `sportex_staging_tenants`;
- `sportex_staging_memberships`;
- `sportex_staging_clients`;
- `sportex_staging_certified_payments`;
- `sportex_staging_orders`;
- `sportex_staging_idempotency`;
- `sportex_staging_audit_events`;
- `sportex_staging_outbox`.

La migracion estatica declara RLS forzado y no crea ni altera `sportex_*` o
`sports_*`. Su nombre `sportex_staging_*` es historico; no debe ejecutarse ni
tratarse como esquema objetivo hasta que una tarea de `PILOTO_DELTA` la revise.
