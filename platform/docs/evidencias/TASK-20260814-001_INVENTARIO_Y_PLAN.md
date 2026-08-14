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
