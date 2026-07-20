# Conexiones SPORTEX

Este documento registra puntos de acceso sin secretos.

## Git

- Repositorio existente: `https://github.com/kingsportuy-bit/sportex.git`.
- Rama verificada: `main`.
- Commit local/remoto verificado el 2026-07-19: `a62e5edb326c5b54a0d78c03ffed78227610ed77`.
- Checkout anterior: `C:\Users\Fito\Documents\APP\SPORTEX`.
- Estado observado: árbol limpio y acceso read-only al remoto confirmado.

Checkout desplegado en el VPS:

- ruta: `/opt/sportex`;
- rama local: `master`;
- commit: `a62e5edb326c5b54a0d78c03ffed78227610ed77`;
- corresponde a `origin/main`; `origin/master` permanece en el commit anterior.

La carpeta nueva `C:\Users\Fito\Documents\CODEX\DELTA\sportex` todavía no es un checkout Git. Su incorporación al repositorio requiere una tarea específica para preservar historial y auditar el código anterior.

## VPS

- SSH: `root@31.97.28.4` mediante clave local existente.
- Hostname verificado: `codexa`.
- No registrar claves ni contraseñas aquí.

Runtime SPORTEX legado observado:

- stack: `sportex`;
- servicio: `sportex_sportex` `1/1`;
- dominio: `https://sportex.codexa.uy`;
- red: `codexanet`;
- imagen: `sportex:latest`;
- directorio: `/opt/sportex`.

## Supabase compartido

Stacks observados:

- producción: servicios `supabase_*`;
- staging: servicios `supabase_staging_*`.

Servicios de base observados `1/1`:

- `supabase_db`;
- `supabase_staging_db`.

Fronteras SPORTEX:

- legado: `public.sportex_*`, fuente de migración y archivo;
- nuevo STAGING: `public.sportex_staging_*`;
- nueva producción: `public.sports_*`.

La misma plataforma exige roles, grants, RLS, migraciones, buckets y guardas de entorno explícitos. Compartir instancia no autoriza acceso cruzado.

## Evolution API

Servicios observados `1/1`:

- producción: `evolution_evolution_api`;
- staging: `evolution_staging_evolution_api`.

Instancias SPORTEX/Delta observadas:

- producción: `DELTA`, estado `close`, sin webhook configurado;
- staging: ninguna coincidencia SPORTEX/Delta.

Endpoints conocidos del entorno BARBEROX:

- staging: `https://evolution-staging.codexa.uy`;
- producción: `https://evolutioncodexa.codexa.uy`.

El nuevo SPORTEX usará inicialmente Evolution STAGING. La instancia legado de producción no se modifica ni reutiliza sin autorización separada.

## Traefik

- Servicio observado: `traefik_traefik` `1/1`.
- Dominio legado observado: `sportex.codexa.uy`.
- El dominio de STAGING para la reconstrucción queda pendiente.

## n8n

SPORTEX no utilizará n8n. No existe conexión ni dependencia objetivo con esa plataforma.
