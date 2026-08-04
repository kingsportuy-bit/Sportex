# Evidencia de demo CRM comercial local

- Tarea: `TASK-20260803-004`
- Fecha: `2026-08-03`
- Estado: `PASS_DESARROLLO_LOCAL`
- Entornos: `DOCUMENTACION`, `DESARROLLO_LOCAL`
- Rama: `sportex-governance-20260801`
- Base remota verificada antes de abrir: `47d47e2e6722f3d21d0941652ed3bbfaca1ff620`
- URL local: `http://127.0.0.1:8080/`

## Resultado funcional

- 18 leads completamente ficticios y tenant-aware.
- Productos: `CAMISETAS=9`, `EQUIPO_COMPLETO=9`.
- Atribucion: `META_EXACTO=14`, `DESCONOCIDO=4`.
- Etapas: `NUEVO=4`, `EN_CALIFICACION=4`, `COTIZADO=3`, `EN_SEGUIMIENTO=3`, `PERDIDO=2`, `SENA_VALIDADA=2`.
- Conversaciones: 18/18 con cuatro mensajes ficticios ordenados y sentidos `CLIENTE` y `DELTA`.
- Tablero, filtros combinables, lista, ficha, creativo, confirmados, faltantes, etapa, proxima accion e historial visibles.
- Comandos Core para etapa, proxima accion y seguimiento interno; la web no escribe el JSON ni contiene transiciones.
- Reset con confirmacion `RESTAURAR_DATOS_FICTICIOS` repone exactamente la semilla.

## Persistencia y prueba de reinicio

1. Se cambio un fixture de `SENA_VALIDADA` a `EN_SEGUIMIENTO`.
2. Se edito la proxima accion y se registro un seguimiento interno.
3. Se recargo el navegador y se reinicio el proceso Core.
4. Etapa, accion y seguimiento persistieron en `.sportex-local/commercial-demo-v1.json`.
5. El reset controlado elimino las mutaciones de QA y restauro los 18 fixtures con version inicial.

El archivo esta ignorado por Git, usa reemplazo atomico y solo se habilita bajo `development|test + memory + SPORTEX_DEV_AUTH=true`. Corrupcion o configuracion fuera del guard fallan cerradas.

## QA visual y navegacion

### Escritorio 1440x900

- `scrollWidth=1425`, sin overflow horizontal;
- 18 filas y 6 estaciones visibles;
- ficha seleccionada y reset visibles;
- consola: 0 errores o advertencias.

### Movil 390x844

- `scrollWidth=375`, sin overflow horizontal;
- lista inicial visible y ficha oculta;
- filtros en una columna;
- al abrir un lead: lista oculta, ficha y volver visibles, 4 mensajes;
- etapa, proxima accion y seguimiento disponibles en formularios internos;
- no existe compositor ni accion de envio.

## Validacion reproducible

- `node --check frontend/app.js`: PASS;
- `npm run validate`: PASS;
- scan NUL: limpio;
- workflow: 8/8;
- documentacion: 65 archivos requeridos, 16 modulos;
- TypeScript `--noEmit`: PASS;
- Core: 25/25;
- SQL estatico: 9 tablas transitorias, RLS forzado y rollback presente;
- build Core: PASS;
- `git diff --check`: PASS;
- runtime final: health local `ok=true`, release `commercial-local-fixture`, persistencia local habilitada, 18 leads.

## Limites confirmados

- Evolution, Meta, Chatwoot, Supabase remoto y VPS: no conectados.
- Mensajes enviados: 0.
- Datos reales o sensibles: 0.
- IA real, pagos, pedidos y produccion: fuera.
- Migraciones y deploy: 0.
- `PILOTO_DELTA` y `PRODUCCION_COMERCIAL`: no usados.
- Commit y push de esta tarea: no realizados.

## Pendientes y proxima accion

- Fito puede validar la demo local abierta en `http://127.0.0.1:8080/`.
- La persistencia real, integraciones, IA, pagos, pedidos y produccion requieren tareas futuras independientes.
- No abrir otra tarea de `CAMP-20260803-001` sin autorizacion explicita de Fito.

## Rollback

Detener el proceso local y revertir solo los archivos de `TASK-20260803-004`. El JSON contiene exclusivamente fixtures y se puede regenerar desde la semilla canonica.
