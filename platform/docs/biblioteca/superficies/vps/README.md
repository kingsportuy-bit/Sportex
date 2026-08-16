# Superficie VPS y Docker Swarm

## Responsabilidad

Alojar servicios SPORTEX aislados dentro del VPS compartido con BARBEROX.

## Reglas

- Servicios, redes, secretos y volúmenes propios.
- Imágenes inmutables.
- Traefik como ingress.
- Health, readiness, logs, métricas y límites.
- desarrollo local aislado de `PILOTO_DELTA`; apertura comercial con gate propio.
- Sin acceso implícito a datos BARBEROX.

## Contratos

`../../../INFRASTRUCTURE_CONTRACT.md`, `../../../ENVIRONMENTS_CONTRACT.md` y `../../../GIT_RELEASE_CONTRACT.md`.

## Estado

`CERTIFICADO_PILOTO`. `sportex_staging_core` opera 1/1 healthy con imagen
inmutable `c6b3b5b`; dominio y smokes publicos pasaron. La apertura comercial
sigue bloqueada y el runtime debe revalidarse antes de cualquier operacion.
