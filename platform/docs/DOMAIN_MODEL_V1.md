# Modelo de dominio SPORTEX v1

## Alcance

Primera vertical implementable:

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

No incluye todavía productos, costos, procesos, documentos, talleres, WhatsApp o frontend.

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

## Tablas STAGING v1

- `sportex_staging_tenants`;
- `sportex_staging_memberships`;
- `sportex_staging_clients`;
- `sportex_staging_certified_payments`;
- `sportex_staging_orders`;
- `sportex_staging_idempotency`;
- `sportex_staging_audit_events`;
- `sportex_staging_outbox`.

Todas usan RLS forzado. Ninguna migración de esta versión crea o altera tablas `sportex_*` legado o `sports_*` de producción.
