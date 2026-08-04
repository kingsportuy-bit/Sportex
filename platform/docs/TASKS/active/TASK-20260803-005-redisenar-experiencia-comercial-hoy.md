# Rediseñar la experiencia comercial Hoy

id: TASK-20260803-005
owner: Codex
requester: Fito
estado: in_progress
lifecycle: active
work_type: feature
campaign: CAMP-20260803-001
context_focus: product
development_guide_impact: none
updated_at: 2026-08-03

## objetivo

Completar la Etapa 0 de la V1 Operativa con un único wireframe maestro que haga
comprensible el recorrido `Hoy -> Lead -> SEÑA_VALIDADA -> Cliente -> Pedido`,
cubra la navegación completa y preserve Core, persistencia y 18 leads ficticios.

## alcance_permitido

- registrar la validación de producto no aprobada sin degradar el PASS técnico;
- reconciliar `CAMP-20260803-001` con el plan V1 aprobado por DELTA;
- diseñar y, solo después de aprobación explícita, implementar sobre la
  plataforma existente;
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
- validar escritorio, móvil, claridad, navegación y ausencia de regresiones.

## alcance_prohibido

- modificar código antes de la aprobación explícita del wireframe por Fito;
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
- `DELTA-DEC-007`, `DELTA-DEC-010` y `DELTA-DEC-011`.

## salidas

- wireframe maestro único de navegación, operación y transición a producción;
- aprobación o nueva devolución de Fito antes de código;
- después de aprobación y versionado autorizado: implementación responsive
  sobre el frontend existente;
- evidencia técnica y de producto separadas.

## validacion

- `Hoy` responde sin scroll en escritorio quién necesita respuesta, qué
  seguimientos vencieron, qué clientes se esperan y cuál es la próxima acción;
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

## rollback

Antes de la aprobación, revertir solamente este checkpoint documental. Después
de implementar, revertir únicamente los cambios visuales de la tarea sin tocar
el Core, la semilla ni el archivo local persistente.

## deuda_restante

- el wireframe maestro fue aprobado explícitamente por Fito con `continua`;
- la implementación queda bloqueada hasta versionar el trabajo local pendiente
  con autorización separada antes de ampliar la vertical;
- datos e integraciones reales permanecen fuera;
- la campaña continúa activa y no se abre otra tarea en paralelo.

## registro_de_avances

### 2026-08-03 - validación de producto y gate de diseño

- La experiencia de `TASK-20260803-004` quedó no aprobada sin invalidar su PASS
  técnico, persistencia ni 18 leads.
- Se definió `Hoy` como entrada, `Resultados` como análisis y un solo wireframe;
  no se modificó código.

### 2026-08-03 - reconciliación con la V1 Operativa

- Se mantuvieron campaña y tarea; las cuatro fuentes DELTA ampliaron el
  wireframe a navegación completa y `SEÑA_VALIDADA -> Cliente + Pedido`.
- Código, Core, persistencia, fixtures, integraciones y runtime no se tocaron.

### 2026-08-03 - aprobación del wireframe maestro

- Fito respondió `continua`; queda aprobado el wireframe de Etapa 0.
- La interfaz vigente sigue `NO_APROBADA`: se aprobó el diseño, no código.
- Sin cambios de código; falta autorizar el commit de resguardo previo.

## decisiones

- `SPORTEX-DEC-006` separa validación técnica de validación de producto.
- `SPORTEX-DEC-007` incorpora el plan V1 a la campaña y define la Etapa 0.
- La jerarquía de `Hoy` parte de urgencia y próxima acción, no de entidades ni
  detalles técnicos del sistema.
- La sugerencia comercial es texto ficticio de apoyo en esta tarea; no incorpora
  IA real ni ejecuta acciones.
