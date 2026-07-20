# SPORTEX

Reinicio estructural del sistema de gestión para empresas de indumentaria deportiva.

## Estado actual

- Fundación documental y modular creada.
- Runtime legado operativo en `sportex.codexa.uy` y preservado sin cambios.
- Nuevo Core, autenticación Supabase y frontend operativo implementados localmente en `TASK-20260719-007`.
- No se copió código del SPORTEX anterior dentro del nuevo Core.
- No se modificó BARBEROX.
- Entorno objetivo: VPS compartido con BARBEROX, Supabase autoalojado y Evolution API directa.
- Supabase objetivo: instancia actual compartida, con `sportex_staging_*` para STAGING y `sports_*` para producción.
- n8n no forma parte de SPORTEX.

## Dirección acordada

- Una empresa equivale a una marca; no se modelan sucursales.
- El Core concentra reglas, estados, costos, permisos y transiciones.
- El frontend no contiene lógica de negocio ni escribe directamente en la base.
- WhatsApp origina señales y propuestas; el Core valida y ejecuta.
- El sistema se divide en módulos con responsabilidad y contratos explícitos.
- Cada transferencia entre etapas puede producir una ficha o documento versionado.

## Estructura de transición

El repositorio histórico conserva el monolito anterior en la raíz. La reconstrucción nueva se integra bajo `platform/` durante STAGING para evitar un reemplazo destructivo antes del cutover.

## Documentos iniciales

- `ANALISIS_DOCUMENTACION_BARBEROX.md`: qué conservar y simplificar.
- `docs/INICIAL.md`: entrada obligatoria.
- `docs/CURRENT_RUNTIME_BASELINE.md`: estado real del SPORTEX legado en el VPS.
- `docs/BIBLIA_SPORTEX.md`: visión y principios de producto.
- `docs/ARCHITECTURE.md`: arquitectura del monolito modular.
- `docs/biblioteca/README.md`: índice de módulos, capas y superficies.
- `docs/INFRASTRUCTURE_CONTRACT.md`: VPS y Docker Swarm.
- `docs/SUPABASE_CONTRACT.md`: base, Auth y Storage autoalojados.
- `docs/EVOLUTION_CONTRACT.md`: integración WhatsApp directa.
- `docs/DEPLOYMENT_PROTOCOL.md`: despliegues, migración, cutover y rollback.
- `docs/DOMAIN_MODEL_V1.md`: entidades, comandos e invariantes de la primera vertical.
- `docs/API_CONTRACT_V1.md`: endpoints y errores iniciales.

## Validación

```powershell
npm run validate
```

## Próximo paso

Resolver el gate de capacidad del VPS, ejecutar la migración controlada `sportex_staging_*` y desplegar `sportex-staging.codexa.uy`. Producción continúa fuera de alcance.
