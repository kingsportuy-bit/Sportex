# Baseline del runtime SPORTEX existente

Verificado: 2026-07-19.

Modo: inspección `read-only` como `root` sobre el VPS.

## Distinción obligatoria

Existen dos realidades diferentes:

| Superficie | Estado |
| --- | --- |
| SPORTEX legado | Desplegado y accesible en producción |
| Nuevo Core modular documentado en esta carpeta | No implementado ni desplegado |

El runtime legado no certifica la arquitectura objetivo. Debe conservarse como baseline hasta que exista una migración y un rollback aprobados.

## Directorio y Git en el VPS

- directorio: `/opt/sportex`;
- checkout Git presente y limpio;
- remoto: `https://github.com/kingsportuy-bit/sportex.git`;
- rama local del VPS: `master`;
- commit desplegado: `a62e5edb326c5b54a0d78c03ffed78227610ed77`;
- el commit coincide con `origin/main`;
- `origin/master` permanece en un commit anterior.

La estrategia de reconstrucción debe resolver la divergencia de nombres de rama sin reescribir historia ni reemplazar el checkout existente.

## Docker Swarm y publicación

- stack: `sportex`;
- servicio: `sportex_sportex`;
- réplicas observadas: `1/1`;
- imagen: `sportex:latest`;
- aplicación: Next.js monolítica;
- dominio: `https://sportex.codexa.uy`;
- comportamiento público observado: redirección a `/login`;
- red: `codexanet`;
- montajes persistentes del servicio: ninguno.

El servicio usa una etiqueta mutable, no declara healthcheck y no posee una red privada propia de SPORTEX.

## Arquitectura efectiva del legado

```text
Navegador
   |
Next.js sportex_sportex
   |
Supabase de producción / tablas public.sportex_*
```

No existe un servicio Core separado. Parte de la lógica y de las escrituras se encuentran en frontend, hooks, server actions y rutas de la propia aplicación Next.js.

La ruta heredada `/api/webhook/n8n` continúa en el código, pero n8n no forma parte de la arquitectura objetivo nueva.

Evolution de producción contiene una instancia legado `DELTA`, observada en estado `close` y sin webhook configurado. No se encontró una instancia equivalente en STAGING.

## Supabase efectivo

Se observaron 13 tablas `public.sportex_*` en Supabase de producción.

- 1 tabla tenía RLS habilitado;
- 12 tablas tenían RLS deshabilitado;
- existían políticas declaradas para 10 tablas, pero una política no protege una tabla cuando RLS está deshabilitado;
- el ownership principal se expresa con `usuario_id`, no con el `tenant_id` objetivo;
- varias tablas históricas y temporales no exponen una columna directa de empresa o usuario.

La base existente es material de migración; no constituye todavía el modelo multitenant certificado.

El reemplazo migrará los datos autorizados desde las tablas legado `sportex_*` hacia las nuevas tablas `sports_*` dentro de la misma instancia Supabase. El nuevo Core no escribirá las tablas legado.

## Hallazgos de seguridad prioritarios

Sin registrar valores sensibles, se comprobó que:

- existe una credencial de privilegio elevado escrita en el Dockerfile legado;
- el contenedor en ejecución contiene un archivo `.env`;
- el webhook heredado declara validación de API key, pero no la ejecuta;
- la autenticación mantiene compatibilidad con contraseñas antiguas en texto plano;
- una migración legado deshabilita RLS en múltiples tablas;
- el frontend legado se conecta directamente con Supabase de producción.

Este baseline no cumple el contrato de seguridad objetivo. Antes de reutilizar o promover el runtime se requiere una tarea de contención y rotación de secretos, seguida por una auditoría de acceso, autenticación, RLS y endpoints.

## Límite de esta inspección

No se modificaron archivos, repositorio, imagen, servicio, stack, red, base, políticas, credenciales ni datos. Tampoco se reinició el servicio.

El procedimiento de reemplazo está definido en `DEPLOYMENT_PROTOCOL.md`.
