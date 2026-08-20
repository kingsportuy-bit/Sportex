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
updated_at: 2026-08-20
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

La carcasa visual exige contorno único, color exacto y ninguna línea bajo la
activa; se verifican primera/intermedia/última y responsive. El candidato
`8823a77365f78f25db9fbf7afb5decd21e59f547` quedó autorizado por el plan,
desplegado y aprobado por la Mesa visual y frontend/QA. La aceptación visual
humana de Fito permanece separada y pendiente.

## evidencia

- `docs/evidencias/TASK-20260817-001_PUESTO_OPERATIVO_DELTA.md`.

## rollback

Revertir la imagen a `sportex-staging:4898d557cf0fa678` si falla smoke o QA.
Las migraciones son aditivas; no se borra información. La prueba controlada
revierte por transición permitida y conserva auditoría.

## deuda_restante

- Certificación real de seña, producción detallada, entregas, postventa y
  procesos configurables completos permanecen fuera de este corte.

## registro_de_avances

- `8823a77` está desplegado en `PILOTO_DELTA`: actualización `completed`,
  `1/1`, un task y un contenedor, health/ready y CSS/JS públicos PASS.
- Las siete pestañas conservan una silueta `180×67`; la superficie activa es
  `186×68`, usa el mismo `rgb(20,25,22)` del panel y une a `0px`.
- La activa queda en capa `2`, las inactivas en `1`; el contorno y doble halo
  continúan por el borde superior con desvanecimiento lateral.
- Outbound preservado: total `16→16`, pendientes `0→0` y outbox `0→0`, sin
  migraciones, cambios de datos ni mensajes nuevos.
- Mesa visual y frontend/QA: PASS sin brechas bloqueantes. Aceptación visual
  humana autenticada: pendiente.

## decisiones

- El origen inicial admite solo atribución exacta de Ads o `DESCONOCIDO`.
- El pedido inicia en `INGRESO`; el tablero lo conduce por boceto, producción
  y finalización con transiciones autorizadas y auditadas.
- `SPORTEX-DEC-016`: Leads administra oportunidades; WhatsApp conserva la
  conversación completa como superficie independiente.
- `SPORTEX-DEC-017`: SPORTEX opera solamente en modo oscuro.
