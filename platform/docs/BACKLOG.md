# Backlog SPORTEX

> Cola de producto de alto nivel. El trabajo ejecutable vive en `TASKS/`.

## Gobierno inmediato

- Replanificar TASK-20260719-007 para `PILOTO_DELTA`.
- Revalidar runtime, VPS, Git remoto, Supabase y Evolution antes de operar.
- Auditar el monolito anterior y decidir que se reutiliza o retira.
- Definir la primera tarea vertical posterior a la gobernanza.

## Producto y negocio

- Trazar lead de anuncio -> conversacion WhatsApp -> venta/no respuesta.
- Definir ficha de venta a diseno.
- Definir ficha de diseno a impresion/compras.
- Definir ficha de taller a envio y ficha de cierre.
- Documentar plantillas de proceso por producto.

## Core

- Completar entidades y modelo de datos.
- Definir catalogo de comandos y eventos.
- Completar outbox, jobs, reintentos, permisos y roles.
- Definir versionado documental y auditoria comercial.

## Integraciones

- Definir certificacion de pagos.
- Implementar ingreso durable de WhatsApp y atribucion de anuncios.
- Definir instancia Evolution del piloto y politica de outbound.
- Definir almacenamiento de archivos y retencion.

## PILOTO_DELTA

- Decidir namespace, roles, buckets y migracion de datos.
- Certificar RLS, backup y restauracion.
- Resolver capacidad antes de desplegar servicios nuevos.
- Rotar secretos inseguros del runtime legado.
- Definir dominio, observabilidad, rollback y soporte.

## Comercial

- Certificar aislamiento multiempresa y onboarding.
- Definir planes, soporte, recuperacion e incidentes.
- Abrir `PRODUCCION_COMERCIAL` solo con GO de Fito.
