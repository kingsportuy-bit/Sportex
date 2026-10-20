# Panel Mockups: checkpoint local

Task TASK-20261020-006.20/10/2026. DESARROLLO_LOCAL.
Rama codex/desplegar-bocetos-20261020, workspace canonico SPORTEX/platform.

## Alcance

Catalogo global admin, borrador/version/publicacion, clon del primer molde
preparado, lienzo setup y prueba sin IA. Nuevos bocetos reciben modelo versionado;
documentos existentes conservan snapshot, geometria, opciones y archivos.
Kit football-basic-v1 usa los assets actuales; otros PSD necesitan preparar kit.

## Implementacion

Core mockups.mjs valida datos y version esperada; servicio integra catalogo en
store transaccional existente, sin migracion SQL. Rutas separan cookie admin,
origen y dominio de panel; empresas leen publicaciones, nunca borradores.
Parametro global no contiene archivos de clientes. Default incluye fuentes,
posiciones/escalas/visibilidad, colores, vivos/curvas y opciones disponibles.

Panel Empresas/Mockups, crear configuracion, Configurar/Probar y confirmacion
propia de Publicar. Setup reutiliza lienzo, logos de muestra y controles de
elementos/vivos. Guarda explicitamente borrador; preview no persiste. Evita IA
y workspace normal. Sin muestras ni fondos privados en defaults. Fondo blanco
o transparente permitido; fotos/logos siguen a cargo de cada empresa.

## Pruebas

mockup-catalog:5 pruebas PASS sobre borrador aislado, versiones concurrentes,
rol de empresa denegado, datos invalidos, limpieza de archivos, reinicio JSON,
backup/restauracion SQLite, fuentes/archivos de empresa. lab-runtime verifica
editor y API admin solo en dominio panel. sketch-base ejecuta Nuevo boceto
con publicacion y archivos locales, conserva otro documento y datos de Logo2.
Suite completa:205 tests PASS,0 fallos. Log privado:
C:/Users/Fito/.codex/artifacts/sportex-bocetos-20261020-006-tests.log.
Checkpoint workflow:close local SPORTEX_CLOSE=PASS:31 workflow,59 Core,
SQL/RLS y build PASS. Log privado con sufijo006-close.log. Tarea permanece
activa para QA visual pendiente; no equivale a release ni cierre de producto.

## QA interna realizada y pendiente

Servidor local4320 con empresa/admin ficticios; proveedor deshabilitado.
Navegador interno: ingreso admin, seccion Mockups, fila Futbol basico, apertura
de editor, placeholders visibles. Desmarcar Medias disponible y Guardar:
estado Borrador guardado; recarga conserva Medias desmarcado. Se corrigio el
ancho de acciones de barra; captura posterior muestra acciones compactas.
Sin errores de consola en esa comprobacion.

El control del navegador se deshabilito durante la sesion. Fito confirmo listo,
pero la herramienta siguio devolviendo Local browser use is disabled in Work
settings. No se evade esa restriccion con otro navegador. Pendiente QA visual
de mover elemento, probar borrador, publicar/consumir y responsive. Esas rutas
estan cubiertas por pruebas HTTP/Core; no sustituye el recorrido visual.

Servidor fixture privado:
C:/Users/Fito/.codex/artifacts/sportex-bocetos-20261020-006/qa-server.mjs.
No usa el volumen remoto ni la caché de empresas. Puerto4320 es solo loopback.

## Limites y rollback

Sin deploy, IA paga ni datos reales. Runtime remoto sigue a95850f. Revertir
commits revierte la feature; catalogo aditivo queda guardado para recuperacion.
No se declara importacion de PSD arbitrarios ni otro cuello listo.

## Extension autorizada: prototipo propio de camiseta

Fito confirma que FUTBOL MAIN corresponde a Futbol basico y aprueba preparar
una prueba propia de camiseta, frente/espalda y tres cuellos. Sin deploy ni
uso de la API del editor. Cuatro generaciones con imagegen integrado: cuerpo
continuo neutro, redondo, V y polo. Prompts exactos y referencias documentados
en `bocetos/prototypes/football-own-v1/prompts.json`, tambien embebidos en PNG.

Visor independiente en loopback4321: color de cuerpo, mangas, franjas y cuello,
presets, diagnostico de piezas, comparacion y descarga. El renderer comparte
cuerpo/coordenadas entre variantes. Mascara desde alfa real, reparto inicial
de mangas por costura, iluminacion derivada de gris, interior y abertura propios.
Mapas y geometria exportados en layers/ y manifest.json del prototipo.

`verify.mjs` con Canvas nativo:8 comprobaciones PASS. Frente y espalda mantienen
cuerpo y franjas identicos por pixel fuera del cuello; escala de collar uniforme,
aberturas separadas y blanco/negro conservan luces. Preparacion461ms, pares17-49ms
en esta computadora; no es un benchmark de navegador. `verification.json` conserva
resultados y hashes de fuentes. Cuatro tests nuevos de material pasan; suite del
laboratorio completa:209 tests PASS,0 fallos (sportex-own-prototype-tests.log).

Se inspeccionaron renders reales del modulo del visor en blanco y franjas;
se corrigieron restos de alfa blanco y el recorte superior continuo. El navegador
interno sigue deshabilitado. No se controla mediante otra automatizacion ni se
afirma QA responsive/de interaccion. La revision visual de esta prueba fue local
sin revisor independiente. Sistema visual heredado conservado.

Estado: PROTOTIPO_LOCAL_NO_INTEGRADO. Costuras de mangas y encaje de cuellos
necesitan aprobacion; luz derivada no equivale a pases fisicos3D. Retirar la
carpeta y detener su servidor revierte esta prueba. Fútbol basico se conserva.

## Cambio de prioridad: cuellos sobre el mockup actual

Fito pidió anclajes editables y corte de fútbol. Se creó un cuerpo exploratorio
adicional con imagegen integrado (quinta llamada, prompt y PNG documentados).
Luego priorizó conservar Fútbol básico y preparar solo cuellos; el visor4321
ahora muestra ese kit. No se avanza el cuerpo propio ni se integra al catálogo.

`basic-renderer.js` lee las máscaras y luces originales del PSD: cuerpo,
mangas, puños, collar e interior. Redondo usa el collar original en sus mismas
coordenadas; V y polo son materiales separados. Solo la banda/interior originales
se completan con tejido muestreado debajo del cuello, antes del montaje de la
nueva banda. Encaje provisional y preview a resolución del kit del editor;
falta aprobación y preparación final en alta resolución.

Panel de anclajes: seis registros independientes, centro X/Y y ancho/alto,
tiradores, proporción, zoom, teclado, deshacer y restablecer. localStorage
versionado por modelo; JSON se valida antes de aplicar. Cancelar puntero o
Escape revierte. PNG de salida no lleva tiradores ni acercamiento del editor.
Los anclajes de cuerpo propio no se aceptan para Fútbol básico.

Suite completa:221 tests PASS. Diez tests de geometría/controlador verifican
proporción incluso en límites, guardado/recarga, undo y cancelación sin persistir.
Dos tests focales verifican identidad del kit y blending. Log privado:
C:/Users/Fito/.codex/artifacts/sportex-collar-anchors-tests.log.
`verify-basic.mjs`:6 checks de render PASS; round registrado en máscara original,
cuerpo inferior idéntico por píxel entre cuellos y cambio de anclaje aislado por
vista. Preparación1284ms; primeros pares172/35/25ms en Canvas nativo, no benchmark
de navegador. Resultado en basic-verification.json, renders basic-*.png/jpg.
El render anterior propio conserva10 checks PASS como antecedente.

HTTP loopback4321 PASS para HTML, módulos y capas requeridas; archivos ajenos y
traversal404, CSP sin conexiones. Inspección de renders reales muestra V/polo
sobre la base actual. El control del navegador interno continúa deshabilitado;
QA de interacción/responsive sigue pendiente. Sin deploy ni llamadas API pagas.
Para cada cliente se preparará su propio kit y anclajes; todavía no es un
importador automático. Detener el visor/revertir este checkpoint es el rollback.

Checkpoint de este ajuste: `workflow:close -- TASK-20261020-006 --profile=auto`
devuelve SPORTEX_CLOSE=PASS, perfil local; validación documental, Core, SQL/RLS
y build PASS. Log privado sportex-collar-anchors-close.log. Tarea permanece activa
para afinar encaje y QA de navegador; no es una publicación ni cierre de producto.

## Espalda original fija

Fito informa que terminó los tres ajustes de frente y que no necesita cambiar
el cuello trasero. El visor usa el round original de espalda en las tres opciones
y omite cualquier geometría trasera del perfil, incluidos valores antiguos.
Conserva el color editable del cuello. También conserva la iluminación PSD de
esa zona, sin reemplazar tejido trasero. No dibuja guías ni permite seleccionar
el anclaje de espalda; la clave local del perfil se mantiene para preservar frentes.

12 pruebas focales de controlador/geometría/material PASS. Native Canvas:6 checks
PASS, incluyendo igualdad completa por píxel de espalda entre variantes y tras
cambiar anclajes V/round traseros. No se afirma haber capturado los ajustes de Fito:
el control interno sigue deshabilitado, y no hay JSON exportado en Downloads.
Se pidió exportar y adjuntar el JSON. Solo entonces se fijarán sus valores como
defaults; todavía se usan los valores de referencia al abrir sin caché.
Checkpoint de esta corrección: SPORTEX_CLOSE=PASS, perfil local. Log privado
sportex-fixed-back-collar-close.log; sin deploy ni cambios de caché de Fito.

## JSON aprobado recibido y aplicado

Fito adjunta sportex-anclajes-camiseta.json. Validación de modelo/revisión y
seis registros PASS antes de aplicar. Archivo archivado como approved-anchors.json
con SHA256 4fed900f232c478ccfb9b7fa793ab65d76f44b402dd054bfaa5c83337b5c205f.
basic-front-defaults.js conserva exactamente sus tres registros frontales, sin
redondear. El renderer los usa al abrir sin caché y al restablecer cada cuello.
El perfil local posterior mantiene prioridad y la identidad de caché no cambia.
La geometría trasera entregada no se aplica: se conserva el cuello original fijo.

verify-basic:6 checks PASS, incluida comparación independiente contra el archivo
aprobado y hash de origen; cuerpo y espalda siguen constantes. Cinco pruebas
focales de material/controlador PASS. HTTP del nuevo módulo PASS tras reiniciar4321.
Sin nuevas generaciones, despliegue ni cambios de datos reales.
La captura adicional muestra otro mock con polo/banda V bicolor; solo referencia.
No se infieren capas editables ni se agrega una variante sin el archivo original.
Checkpoint: SPORTEX_CLOSE=PASS, perfil local. Log privado
sportex-approved-collar-defaults-close.log. Sigue pendiente integración al kit
del laboratorio; no se publica automáticamente esta geometría.

## Luces y textura de V/polo

Fito aclara que el problema visual no es la unión: son luces y tejido.
Causa confirmada en renderer: round.paint aplica Linear Burn/Screen del PSD;
V/polo usaban materialPixel del gris generado, con brillo añadido y otra trama.

collar-material.js toma Burn/Screen de la cara exterior del cuello original y
los aplica a las formas V/polo, saltando las aberturas de la banda. La trama
generada se separa con filtrado normalizado por alfa; se conserva solo un
relieve suave acotado de pliegues. No cambia alfa, tamaño, posición, interior,
round original ni espalda. Es transferencia 2D de apariencia, no render físico.
Los originales PNG tampoco se editan. La paleta de iluminación se calcula por
píxel del material original y se reutiliza para evitar trabajo en cada píxel
generado; los cachés existentes siguen acotados.

Tres tests focales PASS: trama de alta frecuencia no introduce brillo artificial,
alfa/bordes suaves/aberturas se conservan y trabajo de luz acotado a la fuente.
verify-basic conserva6 checks PASS, incluyendo JSON aprobado exacto y espalda
inmutable. Preparación1264ms; pares183/29/19ms con Canvas nativo en este equipo.
Inspección de renders reales: primera transferencia mezclaba banda interior y
exterior; se corrigió el muestreo a la cara exterior. Sin revisión visual del
navegador ni nuevas generaciones. Pendiente revisión de apariencia por Fito.
Suite completa224 tests PASS,0 fallos, log privado sportex-collar-material-tests.log.
HTTP del módulo de material PASS en4321. Sin cambios de perfiles del navegador.
Checkpoint SPORTEX_CLOSE=PASS, perfil local. Log privado
sportex-collar-material-close.log. Revertir este checkpoint restaura la apariencia
anterior sin modificar el JSON de anclajes. Sin deploy.

## GO para publicar el configurador

Fito pide descartar por ahora la prueba de cuellos y da GO producción para subir
el configurador de bocetos. Alcance: catálogo/panel Mockups, editor de defaults,
guardar/probar/publicar configuración inicial; código ejecutable de33a54. Los
commits posteriores de prototipos no cambian el código publicado del laboratorio.
Se excluyen prototipos del bundle y la imagen; no se integran cuellos.

Servicio independiente sportex_bocetos_app, dominios Kodebix existentes, con los
controles de operación real PILOTO_DELTA usados en los releases anteriores.
No se habilita ni promueve el CRM comercial. Release podrá sumar documentación,
manteniendo el mismo código ejecutable. Snapshot SQLite consistente antes de
activar, verificación de restauración y rollback a95850f en el mismo volumen.
No se crean cuentas ni se llama a proveedores de pago como pruebas.

Preflight23:12 UTC: a95850f observado healthy1/1,38GB libres y6.8GB RAM disponibles.
Se reutiliza el procedimiento de release anterior: stop-first, backup con el
servicio detenido, gate sin operaciones processing y comparación de estado.
El GO de Fito autoriza esta publicación; no se pide una confirmación repetida.
Preflight HTTPS: ambos /ready identifican a95850f y los hashes publicados de
app/panel/initial-parameters/garment-trims/element-layout coinciden con Git del
release saliente. Código ejecutable actual idéntico a de33a54; Docker ya copia
solo módulos raíz, Core, public y moldes. CRM observado d9c4f44, sin cambios.
Suite224 tests PASS,0 fallos; log privado sportex-mockup-configurator-release-tests.log.
