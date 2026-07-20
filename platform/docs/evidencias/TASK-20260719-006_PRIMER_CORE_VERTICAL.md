# Evidencia TASK-20260719-006

Fecha: 2026-07-19.

Entorno: desarrollo local con datos sintéticos.

## Resultado

Se implementó la primera vertical del nuevo Core SPORTEX:

```text
cliente -> seña certificada -> pedido -> auditoría + outbox
```

Incluye:

- Node.js 22, TypeScript estricto y Fastify;
- configuración con guardas de entorno;
- tenant y actor resueltos fuera del payload;
- capacidades `clients.*`, `payments.certify` y `orders.*`;
- idempotencia con hash y lock transaccional para PostgreSQL;
- repositorio in-memory transaccional para pruebas;
- repositorio PostgreSQL tenant-aware;
- correlación y errores estables;
- `/health` y `/ready` separados;
- auditoría y outbox dentro de la transacción del pedido;
- migración y rollback STAGING no ejecutados.

## API implementada

- `GET /health`;
- `GET /ready`;
- `POST /v1/clients`;
- `GET /v1/clients`;
- `POST /v1/payments/certify`;
- `POST /v1/orders/from-certified-payment`;
- `GET /v1/orders`.

## Persistencia preparada

Migración: `core/db/migrations/staging/20260719_001_core_foundation.up.sql`.

Tablas explícitas:

- `sportex_staging_tenants`;
- `sportex_staging_memberships`;
- `sportex_staging_clients`;
- `sportex_staging_certified_payments`;
- `sportex_staging_order_counters`;
- `sportex_staging_orders`;
- `sportex_staging_idempotency`;
- `sportex_staging_audit_events`;
- `sportex_staging_outbox`.

Las 9 tablas declaran RLS habilitado y forzado. La migración no crea ni altera `sportex_*` legado o `sports_*` producción.

## Validaciones

- `npm run validate-docs`: PASS, 40 documentos requeridos, 16 módulos y 6 tareas;
- `npm run check`: PASS;
- `npm test`: PASS, 13/13 pruebas;
- `npm run validate-sql`: PASS, 9 tablas STAGING, RLS forzado y rollback;
- `npm run build`: PASS;
- `npm audit`: 0 vulnerabilidades reportadas;
- auditoría local de secretos: sin valores de credenciales;
- auditoría de prefijos SQL: sin creación de tablas legado o producción.

## Smoke del binario compilado

- proceso escuchó en `127.0.0.1:18081`;
- `/health`: 200;
- `/ready`: 200;
- `/v1/orders` sin identidad: 401;
- smoke vertical anterior creó cliente, certificó seña y generó `SPX-2026-00001` con estado `intake_pending`.

Los procesos locales de smoke fueron detenidos al finalizar.

## Límites honestos

- no se ejecutó la migración contra Supabase;
- no existe todavía autenticación Supabase/JWT ni validación de membresía real;
- el adaptador de headers funciona solamente en development/test y el Core se niega a habilitarlo en STAGING/producción;
- no existe worker que procese outbox;
- no se integró Evolution;
- no se implementó frontend;
- no hay certificación STAGING ni despliegue;
- no se modificó VPS, runtime legado, base compartida o producción.
