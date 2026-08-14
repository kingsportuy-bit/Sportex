# Frontend SPORTEX

Estado: `VALIDADO_DESARROLLO_LOCAL`.

La demo comercial se ejecuta sobre la plataforma existente, consume exclusivamente la API `/v1` del Core y conserva la semilla canónica de 18 leads ficticios.

`TASK-20260803-005` implementa la experiencia aprobada en Etapa 0:

- `Hoy` prioriza quién necesita respuesta, seguimientos vencidos, clientes en espera y próximas acciones;
- `WhatsApp` funciona como superficie separada y primero como mensajería: lista
  de chats, conversación y compositor; en móvil la lista abre el chat individual;
- la lista se filtra con lengüetas independientes apiladas fuera de su borde
  izquierdo; son viñetas planas de `42x96px`, sin sombra ni movimiento, con texto
  vertical SPORTEX condensado, pesado y estable incluso en hover;
- WhatsApp concentra su línea cromática en grafito, blanco y verde lima;
- `Detalles` abre contacto y proceso actual dentro del panel de conversación;
  en desktop usa una ficha de `440px`, oculta temporalmente la lista y conserva
  chat/compositor; en mobile abre una pantalla completa sobre el chat;
- el encabezado permite alternar claro/oscuro y recuerda la elección local;
- `Leads` reúne lista filtrable, conversación, trabajo comercial y ficha completa;
- el panel de trabajo muestra etapa, resumen, datos confirmados y faltantes, próxima acción, sugerencia y anuncio de origen;
- la tabla de talles y las respuestas rápidas preparan un borrador local, sin enviar mensajes;
- `Pedidos` y `Clientes` muestran candidatos con `SEÑA_VALIDADA`, sin simular una conversión que todavía no existe en el Core;
- `Anuncios`, `Creativos` y `Resultados` ofrecen vistas derivadas de la muestra local;
- Administración expone catálogo, procesos, respuestas rápidas, proveedores ficticios y restauración controlada;
- los cambios autorizados persisten en JSON local ignorado por Git y pueden restaurarse a la semilla inicial.

La validación técnica y visual local no equivale a aprobación de producto ni certifica `PILOTO_DELTA`.

Queda prohibido:

- escribir directamente en la base;
- calcular costos o ganancias como fuente canónica;
- mover etapas sin validación del Core;
- decidir permisos;
- guardar secretos;
- duplicar reglas de módulos;
- conectar Evolution, Meta, Chatwoot, Supabase remoto o datos reales;
- enviar mensajes o hacer deploy.
