# Observabilidad SPORTEX

## Objetivo

Reconstruir qué ocurrió desde un mensaje de WhatsApp hasta una acción, documento, trabajo o notificación, diferenciando fallas técnicas, bloqueos de negocio y espera humana.

## Señales

### Logs

Eventos estructurados con nivel, componente, tenant interno, correlación, recurso, resultado y error normalizado.

### Métricas

- mensajes recibidos y deduplicados;
- hechos IA propuestos, aprobados y rechazados;
- comandos exitosos, bloqueados y fallidos;
- duración por etapa del pedido;
- trabajos pendientes y vencidos;
- outbox, reintentos y cola muerta;
- documentos generados y fallidos;
- costos estimados contra reales;
- uso, latencia y costo de IA;
- errores de aislamiento o autorización.
- salud, conexiones, locks, replicación y almacenamiento de Supabase por entorno;
- versión, commit y digest desplegados;
- capacidad del host: carga, CPU, memoria, swap y disco.

### Trazas

Una correlación acompaña:

```text
mensaje -> interpretación -> comando -> módulo -> transacción -> job -> integración -> resultado
```

### Auditoría

Registra decisiones del negocio y acciones sensibles. Auditoría no es un log técnico y tiene retención y acceso propios.

## Identificadores

- `correlation_id`: recorrido completo;
- `causation_id`: evento que causó otro;
- `event_id`: evento único;
- `tenant_id`: empresa interna;
- `conversation_id`;
- `order_id`;
- `job_id`;
- `document_version_id`.

## Estados observables

Todo job o notificación debe terminar en:

- `pending`;
- `processing`;
- `succeeded`;
- `blocked`;
- `retry_scheduled`;
- `failed_terminal`;
- `cancelled`.

## Dashboards iniciales

1. Salud de ingreso WhatsApp.
2. Estado de pedidos y etapas.
3. Jobs, outbox y reintentos.
4. Integraciones por proveedor.
5. Seguridad y autorización.
6. IA: uso, costo, latencia y aceptación.
7. Cumplimiento productivo por empresa.

## Alertas

- webhook sin eventos dentro de ventana esperada;
- aumento de duplicados o firmas inválidas;
- outbox o jobs estancados;
- error repetido de proveedor;
- intento cross-tenant;
- documentos no generados antes del gate;
- pedidos próximos a fecha límite sin avance;
- diferencia anormal entre costo estimado y real.
- runtime cuyo digest no coincide con el manifiesto;
- proyección de cronología degradada en lectura o escritura, conservando
  tenant, conversación, operación y código de error sin contenido del mensaje;
- Supabase, Core o workers sin readiness;
- swap agotada, disco crítico o carga sostenida sin margen de rollback.

## Privacidad

No usar teléfonos, nombres, mensajes, escudos, comprobantes ni textos de clientes como etiquetas de métricas. Los contenidos sensibles se consultan solamente desde superficies autorizadas.

## Retención

Las políticas de retención se definirán por señal. Auditoría y evidencia de pagos requieren mayor protección que logs técnicos de diagnóstico.
