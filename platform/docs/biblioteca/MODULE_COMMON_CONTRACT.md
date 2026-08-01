# Contrato comun de modulos SPORTEX

Toda ficha de modulo hereda estas reglas salvo que un contrato rector exija una
restriccion mayor.

## Owner unico

Cada decision de negocio tiene un modulo owner. Otras capas pueden consultar o
solicitar comandos, pero no duplicar la regla.

## Contexto y tenant

El contexto confiable se resuelve antes de ejecutar negocio. El tenant no se
acepta desde un payload no confiable y toda consulta/escritura aplica
aislamiento por empresa.

## Comandos y eventos

Los comandos validan permisos, precondiciones e idempotencia. Los eventos
describen hechos ya aceptados; no reemplazan la transaccion que los produjo.

## Persistencia y auditoria

Toda mutacion sensible conserva actor, tenant, correlacion, motivo, resultado y
version relevante. Secretos y archivos completos no se copian a auditoria.

## Efectos externos

Mensajes, documentos, compras, pagos y notificaciones salen por outbox o un
mecanismo durable equivalente. Los reintentos no duplican efectos.

## Pruebas

Cada modulo declara tests documentales. Si tiene codigo, agrega unitarias,
integracion, permisos, cross-tenant y regresiones proporcionales al riesgo.

## Estado y cierre

`IMPLEMENTADO_NO_VALIDADO` no equivale a certificado. El cierre registra
evidencia ligada a version, rollback y deuda restante.
