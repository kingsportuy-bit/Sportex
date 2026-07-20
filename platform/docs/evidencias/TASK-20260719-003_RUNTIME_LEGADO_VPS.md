# Evidencia TASK-20260719-003

Fecha: 2026-07-19.

Modo: inspección `read-only` como `root`.

## Evidencia observada

- VPS: `31.97.28.4`, hostname `codexa`;
- directorio: `/opt/sportex`;
- stack: `sportex`;
- servicio: `sportex_sportex`, réplica `1/1`;
- imagen: `sportex:latest`;
- dominio: `https://sportex.codexa.uy`;
- respuesta pública: redirección HTTP 307 a `/login`;
- red del servicio: `codexanet`;
- repositorio: `https://github.com/kingsportuy-bit/sportex.git`;
- rama local del VPS: `master`;
- commit: `a62e5edb326c5b54a0d78c03ffed78227610ed77`, coincidente con `origin/main`;
- aplicación: Next.js monolítica conectada a Supabase de producción;
- tablas observadas: 13 tablas `public.sportex_*`;
- RLS observado: habilitado en 1 de 13 tablas.
- instancia Evolution de producción: `DELTA`, estado `close`, sin webhook;
- Evolution STAGING: sin instancia SPORTEX/Delta observada.

## Riesgos observados

- secreto de servidor escrito en el Dockerfile legado;
- archivo `.env` presente en el contenedor;
- validación de API key pendiente en webhook heredado;
- compatibilidad con contraseñas en texto plano;
- RLS deshabilitado en la mayoría de las tablas;
- ausencia de Core independiente y acceso directo del legado a Supabase.

No se registran valores de credenciales ni datos personales en esta evidencia.

## Mutaciones

Ninguna. No se realizaron cambios en VPS, Git, Docker, Supabase, Evolution, n8n ni datos.
