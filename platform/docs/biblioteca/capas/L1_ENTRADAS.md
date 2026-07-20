# L1 - Entradas

## Responsabilidad

Recibir eventos y comandos desde WhatsApp, pagos, frontend, archivos y proveedores; autenticar el origen y traducirlos a contratos internos.

## Permitido

- validar firma y formato;
- resolver integración, entorno y tenant;
- asignar correlación e idempotencia;
- almacenar referencia segura al contenido;
- rechazar o poner en cuarentena.

## Prohibido

- decidir reglas del negocio;
- certificar pagos;
- mover pedidos;
- escribir tablas de dominio.

## Tests documentales

- origen inválido se rechaza;
- tenant ambiguo queda en cuarentena;
- replay no duplica evento;
- payload sensible no se imprime en logs.
