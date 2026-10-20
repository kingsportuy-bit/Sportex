# Corregir copia de referencia con Logo2

id: TASK-20261020-005
owner: Codex
requester: Fito
estado: in_progress
lifecycle: active
work_type: operacion
campaign: CAMP-20260803-001
context_focus: infrastructure
development_guide_impact: none
plan_authorization: PLAN_APPROVED_AUTHORIZED
updated_at: 2026-10-20

## objetivo

Copiar colores desde la referencia cargada sin rechazar el Logo2 del editor.

## alcance_permitido

Publicar codigoa2e2deb aprobado en sportex_bocetos_app, con respaldo SQLite,
rollback a65249d y verificacion. Release puede agregar solo documentos.

## alcance_prohibido

Sin IA de pago, mutaciones de cuentas, CRM, legado, DNS ni cambios en generacion.

## entradas

Fito informa elementos/texturas invalidos y pide copiar la imagen de referencia.
Tras verificar sponsors y textos, Fito confirma «Go» para publicar la correccion.

## salidas

Contexto compatible con los elementos del editor y evidencia de imagen origen.

## validacion

Prueba roja/verde de contexto UI a HTTP autenticado, proveedor simulado;
rechazo de IDs desconocidos y regresion completa de bocetos/validacion general.

## evidencia

docs/evidencias/TASK-20261020-005_COPIAR_REFERENCIA.md

## rollback

Restaurar imagen a65249d en el mismo volumen; conservar snapshot previo.

## deuda_restante

Publicacion autorizada; pendiente verificar version, respaldo y servicio.

## registro_de_avances

Servidor rechaza brand2 enviado por fixedLayerKeys; falla antes del proveedor.
Prueba roja reproduce400 exacto; aceptar brand2 hace pasar el paquete real.
16 focales y199 bocetos PASS. Sin llamadas reales ni cambios de generacion.
SPORTEX_CLOSE=PASS local;31 workflow,59 Core, SQL/RLS y build PASS.
GO confirmado para codigoa2e2deb. Sponsors admitidos para contornos y textos
libres excluidos; pruebas locales con0/2/30 sponsors y3 textos PASS.

## decisiones

La primera imagen siempre es referenceData; mock y texturas solo contexto.
