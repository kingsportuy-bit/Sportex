# Módulo nuevo pedido

## Responsabilidad

Crear e inicializar una única vez el expediente productivo después de una seña certificada.

## Fuente/decisión

`BUSINESS.md` y `../../../../../negocio/procesos/arquitectura-modular-whatsapp-core.md`.

## Owner

Core SPORTEX, caso de uso `nuevo_pedido`.

## Permisos

Se activa por evento certificado o comando manual con permiso `orders.create`.

## Contrato de entrada

Tenant, cliente, conversación, cotización, pago certificado, productos conocidos y evidencia única.

## Contrato de salida

Pedido, ítems, precio, seña, saldo, costos estimados, proceso, trabajos, documentos, pendientes y eventos.

## Persistencia

Pedido y snapshot comercial; delega detalles a módulos propietarios dentro de una transacción coordinada.

## Auditoría

Origen, actor o evento, evidencia, campos conocidos, pendientes y resultado idempotente.

## Side effects

Publica `order.created`, crea outbox interno y solicita proyecciones.

## Workers

No ejecuta side effects externos directamente.

## Tests

Pago repetido, cliente existente, datos incompletos, varios productos, costo parcial y rollback transaccional.

## Evidencia

Primera vertical implementada y probada localmente en `TASK-20260719-006`: seña certificada, pedido único, auditoría y `order.created` en outbox.

## Rollback

Cancelar expediente inicial mediante comando compensatorio sin borrar pago ni auditoría.

## Estado

IMPLEMENTADO_NO_VALIDADO.

## Cierre documental

Requiere contrato de comando/evento, modelo de datos y E2E desde pago certificado.
