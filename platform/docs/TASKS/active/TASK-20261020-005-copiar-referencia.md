# Corregir copia de referencia con Logo2

id: TASK-20261020-005
owner: Codex
requester: Fito
estado: in_progress
lifecycle: active
work_type: fix
campaign: CAMP-20260803-001
context_focus: runtime
development_guide_impact: none
plan_authorization: PLAN_APPROVED_AUTHORIZED
updated_at: 2026-10-20

## objetivo

Copiar colores desde la referencia cargada sin rechazar el Logo2 del editor.

## alcance_permitido

Diagnostico y correccion local del contrato de analisis, pruebas sin API real,
documentacion y versionado Git de la correccion para revision/publicacion.

## alcance_prohibido

Sin deploy, IA de pago, datos reales, CRM, legado ni cambios en generacion.

## entradas

Fito informa elementos/texturas invalidos y pide copiar la imagen de referencia.

## salidas

Contexto compatible con los elementos del editor y evidencia de imagen origen.

## validacion

Prueba roja/verde de contexto UI a HTTP autenticado, proveedor simulado;
rechazo de IDs desconocidos y regresion completa de bocetos/validacion general.

## evidencia

docs/evidencias/TASK-20261020-005_COPIAR_REFERENCIA.md

## rollback

Revertir el commit local; runtime a65249d permanece sin cambios.

## deuda_restante

Publicacion pendiente: requiere GO de Fito para una version concreta.

## registro_de_avances

Servidor rechaza brand2 enviado por fixedLayerKeys; falla antes del proveedor.
Prueba roja reproduce400 exacto; aceptar brand2 hace pasar el paquete real.
16 focales y199 bocetos PASS. Sin llamadas reales ni cambios de generacion.
SPORTEX_CLOSE=PASS local;31 workflow,59 Core, SQL/RLS y build PASS.

## decisiones

La primera imagen siempre es referenceData; mock y texturas solo contexto.
