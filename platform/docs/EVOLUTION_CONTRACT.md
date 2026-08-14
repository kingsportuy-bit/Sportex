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

## Corte real PILOTO_DELTA

- La instancia permitida es exactamente `DELTA` y se vincula del lado servidor a un unico tenant y actor tecnico.
- El webhook es `POST /v1/webhooks/evolution` y exige `x-sportex-webhook-secret`; el secreto no viaja en la URL ni se expone al frontend.
- El primer corte acepta texto individual entrante y mensajes manuales salientes observados por Evolution. Grupos, estados, broadcasts, medios y contactos LID sin alternativa telefonica inequivoca quedan fuera o en cuarentena.
- Cada evento se guarda primero en el journal durable y se deduplica por tenant y una identidad estable derivada de evento, instancia, mensaje y estado.
- El envio real queda apagado por defecto. Al habilitarlo exige STAGING, ingreso real activo, API key montada como secreto, confirmacion humana por mensaje e idempotencia durable; su activacion requiere un GO externo especifico.
- El backfill es una fase separada: nunca dispara mensajes ni cambia automaticamente etapas comerciales.

## Leads de anuncios

Cuando el proveedor entregue contexto de origen, el ingreso conserva IDs de
mensaje, anuncio/click y conversacion sin tratarlos como verdad de venta. La
atribucion y el resultado comercial pertenecen a modulos de leads/pedidos y se
reconcilian con eventos reales.

## Operacion

Crear, reconectar, cambiar webhook, enviar, cerrar sesion o modificar Evolution
es una operacion real. Requiere preflight, rollback y permiso exacto de Fito.

## Continuidad visible del chat

- Un mensaje que llega desde Evolution se autentica y normaliza, se guarda
  primero en el journal PostgreSQL y recien despues se proyecta en la
  conversacion comercial. El panel nunca usa el webhook como fuente visual
  directa: consulta la proyeccion durable de la base.
- Un mensaje enviado desde WhatsApp Web vuelve a SPORTEX como evento
  `messages.upsert` con `fromMe=true`; recorre el mismo journal y aparece en el
  mismo hilo sin ser reenviado.
- Un mensaje enviado desde SPORTEX nace en el outbox durable antes de llamar a
  Evolution. Cuando Evolution confirma el ID externo, se marca `SENT` y se
  proyecta inmediatamente en el chat. El eco posterior usa ese mismo ID y es
  idempotente, por lo que no crea una segunda burbuja.
- Si Evolution confirmo el envio pero falla solamente la proyeccion inmediata,
  el outbox conserva `SENT`: no se habilita un reintento ciego. El eco live
  reconcilia el chat.
- Mientras WhatsApp esta abierto, la interfaz vuelve a consultar la proyeccion
  cada dos segundos y al recuperar visibilidad. Conserva chat elegido, borrador,
  foco y posicion de lectura; no mantiene una copia autoritativa en el browser.

## Replay local

`TASK-20260803-001` incorpora un replay de eventos ficticios, protegido por tres
gates simultáneos: entorno `development|test`, store `memory` y autenticación
de desarrollo. Solo acepta la instancia `LOCAL_FIXTURE` y referencias con
prefijo ficticio.

El endpoint de replay original no se conecta a Evolution ni representa el
payload productivo completo. `TASK-20260814-001` agregó, por fuera del endpoint,
un pipeline simulado que persiste journal y outbox en PostgreSQL local, procesa
backfill/live ficticio y usa transporte falso. No crea webhook, no consulta una
instancia y no habilita mensajes reales.

## Pipeline simulado durable

- el journal persiste el sobre normalizado antes de proyectarlo;
- la clave `(tenant, provider_event_id)` evita duplicados;
- el worker procesa un tenant por vez y ordena por fecha de ocurrencia;
- errores quedan en cuarentena sin borrar la evidencia;
- backfill conserva su origen y no habilita outbound;
- el outbox exige confirmación humana y nace detrás de kill switch;
- receipts no pueden hacer retroceder un estado ya confirmado;
- las migraciones `20260814_002` y `20260814_003` tienen RLS y rollback local ensayado.
