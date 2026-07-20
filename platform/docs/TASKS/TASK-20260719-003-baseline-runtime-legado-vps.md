# Baseline del runtime legado en VPS

id: TASK-20260719-003
owner: Codex
requester: Fito
estado: done

## objetivo

Verificar como `root`, en modo read-only, el directorio y los servicios SPORTEX ya existentes en el VPS, y corregir la documentación que los consideraba inexistentes.

## alcance_permitido

- inspección read-only de `/opt/sportex`;
- inspección read-only de Git, Docker Swarm, Traefik y metadatos de Supabase;
- documentación del baseline legado sin secretos;
- validación documental local.

## alcance_prohibido

- modificar o reiniciar servicios;
- leer o exponer datos de clientes;
- mostrar valores de secretos;
- rotar credenciales;
- editar el checkout del VPS;
- cambiar tablas, RLS, políticas o datos;
- operar Evolution o n8n.

## entradas

- corrección de Fito sobre el runtime existente;
- acceso SSH como `root`;
- directorio `/opt/sportex`;
- stack Docker `sportex`;
- metadatos de tablas `sportex_*`.

## salidas

- baseline del runtime legado;
- conexiones e infraestructura corregidas;
- riesgos prioritarios registrados sin secretos;
- diferencia explícita entre legado desplegado y nuevo Core no iniciado.

## validacion

- servicio `sportex_sportex` observado `1/1`;
- dominio público observado;
- checkout y commit verificados;
- metadatos de tablas y RLS verificados sin leer filas de negocio;
- `npm run validate-docs`.

## evidencia

- `docs/evidencias/TASK-20260719-003_RUNTIME_LEGADO_VPS.md`;
- `docs/CURRENT_RUNTIME_BASELINE.md`.
