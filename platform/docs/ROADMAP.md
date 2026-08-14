# Roadmap SPORTEX

Los estados documentales no reemplazan evidencia de runtime.

## F0 - Sistema de desarrollo

Estado: `COMPLETADO`.

- Git independiente, estado canonico, tareas, Biblioteca y validadores.

## F1 - Reconciliacion del sistema existente

Estado: `PENDIENTE_REVALIDACION`.

- Revalidar legado, runtime, contratos, deuda y retiro reversible.

## F2 - Kernel del Core

Estado: `IMPLEMENTADO_NO_VALIDADO`.

- Tenant, identidad, idempotencia y auditoria existen; persistencia real,
  autenticacion y conversion Cliente/Pedido requieren nueva validacion.

## CAMP-20260803-001 - V1 Operativa Delta

Estado: `ETAPA_0_REPLANIFICADA_WIREFRAME_PENDIENTE_APROBACION`.

- E0: interfaz no aprobada. `DELTA-DEC-012` exige tableros
  de Leads/Pedidos y un mock relacionado de 18 leads, 6 clientes y 8 pedidos.
  El wireframe espera aprobación.
- E1: `Hoy -> Lead -> SEÑA_VALIDADA -> Cliente + Pedido` ficticio.
- E2: persistencia durable, permisos, respaldo y rollback.
- E3: captura real paralela y de solo lectura.
- E4: respuesta asistida con aprobación humana.
- E5: `PILOTO_DELTA` acotado, reversible y observado.
- E6: mejorar con evidencia de 7 a 14 días.

Cada etapa conserva tarea, gate y autorización. La campaña solo termina con
aceptación operativa de Delta.

## F7 - PRODUCCION_COMERCIAL

Estado: `BLOQUEADO`.

- Requiere aislamiento certificado y GO específico de salida al mercado.
