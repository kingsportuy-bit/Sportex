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

### 2026-08-15 - task abierta

- `TASK-20260814-001` cerró con evidencia sin inventar el envío manual.
- Se abrió este corte focal bajo el handoff aprobado y sin acciones remotas.

### 2026-08-15 - implementación local certificada

- Primer candidato local implementado y validado sin acciones remotas; la
  revisión posterior lo rechazó y sus resultados quedaron superados.

### 2026-08-15 - reabierta por NO-GO de revisión

- El candidato `fca96c2` no se publica ni promueve.
- Se corrige la frontera transaccional para que la cronología derivada nunca
  revierta la mutación principal ni pierda su evento fuente.
- Se agrega preflight migration-first/readiness, compatibilidad legacy,
  observabilidad, E2E reproducible y aislamiento RLS con rol de aplicación.

### 2026-08-15 - correcciones de revisión validadas

- Segundo candidato local corrigió desacople, migration-first, RLS y E2E, pero
  la tercera revisión lo rechazó por las brechas documentadas abajo.

### 2026-08-15 - reabierta por tercera revisión NO-GO

- El candidato `c22a714` no se publica ni promueve.
- Se corrige el contraste local del cierre de Detalles y se agrega validación
  perceptual automatizada en claro/oscuro, desktop/mobile.
- Se alinea sin pérdida la nota máxima de seguimiento con la actividad fuente,
  la API, el preflight, la proyección y la migración.
- El ensayo completo PostgreSQL pasa a un harness versionado y reproducible.

### 2026-08-15 - tercera corrección validada

- Cierre de Detalles visible y accionable con contraste medido en claro/oscuro
  y desktop/mobile; compositor, borrador y scroll permanecen estables.
- Nota canónica de 1000 y detalle derivado de 1015 se conservan completos en
  API, servicio, fuente, migración y reconstrucción PostgreSQL.
- El harness versionado prueba PG16, migraciones, preflight, down/re-up,
  readiness, degradación, RLS y reconstrucción con resultado PASS.
- Core 51/51, E2E, SQL, build, documentación y diff PASS; sin acción remota.

## decisiones

- Mensajes y eventos permanecen separados en persistencia y presentación.
- El Core produce hechos; la cronología solo los proyecta.
- `assistant` es compatibilidad pasiva de datos, no una automatización.
