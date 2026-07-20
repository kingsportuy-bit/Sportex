# Evidencia TASK-20260719-004

> Estado histórico: `superseded` por `TASK-20260719-005`. La decisión vigente reutiliza Supabase actual con `sportex_staging_*` para STAGING, `sports_*` para producción y `sportex_*` como legado.

Fecha: 2026-07-19.

Modo: documentación e inspección read-only.

## Decisiones

- SPORTEX no usará la instancia Supabase compartida.
- STAGING y producción tendrán stacks Supabase dedicados entre sí.
- El nuevo Core reemplazará al monolito SPORTEX legado mediante despliegue paralelo y cutover.
- Producción exige autorización explícita independiente de STAGING.
- Todo release usa commit remoto, imagen por digest, migraciones versionadas, evidencia y rollback.

## Capacidad observada del VPS

- CPU: 4 vCPU;
- RAM: 15 GiB;
- memoria disponible observada: aproximadamente 5.9 GiB;
- swap: 2 GiB de 2 GiB utilizada;
- disco: 54 GiB libres de 194 GiB;
- carga observada: entre 8 y 9.8, superior a los 4 vCPU disponibles;
- CPU steal observado: entre 15% y 27% durante la segunda muestra;
- Docker daemon observado bajo carga elevada;
- servicios Swarm: 77;
- contenedores en ejecución: 68.

Conclusión: el host no posee margen seguro para instalar stacks Supabase adicionales en ese estado. Queda bloqueado hasta ampliar recursos, reducir carga demostrablemente o elegir otro VPS.

## Validación documental

- `npm run validate-docs`: PASS con 38 documentos requeridos, 16 módulos y 4 tareas.

## Mutaciones

Ninguna. No se instalaron servicios ni se modificó VPS, Git, Supabase, Evolution o producción.
