# Contrato Evolution API SPORTEX

## Decisión

Evolution API será el proveedor de WhatsApp. SPORTEX se conectará directamente desde adaptadores y workers del Core, sin n8n.

## Instancias

- Cada empresa o marca tendrá su propia instancia Evolution.
- La instancia pertenece a un único tenant y entorno.
- Delta será la primera instancia piloto en STAGING.
- Una instancia de staging nunca envía como producción.

## Baseline observado

- producción contiene una instancia legado llamada `DELTA`;
- estado observado el 2026-07-19: `close`;
- no tenía webhook configurado;
- no se encontró una instancia SPORTEX o Delta en Evolution STAGING.

La instancia legado no queda adoptada automáticamente por el nuevo Core. Su vinculación, reconexión o reemplazo requiere una tarea autorizada y credenciales registradas por tenant y entorno.

## Ingreso

Evolution publica webhooks hacia un endpoint autenticado del Core.

El adaptador:

- valida secreto, origen y contrato;
- resuelve tenant por integración registrada;
- asigna idempotencia y correlación;
- normaliza el evento;
- guarda referencia segura;
- entrega al módulo WhatsApp.

No interpreta reglas del negocio ni escribe tablas de pedidos.

## Salida

El Core crea outbox autorizado. Un worker Evolution:

- reclama el trabajo;
- relee tenant, instancia, conversación y permiso;
- envía;
- verifica la respuesta del proveedor;
- registra identificador y resultado;
- reintenta o falla terminalmente según política.

## Seguridad

- credenciales solamente del lado servidor;
- secretos separados por entorno;
- webhooks autenticados;
- payloads sensibles fuera de logs;
- allowlist obligatoria en STAGING;
- soporte cross-tenant auditado;
- QR y reconexión protegidos por permisos.

## Estados operativos

- `unconfigured`;
- `provisioning`;
- `qr_pending`;
- `connected`;
- `degraded`;
- `disconnected`;
- `blocked`;
- `retired`.

## Observabilidad

Medir ingreso, duplicados, latencia, conexión, envíos, reintentos y errores por tenant interno sin usar teléfonos como etiquetas.

## Límite actual

No se creó ni modificó ninguna instancia como parte de esta documentación. Existe la instancia legado `DELTA` en producción, actualmente desconectada y sin webhook.
