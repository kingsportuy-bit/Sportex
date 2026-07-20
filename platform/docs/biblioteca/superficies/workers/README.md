# Superficie workers

## Responsabilidad

Consumir jobs y outbox para ejecutar efectos externos de forma idempotente y observable.

## Reglas

- Claim seguro y lease.
- Tenant obligatorio.
- Releer estado y permiso antes del efecto.
- Reintentos con backoff y límite.
- Cola muerta visible.
- Resultado verificable.
- Sin creación libre de jobs desde frontend.

## Estado

NO_INICIADO.
