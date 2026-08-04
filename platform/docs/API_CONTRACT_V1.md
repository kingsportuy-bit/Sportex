# Contrato API SPORTEX v1

## Convenciones

- base: `/v1`;
- JSON UTF-8;
- `x-correlation-id` opcional; el Core genera uno si falta;
- `Idempotency-Key` obligatorio en comandos de creación;
- errores estables: `{ error, message, correlationId, details? }`;
- respuestas: `{ data, meta: { correlationId, replayed? } }`.

## Autenticación

### Development y test

Permiten un adaptador de headers solamente si `SPORTEX_DEV_AUTH=true`:

- `x-sportex-tenant-id`;
- `x-sportex-actor-id`;
- `x-sportex-capabilities`.

El proceso se niega a iniciar con este adaptador en `PILOTO_DELTA` o
`PRODUCCION_COMERCIAL`.

### PILOTO_DELTA y PRODUCCION_COMERCIAL

- El navegador obtiene un access token desde Supabase Auth.
- Envía `Authorization: Bearer <token>` al Core.
- El Core valida el token contra el servicio Auth del entorno.
- El `tenant_id` proviene de metadata firmada y se confirma con una membresía activa en base.
- Las capacidades efectivas provienen de la membresía, no del token enviado por el frontend.
- Un usuario autenticado sin empresa o membresía queda rechazado.

## Configuración y sesión

### `GET /v1/public-config`

No requiere sesión. Devuelve solamente configuración pública de Auth, entorno y release. La anon key de Supabase es pública por definición; nunca devuelve service role ni secretos de base.

### `GET /v1/session`

Requiere token Bearer. Devuelve identidad, empresa activa, capacidades y si la contraseña temporal debe cambiarse.

## Salud

### `GET /health`

Confirma proceso vivo y release. No prueba dependencias.

### `GET /ready`

Confirma repositorio y Supabase Auth requeridos.

## Clientes

### `POST /v1/clients`

Capacidad: `clients.create`.

Body:

```json
{
  "displayName": "Fito",
  "teamName": "Delta FC",
  "primaryPhone": "+59899111222"
}
```

### `GET /v1/clients`

Capacidad: `clients.read`. Nunca acepta `tenantId` por query.

## Mesa comercial local

Disponible solamente si el Core inicia con `development|test`, store `memory`
y `SPORTEX_DEV_AUTH=true`. No existe en `PILOTO_DELTA` ni producción.

### `POST /v1/local/evolution-replays`

Capacidad: `commercial.replay`. Requiere `Idempotency-Key`.

Recibe un evento reducido estilo Evolution con:

- `event=messages.upsert`;
- `instance=LOCAL_FIXTURE`;
- `key.id=msg-ficticio-*` y `remoteJid=contacto-ficticio-*`;
- mensaje entrante de texto y fecha ISO;
- `externalAdReply` opcional con IDs ficticios.

El Core rechaza referencias que no sean ficticias. El mismo mensaje del
proveedor no crea dos conversaciones, leads ni oportunidades aunque llegue con
otra clave HTTP.

### `GET /v1/commercial/workspace`

Capacidad: `commercial.read`. Devuelve la proyección tenant-aware con
conversación, atribución, lead, oportunidad, etapa y próxima acción.

### `GET /v1/public-config`

Incluye `localCommercialReplayEnabled` para que la web muestre el modo local
solo cuando el guard de entorno está activo.

## Pagos

### `POST /v1/payments/certify`

Capacidad: `payments.certify`.

Body:

```json
{
  "clientId": "uuid",
  "evidenceReference": "transferencia-2026-0001",
  "amountCents": 150000,
  "currency": "UYU"
}
```

## Pedidos

### `POST /v1/orders/from-certified-payment`

Capacidad: `orders.create`.

Body:

```json
{
  "clientId": "uuid",
  "certifiedPaymentId": "uuid",
  "teamName": "Delta FC",
  "quotedTotalCents": 450000,
  "currency": "UYU"
}
```

La respuesta incluye `balanceCents` calculado por el Core.

### `GET /v1/orders`

Capacidad: `orders.read`. Devuelve solamente pedidos del tenant resuelto por identidad.

## Códigos de error iniciales

- `authentication_required`;
- `authentication_unavailable`;
- `development_auth_forbidden`;
- `tenant_membership_required`;
- `permission_denied`;
- `invalid_payload`;
- `idempotency_key_required`;
- `idempotency_key_invalid`;
- `idempotency_conflict`;
- `fixture_only`;
- `client_not_found`;
- `client_phone_conflict`;
- `payment_not_found`;
- `payment_evidence_conflict`;
- `payment_already_used`;
- `payment_client_mismatch`;
- `currency_mismatch`;
- `quoted_total_below_deposit`;
- `not_found`;
- `internal_error`.

### Mutaciones de la demo CRM local

`TASK-20260803-004` agrega estos comandos bajo el mismo guard triple. Las mutaciones requieren `commercial.manage`, un recurso del tenant y `expectedVersion`:

- `PATCH /v1/local/commercial/workspace/:itemId/stage`: aplica una transicion permitida entre `NUEVO`, `EN_CALIFICACION`, `COTIZADO`, `EN_SEGUIMIENTO`, `PERDIDO` y `SENA_VALIDADA`.
- `PATCH /v1/local/commercial/workspace/:itemId/next-action`: edita texto y fecha de proxima accion.
- `POST /v1/local/commercial/workspace/:itemId/follow-ups`: registra una nota interna; no crea un mensaje ni efecto externo.
- `POST /v1/local/commercial-demo/reset`: exige `confirmation=RESTAURAR_DATOS_FICTICIOS` y repone los 18 fixtures del tenant.

`GET /v1/public-config` incluye `localCommercialPersistenceEnabled`. El JSON local no es una API de datos reales ni persistencia candidata para piloto.
