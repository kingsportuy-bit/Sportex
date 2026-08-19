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

Revertir la imagen a `sportex-staging:3f2962610d2a4da6` si falla smoke o QA. Las migraciones
son aditivas; no se borra información. La prueba controlada revierte por
transición permitida y conserva auditoría.

## deuda_restante

- Certificación real de seña, producción detallada, entregas, postventa y
  procesos configurables completos permanecen fuera de este corte.

## registro_de_avances

- `e845927` desplegado: al abrir cualquier chat de WhatsApp, tanto la primera
  carga como su actualización quedan en el último mensaje. `1/1`, health,
  ready y JavaScript público PASS; sin migraciones, datos ni mensajes.
  Rollback `d7150d7`.
- `3f29626` desplegado: pestañas de etapas arriba de WhatsApp, antes del chat.
  `1/1`, health, ready, HTML y CSS públicos PASS; sin migraciones, datos ni
  mensajes. Rollback `e845927`.
- `a0be896` desplegado: botón `Editar etapas` visible junto a esas pestañas;
  `1/1`, health, ready y HTML público PASS. Sin migraciones, datos ni mensajes.
  Rollback `3f29626`.
- Pendiente: recorrido autenticado real, sin escritura ni mensajes de prueba.

## decisiones

- El origen inicial admite solo atribución exacta de Ads o `DESCONOCIDO`.
- El pedido inicia en `INGRESO`; el tablero lo conduce por boceto, producción
  y finalización con transiciones autorizadas y auditadas.
- `SPORTEX-DEC-016`: Leads administra oportunidades; WhatsApp conserva la
  conversación completa como superficie independiente.
- `SPORTEX-DEC-017`: SPORTEX opera solamente en modo oscuro.
