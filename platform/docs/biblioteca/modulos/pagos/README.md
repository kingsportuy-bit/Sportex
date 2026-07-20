# Módulo pagos

## Responsabilidad

Registrar candidatos, certificaciones, señas, saldos, devoluciones y evidencia de pago.

## Fuente/decisión

`BUSINESS.md`, `SECURITY.md` y guía de alta por seña.

## Owner

Core SPORTEX; certifica operador autorizado o integración confiable.

## Permisos

`payments.certify`, `payments.reverse` y `payments.view` separados.

## Contrato de entrada

Candidato o transacción con tenant, cliente, cotización, importe, medio, referencia y evidencia.

## Contrato de salida

Pago pendiente, certificado, rechazado, revertido o conciliado; evento idempotente.

## Persistencia

Pagos, referencias únicas, asignaciones a pedido, evidencia segura y conciliación.

## Auditoría

Detección, certificación, rechazo, reasignación, reversión y actor.

## Side effects

Un pago certificado puede emitir `deposit.validated` o actualizar saldo.

## Workers

Conciliación y consulta de proveedores cuando exista integración.

## Tests

Mismo comprobante, importe parcial, pedido ambiguo, reversión, permiso y aislamiento.

## Evidencia

Certificación manual idempotente, referencia única, permisos, auditoría y aislamiento implementados en `TASK-20260719-006`.

## Rollback

Revertir mediante evento compensatorio; nunca borrar certificación histórica.

## Estado

IMPLEMENTADO_NO_VALIDADO.

## Cierre documental

Requiere mecanismo de certificación definido y pruebas idempotentes.
