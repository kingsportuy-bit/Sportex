# Core SPORTEX

Estado: `IMPLEMENTADO_NO_VALIDADO`.

El Core se implementa como monolito modular y es la única autoridad de reglas, estados, permisos y efectos autorizados.

La primera vertical disponible incluye:

- clientes;
- certificación manual de seña;
- creación idempotente de pedido;
- auditoría y outbox transaccionales;
- adaptadores in-memory y PostgreSQL;
- migracion transitoria de julio de 2026 con RLS forzado;
- API, health, readiness y correlación;
- autenticación Supabase mediante token Bearer y membresía tenant-aware;
- frontend estático servido sin acceso directo a base.

La campaña `CAMP-20260803-001` agrega una segunda vertical, todavía limitada a desarrollo local:

- replay de eventos ficticios y semilla canonica de 18 casos;
- conversacion y mensajes normalizados de solo lectura;
- atribucion `META_EXACTO` o `DESCONOCIDO` sin inferencias;
- productos, talles, confirmados y faltantes;
- seis etapas, proxima accion, seguimiento y versiones gobernados por el Core;
- persistencia JSON local atomica, tenant-aware e ignorada por Git.

La ampliacion de `TASK-20260803-004` esta `VALIDADA_DESARROLLO_LOCAL`; el estado general continua sin certificacion en `PILOTO_DELTA`.

Validación local:

```powershell
npm run validate
```

No esta certificado en `PILOTO_DELTA`. Development/test conserva headers
explicitos; el codigo todavia usa nombres tecnicos STAGING que deben
replanificarse antes de cualquier despliegue real. El piloto exige Supabase Auth
y membresia activa.

La mesa CRM y su persistencia no existen fuera de `development|test + memory + dev auth`,
no se conecta a Evolution y no envía mensajes.

Ver `../docs/DOMAIN_MODEL_V1.md`, `../docs/API_CONTRACT_V1.md` y la tarea activa.
