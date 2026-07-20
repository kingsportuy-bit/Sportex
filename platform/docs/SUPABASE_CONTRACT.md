# Contrato Supabase SPORTEX

## Decisión

SPORTEX utilizará la instancia Supabase autoalojada actual. La separación será lógica y verificable mediante prefijos de tabla, roles, grants, RLS, migraciones, buckets y credenciales de aplicación.

## Entornos

- Desarrollo: Supabase local o base descartable aislada.
- Legado producción: tablas `sportex_*`, fuente temporal de migración.
- Nuevo STAGING: tablas `sportex_staging_*`.
- Nueva producción: tablas `sports_*`, solamente después de promoción autorizada.

## Baseline legado

El SPORTEX desplegado ya usa Supabase de producción y tablas `public.sportex_*`. La inspección del 2026-07-19 observó 13 tablas, con RLS habilitado solamente en una.

Esas tablas son legado a inventariar y migrar. Su existencia no autoriza al nuevo frontend a escribirlas directamente ni certifica aislamiento multitenant.

## Aislamiento con BARBEROX y otros servicios

Compartir el stack no significa compartir el dominio.

Cada entorno tendrá:

- catálogo explícito de tablas permitidas;
- rol de base propio con grants limitados a su catálogo;
- RLS y políticas propias;
- migraciones propias y con guardas de prefijo;
- buckets y rutas propios;
- credenciales de aplicación diferenciadas cuando el componente lo permita;
- backups y restauración identificables;
- ownership sin dependencia de tablas BARBEROX.

Una service role global de Supabase puede saltar RLS; por eso solamente el Core puede custodiarla y su uso queda restringido a operaciones administrativas excepcionales. El acceso normal del Core debe usar roles limitados por entorno.

Quedan prohibidos accesos de STAGING a `sportex_*`, `sports_*` o tablas de otros productos, y accesos de producción a `sportex_staging_*`.

Las migraciones no pueden seleccionar tablas mediante patrones ambiguos: deben operar sobre un manifiesto explícito de nombres.

## Acceso

- Frontend usa Auth y API del Core.
- Frontend no usa service role ni escribe tablas de dominio directamente.
- Core usa credenciales servidor con mínimo privilegio.
- Operaciones administrativas quedan auditadas.
- `tenant_id` se aplica además de la separación entre aplicaciones.

## Storage

Bocetos, logos, comprobantes y fichas se almacenan en buckets privados, particionados por tenant y recurso, con URLs temporales.

## Realtime

Realtime puede actualizar proyecciones visuales, pero no decide reglas ni reemplaza eventos del Core.

## Migraciones

- versionadas en Git;
- aditivas cuando sea posible;
- probadas en STAGING;
- con validación de aislamiento;
- rollback o restauración documentados;
- sin editar producción manualmente como método normal.

## Observabilidad

Medir conexiones, queries lentas, errores, locks, espacio, migraciones y fallos de RLS sin exponer datos personales.
