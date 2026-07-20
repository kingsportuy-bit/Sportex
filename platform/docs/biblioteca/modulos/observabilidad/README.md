# Módulo observabilidad

## Responsabilidad

Recolectar y correlacionar logs, métricas, trazas, auditoría técnica, salud y costos de ejecución en un entorno multitenant seguro.

## Fuente/decisión

`OBSERVABILITY.md` y `MULTITENANCY_CONTRACT.md`.

## Owner

Plataforma SPORTEX.

## Permisos

Vistas por empresa y vistas de plataforma separadas; acceso a contenido sensible restringido.

## Contrato de entrada

Eventos estructurados con correlación, componente, tenant interno, resultado y error normalizado.

## Contrato de salida

Dashboards, alertas, trazas, SLIs, diagnósticos y evidencia operativa.

## Persistencia

Logs, métricas, trazas y auditoría en almacenes con retención diferenciada.

## Auditoría

Accesos a observabilidad, silencios de alerta y cambios de retención.

## Side effects

Alertas y creación de incidentes; nunca cambia pedidos directamente.

## Workers

Agregación, retención, evaluación de alertas y exportación segura.

## Tests

Correlación completa, redacción, cardinalidad, aislamiento, alerta y caída del observador sin caída del negocio.

## Evidencia

Logs estructurados Fastify, correlación, health/readiness y errores estables implementados en `TASK-20260719-006`. Métricas y trazas externas pendientes.

## Rollback

Desactivar exporter o alerta conservando operación y auditoría local mínima.

## Estado

EN_PROGRESO.

## Cierre documental

Requiere stack elegido, dashboards mínimos, alertas y prueba multitenant.
