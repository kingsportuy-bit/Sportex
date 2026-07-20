# Supabase compartido con prefijos por entorno

id: TASK-20260719-005
owner: Codex
requester: Fito
estado: done

## objetivo

Reemplazar la decisión de stacks Supabase dedicados por el uso controlado de la instancia actual, separando legado, STAGING y producción mediante prefijos, roles, RLS, migraciones y buckets.

## alcance_permitido

- actualizar contratos documentales;
- definir prefijos y ownership por entorno;
- adaptar el protocolo de despliegue y cutover;
- marcar la decisión anterior como superseded;
- verificar metadatos read-only de tablas existentes.

## alcance_prohibido

- crear o modificar tablas;
- ejecutar migraciones;
- cambiar RLS, roles, claves o buckets;
- modificar Supabase o producción;
- desplegar servicios;
- migrar datos legado.

## entradas

- decisión de Fito de reutilizar Supabase actual;
- prefijo nuevo de producción `sports_*`;
- prefijo nuevo de STAGING `sportex_staging_*`;
- tablas legado existentes `sportex_*`.

## salidas

- contrato Supabase corregido;
- protocolo de despliegue sin stacks Supabase nuevos;
- separación explícita legado/STAGING/producción;
- roadmap, sesión y backlog actualizados.

## validacion

- comprobación read-only de prefijos actuales;
- búsqueda de referencias obsoletas a Supabase dedicado;
- ausencia de secretos;
- `npm run validate-docs`.

## evidencia

- `docs/evidencias/TASK-20260719-005_SUPABASE_COMPARTIDO_PREFIJOS.md`;
- `npm run validate-docs`: PASS.
