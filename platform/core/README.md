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

La campaña `CAMP-20260803-001` agrega una segunda vertical, todavía limitada a
desarrollo local:

- replay de eventos ficticios estilo Evolution;
- conversación y mensajes normalizados;
- atribución `META_EXACTO` o `DESCONOCIDO`;
- lead, oportunidad, etapa `NUEVO` y próxima acción;
- store efímero separado y guardado por entorno, driver y autenticación.

Validación local:

```powershell
npm run validate
```

No esta certificado en `PILOTO_DELTA`. Development/test conserva headers
explicitos; el codigo todavia usa nombres tecnicos STAGING que deben
replanificarse antes de cualquier despliegue real. El piloto exige Supabase Auth
y membresia activa.

El replay comercial no existe fuera de `development|test + memory + dev auth`,
no se conecta a Evolution y no envía mensajes.

Ver `../docs/DOMAIN_MODEL_V1.md`, `../docs/API_CONTRACT_V1.md` y la tarea activa.
