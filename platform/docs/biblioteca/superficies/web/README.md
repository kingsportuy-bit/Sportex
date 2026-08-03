# Superficie web

## Responsabilidad

Mostrar información del Core y permitir ejecutar acciones autorizadas.

## Reglas

- Sin acceso directo a base de datos.
- Sin cálculos o transiciones de negocio.
- Las acciones disponibles vienen del Core.
- Las vistas son proyecciones reconstruibles.
- Mostrar bloqueos y evidencia sin ocultar estados reales.
- Separar permisos visuales de autorización efectiva del Core.

## Estado

IMPLEMENTADO_NO_VALIDADO. Frontend nuevo sin acceso a base, con login Supabase
y comandos del Core; smoke visual local historico en PASS. Despliegue y E2E de
`PILOTO_DELTA` pendientes de replanificacion.

`TASK-20260803-001` agrega una mesa comercial local para visualizar origen,
conversación, etapa y próxima acción. No habilita envío ni datos reales.
