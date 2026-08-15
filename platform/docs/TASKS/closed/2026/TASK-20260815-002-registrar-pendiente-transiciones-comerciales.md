# Registrar pendiente de transiciones comerciales

id: TASK-20260815-002
owner: Codex
requester: Fito
estado: done
lifecycle: closed
work_type: documentacion
campaign: CAMP-20260803-001
context_focus: product
development_guide_impact: none
updated_at: 2026-08-15

## objetivo

Registrar que cambiar etapas o estados comerciales desde la interfaz WhatsApp
de SPORTEX no esta soportado ni verificado como capacidad del piloto actual.

## alcance_permitido

- Actualizar estado, pendiente y evidencia documental de PILOTO_DELTA.
- Separar la cronologia ya desplegada de los comandos comerciales aun no probados.
- Dejar una proxima verificacion observable, sin asumir implementacion.

## alcance_prohibido

- Cambiar Core, frontend, DB, contratos de estado o permisos.
- Desplegar, migrar, enviar mensajes o operar Evolution.
- Declarar que la interfaz cambia etapas hasta probarlo de punta a punta.

## entradas

- Observacion de Fito posterior al release `72e0fc2`.
- Evidencia de `TASK-20260815-001` y runtime PILOTO_DELTA vigente.

## salidas

- Estado canonico con `PENDIENTE_VERIFICACION` para transiciones comerciales.
- Evidencia documental sin cambio de runtime.

## validacion

- Estado, tarea, evidencia y vistas coinciden.
- `npm run validate` y `SPORTEX_CLOSE=PASS`.
- Git demuestra cero cambio de codigo o runtime.

## evidencia

- `docs/evidencias/TASK-20260815-002_PENDIENTE_TRANSICIONES_COMERCIALES.md`.

## rollback

Revertir solo este checkpoint documental; el runtime `72e0fc2` no cambia.

## deuda_restante

- Verificar el recorrido `chat -> detalle -> cambio de etapa -> persistencia -> auditoria`.
- Si falta, abrir una feature separada antes de implementarlo.

## registro_de_avances

### 2026-08-15 - pendiente registrado

- Fito confirma que la interfaz actual no se considera lista para cambiar estados.
- Se conserva la cronologia operativa desplegada y no se toca PILOTO_DELTA.
- Estado y evidencia usan `PENDIENTE_VERIFICACION_TRANSICIONES_COMERCIALES`.

## decisiones

- La falta de verificacion no se presenta como capacidad disponible.
- Este checkpoint no prioriza ni implementa la feature.
