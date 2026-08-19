# Puesto operativo Delta desde SPORTEX

id: TASK-20260817-001
owner: Codex
requester: Fito
estado: in_progress
lifecycle: active
work_type: feature
campaign: CAMP-20260803-001
context_focus: product
development_guide_impact: required
updated_at: 2026-08-19
plan_authorization: PLAN_APPROVED_AUTHORIZED

## objetivo

Dejar `PILOTO_DELTA` listo para que Delta opere mañana el ciclo mínimo desde
WhatsApp: clasificar el lead, conservar su origen, crear un Cliente y un único
Pedido, gestionar bocetos y mover el pedido hasta finalizado.

## alcance_permitido

- Tableros de Leads y Pedidos derivados del Core, y comandos de WhatsApp.
- Origen solo `DESCONOCIDO` o `META_EXACTO`, sin atribución inventada.
- Conversión idempotente, datos mínimos, etapas de pedido y boceto vigente.
- Tenant, permisos, versión, auditoría, pruebas, candidato y QA de piloto.

## alcance_prohibido

- Mensajes, automatizaciones, Meta/Ads o `PRODUCCION_COMERCIAL`.
- Señal sin evidencia, pedido duplicado, reglas en frontend o borrado de datos.
- `logo-sportex.png` ajeno al proyecto.

## entradas

- Plan aprobado de Fito, `PILOTO_DELTA` y el antecedente
  `TASK-20260815-002`.

## salidas

- Operación comercial persistida, web operativa y evidencia de piloto sin
  outbound.

## validacion

Core valida tenant, permisos, transición, versión e idempotencia; Diseño deja
una sola versión vigente sin borrar historial; UI verifica tableros y contraste;
PILOTO_DELTA exige health/ready, login y cero mensajes salientes.

## evidencia

- `docs/evidencias/TASK-20260817-001_PUESTO_OPERATIVO_DELTA.md`.

## rollback

Revertir la imagen a `e24cfcf2154ac5c7` si falla smoke o QA. Las migraciones
son aditivas; no se borra información. La prueba controlada revierte por
transición permitida y conserva auditoría.

## deuda_restante

- Certificación real de seña, producción detallada, entregas, postventa y
  procesos configurables completos permanecen fuera de este corte.

## registro_de_avances

- Runtime `9250d3a`: login, tableros, carga, boceto y sesión.
- Sin mensajes de prueba; salida manual Delta habilitada.
- PASS local 57/57, build, SQL y QA; deploy `1/1`, health, ready y consulta.
- Incidente UUID/texto corregido: `SPX-ERR-20260819-001`.
- Pendiente: recorrido autenticado real, sin escritura ni mensajes de prueba.

## decisiones

- El origen inicial admite solo atribución exacta de Ads o `DESCONOCIDO`.
- El pedido inicia en `INGRESO`; el tablero lo conduce por boceto, producción
  y finalización con transiciones autorizadas y auditadas.
