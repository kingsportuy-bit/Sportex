# Superficie VPS y Docker Swarm

## Responsabilidad

Alojar servicios SPORTEX aislados dentro del VPS compartido con BARBEROX.

## Reglas

- Servicios, redes, secretos y volúmenes propios.
- Imágenes inmutables.
- Traefik como ingress.
- Health, readiness, logs, métricas y límites.
- STAGING y producción separados.
- Sin acceso implícito a datos BARBEROX.

## Contratos

`../../../INFRASTRUCTURE_CONTRACT.md`, `../../../ENVIRONMENTS_CONTRACT.md` y `../../../GIT_RELEASE_CONTRACT.md`.

## Estado

LEGADO_OPERATIVO_NO_CERTIFICADO. NUEVO_CORE_SIN_DEPLOY.
