# Panel sencillo del laboratorio

id: TASK-20261019-001
owner: Codex
requester: Fito
estado: done
lifecycle: closed
work_type: feature
campaign: CAMP-20260803-001
context_focus: architecture
development_guide_impact: none
updated_at: 2026-10-19

## objetivo

Primera version local del panel por empresa, acotada por pedido de Fito.

## alcance_permitido

Core/bocetos, adaptador local persistente, panel/login, recursos, vencimiento,
cuotas, consumo y conexion con editor. Fixtures y pruebas sin gasto real.

## alcance_prohibido

Sin cambios de CRM/legado, DB remota, cuentas reales, DNS, deploy ni secretos en Git.

## entradas

Spec aprobada; Fito: «bien procede, no hagas un desarrollo enorme».
docs/superpowers/specs/2026-10-19-panel-bocetos-design.md

## salidas

Panel local usable; autoridad Core y aislamiento por empresa.

## validacion

Pruebas de permisos, vencimiento, cuota concurrente, costos y persistencia.
Regresiones del editor, navegador interno y npm run validate.

## evidencia

docs/evidencias/TASK-20261019-001_PANEL_BOCETOS.md

## rollback

Desactivar modo gestionado; conservar editor local, IndexedDB y datos privados.

## deuda_restante

Integracion Auth/DB reales y salida comercial requieren tarea operativa.

## registro_de_avances

19/10: panel local implementado. 174 tests del laboratorio y validacion general
PASS. QA interno: alta, recursos, fuentes, vencimiento y renovacion. Sin gasto API.

## decisiones

Core decide; servidor local adapta. Sin cobros automaticos. Moldes futuros.

19/10, correccion: principal/respaldo compartidos, registro por llamada y empresa;
Ver consumo, cache aislada y costo global. 180 tests del laboratorio PASS.
