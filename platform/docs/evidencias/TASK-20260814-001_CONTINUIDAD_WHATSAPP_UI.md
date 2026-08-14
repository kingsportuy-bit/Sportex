# Evidencia — continuidad WhatsApp y UI

Fecha: 2026-08-14
Task: `TASK-20260814-001`
Entorno operado: desarrollo local
Base remota vigente al iniciar: `f6a92770b2539975216e81f96fcffc00b4afcb03`

## Resultado

El candidato local completa la continuidad de mensajes del puesto WhatsApp:

1. Evolution guarda cada entrada en el journal antes de proyectarla.
2. Las salidas externas de WhatsApp Web recorren el mismo pipeline live.
3. Las salidas de SPORTEX nacen en outbox, reciben un ID de Evolution, aparecen
   en la conversacion y deduplican el eco posterior por ese mismo ID.
4. La interfaz refresca la proyeccion durable cada dos segundos mientras el
   chat esta visible, sin perder borrador, foco ni scroll.

La correccion de interfaz tambien deja funcional el cierre de formularios con
campos requeridos vacios, reemplaza `USER` por `IMPRESION`, fija el login en
grafito y elimina el crema de las superficies principales del chat claro.

## Validacion reproducible

- `npm run check`: PASS.
- `npm test`: 44/44 PASS.
- `git diff --check`: PASS.
- Test focal nuevo: una salida queda durable y visible antes del eco de
  Evolution; repetir el eco no duplica el mensaje.
- Browser local: formulario Registrar venta abierto con campos vacios y
  Cancelar produjo dialogos `1 -> 0`.
- Browser local: WhatsApp revisado en claro y oscuro; el modo claro usa blanco
  real y mantiene grafito, blanco y lima como firma.

## Seguridad de entrega

No se desplego, no se modifico Evolution, no se enviaron mensajes y no se
tocaron datos reales durante este corte. Si el proveedor ya confirmo el envio,
un fallo de proyeccion no habilita un reintento automatico potencialmente
duplicado; el eco live reconcilia la vista.

## Pendiente

El candidato funcional inmutable es
`1cc2c96fe8f8e0f8215ce5a804dd1ad775982c45` y esta publicado en la rama
`sportex-governance-20260801`. Falta el GO remoto exacto para desplegar ese SHA
en `PILOTO_DELTA`. La aceptacion visual final del login se realiza sobre el
runtime desplegado, porque la demo local omite autenticacion.
