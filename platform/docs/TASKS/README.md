# Tareas SPORTEX

## Regla

Cada cambio ejecutable requiere un archivo `TASK-YYYYMMDD-###-nombre.md` con contrato. Solo puede existir una tarea en estado `approved`, `in_progress` o `review`.

## Campos obligatorios

- `id`;
- `owner`;
- `requester`;
- `estado`;
- objetivo;
- alcance permitido;
- alcance prohibido;
- entradas;
- salidas;
- validación;
- evidencia.

## Estados

- `draft`;
- `approved`;
- `in_progress`;
- `blocked`;
- `review`;
- `done`;
- `superseded`;
- `cancelled`.

## Estado actual

- `TASK-20260719-007`: `in_progress` — autenticación, frontend y despliegue STAGING utilizable para Delta.
- `TASK-20260719-001`: `done` — fundación documental y modular de SPORTEX validada.
- `TASK-20260719-002`: `done` — entorno VPS, Git, Supabase y Evolution sin n8n, verificado read-only y documentado.
- `TASK-20260719-003`: `done` — baseline read-only del runtime legado existente en `/opt/sportex`.
- `TASK-20260719-004`: `superseded` — propuesta de Supabase dedicado reemplazada por decisión posterior.
- `TASK-20260719-005`: `done` — Supabase compartido con prefijos separados por entorno.
- `TASK-20260719-006`: `done` — primera vertical local del Core SPORTEX implementada y validada.

## Plantilla

Ver `TEMPLATE.md`.
