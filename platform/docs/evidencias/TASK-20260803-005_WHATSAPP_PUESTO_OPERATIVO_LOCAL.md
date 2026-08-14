# WhatsApp como puesto operativo local

- Tarea: `TASK-20260803-005`
- Campaña: `CAMP-20260803-001`
- Fecha: `2026-08-14`
- Entorno: `DESARROLLO_LOCAL`
- Estado: `CONCEPTO_VISUAL_ACEPTADO_EN_DESARROLLO_LOCAL`

## Decisión de producto

Fito aprobó redirigir SPORTEX para que la conversación sea la entrada al trabajo
real, sin confundirla con el CRM. El primer corte usa esta cadena:

`conversación -> contexto -> próxima acción -> evidencia medible`

`WhatsApp`, `Leads`, `Clientes` y `Pedidos` son superficies relacionadas pero
distintas. Una persona conserva una sola historia; una oportunidad y un pedido
representan procesos diferentes.

## Implementación de este corte

- nueva pantalla `WhatsApp` separada de `Leads`;
- escritorio con lista de chats, conversación y compositor como estructura principal;
- móvil con lista y chat individual, sin paneles de CRM dentro de WhatsApp;
- búsqueda por persona, equipo o último mensaje;
- cabecera, burbujas y compositor siguen primero el patrón mental de WhatsApp;
- la ficha queda en opciones y no ocupa espacio permanente;
- lengüetas laterales independientes con `Todas` y las seis etapas comerciales
  de la empresa ficticia; en escritorio se apilan por fuera del borde izquierdo,
  con el nombre girado en vertical, y filtran chats sin cubrir la lista;
- no existe una barra continua: la activa usa lima y en móvil las lengüetas
  conservan la lectura vertical dentro de un margen propio;
- cada lengüeta queda al ras del borde del panel, sin sombras, conectores ni
  movimiento; el estado activo se expresa únicamente con fondo lima;
- prueba de hover confirmó texto vertical estable antes/después, sin giro ni
  desplazamiento (`writing-mode: vertical-rl`, transformación de texto estable);
- el índice vertical usa viñetas uniformes de `42x96px`, separación de `1px` y
  oculta los conteos visuales, preservándolos solo en el nombre accesible;
- tipografía validada en `Bahnschrift Condensed`, `900`, `10px`, mayúsculas; los
  siete nombres entran completos, incluidos `Cotización enviada` y `Cerrado sin venta`;
- mobile usa `42x88px` y `9px`; las siete viñetas terminan en `807px` dentro del
  viewport `390x844`, sin recorte de texto ni desborde inferior;
- línea cromática reducida a grafito, blanco y verde lima, usando lima para
  selección y acciones sin introducir un acento azul;
- `Detalles` abre una ficha dentro del panel de conversación con identidad,
  proceso, próxima acción, transiciones, faltantes, origen e historial;
- en desktop la ficha mide `440px`, el chat conserva `314px` y el compositor queda
  visible; la lista se oculta temporalmente y vuelve al cerrar;
- en mobile `390x844` la ficha cubre exactamente la pantalla interna del chat y
  ofrece cierre propio, sin comprimir la información en una columna estrecha;
- selector claro/oscuro global, con preferencia persistida localmente y
  adaptación inicial a la preferencia del sistema;
- `Hoy` abre directamente la conversación priorizada;
- borrador, respuesta rápida y tabla de talles permanecen locales y copiables;
- etapa, próxima acción y seguimiento siguen usando los comandos existentes del Core.

## Límites reales

- las 18 conversaciones siguen siendo ficticias y locales;
- no se conectó Evolution, Meta, Supabase remoto ni datos reales;
- no se enviaron mensajes y no existe acción de envío;
- no hubo deploy, migración, commit ni push;
- los tableros completos de `Leads` y `Pedidos`, la conversión integrada a
  Cliente/Pedido y la sincronización real quedan para cortes posteriores.

## Evidencia

- revisión visual de escritorio sobre `http://127.0.0.1:8080/`;
- revisión responsive `390x844`: lista -> chat individual -> compositor;
- búsqueda, selección y navegación semántica comprobadas en navegador;
- filtro de etapa `EN_CALIFICACION`: 4 conversaciones visibles de 4 esperadas;
- ficha móvil comprobada sin solapamiento, con cinco tarjetas completas y
  desplazamiento interno; consola del navegador sin errores;
- `node --check frontend/app.js`: PASS;
- `git diff --check`: PASS;
- `npm run validate`: PASS;
- workflow: 8/8;
- documentación: 65 archivos y 16 módulos;
- Core: 25/25 tests;
- TypeScript, SQL y build: PASS.

Tras la devolución visual de Fito se retiraron el panel comercial lateral y la
pestaña `Trabajo`. Las acciones inteligentes se incorporarán después de forma
contextual, sin deformar la experiencia base de WhatsApp.

Fito aceptó después el concepto visual resultante. El modo oscuro conserva la
misma estructura, usa grafito y verde oscuro sin convertir la interfaz en negro
puro, y permite volver a claro desde el encabezado.

Las etapas que se ven hoy son una plantilla local de Delta. La interfaz consume
una sola definición, pero el Core todavía no expone plantillas configurables por
empresa; esa capacidad permanece pendiente y no se presenta como implementada.

## Próximo gate

El próximo corte se decide por separado: conexión operativa real, captura
continua, orden/idempotencia,
backfill, envío manual explícito y recuperación segura. Ese trabajo sí requiere
un alcance y GO remoto exactos antes de tocar Evolution, datos o mensajes.
