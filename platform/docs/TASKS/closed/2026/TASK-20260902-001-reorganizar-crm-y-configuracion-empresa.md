# Reorganizar CRM y configuración de empresa

id: TASK-20260902-001
owner: Codex
requester: Fito
estado: done
lifecycle: closed
work_type: feature
campaign: CAMP-20260803-001
context_focus: product
development_guide_impact: none
updated_at: 2026-09-02
## objetivo

Implementar Leads, Clientes, Pedidos y Mi empresa con WhatsApp intacto y
persistencia tenant-aware local.

## alcance_permitido

Reutilizar WhatsApp en Leads/Clientes; agregar configuración, API, SQL/RLS y
tests; preservar la conversión Lead a Cliente/Pedido y el tablero/planilla.

## alcance_prohibido

Cambiar visualmente WhatsApp; tocar piloto, datos/mensajes reales, secretos,
deploy, push o IA; reglas en frontend, hardcode Delta o cruce tenant.

## entradas

Aprobación de Fito y plataforma canónica.

## salidas

Runtime local, modelo/API/migración tenant-aware, tests y evidencia visual.

## validacion

Contexto, aislamiento, permisos, tests, SQL, build, QA y cero efectos externos.

## evidencia

`docs/evidencias/TASK-20260902-001_REORGANIZAR_CRM_CONFIGURACION_EMPRESA.md`.

## rollback

Revertir archivos; rollback SQL retira solo objetos nuevos.

## deuda_restante

La migración no fue ejecutada. Piloto, deploy, mensajes reales, flujo explícito
de reposiciones e IA requieren otra tarea y su GO correspondiente.

## registro_de_avances

### 2026-09-02 - Inicio

Plan aprobado; preflight PASS; WhatsApp visual congelado.

### 2026-09-02 - Implementación y cierre local

- Navegación final: Leads, Clientes, Pedidos y Mi empresa.
- Leads/Clientes reutilizan el mismo DOM y CSS del panel WhatsApp; sólo cambia
  la proyección de datos y etapas.
- Mi empresa guarda perfil, reglas, productos, escalas, talles y recursos por
  tenant mediante Core versionado, idempotente y auditado.
- Migración `20260902_011` creada con cinco tablas, RLS forzado y rollback; no
  fue ejecutada fuera del entorno local.
- `npm run validate` PASS, 59 tests Core PASS y QA visual desktop/móvil PASS.
- Sin push, deploy, migración remota, mensajes ni datos reales.

## decisiones

`SPORTEX-DEC-021`; reposición es producción; trabajo solo local.
