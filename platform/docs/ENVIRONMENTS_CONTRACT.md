# Contrato de entornos SPORTEX

## DOCUMENTACION

Define producto y contratos. No ejecuta código ni usa servicios reales.

## DESARROLLO

Implementación local con datos ficticios. Puede cambiar agresivamente mientras preserve pruebas y rollback local.

## STAGING

Entorno aislado para integraciones, migraciones y certificación. Debe usar empresas, números, credenciales y datos de prueba explícitos.

- stack de aplicación: `sportex_staging`;
- Supabase compartido, catálogo permitido: `sportex_staging_*`;
- rol y buckets exclusivos de STAGING;
- red privada: `sportex_staging_net`;
- Evolution STAGING y allowlist obligatoria.

## PRODUCCION

Atiende empresas y conversaciones reales. Requiere autorización explícita de Fito, tarea aprobada, cambio mínimo, evidencia, observabilidad y rollback.

- stack de aplicación nuevo: `sportex_prod`;
- Supabase compartido, catálogo permitido: `sports_*`;
- rol y buckets exclusivos de producción;
- red privada: `sportex_prod_net`;
- Evolution producción solo durante un cutover aprobado.

## Reglas transversales

- Un entorno no comparte base, secretos, colas ni webhooks con otro.
- Un tenant de prueba no representa un entorno.
- Ningún dato productivo se usa en desarrollo o staging sin autorización y procedimiento documentado.
- Los envíos de WhatsApp de staging requieren allowlist.
- Las certificaciones pertenecen a una versión y entorno concretos.
- STAGING y producción comparten plataforma Supabase, pero no tablas, roles de aplicación, políticas, buckets ni migraciones.
- Todo despliegue sigue `DEPLOYMENT_PROTOCOL.md`.
