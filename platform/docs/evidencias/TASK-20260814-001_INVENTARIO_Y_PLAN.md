# Evidencia — inventario y plan de integración real SPORTEX / DELTA

- Fecha: 2026-08-14
- Entorno: `DESARROLLO_LOCAL`
- Tarea: `TASK-20260814-001`
- Handoff: `SARA/HANDOFF-20260814-003`

## Conclusión

SPORTEX no parte de cero. Existen dos verticales locales separadas:

1. conversación, atribución, lead/oportunidad, etapa, próxima acción y seguimiento;
2. cliente, seña certificada y pedido idempotente con auditoría y outbox.

La implementación debe normalizar e integrar ambas, conservar las reglas y
tests que pasan y agregar persistencia e integraciones reales por gates.

## Inventario

La matriz completa vive en la task. Resumen:

- reutilizar: UI, fixtures, Core transaccional, idempotencia, autorización,
  auditoría, outbox base, atribución y seguimientos;
- adaptar: modelo comercial agregado, persistencia, Cliente/Contacto, API,
  eventos, auth y migraciones;
- falta: Evolution real, workers, backfill, receipts, Meta lectura, múltiples
  oportunidades, asistencia registrada, proceso mínimo y piloto real.

## Riesgo principal

Crear varias historias incompatibles entre Evolution, Chatwoot, captura
provisional y SPORTEX. La defensa es una única historia operativa normalizada en
SPORTEX, con evidencia externa inmutable, idempotencia y captura pasiva antes de
outbound.

## Próxima prueba

Gate 1: demostrar localmente el recorrido completo con fixtures y persistencia
objetivo, incluyendo aislamiento tenant y creación única de Cliente/Pedido a
partir de una seña validada.

## Acciones no ejecutadas

- No se accedió a Evolution, Meta, Chatwoot, VPS, Supabase remoto ni datos reales.
- No se desplegó ni migró.
- No se enviaron mensajes.

## Checkpoint ejecutado — Gate 1A

Se cerró la primera brecha integrada sin reconstruir el Core:

`Conversación -> Oportunidad con seña validada -> Cliente -> Pago certificado -> Pedido`

Evidencia observable:

- endpoint local `convert-to-order` gobernado por etapa, versión y permisos;
- claves idempotentes estables por oportunidad para Cliente, Pago y Pedido;
- proyección `coreConversion` en la ficha y evento `ORDER_CREATED`;
- acción y resultado visibles dentro de Detalles de WhatsApp sin ocultar el chat;
- prueba de navegador: `SPX-2026-00001`, $ 10.000 de seña, $ 112.320 total,
  1 Cliente y 1 Pedido sobre fixtures locales;
- Core `27/27` PASS, incluido reintento sin duplicación y fail-closed sin seña.

El checkpoint prueba integración local. No prueba Evolution, persistencia remota,
datos reales, captura pasiva ni envío.

## Checkpoint ejecutado — Gate 1B

- Contacto se separó de Conversación, Lead y Oportunidad con relaciones explícitas.
- La migración aditiva `20260814_002` define cinco tablas comerciales normalizadas.
- Todas aplican aislamiento por tenant, RLS forzado, permisos mínimos y down migration.
- `validate-sql`: 14 tablas PASS. La migración permanece local y no ejecutada.

## Checkpoint ejecutado — Gate 1C

- Se implementó el store PostgreSQL comercial sobre las cinco tablas nuevas y
  la idempotencia canónica del Core.
- La migración conserva el `workspace_id` que consume la interfaz y aplica RLS
  forzado a las 14 tablas totales.
- Ensayo aislado PostgreSQL 16:
  - Core `up`: PASS;
  - comercial `up`: PASS;
  - comercial `down`: 0 tablas restantes;
  - reaplicación: 5 tablas comerciales;
  - rollback con datos: 0 tablas restantes.
- Ensayo funcional: dos tenants conservaron un expediente cada uno; repetir el
  mismo mensaje devolvió replay sin crear un segundo expediente.
- Core `28/28` PASS. PostgreSQL expone solo la lectura de la proyección; replay,
  reset y mutaciones locales continúan bloqueados fuera de desarrollo seguro.
- El contenedor temporal verificado fue eliminado. No se tocó ninguna base,
  integración o dato remoto.
