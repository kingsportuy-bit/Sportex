# Módulo identidad y empresas

## Responsabilidad

Administrar empresas/marcas, usuarios, membresías, roles, sesiones y contexto multitenant.

## Fuente/decisión

`MULTITENANCY_CONTRACT.md` y `SECURITY.md`.

## Owner

Core SPORTEX.

## Permisos

Alta y administración requieren owner o rol de plataforma auditado.

## Contrato de entrada

Identidad autenticada, empresa objetivo y acción solicitada.

## Contrato de salida

Actor, tenant, membresía, roles, capacidades y sesión válidos.

## Persistencia

Empresas, usuarios, membresías, roles, permisos, sesiones e integraciones por tenant.

## Auditoría

Altas, accesos, cambios de rol, soporte cross-tenant y revocaciones.

## Side effects

Invitaciones y avisos de seguridad mediante notificaciones.

## Workers

Expiración de sesiones e invitaciones; revisión de accesos.

## Tests

Aislamiento, revocación, rol insuficiente, soporte auditado y tenant no confiable en payload.

## Evidencia

Contexto tenant/actor y guardas de autenticación development implementados en `TASK-20260719-006`. Membresía real pendiente.

## Rollback

Revocar membresía o sesión sin borrar auditoría.

## Estado

EN_PROGRESO.

## Cierre documental

Requiere modelo de datos, matriz de permisos, tests cross-tenant y evidencia STAGING.
