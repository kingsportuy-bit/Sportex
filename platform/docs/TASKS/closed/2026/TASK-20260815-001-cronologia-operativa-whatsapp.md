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

### 2026-08-15 - cuarta corrección validada

- Humanización estructural TS/SQL, nota máxima literal, down/re-up, RLS y E2E
  autocontenido quedaron PASS; core 52/52 y sin efectos remotos.

### 2026-08-15 - gate documental posterior a 279cdf6

- Se reabre únicamente para canonizar lifecycle y evidencia después del commit
  de código `279cdf6d4a902ab868db582f5de8c1c2702be0f9`.
- Alcance exclusivo: tarea, estado, vistas generadas y evidencia; cero código,
  push, deploy, migración o mensajería.
- El cierre final debe devolver `SPORTEX_CLOSE=PASS` con este checkpoint activo
  y luego nuevamente con la tarea cerrada.
- Cierre activo posterior a `279cdf6`: `SPORTEX_CLOSE=PASS`, 52/52, SQL, build
  y documentación PASS.
- Lifecycle vuelve a `done/closed`; el cierre cerrado se ejecuta después de
  regenerar las vistas y antes del commit documental exclusivo.
- Cierre con lifecycle cerrado: `SPORTEX_CLOSE=PASS`, `ACTIVE_TASK=none`.

## decisiones

- Mensajes y eventos permanecen separados en persistencia y presentación.
- El Core produce hechos; la cronología solo los proyecta.
- `assistant` es compatibilidad pasiva de datos, no una automatización.
