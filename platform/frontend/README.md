# Frontend SPORTEX

Estado: `IMPLEMENTADO_NO_VALIDADO`.

El frontend muestra proyecciones del Core y permite ejecutar comandos autorizados.

La primera superficie incluye login Supabase, pedidos, clientes, seña certificada y alta idempotente de pedido. Está servida por el mismo artefacto liviano del Core, pero permanece separada en código y consume exclusivamente `/v1`.

En desarrollo local, `TASK-20260803-004` valida una mesa CRM de fixtures sobre esta misma superficie:

- inicia sin secretos con identidad ficticia de desarrollo;
- carga una semilla canonica de 18 leads con atribucion exacta o desconocida;
- permite filtrar el tablero, abrir el expediente y consultar la conversacion historica;
- solicita al Core cambiar etapa, editar proxima accion o registrar seguimiento;
- persiste solamente fixtures en JSON local ignorado por Git;
- restaura la semilla mediante confirmacion explicita;
- nunca ofrece enviar, publicar, conectar ni usar datos reales.

Estado CRM: `VALIDADO_DESARROLLO_LOCAL`; no certifica `PILOTO_DELTA`.

Validación de producto del 2026-08-03: `NO_APROBADA`. El resultado técnico,
los 18 leads y la persistencia permanecen válidos; `TASK-20260803-005` rediseña
la experiencia alrededor de `Hoy` y `Resultados` antes de una nueva revisión.

Etapa 0 V1: el rediseño propuesto amplía la navegación a Operación (`Hoy`,
`Leads`, `Pedidos`, `Clientes`), Marketing y Administración. El wireframe
incluye conversación asistida, tabla de talles, origen histórico, conversión
objetivo a Cliente/Pedido y tablero productivo. Sigue pendiente de aprobación;
no representa código ni capacidades nuevas ya implementadas.

Queda prohibido:

- escribir directamente en la base;
- calcular costos o ganancias como fuente canónica;
- mover etapas sin validación del Core;
- decidir permisos;
- guardar secretos;
- duplicar reglas de módulos.

No se reutilizaron componentes ni acceso directo a Supabase del monolito anterior. La identidad visual usa la marca real de Delta Sport y el recorrido operativo de producción.
