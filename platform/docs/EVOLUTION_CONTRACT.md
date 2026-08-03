# Contrato Evolution / WhatsApp SPORTEX

## Rol

Evolution transporta eventos y mensajes. El Core conserva idempotencia,
autorizacion, estado de conversacion y decisiones de negocio.

## PILOTO_DELTA

La instancia, webhook y numero a utilizar deben inventariarse y aprobarse en
una tarea propia. La existencia de una sesion de WhatsApp o una instancia
llamada `DELTA` no autoriza conectarla.

## Ingreso

- verificar autenticidad y tenant antes de persistir;
- conservar ID externo, timestamp, remitente, tipo y payload minimizado;
- deduplicar por evento/mensaje;
- persistir antes de procesar;
- responder rapido y procesar efectos de forma durable;
- registrar errores sin exponer secretos ni contenido innecesario.

## Salida

- outbox durable e idempotente;
- destino, plantilla/contenido, motivo y correlacion auditables;
- reintentos acotados sin duplicar;
- takeover humano y detencion disponibles;
- mensajes reales solo con alcance y permiso explicitos;
- pruebas locales usan adaptador falso, nunca una sesion real.

## Leads de anuncios

Cuando el proveedor entregue contexto de origen, el ingreso conserva IDs de
mensaje, anuncio/click y conversacion sin tratarlos como verdad de venta. La
atribucion y el resultado comercial pertenecen a modulos de leads/pedidos y se
reconcilian con eventos reales.

## Operacion

Crear, reconectar, cambiar webhook, enviar, cerrar sesion o modificar Evolution
es una operacion real. Requiere preflight, rollback y permiso exacto de Fito.

## Replay local

`TASK-20260803-001` incorpora un replay de eventos ficticios, protegido por tres
gates simultáneos: entorno `development|test`, store `memory` y autenticación
de desarrollo. Solo acepta la instancia `LOCAL_FIXTURE` y referencias con
prefijo ficticio.

El replay no se conecta a Evolution, no representa el payload productivo
completo, no persiste en PostgreSQL y no habilita mensajes. Sirve para validar
normalización, deduplicación, atribución y la proyección comercial local.
