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
- `status`: `intake_pending` o `production_ready`;
- `quotedTotalCents`;
- `depositCents` tomado de la seña;
- `currency`;
- `version`;
- timestamps.

Una seña certificada crea como máximo un pedido. `production_ready` significa
que el pedido fue entregado al proceso productivo mínimo; no implica que exista
todavía un motor completo de etapas de fábrica.

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

### `ReleaseOrderToProduction`

- capacidad: `production.release`;
- exige confirmación exacta `ENTREGAR_A_PRODUCCION`;
- exige la versión vigente del Pedido;
- cambia únicamente `intake_pending -> production_ready`;
- registra auditoría y outbox en la misma transacción;
- es idempotente y no crea una segunda entrega.

## Eventos

- `client.created` para auditoría interna;
- `payment.certified` para auditoría interna;
- `order.created` en outbox.
- `order.production_released` en auditoría y outbox.

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

La primera vertical no extrae producto mediante IA ni ejecuta seguimientos o
mensajes reales. `TASK-20260814-001` incorporó la conversión gobernada de una
oportunidad con seña validada a Cliente, Pago certificado y Pedido único, y el
traspaso explícito de ese Pedido a producción mínima.

## Transporte WhatsApp durable local

El sobre WhatsApp normalizado se persiste antes de la proyección comercial.
Journal, conversación y outbox son responsabilidades separadas:

```text
evento simulado -> journal durable -> worker tenant-aware -> conversación/oportunidad
orden manual confirmada -> outbox durable -> transporte falso -> receipt
```

El journal conserva `SIMULATED_LIVE` o `BACKFILL`; la conversación conserva el
origen por mensaje. Un mensaje saliente no puede crear una oportunidad sin una
conversación previa. Receipts actualizan entrega y no deciden negocio.

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

## Ampliacion CRM local de TASK-20260803-004

Esta seccion reemplaza el alcance efimero inicial para la demo local. La semilla canonica contiene 18 expedientes ficticios con producto `CAMISETAS` o `EQUIPO_COMPLETO`, cantidades, talles, colores, personalizacion, datos confirmados y faltantes.

La oportunidad usa `NUEVO`, `EN_CALIFICACION`, `COTIZADO`, `EN_SEGUIMIENTO`, `PERDIDO` o `SENA_VALIDADA`, y conserva proxima accion, fecha, estado, version, seguimientos e historial. Cada mutacion autorizada incrementa la version. `SENA_VALIDADA` es solo una etapa fixture: no crea ni certifica pagos.

El JSON local atomico conserva solamente fixtures ignorados por Git. La vertical no convierte leads en clientes, no interpreta con IA, no envia mensajes y no crea pagos, pedidos ni produccion.

Esa última limitación describe solamente el adaptador JSON de demo. La
persistencia objetivo PostgreSQL y la conversión gobernada pertenecen a
`TASK-20260814-001` y no habilitan integraciones reales por sí solas.
