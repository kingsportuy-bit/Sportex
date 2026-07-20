# Contrato del Core SPORTEX

## Responsabilidad

El Core es la única autoridad para reglas, permisos, estados, transiciones, costos, versiones y efectos autorizados.

## Entrada

El Core recibe:

- comandos autenticados desde frontend;
- eventos normalizados desde adaptadores;
- resultados de workers;
- validaciones humanas;
- eventos de tiempo del scheduler.

## Flujo obligatorio

1. Resolver entorno, empresa y actor desde identidad confiable.
2. Validar esquema e idempotencia.
3. Autorizar la acción.
4. Cargar el agregado o expediente vigente.
5. Evaluar precondiciones y bloqueos.
6. Aplicar reglas en el módulo propietario.
7. Guardar estado, auditoría y outbox en una transacción.
8. Publicar respuesta estable.

## Invariantes

- Ningún comando opera sin `tenant_id` resuelto por el Core.
- Un pago certificado no puede procesarse dos veces.
- Un pedido conserva una versión vigente y su historial.
- Una transición prohibida no se fuerza desde frontend, integraciones o workers.
- Un documento liberado no se sobrescribe; se crea nueva versión.
- Todo side effect parte de outbox o job persistido.
- Un worker vuelve a validar tenant, permisos y estado antes del efecto.
- Los costos estimados y reales no se mezclan.

## Módulos iniciales

- identidad y empresas;
- clientes y leads;
- conversaciones WhatsApp;
- pagos;
- nuevo pedido;
- costos;
- procesos;
- documentos;
- diseño;
- impresión y compras;
- talleres;
- envíos;
- notificaciones;
- observabilidad;
- seguridad;
- postventa.

## Persistencia

Cada módulo posee sus tablas o repositorios. Las consultas cruzadas usan servicios de aplicación, vistas controladas o eventos; no escrituras directas.

## API

La API expone recursos y comandos. No expone writers genéricos como `actualizar cualquier estado` o `insertar cualquier job`.

Las respuestas incluyen:

- resultado;
- versión del recurso;
- correlación;
- bloqueos o acciones disponibles;
- errores estables sin secretos.

## Extensibilidad

Los módulos pueden extraerse a servicios separados solamente cuando exista necesidad medida. Sus contratos internos deben permitirlo sin cambiar el comportamiento del negocio.
