# Superficie API

## Responsabilidad

Exponer consultas y comandos del Core mediante contratos autenticados y versionados.

## Reglas

- Resolver identidad y tenant.
- Validar esquemas.
- Usar comandos específicos.
- Devolver errores estables y correlación.
- No exponer writers genéricos.
- Documentar input, output, permisos, side effects y pruebas.

## Validación mínima

Payload inválido, permiso insuficiente, tenant incorrecto, caso feliz, idempotencia y error esperado.

## Estado

IMPLEMENTADO_NO_VALIDADO. API v1 inicial probada localmente; autenticacion real
y certificacion en `PILOTO_DELTA` pendientes de replanificacion.

La mesa comercial agrega replay y lectura solo bajo el guard local triple de
`TASK-20260803-001`; no existe en entornos reales.

## Demo CRM local

`TASK-20260803-004` suma comandos especificos de etapa, proxima accion, seguimiento y reset bajo el guard local triple. Las mutaciones exigen `commercial.manage`, tenant y version esperada; no existen en entornos reales.
