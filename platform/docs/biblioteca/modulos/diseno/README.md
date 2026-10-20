# Módulo diseño

## Responsabilidad

Gestionar brief, archivos recibidos, bocetos, correcciones, variantes y aprobación final del cliente.

## Fuente/decisión

Proceso Delta y futura ficha de venta a diseño.

## Owner

Área de diseño mediante Core SPORTEX.

## Permisos

Diseño edita; cliente aprueba por evidencia vinculada; producción solo lee versión liberada.

## Contrato de entrada

Pedido, brief, logos, colores, personalización, variantes y pendientes.

## Contrato de salida

Bocetos versionados, aprobación, lista final y evento `design.approved`.

## Persistencia

Brief, assets, revisiones, comentarios, aprobaciones y versión final.

## Auditoría

Quién cambió, qué versión se envió y qué evidencia aprobó el cliente.

## Side effects

Notificar pendientes, solicitar aprobación y habilitar liberación técnica.

## Workers

Previsualizaciones, conversión de archivos y recordatorios.

## Tests

Versión reemplazada, aprobación ambigua, cambio posterior, datos faltantes y acceso por tenant.

## Evidencia

Pendiente definir ficha de etapa.

## Rollback

Restaurar versión anterior como base de nueva revisión; no borrar historial.

## Estado

EN_DEFINICION.

El laboratorio local importado vive en `platform/bocetos`, con contrato en
`docs/BOCETOS_LOCAL_CONTRACT.md` (TASK-20261018-001). Esta superficie no certifica
el modulo ni integra aprobaciones, pedidos o persistencia por tenant.

TASK-20261019-001 agrega panel local gobernado por `core/bocetos/`: acceso y
vencimiento, creditos idempotentes, recursos privados y consumo por empresa.
Persistencia JSON local e identidad ficticia; no habilita uso comercial ni CRM.

## Cierre documental

TASK-20261020-006: catalogo de configuraciones de mockup en Core/bocetos,
admin exclusivo y lectura de publicaciones por empresas. Reutiliza lienzo;
primer kit actual, defaults versionados y snapshot por boceto. Contrato
BOCETOS_LOCAL_CONTRACT.md; evidencia TASK-20261020-006_PANEL_MOCKUPS.md.

TASK-20261020-005 valida localmente copia desde la referencia con Logo2, paquete
UI real y HTTP autenticado, sin IA paga. Contrato BOCETOS_LOCAL_CONTRACT.md y
evidencia TASK-20261020-005_COPIAR_REFERENCIA.md. No acredita release nuevo.

Requiere responsabilidades, ficha, estados y prueba con pedido Delta.
