# Decisiones tecnicas vigentes de SPORTEX

Registro durable; las decisiones reemplazadas se marcan y el negocio queda en DELTA.

## SPORTEX-DEC-001 - Fuente canonica unica y vistas derivadas

- 2026-08-02 · `VIGENTE`. `docs/state/PROJECT_STATE.json` es la única fuente
  del contexto vivo; las vistas generadas no se editan y el workflow bloquea
  si están desactualizadas o contradicen tareas/estado.

## SPORTEX-DEC-002 - Cierre proporcional al desarrollo de software

- Fecha: 2026-08-02
- Estado: `VIGENTE`
- Decision: un checkpoint material exige tarea, estado, decision, evidencia y
  pendientes. La suite se elige entre `docs`, `local` y `pilot-release` segun
  tipo de tarea y archivos; puede escalar, nunca degradar el riesgo inferido.
- Motivo: un proyecto de software necesita probar tanto la continuidad
  documental como la ausencia de regresiones de codigo.
- Impacto: un PASS local no certifica runtime ni concede permiso de migracion,
  deploy, integracion, mensajes o uso de datos reales.

## SPORTEX-DEC-003 - La campaña comercial no se abre implicitamente

- Fecha: 2026-08-02
- Estado: `REEMPLAZADA_POR_SPORTEX_DEC_004`
- Registro: inicialmente la campaña no se abrió implícitamente; Fito la inició
  después de instalar el OS. `SPORTEX-DEC-004` gobierna el estado vigente.

## SPORTEX-DEC-004 - Primera vertical comercial local y sin efectos externos

- Fecha: 2026-08-02
- Estado: `VIGENTE`
- Decisión: `CAMP-20260803-001` comienza con conversación, atribución, Lead,
  Oportunidad, etapa y próxima acción sobre datos ficticios locales.
- Atribución: `META_EXACTO` exige `externalAdReply.sourceId`; si falta, el Core
  registra `DESCONOCIDO` sin inferir.
- Límite: sin webhooks, datos reales, mensajes, migraciones, deploy ni piloto.

## SPORTEX-DEC-005 - Persistencia CRM local de fixtures gobernada por el Core

- Fecha: 2026-08-03
- Estado: `VIGENTE`
- Decisión: 18 expedientes ficticios persisten en JSON local atómico y aislado;
  etapas, versiones, próxima acción, seguimientos y reset pertenecen al Core.
- Guard: solo `development|test + memory + SPORTEX_DEV_AUTH=true`; corrupción
  falla cerrada. `SEÑA_VALIDADA` no certifica pagos ni crea pedidos reales.

## SPORTEX-DEC-006 - Validación técnica y validación de producto son gates separados

- Fecha: 2026-08-03
- Estado: `VIGENTE`
- Decisión: el PASS técnico no implica aprobación de experiencia. La devolución
  de producto no falla el Core, la persistencia ni los contratos ya probados.
- Gate: `TASK-20260803-005` preserva funcionalidad y fixtures; no hay código de
  rediseño antes de que Fito apruebe el wireframe.

## SPORTEX-DEC-007 - CAMP-20260803-001 entrega la V1 Operativa por etapas

- Fecha: 2026-08-03
- Estado: `VIGENTE`
- Decisión: `DELTA-DEC-007/010/011` gobiernan la V1 por etapas. La conversión
  objetivo es `SEÑA_VALIDADA -> Cliente + exactamente un Pedido`, idempotente.
- Gate: preservar Core, persistencia y 18 leads; conexiones requieren otro GO.

## SPORTEX-DEC-008 - Tableros primero para Leads y Pedidos

- Fecha: 2026-08-03
- Estado: `REEMPLAZADA_POR_SPORTEX_DEC_021`
- Fuente: `DELTA-DEC-012`.
- Decisión: `Leads` y `Pedidos` abren en tableros por etapas; una tarjeta abre
  conversación y ficha. `Clientes` enlaza historias, oportunidades y pedidos.
- Gate: preservar 18 leads y agregar 6 clientes y 8 pedidos relacionados.
- Estado: PASS técnico preservado; producto no aprobado y sin autorizar código.

## SPORTEX-DEC-009 - WhatsApp es una superficie operativa separada

- Fecha: 2026-08-13
- Estado: `REEMPLAZADA_POR_SPORTEX_DEC_021`
- Decisión: SPORTEX será un tercer cliente sincronizado de WhatsApp. `WhatsApp`
  muestra chats; `Leads` y `Pedidos` conservan tableros distintos; `Clientes`
  enlaza la historia sin duplicarla.
- Primer corte: `conversación -> contexto -> próxima acción -> evidencia`, con
  control humano. El Core conserva reglas, permisos, cálculos e idempotencia.
- Límite: local y ficticio; Evolution, datos, mensajes y deploy requieren GO remoto.

## SPORTEX-DEC-010 - Integración del WhatsApp de Delta

- Fecha: 2026-08-14
- Estado: `VIGENTE`
- Decisión: reutilizar UI/Core y conectar Delta por gates; `SEÑA_VALIDADA` crea
  un Pedido único. Toda operación remota exige rollback y GO exacto.
- Evidencia: `TASK-20260814-001`.

## SPORTEX-DEC-011 - Mensajes y eventos separados; asistente solo compatible

- 2026-08-15 · `VIGENTE`. Mensajes y eventos se persisten separados; la API
  solo los reúne para lectura y la UI conserva burbujas y separadores.
- `ASSISTANT` es dato pasivo, sin ejecución. Ocultar la cronología no toca
  mensajes ni fuentes del Core.
- Imagenes manuales son assets privados tenant-aware; lectura es un cursor por
  actor/conversacion separado de receipts. Ambas capacidades quedan apagadas
  por defecto y no introducen IA.

## SPORTEX-DEC-012 - WhatsApp define el sistema visual transversal

- 2026-08-16 · `VIGENTE`. WhatsApp define jerarquía, superficies y estados de
  toda la aplicación mediante tokens claro/noche con contraste estable.
- SPORTEX y `#DCFF52` se conservan como marca y señal.

## SPORTEX-DEC-013 - Contexto compacto y selectores focales

- 2026-08-16 · `VIGENTE`. El estado vivo conserva como maximo cinco cambios;
  el historial restante vive en `docs/historico/PROJECT_HISTORY.json`.
- Biblioteca y errores se consultan con ranking OR y top acotado; una falta de
  coincidencia se explicita y no amplia silenciosamente el contexto.
- El router informa caracteres y tokens estimados. Ninguna optimizacion reduce
  gates de PILOTO_DELTA ni agrega una ronda de STAGING.

## SPORTEX-DEC-014 - Puesto operativo mínimo de Delta

- 2026-08-16 · `VIGENTE`. El próximo corte deja a Delta operar desde
  SPORTEX, no una demostración aislada: WhatsApp, Leads, Clientes y Pedidos
  forman una experiencia continua.
- Los tableros y tarjetas son proyecciones: el Core conserva las transiciones,
  permisos, versión, auditoría e idempotencia. El frontend nunca decide una
  regla ni escribe la base directamente.
- El origen de un contacto es `META_EXACTO` cuando el mensaje trae referencia
  verificable del anuncio, o `DESCONOCIDO` cuando no la trae; no se infiere.
- El flujo mínimo de pedido es `INGRESO -> BOCETO -> LISTO_PARA_PRODUCCION ->
  EN_PRODUCCION -> FINALIZADO`. Cada transición debe estar autorizada,
  persistida y auditada. El diseño conserva versiones y una sola vigente.

## SPORTEX-DEC-015 - Tableros configurables y lectura focal

- 2026-08-19 · `VIGENTE`. Leads y Pedidos usan columnas tenant-aware;
  renombrar, ordenar o borrar conserva reasignación y auditoría en Core.
- WhatsApp carga resumen y detalle por separado; sus cambios refrescan sólo el
  elemento afectado. El navegador no guarda conversaciones ni adjuntos.

## SPORTEX-DEC-016 - Leads administra; WhatsApp atiende

- 2026-08-19 · `REEMPLAZADA_POR_SPORTEX_DEC_021`. `Leads` es el tablero Kanban de oportunidades; sus
  tarjetas abren una ficha administrativa, no el chat de WhatsApp.
- La ficha muestra el contexto comercial, el próximo paso, los últimos
  mensajes y una respuesta breve. El historial y la atención completa siguen
  en `WhatsApp` y se abren solamente mediante una acción explícita.
- La respuesta breve usa el mismo comando manual y el mismo outbox del Core;
  el frontend no decide etapas, permisos ni estados de envío.

## SPORTEX-DEC-017 - Tema oscuro único

- 2026-08-19 · `VIGENTE`. SPORTEX opera únicamente en modo oscuro; no expone
  selector, preferencia persistida ni ruta de retorno al tema claro.
- La interfaz fija el tema antes de cargar la app y las superficies oscuras usan
  grafito explícito cuando no deben depender de un token de texto.

## SPORTEX-DEC-018 - Cierre gobernado de worktrees

- 2026-08-20 · `VIGENTE`. Cada worktree físico se clasifica `INTEGRADO`,
  `PRESERVAR` o `BLOQUEADO`; un checkout no clasificado bloquea el cierre.
- El retiro automático se limita a `INTEGRADO`, limpio y contenido en la rama
  objetivo. No usa `--force`, no borra refs y poda por separado metadatos
  fantasma `prunable`.

## SPORTEX-DEC-019 - Preemption y reconciliacion obligatoria de hotfixes

- 2026-08-20 · `VIGENTE`. El diagnostico de incidentes comienza read-only; la
  primera mutacion exige una unica task incidente y pausa formal de la task
  material con snapshot completo, worktree `PRESERVAR` y candidato
  `STALE_AFTER_HOTFIX`.
- Recuperar el servicio deja `RECOVERED_RECONCILIATION_PENDING`. El cierre y
  la reanudacion requieren fix en Git canonico, rama/candidato actualizados y
  revalidacion local PASS.

## SPORTEX-DEC-020 - Evolucion explicita del modelo de entornos

- 2026-08-20 · `VIGENTE`. Hoy rige `PILOT_ONLY`: `PILOTO_DELTA` es produccion
  restringida y no existe STAGING separado.
- La aceptacion de la primera version usable no despliega ni migra. Requiere
  una task futura especifica para separar y certificar los entornos.
- Solo despues de esa transicion rige local -> STAGING -> artefacto certificado
  -> GO -> PRODUCCION y el gate `ENVIRONMENT_RECONCILIATION` exige STAGING.

## SPORTEX-DEC-021 - CRM conversacional y configuracion de la empresa

- 2026-09-02 · `VIGENTE`. Navegación: `Leads`, `Clientes`, `Pedidos`, `Mi empresa`.
- Leads/Clientes reutilizan el panel WhatsApp vigente sin cambios visuales;
  solo cambian datos, filtros y comandos gobernados por el Core.
- La seña crea Cliente/Pedido idempotente; reposiciones nacen desde ese pedido
  y pasan a producción. Pedidos conserva tablero/planilla.
- Mi empresa persiste perfil, productos, precios, talles, recursos y parámetros
  por tenant. Solo autoriza implementación local, sin efectos remotos.

## SPORTEX-DEC-022 - Laboratorio de bocetos canonico en platform

19/10: Texturas imagen/PDF proporcionales, sin rellenar, con deformacion solo manual. Sin CDR ni Corel.

- 2026-10-18 · `VIGENTE`. Fito autoriza incorporar el editor DELTA a
  `platform/bocetos`; DELTA queda como respaldo de migracion.
- Solo laboratorio local, conservando el origen y almacenamiento del navegador.
  No modifica CRM, piloto ni reglas del Core. Antes de exposicion remota requiere
  autenticacion, tenant, cuotas y archivos gobernados por Core.
- Analisis de colores separado de generacion de imagen, con esquema validado;
  no afirmar fidelidad cromatica exacta ni probar con consumo pago automatico.

- 2026-10-18: IndexedDB conserva preferencias y logos. Mangas medidas respecto
  del puño; guia con escala fisica comun. Edicion de pieza con confirmar/cancelar.
- Separacion tolerante y recuperacion manual local en variante nueva. Mangas
  posteriores intercambian right/left. Formatos historicos siguen importables.
- 19/10: tras comparar proveedores y probar dos pasos autorizados, Fito descarta
  ese experimento. OpenAI queda como proveedor. Una imagen con rectangulos
  completos segun medidas del patron, sin margen extra, siluetas ni segundo pase;
  ajuste del recorte entero a cada patron. Punos generados permitidos.
- Geometria y conservacion de pixeles no equivalen a aprobacion visual.
- 19/10: montaje deforma solo costados de frente/espalda, conservando alturas.
  Ranglan es una superposicion independiente; cuerpo y generacion no cambian.
- Short usa la misma deformacion por vista, sin cerrar la entrepierna. Medias
  fuera de generacion IA; conservan colores y bocetos anteriores.
- Guia compacta: escala comun y calles de 16 px, sin aumentar el lienzo ni
  llamadas. Recorte por posiciones reales; rejilla anterior sigue importable.
- Deformacion limita cambios a cuartos exteriores, centro fijo y contorno
  subpixel suave. Ampliacion usa render 2x, compartido con exportacion.
- Hombro/bajo mantienen el registro lateral vecino con transicion suave; no
  deshacer la deformacion hasta identidad, porque abre las franjas al terminar.
- 19/10: Fito solicita panel del laboratorio: URL comun con usuario/contrasena,
  alta y renovacion manual, bloqueo al vencer aun con sesion recordada y gasto
  reportado por OpenAI separado por clave. Especificacion propuesta en
  docs/superpowers/specs/2026-10-19-panel-bocetos-design.md; sin implementacion,
  cambio de DB, aprovisionamiento real ni habilitacion comercial en este checkpoint.
- 19/10, TASK-20261019-001: Fito aprueba proceder y pide evitar desarrollo grande.
  Primera version local: modulo ESM Core, store JSON privado y servidor existente;
  identidad local de pruebas, panel compacto y editor aislado por empresa.
  Auth/DB remotos y dominios se conectan antes de publicar; no hay GO comercial.

- 19/10, correccion de Fito: una clave OpenAI compartida y otra de respaldo.
  Cada llamada registra usage ligada a empresa/actor del servidor, incluso fallos.
  Respaldo solo ante 401/429; replay y cache no duplican consumo. Tokens por
  empresa; cargo oficial global. Sustituye la propuesta de clave por empresa.

- 20/10, TASK-20261020-001: Fito autoriza deploy de bocetos y ofrece GoDaddy para
  DNS. Servicio nuevo aislado del CRM, dos dominios HTTPS, identidad propia del
  Core y SQLite privado (una replica, lock exclusivo, backup restaurable).
  Sustituye la intencion anterior de exigir proveedor Auth/DB externo para esta
  primera publicacion. La salida comercial general del CRM sigue sin habilitar.

- 20/10: bocetos b8e1fc8 publicado en dos dominios Kodebix, stack propio. HTTPS,
  admin, persistencia tras reemplazo y restauracion de backup real PASS. CRM
  d9c4f44 conservado. Respaldo API/admin key pendientes; primera alta manual.

- 20/10, TASK-20261020-002: base actual de Delta Sport para nuevas empresas,
  conservando geometria/opciones/fuentes sin logos, escudo ni fondo Delta.
  Cada espacio de imagen reemplaza su archivo, sin acumular biblioteca ni
  alterar otros bocetos. Acceso minimalista sin tarjeta, logo/subtitulo centrados.
  Preparacion local; publicacion requiere GO operativo.

- 20/10, GO de Fito: «si autorizo».69739bb publica el codigo aprobado6b6f5f2;
  diferencias solo documentales. Login/base/assets exactos, backup restaurado
  y cuenta Delta preservada; ninguna llamada IA ni cambio de CRM.

- 20/10, TASK-20261020-003: Fito pide eliminar empresas y todos sus datos activos
  desde el panel. Confirma conservar respaldos anteriores. Comando exclusivo
  admin con usuario escrito y version; operaciones en curso bloquean la purga.
  SQLite confirma datos y archivos juntos. Sesiones revocadas; otras empresas,
  cargos globales y bocetos locales se conservan. Sin borrados reales de QA.
- Fito responde «go» para publicar el codigo01e6797 con backup y rollback a
  69739bb. El release puede sumar solo documentacion operativa; no incluye
  eliminaciones reales ni pruebas IA.
- 14de41c publicado y observado healthy1/1, HTTPS/assets exactos, cuenta y respaldo
  conservados. Aviso de eliminacion abierto/cancelado, ninguna empresa borrada.
- TASK-20261020-004: Fito confirma nombre arriba del numero y vivos apagados
  en la base inicial. Quitar el texto adicional; conservar bocetos existentes.
- Fito ajusta nombre un poco mas arriba, ambos centrados en camiseta y numero
  frontal desactivado. Eje de mascara797, nombre18px arriba; tamanos conservados.
- Fito responde «go» para publicar9a21e31 con respaldo, rollback14de41c y
  conservacion de cuentas/documentos; sin IA ni borrados de QA.
- a65249d publicado: codigo9a21e31 exacto, base alineada/vivos off, respaldo
  restaurado y runtime healthy. No habia empresas al corte; no se crean para QA.
- TASK-20261020-005: corregir rechazo de Logo2 en contexto de copia de referencia.
  referenceData sigue siendo imagen origen; mock solo contexto. Prueba HTTP con
  paquete UI real y proveedor simulado; sin API paga ni publicacion automatica.
- Fito confirma «Go» luego de verificar sponsors/textos para publicara2e2deb,
  con backup y rollback a65249d; sin llamadas IA ni mutaciones de cuentas de QA.
- a95850f publicado healthy1/1: Logo2/sponsors aceptados en contenedor real,
 2 empresas preservadas, backup restaurado y HTTPS PASS; sin llamadas IA.
- TASK-20261020-006: Fito aprueba comenzar panel Mockups con modelo actual.
  Catalogo de plataforma exclusivo admin; borrador, prueba y revision publicada.
  Lienzo compartido sin IA, archivos privados fuera del template y snapshot en
  bocetos. Otros PSD requieren preparar kits; no hay deploy autorizado.
- Fito confirma que FUTBOL MAIN es Futbol basico y autoriza una prueba propia
  2D con frente/espalda y tres cuellos, mediante imagegen integrado. Base comun
  continua, cuello/abertura/luces independientes; colores y franjas locales.
  Se valida por separado antes de integrarla; no sustituye el modelo publicado.
- Fito prioriza solo cuellos sobre Futbol basico; los mocks de clientes se
  prepararan sobre sus bases. Anclajes locales por tipo/vista con JSON. El cuerpo
  propio queda exploratorio; sin integracion ni deploy automaticos.
- Fito da por ajustados los tres cuellos frontales y deja el cuello original
  fijo en espalda. No capturados aun sus valores locales: falta exportar JSON.
- Fito entrega el JSON: sus tres frentes pasan a ser defaults del visor local.
  Geometria trasera ignorada; mantiene cuello original. Nueva captura de polo
  bicolor es solo referencia; no se ha pedido preparar otra variante.
- Fito aclara que el desajuste es de luces/tejido. Mantener anclajes aprobados;
  V/polo toman apariencia de la banda original del PSD, con pliegues suavizados.
- Fito pausa cuellos y da GO para desplegar el configurador del panel en el
  servicio de bocetos. Codigo de33a54; release solo suma documentos. Snapshot
  SQLite y rollback a95850f; conservar empresas/bocetos. Sin prototipos en paquete.
- f4386fb publicado23:19:57 UTC: configurador healthy1/1,27 pruebas en imagen,
  catálogo/editor admin y HTTPS exactos PASS.2 empresas y backup preservados.
  Cuellos excluidos; no hubo IA paga ni escrituras de negocio de QA.
- TASK-20261020-007: Fito autoriza corregir/publicar el guardado del configurador
  desplegado, sin interfaz local. Guardar aspecto grafico numerico para conservar
  medidas con muestras, sin bytes privados; fuentes de revisiones explicitas
  prevalecen sobre defaults de empresa. Compatibilidad con bases anteriores y
  documentos existentes; respaldo y rollback f4386fb antes de activar.
