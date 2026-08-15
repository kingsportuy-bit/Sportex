# Incorporar cronología operativa al chat WhatsApp

id: TASK-20260815-001
owner: Codex
requester: Fito
estado: done
lifecycle: closed
work_type: feature
campaign: CAMP-20260803-001
context_focus: architecture
development_guide_impact: none
updated_at: 2026-08-15

## objetivo

Intercalar en el chat WhatsApp-first los hitos operativos existentes del Core
sin convertirlos en mensajes y dejar el contrato de actor/origen compatible
con un asistente futuro que permanece sin camino ejecutable.

## alcance_permitido

- Modelo y persistencia aditiva tenant-aware para eventos de cronología.
- Proyección retrocompatible `messages + timeline` sin alterar el journal,
  outbox, provider IDs, receipts, ordering ni polling actual.
- Hitos existentes: oportunidad, etapa, próxima acción, seguimiento, seña,
  Cliente/Pedido y entrega a producción.
- UI desktop/mobile con separadores operativos y lenguaje no técnico.
- Actor y origen `assistant` representables solo como datos futuros.
- Pruebas negativas que demuestren ausencia de proveedor, prompts, jobs,
  worker, propuestas y outbound IA.
- Preparar candidato, migración, backup y rollback para `PILOTO_DELTA`.

## alcance_prohibido

- Activar, implementar o configurar un bot o proveedor LLM.
- Generar borradores, clasificaciones, follow-ups o respuestas automáticas.
- Crear endpoints de activación, workers, jobs, prompts o outbound IA.
- Cambiar estados comerciales, reglas de Delta, campañas ADS o atribución.
- Desplegar, migrar o enviar mensajes reales sin gate propietario exacto.
- Abrir `PRODUCCION_COMERCIAL` o incluir empresas externas.

## entradas

- `HANDOFF-20260815-006` y autorización `AUTH-20260815-004`.
- Cierre certificado de `TASK-20260814-001`.
- Mensajes, journal, outbox, receipts, polling y Core vigentes.
- `CommercialActivity` y eventos de dominio existentes.

## salidas

- Contrato discriminado de mensajes y eventos operativos.
- Migración aditiva y reversible.
- Proyección API retrocompatible y cronología determinista.
- Separadores operativos desktop/mobile.
- Compatibilidad pasiva de actor/origen `assistant` sin automatización.
- Evidencia local, candidato exacto y paquete de eventual promoción.

## validacion

- Regresión de mensajes, provider IDs, receipts, eco, ordering y polling.
- Idempotencia, reinicio/reproyección, live/backfill y tenant isolation.
- Un fallo de proyección de eventos no impide persistir mensajes.
- Desktop/mobile conservan compositor, scroll, foco y borrador.
- Cero rutas, proveedores, prompts, jobs, workers, propuestas o outbound IA.
- Migración up/down, SQL, TypeScript, tests, build y `SPORTEX_CLOSE=PASS`.

## evidencia

- `docs/evidencias/TASK-20260815-001_CRONOLOGIA_OPERATIVA.md`.

## rollback

- Feature flag de lectura/presentación para retirar la cronología sin tocar mensajes.
- Migración aditiva reversible y fuentes originales conservadas.
- Artefacto productivo anterior `sportex-staging:3c8c9da25ba1fae3`.
- Ningún rollback borra mensajes, journal, outbox ni eventos fuente.

## deuda_restante

- Un asistente operativo requiere otra decisión, task y autorización.
- Paginación avanzada y una taxonomía transversal se posponen hasta medir volumen.
- El primer envío manual real de Fito sigue siendo aceptación humana separada.

## registro_de_avances

### 2026-08-15 - historial de candidatos rechazados

- `fca96c2`, `c22a714` y `e455915` no se publican ni promueven.
- Las revisiones previas incorporaron desacople, migration-first, RLS, E2E,
  contraste y límites, pero no alcanzaron el contrato final.

### 2026-08-15 - reabierta por cuarta revisión NO-GO

- El candidato `e455915` no se publica ni promueve.
- La humanización pasa a ser estructural y específica por tipo de evento; nunca
  sustituye tokens dentro de notas, motivos u otro texto libre.
- TypeScript, backfill SQL y preflight deben producir el mismo detalle exacto.
- El E2E pasa a tener un comando autocontenido que levanta y limpia su demo.

### 2026-08-15 - cuarta corrección validada

- TS y SQL humanizan solo campos estructurales; nota, motivo y texto libre se
  conservan literales aun cuando repiten todos los tokens técnicos.
- API y PostgreSQL prueban nota máxima de 1000, detalle exacto de 1015 y
  reconstrucción después de down/re-up.
- `test:e2e:timeline` levanta y limpia su propia demo 8091; claro/oscuro y
  desktop/mobile PASS, sin proceso ni JSON residual.
- Core 52/52, harness PG, E2E, SQL, build, documentación y diff PASS; sin
  publicación ni efectos remotos.

## decisiones

- Mensajes y eventos permanecen separados en persistencia y presentación.
- El Core produce hechos; la cronología solo los proyecta.
- `assistant` es compatibilidad pasiva de datos, no una automatización.
