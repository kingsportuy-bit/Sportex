# Contrato Supabase/PostgreSQL SPORTEX

## Autoridad

La base persiste estado; el Core valida reglas, permisos y transiciones. El
frontend y los adaptadores no escriben negocio directamente.

## Aislamiento

- Toda fila operativa pertenece a `tenant_id`/`empresa_id`.
- RLS se fuerza y se prueba con casos cross-tenant negativos.
- Roles runtime tienen privilegios minimos.
- Migraciones son versionadas, idempotentes cuando corresponda y con rollback o
  backup restaurable.
- Buckets y archivos preservan tenant, version y auditoria.

## Namespaces heredados

- `sportex_*`: legado observado.
- `sportex_staging_*`: migracion nueva preparada en julio de 2026, no asumida
  como ejecutada ni como target vigente.
- `sports_*`: nombre propuesto anteriormente para produccion, no certificado.

El namespace fisico de `PILOTO_DELTA` se decide en una tarea de migracion luego
de revalidar la base real. No se renombra, copia, mezcla ni elimina ninguna
tabla por esta documentacion.

## Operaciones

Antes de una migracion real:

1. inventario de tablas, roles, policies, funciones, triggers y buckets;
2. backup y prueba de restauracion proporcional;
3. SQL validado y scope exacto;
4. confirmacion de que no toca otros proyectos;
5. GO explicito de Fito;
6. observacion y pruebas de aislamiento posteriores.

Credenciales, tokens y datos reales no se guardan en Git ni evidencia textual.
