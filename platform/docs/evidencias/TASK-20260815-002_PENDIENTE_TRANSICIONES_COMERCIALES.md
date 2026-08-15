# Pendiente — transiciones comerciales desde WhatsApp

- Fecha: 2026-08-15
- Tarea: `TASK-20260815-002`
- Entorno observado: `PILOTO_DELTA`
- Runtime conservado: `72e0fc2a7abfdecd1293e9b3b3aa44acec5ca35e`
- Mutaciones remotas: `0`

## Hecho registrado

La cronologia de mensajes y eventos esta desplegada, pero cambiar etapas o
estados comerciales desde el panel WhatsApp no se considera hoy una capacidad
soportada ni verificada. No se infiere soporte a partir de botones, contratos o
mutaciones Core aisladas.

## Criterio de verificacion futuro

Un operador debe poder abrir un chat, ver su contexto, solicitar un cambio de
etapa permitido, observar persistencia y auditoria, recargar y encontrar el
mismo estado. Un rechazo por permiso o transicion invalida debe quedar claro y
no modificar la entidad.

## Limites

- No se cambio codigo, DB, runtime, Evolution ni mensajeria.
- No se modifico el estado de ningun lead, cliente, oportunidad o pedido.
- No se autoriza implementacion automatica; primero corresponde verificar la
  capacidad actual y abrir una feature solo si existe una brecha.

Resultado: `PENDIENTE_VERIFICACION_TRANSICIONES_COMERCIALES`.
