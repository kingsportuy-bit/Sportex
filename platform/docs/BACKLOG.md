# Backlog SPORTEX

## Producto y negocio

- Definir ficha de venta a diseño.
- Definir ficha de diseño a impresión.
- Definir ficha de taller a envío.
- Definir ficha de cierre.
- Documentar plantillas de proceso por producto.

## Core

- Diseñar entidades y modelo de datos.
- Definir catálogo de comandos y eventos.
- Diseñar outbox, jobs y reintentos.
- Diseñar permisos y roles.
- Definir política de versionado documental.

## Integraciones

- Definir mecanismo de certificación de pagos.
- Definir ingreso de WhatsApp.
- Definir aprovisionamiento y ciclo de vida de instancias Evolution por empresa y entorno.
- Definir almacenamiento de archivos.

## Infraestructura y despliegue

- Repetir gate de capacidad antes de desplegar nuevos servicios.
- Crear roles y grants separados para STAGING y producción.
- Crear tablas `sportex_staging_*` mediante migraciones versionadas.
- Certificar RLS, backup y restauración de tablas STAGING.
- Desplegar Core, workers y frontend en STAGING.
- Ensayar migración desde tablas legado `sportex_*`.
- Crear tablas `sports_*` solamente para el cutover autorizado.
- Rotar los secretos expuestos del runtime legado.

## Auditoría pendiente

- Auditar código, frontend, esquema y tablas del SPORTEX anterior.
