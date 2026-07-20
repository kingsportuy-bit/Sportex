# Módulo clientes y leads

## Responsabilidad

Conservar identidad comercial, equipo, teléfonos, origen, consultas, cotizaciones y conversión a cliente.

## Fuente/decisión

`BUSINESS.md` y conversaciones históricas de Delta.

## Owner

Core SPORTEX, dominio comercial.

## Permisos

Ventas administra; otros roles leen según necesidad.

## Contrato de entrada

Tenant, identidad normalizada, canal, origen y hechos comerciales validados.

## Contrato de salida

Cliente o lead único, historial, pedidos relacionados y etapa comercial.

## Persistencia

Clientes, teléfonos, equipos, leads, campañas, cotizaciones y enlaces de conversación.

## Auditoría

Creación, fusión, cambios de identidad, conversión y asociación de pedidos.

## Side effects

Crear tareas comerciales o notificaciones autorizadas.

## Workers

Deduplicación asistida y seguimientos programados.

## Tests

Teléfono duplicado, varias identidades, fusión reversible, origen publicitario y aislamiento.

## Evidencia

Alta y listado de clientes tenant-aware, teléfono único por tenant y pruebas en `TASK-20260719-006`. Leads pendientes.

## Rollback

Deshacer vínculo o fusión conservando IDs e historial.

## Estado

EN_PROGRESO.

## Cierre documental

Requiere política de identidad, modelo de cotización y casos de duplicados Delta.
