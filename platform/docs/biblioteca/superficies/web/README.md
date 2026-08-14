# Superficie web

## Responsabilidad

Mostrar información del Core y permitir ejecutar acciones autorizadas.

## Reglas

- Sin acceso directo a base de datos.
- Sin cálculos o transiciones de negocio.
- Las acciones disponibles vienen del Core.
- Las vistas son proyecciones reconstruibles.
- Mostrar bloqueos y evidencia sin ocultar estados reales.
- Separar permisos visuales de autorización efectiva del Core.

## Estado

IMPLEMENTADO_NO_VALIDADO. Frontend nuevo sin acceso a base, con login Supabase
y comandos del Core; smoke visual local historico en PASS. Despliegue y E2E de
`PILOTO_DELTA` pendientes de replanificacion.

`TASK-20260803-001` agrega una mesa comercial local para visualizar origen,
conversación, etapa y próxima acción. No habilita envío ni datos reales.

## Demo CRM local

`TASK-20260803-004` valida una mesa master-detail con tablero, filtros, ficha, conversacion historica, atribucion, etapa, proxima accion, seguimiento y reset controlado. Consume solo el Core, persiste solo fixtures locales y no habilita envio ni datos reales.

La validación técnica permanece en PASS, pero la experiencia está
`VALIDACION_PRODUCTO_NO_APROBADA`. `DELTA-DEC-012` corrige el contrato visual:
`Leads` y `Pedidos` abren en tableros por etapas; conversación y ficha se abren
lado a lado desde una tarjeta. `Clientes` enlaza conversaciones, oportunidades
y pedidos. No se modifica código hasta aprobar el wireframe corregido.

La Etapa 0 de la V1 amplía el contrato visual a Operación (`Hoy`, `Leads`,
`Pedidos`, `Clientes`), Marketing (`Anuncios`, `Creativos`, `Resultados`) y
Administración mínima. La ficha completa es secundaria; cada pantalla conserva
un trabajo principal. Respuestas, tabla de talles y la implementación del mock
relacionado de 6 clientes y 8 pedidos son objetivos, no evidencia actual.

`TASK-20260803-005` agrega a WhatsApp viñetas altas con texto vertical,
encastradas fuera del lateral izquierdo de la lista, y detalle de contacto/proceso
dentro del panel de conversación sin bloquear el compositor. En desarrollo
local las etapas provienen de una
plantilla única de fixtures; la superficie no decide transiciones ni demuestra
todavía configuración persistida por empresa.
