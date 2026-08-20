# Puesto operativo Delta desde SPORTEX

id: TASK-20260817-001
owner: Codex
requester: Fito
estado: done
lifecycle: closed
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
activa; se verifican primera/intermedia/última y responsive. Fito otorgó
aceptación visual humana explícita el 2026-08-20 sobre la versión local luego
versionada como `d9c32b7`; no autorizó un nuevo despliegue.

## evidencia

- `docs/evidencias/TASK-20260817-001_PUESTO_OPERATIVO_DELTA.md`.

## rollback

Revertir la imagen a `sportex-staging:9ff30856c69fddae` si falla smoke o QA. Las migraciones
son aditivas; no se borra información. La prueba controlada revierte por
transición permitida y conserva auditoría.

## deuda_restante

- Certificación real de seña, producción detallada, entregas, postventa y
  procesos configurables completos permanecen fuera de este corte.
- `d9c32b7` quedó integrado localmente y aceptado, pero no fue publicado ni
  desplegado. El runtime continúa en `4898d55` hasta un GO remoto nuevo.

## registro_de_avances

- `4898d55` está desplegado en `PILOTO_DELTA`: `1/1`, health/ready y CSS/JS
  públicos PASS; sin migraciones, datos ni mensajes. Rollback `9ff3085`.
- Un solo `panelContour` une activa, cabecera y panel en `#111914`; las seis
  inactivas usan `#0e1510`.
- Outbound preservado: `SENT 16→16`, pendientes y outbox `0→0`.
  No hubo nueva escritura remota.
- Fito aceptó visualmente la versión `d9c32b7`. Sintaxis, tres capturas frías,
  siete estados, responsive, teclado y requests controladas PASS. La copia
  píxel a píxel contra la referencia sellada siguió `FAIL_CLOSED` y no se usó
  para sustituir la decisión humana.
- La rama fue integrada por fast-forward en `sportex-governance-20260801`.
  La política `INTEGRADO/PRESERVAR/BLOQUEADO` quedó probada y el inventario
  final de worktrees devolvió `WORKTREE_CLOSE=PASS`.
- Una pérdida lateral de `platform/core` durante el primer retiro se detectó,
  restauró desde `HEAD` sin diff y quedó cubierta por el guard post-retiro;
  tipos, 57/57, SQL y build volvieron a pasar.

## decisiones

- El origen inicial admite solo atribución exacta de Ads o `DESCONOCIDO`.
- El pedido inicia en `INGRESO`; el tablero lo conduce por boceto, producción
  y finalización con transiciones autorizadas y auditadas.
- `SPORTEX-DEC-016`: Leads administra oportunidades; WhatsApp conserva la
  conversación completa como superficie independiente.
- `SPORTEX-DEC-017`: SPORTEX opera solamente en modo oscuro.
- `SPORTEX-DEC-018`: el cierre clasifica todos los worktrees y sólo retira
  automáticamente los limpios e integrados.
