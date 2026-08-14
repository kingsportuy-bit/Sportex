# Implementación local de la experiencia comercial

- Tarea: `TASK-20260803-005`
- Campaña: `CAMP-20260803-001`
- Fecha: `2026-08-03`
- Entorno: `DESARROLLO_LOCAL`
- Estado: `IMPLEMENTADA_PENDIENTE_VALIDACION_PRODUCTO`

## Resultado

Se implementó el wireframe aprobado sobre el frontend existente. `Hoy` es la
entrada; `Leads` reúne prioridad, conversación y trabajo comercial; `Resultados`
separa métricas y embudo; la navegación agrupa Operación, Marketing y
Administración sin conectar servicios externos.

La demo conserva 18 leads ficticios, atribución exacta o desconocida, Core,
persistencia local, cambios de etapa autorizados, próxima acción, seguimiento y
restauración controlada. La tabla de talles y las respuestas rápidas preparan
un borrador local: no existe acción de enviar.

`Pedidos` y `Clientes` muestran los casos con `SEÑA_VALIDADA` como candidatos.
No crean entidades ni simulan la conversión futura del Core a Cliente y un único
Pedido.

## QA ejecutada

- escritorio `1440x900`: `Hoy`, `Leads`, tres zonas, módulos y ficha completa;
- móvil `390x844`: menú, `Hoy`, lista, pestañas `Chat / Trabajo / Ficha`;
- ancho de documento igual al ancho visible en ambos tamaños, sin desborde;
- tabla de talles agregada a borrador local, sin mensaje;
- próxima acción modificada, recargada y recuperada desde persistencia;
- restauración confirmada: Lucía volvió a la acción y fecha iniciales;
- navegación comprobada en `Resultados` y `Configuración`;
- semilla final: 18 leads ficticios.

## Validaciones automatizadas

- `node --check frontend/app.js`: PASS;
- `git diff --check`: PASS;
- `npm run validate`: PASS;
- `npm run workflow:close -- TASK-20260803-005`: `SPORTEX_CLOSE=PASS`.

## Límites respetados

- no se modificó Core ni su contrato;
- no se conectó Evolution, Meta, Chatwoot, Supabase remoto ni datos reales;
- no se enviaron mensajes, no hubo deploy y no se usó `PILOTO_DELTA`;
- no se incorporó IA real, pagos, pedidos ni producción;
- el commit `0ccd4dc` es un resguardo local anterior a esta implementación;
- los cambios de interfaz y documentación permanecen sin commit ni push.

## Pendiente y próxima acción

Fito debe validar la experiencia en `http://127.0.0.1:8080/`. La tarea y la
campaña permanecen activas. No se inicia otra etapa ni se versiona este ajuste
sin autorización explícita.
