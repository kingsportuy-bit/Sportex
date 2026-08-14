# Módulo procesos

## Responsabilidad

Definir plantillas editables e instanciar etapas, controles, dependencias, responsables, plazos y bloqueos por pedido.

## Fuente/decisión

`BUSINESS.md` y guías operativas Delta.

## Owner

Core SPORTEX, motor de procesos.

## Permisos

Configurar plantillas requiere administración; avanzar etapa requiere capacidad y gates cumplidos.

## Contrato de entrada

Tenant, productos, versión de plantilla y eventos de avance.

## Contrato de salida

Proceso inmutable por versión, etapas activas, trabajos, bloqueos y acciones disponibles.

## Persistencia

Plantillas, versiones, instancias, etapas, transiciones, controles, dependencias y SLA.

## Auditoría

Creación, edición, publicación, transición, override y motivo.

## Side effects

Solicita trabajos, documentos y notificaciones mediante eventos.

## Workers

Vencimientos y recordatorios; nunca avanzan una etapa solo por tiempo.

## Tests

Plantilla nueva, versión histórica, gate incompleto, ramas paralelas, bloqueo y override autorizado.

## Evidencia

Proceso Delta documentado. La UI local de `TASK-20260803-005` demuestra que una
única plantilla puede alimentar pestañas, etiquetas y filtros de WhatsApp; el
motor, versionado y configuración persistida por empresa siguen pendientes.

## Rollback

Restaurar plantilla para pedidos futuros o migrar instancia con plan explícito.

## Estado

EN_DEFINICION.

## Cierre documental

Requiere plantillas de producto y motor de transición probado.
