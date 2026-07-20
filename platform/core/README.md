# Core SPORTEX

Estado: `IMPLEMENTADO_NO_VALIDADO`.

El Core se implementa como monolito modular y es la única autoridad de reglas, estados, permisos y efectos autorizados.

La primera vertical disponible incluye:

- clientes;
- certificación manual de seña;
- creación idempotente de pedido;
- auditoría y outbox transaccionales;
- adaptadores in-memory y PostgreSQL;
- migración STAGING con RLS forzado;
- API, health, readiness y correlación;
- autenticación Supabase mediante token Bearer y membresía tenant-aware;
- frontend estático servido sin acceso directo a base.

Validación local:

```powershell
npm run validate
```

No está desplegado ni certificado en STAGING. Development/test conserva headers explícitos; STAGING exige Supabase Auth y membresía activa.

Ver `../docs/DOMAIN_MODEL_V1.md`, `../docs/API_CONTRACT_V1.md` y la tarea activa.
