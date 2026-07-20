# Supabase dedicado y protocolo de despliegue

id: TASK-20260719-004
owner: Codex
requester: Fito
estado: superseded

## objetivo

Definir Supabase exclusivo para SPORTEX por entorno y un protocolo formal para despliegues de STAGING, producción y reemplazo del runtime legado.

## alcance_permitido

- inspección read-only de capacidad del VPS;
- contratos documentales de entornos, infraestructura, Supabase, Git y seguridad;
- protocolo de despliegue, migración, cutover y rollback;
- actualización del roadmap y estado.

## alcance_prohibido

- instalar Supabase;
- crear stacks, redes, volúmenes, dominios o secretos;
- modificar producción o el runtime legado;
- migrar datos;
- configurar Evolution;
- realizar commits o pushes.

## entradas

- decisión de Fito de separar Supabase;
- decisión de reemplazar el SPORTEX legado;
- baseline del VPS y runtime legado;
- experiencia documental de releases y migraciones controladas.

## salidas

- `docs/DEPLOYMENT_PROTOCOL.md`;
- `docs/DEPLOYMENT_MANIFEST_TEMPLATE.md`;
- contrato Supabase actualizado;
- topología STAGING/producción;
- gate de capacidad;
- protocolo de reemplazo y rollback.

## validacion

- consistencia entre entornos, infraestructura, Supabase, seguridad y Git;
- ausencia de secretos;
- `npm run validate-docs`.

## evidencia

- `docs/evidencias/TASK-20260719-004_SUPABASE_DEPLOYMENT_PROTOCOL.md`.
- `npm run validate-docs`: PASS.

## superseded

Reemplazada por `TASK-20260719-005`: Fito decidió reutilizar la instancia Supabase actual con separación por prefijos y controles de acceso.
