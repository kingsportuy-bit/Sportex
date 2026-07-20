# Módulo seguridad

## Responsabilidad

Aplicar autenticación, autorización, políticas, protección de secretos, acciones sensibles, incidentes y controles de aislamiento.

## Fuente/decisión

`SECURITY.md` y `MULTITENANCY_CONTRACT.md`.

## Owner

Plataforma SPORTEX; cada módulo declara sus capacidades.

## Permisos

Denegar por defecto; soporte de plataforma con motivo y auditoría.

## Contrato de entrada

Actor, tenant confiable, acción, recurso, contexto y evidencia requerida.

## Contrato de salida

Decisión permitir/denegar, motivo estable, requisitos adicionales y evento auditado.

## Persistencia

Roles, capacidades, políticas, sesiones, revocaciones, incidentes y auditoría.

## Auditoría

Toda acción sensible, denegación relevante, acceso cross-tenant y cambio de política.

## Side effects

Revocar sesiones, bloquear integración, alertar o exigir confirmación.

## Workers

Expiración, rotación, detección de anomalías y revisión periódica.

## Tests

Escalada de privilegios, cross-tenant, sesión revocada, secreto ausente, acción sensible y soporte.

## Evidencia

Capacidades, denegación por defecto, guardas de entorno, rol STAGING y RLS forzado implementados en `TASK-20260719-006`. Supabase Auth pendiente.

## Rollback

Restaurar política anterior con registro; nunca reactivar secretos comprometidos.

## Estado

EN_PROGRESO.

## Cierre documental

Requiere threat model, matriz de permisos, pruebas y procedimiento de incidente.
