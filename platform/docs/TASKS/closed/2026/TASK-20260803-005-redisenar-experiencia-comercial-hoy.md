# Rediseñar la experiencia comercial Hoy

id: TASK-20260803-005
owner: Codex
requester: Fito
estado: done
lifecycle: closed
work_type: feature
campaign: CAMP-20260803-001
context_focus: product
development_guide_impact: none
updated_at: 2026-08-14

## objetivo

Convertir la Etapa 0 en un puesto operativo local que permita recorrer
`conversación -> contexto -> próxima acción` sin salir de SPORTEX. `WhatsApp`
es una superficie sincronizable separada de los tableros de `Leads` y `Pedidos`;
`Clientes` conserva la identidad y las relaciones sin duplicar la conversación.

## alcance_permitido

- registrar la validación de producto no aprobada sin degradar el PASS técnico;
- reconciliar `CAMP-20260803-001` con el plan V1 aprobado por DELTA;
- implementar el corte local aprobado por Fito sobre la plataforma existente;
- incorporar `WhatsApp` como bandeja separada con lista, chat, borrador y
  contexto comercial en escritorio y móvil;
- cubrir Operación: `Hoy`, `Leads`, `Pedidos` y `Clientes`;
- cubrir Marketing: `Anuncios`, `Creativos` y `Resultados`;
- cubrir Administración: productos/precios/talles, procesos/respuestas rápidas,
  proveedores y configuración;
- mostrar priorización, conversación, resumen, confirmados, faltantes, próxima
  acción, respuestas rápidas, tabla de talles y anuncio de origen;
- mostrar como objetivo V1 la conversión idempotente de `SEÑA_VALIDADA` a un
  Cliente vinculado y exactamente un Pedido visible en producción;
- mantener la ficha completa disponible por detalle progresivo;
- definir patrones claros de escritorio y móvil;
- conservar los 18 leads, conversaciones, mutaciones Core, persistencia y reset;
- especificar 6 clientes y 8 pedidos ficticios relacionados, con recompra,
  bloqueo, cambio posterior a la seña y pedido entregado;
- validar escritorio, móvil, claridad, navegación y ausencia de regresiones.

## alcance_prohibido

- hacer commit o push sin autorización separada de Fito;
- crear una aplicación paralela o trasladar reglas fuera del Core;
- eliminar, reemplazar o reducir los 18 fixtures y su persistencia local;
- conectar Evolution, Meta, Chatwoot, Supabase remoto o servicios reales;
- enviar mensajes, usar datos reales, hacer deploy o usar `PILOTO_DELTA`;
- incorporar IA real, pagos, pedidos o producción.

## entradas

- devolución de Fito: `VALIDACION_PRODUCTO_NO_APROBADA` para la experiencia de
  `TASK-20260803-004`;
- resultado técnico de `TASK-20260803-004` en PASS;
- estructura recomendada y cuatro preguntas operativas definidas por Fito;
- plataforma CRM local existente y campaña `CAMP-20260803-001` activa.
- `plan-entrega-sportex-delta-v1-operativa.md` y contrato funcional de DELTA;
- `DELTA-DEC-007`, `DELTA-DEC-010`, `DELTA-DEC-011` y `DELTA-DEC-012`.

## salidas

- wireframe maestro único de navegación, operación y transición a producción;
- aprobación o nueva devolución de Fito antes de código;
- después de aprobación y versionado autorizado: implementación responsive
  sobre el frontend existente;
- evidencia técnica y de producto separadas.

## validacion

- `Hoy` responde sin scroll en escritorio quién necesita respuesta, qué
  seguimientos vencieron, qué clientes se esperan y cuál es la próxima acción;
- `Leads` abre en tablero CRM por etapas y cada tarjeta muestra equipo/cliente,
  producto, cantidad, faltante, próxima acción, tiempo sin respuesta y origen;
- el detalle del Lead muestra conversación y ficha comercial lado a lado;
- `Pedidos` abre en tablero productivo y cada tarjeta muestra cliente/equipo,
  producto, cantidad, fecha, bloqueo, responsable y próxima acción;
- el detalle del Pedido muestra conversación vinculada y ficha completa lado a lado;
- `Clientes` permite recorrer conversaciones, oportunidades y pedidos enlazados;
- el mock conserva 18 leads y especifica 6 clientes y 8 pedidos relacionados,
  incluidos dos pedidos de un cliente, bloqueo, cambio versionado y entrega;
- la lista comunica prioridad y motivo con lenguaje comercial simple;
- conversación y acción principal permanecen visibles al mismo tiempo;
- `Resultados` concentra métricas, atribución y embudo;
- la navegación agrupa todos los módulos aprobados en Operación, Marketing y
  Administración sin mostrar superficies vacías;
- `Leads` permite entender la charla, preparar una respuesta, adjuntar una tabla
  de talles y dejar el siguiente paso con aprobación humana;
- cambiar el interés no reemplaza el anuncio que originó el contacto;
- `SEÑA_VALIDADA` muestra el efecto futuro `Cliente + un Pedido` de forma
  inequívoca y el Pedido aparece en el tablero productivo;
- la ficha completa se abre sin recargar la pantalla diaria;
- escritorio y móvil conservan contexto, acción principal y navegación;
- no aparecen título gigante, barra decorativa, módulos vacíos, tecnicismos ni
  información repetida;
- etapa, próxima acción, seguimiento, persistencia y reset conservan el
  comportamiento probado;
- QA visual y funcional de escritorio y móvil, tests completos y
  `SPORTEX_CLOSE=PASS` al finalizar la implementación.

## evidencia

- `docs/evidencias/TASK-20260803-005_VALIDACION_PRODUCTO_Y_WIREFRAME.md`;
- `docs/evidencias/TASK-20260803-005_ETAPA_0_V1_OPERATIVA.md`.
- `docs/evidencias/TASK-20260803-005_IMPLEMENTACION_INTERFAZ_COMERCIAL.md`.
- `docs/evidencias/TASK-20260803-005_DELTA_DEC_012_WIREFRAME.md`.
- `docs/evidencias/TASK-20260803-005_WHATSAPP_PUESTO_OPERATIVO_LOCAL.md`.

## rollback

Antes de la aprobación, revertir solamente este checkpoint documental. Después
de implementar, revertir únicamente los cambios visuales de la tarea sin tocar
el Core, la semilla ni el archivo local persistente.

## deuda_restante

- Fito aprobó la dirección de producto y el concepto visual WhatsApp primero;
- `WhatsApp` ya es una superficie separada, pero todavía usa conversaciones
  ficticias y solo permite preparar/copiar respuestas;
- los tableros completos de `Leads` y `Pedidos` siguen pendientes del corte
  posterior y no deben volver a mezclarse con la bandeja;
- los 6 clientes y 8 pedidos relacionados están especificados, no implementados;
- `SEÑA_VALIDADA -> Cliente + exactamente un Pedido` sigue siendo una capacidad
  futura del Core;
- datos e integraciones reales permanecen fuera;
- los cambios de interfaz no tienen commit ni push;
- la campaña continúa activa y no se abre otra tarea en paralelo.

## registro_de_avances

### 2026-08-03 - historial previo consolidado

- El PASS técnico, Core, persistencia y 18 leads de `TASK-20260803-004` se
  conservaron pese a la no aprobación de producto.
- El primer wireframe fue aprobado e implementado localmente; QA responsive y
  persistencia pasaron. El resguardo `0ccd4dc` quedó local y sin push.
- La interfaz implementada nunca obtuvo aprobación de producto.

### 2026-08-03 - producto no aprobado y reconciliación DELTA-DEC-012

- Fito no aprobó la Etapa 0: una lista de conversaciones no reemplaza los
  tableros de Leads y Pedidos, y la demo no puede contener solo leads.
- El PASS técnico, Core, persistencia, 18 leads y cambios locales se conservan.
- Se definió un único wireframe con tablero CRM, detalle de Lead, tablero
  productivo, detalle de Pedido, ficha de Cliente y navegación relacionada.
- Se especificó un mock futuro de 6 clientes y 8 pedidos ficticios enlazados.
- No se modificó código, no se creó commit y no se hizo push.

### 2026-08-13 - dirección operativa aprobada e interfaz local ejecutada

- Fito definió SPORTEX como puesto operativo basado en WhatsApp continuo,
  conectado con Oportunidades, Clientes, Pedidos y medición de punta a punta.
- Se aprobó ejecutar primero una vertical acotada: conversación, contexto,
  próxima acción y trazabilidad, sin abrir integraciones reales.
- Se incorporó `WhatsApp` como pantalla propia con lista y chat tipo WhatsApp Web.
- Fito corrigió el concepto visual: se retiraron el panel lateral comercial y
  `Chat / Trabajo`; WhatsApp queda primero como lista, conversación y compositor.
- `Hoy` abre la conversación exacta. El compositor local permanece deshabilitado
  para envío; la inteligencia se agregará después de forma contextual.
- QA visual pasó en escritorio y `390x844`; `npm run validate` pasó completo,
  incluidos 25/25 tests Core. No hubo datos reales, mensajes, deploy, commit ni push.
- Fito aceptó el concepto visual WhatsApp primero. Se agregó un selector global
  claro/oscuro que respeta la preferencia del sistema la primera vez y luego
  recuerda localmente la elección, sin cambiar datos ni comportamiento Core.

### 2026-08-14 - lengüetas laterales y detalle progresivo

- La lista de chats incorporó lengüetas independientes apiladas por fuera de su
  borde izquierdo. En escritorio ocupan el espacio exterior, no pisan los chats,
  tienen mayor altura y muestran el nombre completo girado en vertical.
- Las lengüetas se redujeron a viñetas planas unidas al borde izquierdo: sin
  conectores, sombras, desplazamientos ni conteos visibles.
- `hover` y foco preservan `writing-mode: vertical-rl` y el giro de `180deg`;
  ninguna palabra cambia de orientación ni la viñeta se desplaza al recorrerla.
- La versión mínima usa `42px` de ancho, `96px` de alto y `1px` de separación;
  solo el fondo lima distingue la etapa activa.
- La palabra adopta la voz visual SPORTEX: `Bahnschrift Condensed`, peso `900`,
  `10px`, mayúsculas y mayor presencia sin recuperar efectos decorativos.
- En móvil conservan la misma lectura vertical dentro de un margen lateral propio,
  sin superponerse a las conversaciones.
- La lengüeta activa se reconoce por el acento lima y el filtro actúa sobre la
  lista de conversaciones sin alterar el chat ni el proceso comercial.
- Fito fijó la línea cromática en grafito, blanco y verde lima; se retiró el
  azul como acento de WhatsApp y la selección activa usa lima.
- La definición local de etapas quedó centralizada como plantilla de empresa y
  alimenta etiquetas, filtros, tableros y comandos. No simula todavía la
  configuración persistida que deberá entregar el Core en `PILOTO_DELTA`.
- El encabezado del chat ofrece `Detalles`; abre una ficha desplazable dentro
  del panel de conversación. En desktop mide `440px`; la lista se oculta mientras
  está abierta para preservar chat y compositor, y reaparece al cerrarla.
- En mobile `Detalles` es una pantalla completa sobre el chat, con cierre propio;
  no intenta comprimir chat, ficha y compositor en el mismo ancho.
- QA de navegador verificó las siete viñetas verticales, detalle interno en
  escritorio con `440px`, restauración de la lista al cerrar y pantalla completa
  en `390x844` superpuesta al chat.

## decisiones

- `SPORTEX-DEC-006` separa validación técnica de validación de producto.
- `SPORTEX-DEC-007` incorpora el plan V1 a la campaña y define la Etapa 0.
- La jerarquía de `Hoy` parte de urgencia y próxima acción, no de entidades ni
  detalles técnicos del sistema.
- La sugerencia comercial es texto ficticio de apoyo en esta tarea; no incorpora
  IA real ni ejecuta acciones.
- `DELTA-DEC-012` reemplaza la lista conversacional como entrada de `Leads`:
  tablero primero, detalle conversacional después de seleccionar una tarjeta.
- `SPORTEX-DEC-009` separa la bandeja `WhatsApp` de los tableros y fija como
  primer corte la jornada vertical `conversación -> contexto -> próxima acción`.

## cierre

- Resultado: interfaz WhatsApp-first aceptada y validada localmente con lista,
  chat, compositor, etapas parametrizables, detalle progresivo, tema claro/oscuro
  y comportamiento responsive.
- Evidencia: `docs/evidencias/TASK-20260803-005_WHATSAPP_PUESTO_OPERATIVO_LOCAL.md`.
- Validación: 25/25 pruebas Core, documentación, SQL, TypeScript y build en PASS.
- Limitación explícita: fixtures locales; sin Evolution, datos reales, mensajes
  ni despliegue.
- Continuidad: `TASK-20260814-001` integra la interfaz aprobada con el Core y
  prepara la conexión real de Delta por gates.
