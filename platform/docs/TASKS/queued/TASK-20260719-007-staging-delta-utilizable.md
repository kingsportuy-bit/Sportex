# SPORTEX STAGING utilizable para Delta

id: TASK-20260719-007
owner: Codex
requester: Fito
estado: blocked
lifecycle: queued
work_type: operacion
campaign: none
context_focus: deploy
development_guide_impact: none

## objetivo

Entregar el nuevo SPORTEX en `sportex-staging.codexa.uy` como una superficie aislada y utilizable para Delta, con autenticación real, persistencia Supabase, frontend sin lógica de negocio y el flujo completo cliente -> seña certificada -> pedido.

## alcance_permitido

- auditar de forma read-only el repositorio y runtime legado;
- integrar la nueva base en una rama de reconstrucción preservando el historial existente;
- completar autenticación Supabase/JWT y membresías tenant-aware;
- ejecutar exclusivamente migraciones `sportex_staging_*` en Supabase STAGING;
- crear frontend delgado que consuma solamente la API del Core;
- construir imágenes inmutables y desplegar el stack `sportex_staging`;
- publicar `sportex-staging.codexa.uy` sin cambiar el router productivo;
- cargar únicamente datos ficticios de validación;
- validar capacidad, seguridad, aislamiento, E2E, observabilidad y rollback;
- actualizar contratos, estado, changelog, manifiesto y evidencia.

## alcance_prohibido

- modificar o reiniciar el stack legado `sportex`;
- cambiar `sportex.codexa.uy`;
- crear, alterar o leer datos desde tablas legado `sportex_*` o producción `sports_*`;
- conectar o modificar Evolution de producción o la instancia `DELTA`;
- utilizar n8n;
- cargar conversaciones, clientes o pagos reales;
- promover a producción;
- borrar historia Git, forzar pushes o eliminar recursos existentes.

## entradas

- primera vertical local de `TASK-20260719-006`;
- contratos de arquitectura, seguridad, multitenancy, Supabase y despliegue;
- Supabase STAGING compartido con catálogo permitido `sportex_staging_*`;
- repositorio `kingsportuy-bit/Sportex`;
- VPS `31.97.28.4`, Docker Swarm y Traefik existentes;
- Delta Sport como tenant piloto con datos ficticios.

## salidas

- rama remota de reconstrucción con Core, frontend, migraciones y despliegue;
- autenticación real y membresía de empresa;
- base STAGING migrada con aislamiento verificable;
- frontend operativo de clientes, señas y pedidos;
- stack y dominio STAGING observados;
- release manifest con commit, digest, checksums y rollback;
- evidencia E2E y estado documental honesto.

## validacion

- validadores documentales y estáticos;
- tests unitarios, API, autenticación, idempotencia y cross-tenant;
- build reproducible de Core y frontend;
- auditoría de secretos y catálogos prohibidos;
- gate de capacidad del VPS;
- migración y rollback ensayados;
- `/health`, `/ready`, login y E2E desde navegador;
- verificación de servicios, logs, digest, dominio y aislamiento;
- confirmación de que producción y legado no cambiaron.

## evidencia

- `docs/evidencias/TASK-20260719-007_STAGING_DELTA_UTILIZABLE.md`;
- `docs/deployments/SPORTEX-STAGING-20260719-001.md`.

## bloqueo_actual

Fito reemplazo el modelo STAGING separado por `PILOTO_DELTA`. El codigo y la
evidencia existentes se preservan, pero el objetivo, los namespaces, el dominio
y el plan de cutover deben replantearse en una nueva tarea antes de operar.

## rollback

No desplegar ni migrar desde este contrato. La rama y los artefactos quedan
preservados como base de trabajo reversible.

## deuda_restante

Convertir las piezas utiles en un plan de piloto Delta coherente con el nuevo
contrato de entornos y revalidar todo estado runtime.
