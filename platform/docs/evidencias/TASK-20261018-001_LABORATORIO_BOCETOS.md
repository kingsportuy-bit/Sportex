# Evidencia TASK-20261018-001

Entorno: DESARROLLO_LOCAL. Estado inicial: implementacion en curso.
No se ejecutaron llamadas pagas, deploys ni operaciones sobre datos reales.

Origen de migracion: editor bocetos-delta. Destino canonico: platform/bocetos.
Validaciones y limitaciones se registraran al completar la implementacion.

## 2026-10-18 - Interaccion, mangas y preferencias

Sintaxis PASS y 47 pruebas Node PASS, mas herramientas del editor. Casos nuevos:
seleccion de pieza bloqueada hasta tick/cruz, reciclado de numeros de pestaña,
serializacion e hidratacion de logos, fuentes y dimensiones independientes,
controles fuera del marco rotado, agrupacion de eventos en un cuadro, mascaras
PSD reales medidas respecto del puño, escala fisica comun y recortes separados.

Render de luces limitado a la region editada, con igualdad pixel a pixel frente
al render completo. Muestra sintetica: 2.073.600 a 37.800 pixeles procesados.
Se reutilizan superficies de dibujo y cache de piezas recortadas. Esto demuestra
menos trabajo de CPU; no es una medicion de FPS del navegador.

La automatizacion del navegador esta deshabilitada en Work settings. Queda
pendiente QA visual y tactil de estos cambios. No se hicieron llamadas pagas.
Para versiones existentes, Reajustar al molde crea una variante con registro de
mangas actualizado y conserva la anterior. No se modifican bocetos del browser
desde las pruebas. Rollback de esta iteracion: copia privada app-before-interaction.js
y versiones anteriores de cada diseño; conservar IndexedDB.

## 2026-10-18 - Separacion tolerante y recuperacion local

El detector anterior rechazaba rectangulos completos que excedian 1,75 veces
el ancho o 1,5 veces el alto solicitado. La guia de escala fisica hizo pequenas
las mangas y aumento la posibilidad de este rechazo. Se mantienen fondo
exterior, componente rectangular, posicion de celda, unicidad y rechazo de
fragmentos; se elimina la dependencia del limite superior respecto de la guia.
Las mangas con dimension no verificada conservan todos los pixeles y no reciben
un margen supuesto por zoom. Quedan marcadas para revision del estampado.

Archivo privado existente boceto10-atlas.png (no se afirma que sea la ultima
respuesta del usuario), comparado con guia compacta de manga 76x140:
frente 408x504, espalda 402x504, derecha 376x447, izquierda 347x446.
Los cuatro se recuperan completos; ambas mangas requieren revision de margen.
No se ejecutaron generaciones nuevas ni analisis pagos.

Corregir separacion permite marcar rectangulos con el mouse o coordenadas,
reutiliza detecciones validas y rechaza solapamientos y regiones fuera de imagen.
Aplicar crea otra variante, conserva el archivo y la anterior, retiene piezas
heredadas no regeneradas y evita reemplazos parciales ante errores. La correccion
y su geometria sobreviven al guardado del navegador; no llama a APIs ni consume
creditos. Los campos temporales del modal no alteran preferencias del documento.

Check PASS y 52 pruebas Node PASS, mas herramientas del editor. Pruebas nuevas:
mangas completas mayores que la guia, deteccion parcial, validacion manual,
recuperacion atomica, persistencia de rectangulos, arrastre/cancelacion/campos
numericos/aplicacion del controlador. La prueba del controlador usa DOM simulado;
no sustituye QA visual en navegador, que sigue pendiente por automatizacion
deshabilitada. No se promete fidelidad de motivos ni sangrado de IA sin verificar
el resultado real. Una llamada por pieza queda como alternativa futura con costo
adicional y requiere decision del usuario. Se mantiene una llamada por generacion.

Rollback: volver a la variante original; para retirar esta capacidad, revertir
atlas-recovery y sus enlaces en app, HTML, CSS y servidor. Conservar IndexedDB.

## 2026-10-18 - Continuacion exterior al contorno real

La guia nueva usa pattern-silhouette-v1: azul = mascara imprimible real del PSD;
durazno = zonas ocultas de hombros, cuello, costados y margen extra del 10% por
borde. El bounding box interior ya no se presenta como toda la superficie visible.
El proveedor recibe una regla explicita: reconstruir la composicion visible dentro
del azul y crear continuacion nueva en durazno, sin repartir el diseño visible en
todo el rectangulo. Incluye el ejemplo de panel blanco con bordes curvos visibles.
Salida requerida: rectangulos completos sin silueta ni colores de guia, cuello,
puños o elementos. Se conserva una sola llamada. No cambia archivos ya generados.

Raster de guia usa las mismas mascaras, coordenadas y marco de puño que el render.
Inspeccionada la imagen local private/guia-visible-continuacion.png: cuerpos curvos
y mangas separadas, con continuacion alrededor. No es una respuesta del proveedor.
Check PASS y 55 tests PASS; nuevos casos contrastan pixeles de guia con PSD y
render, prueban costados ocultos dentro del bounding box y mangas desrotadas.
La ruta valida la version de guia y las pruebas simulan una sola llamada de imagen.
No se hicieron llamadas pagas. Fidelidad de IA con esta guia: PENDIENTE_EVIDENCIA;
no afirmar que el modelo respeta un margen por pasar pruebas geometricas.
Rollback: quitar la propiedad guide de generationLayout para volver a la guia
rectangular anterior; mantener variantes y preferencias guardadas.

## 2026-10-18 - Generacion unica con extension como tarea principal

El usuario aporta otra salida donde los bordes impresos laterales siguen cerca
del limite exterior y desaparecen al encajar. La guia por si sola no resolvio
la fidelidad. Fito rechaza dos llamadas; queda explicitamente una sola.

Para la guia nueva, extended-artwork-prompt.mjs reemplaza la instruccion larga
de extraccion por una tarea prioritaria de reconstruccion + outpainting en una
salida. Describe la referencia como un recorte de un diseño mayor. Da dimensiones
del diseño visible, rectangulo completo y cantidad de pixeles NUEVOS por cada
lado; exige conservar los bordes visibles dentro del azul y continuar afuera.
No agrega generacion intermedia ni cambia modelo, calidad, cuotas o encaje.
La ruta legacy permanece compatible con guias anteriores.

Check y 55 tests PASS. Proveedor simulado verifica una llamada, instrucciones de
10% por lado y 120% total, coordenadas y exclusiones. Esto valida la solicitud,
NO su cumplimiento por IA. Nueva salida real pendiente; no afirmar resuelto el
problema de fidelidad sin evidencia. No se ejecutaron llamadas pagas.
Referencia consultada: https://developers.openai.com/api/docs/guides/image-generation
La documentacion indica que la mascara es orientativa, no una garantia de limites
exactos. No se propone nuevamente el flujo de dos llamadas rechazado.
Rollback: usar basePrompt en la ruta de guia nueva y retirar el helper; conservar
originales, bocetos y preferencias del navegador.

## 2026-10-18 - Salida con silueta de mascara y margen de contorno

Fito pide generar la forma de la mascara. mask-bleed-v1 solicita siluetas separadas
con el diseño visible dentro del contorno PSD y continuacion nueva en una banda
de dilatacion eliptica: radios del 10% de ancho/alto del patron. El diseño azul
no cambia de coordenadas. Fuera de esa union queda el separador protegido por
mascara opaca; dentro, mascara editable transparente. Se mantiene una llamada.
El prompt ya no concatena las instrucciones de salida rectangular anteriores.

La importacion valida cobertura de mascara en coordenadas registradas, acepta
siluetas curvas y piezas desconectadas (medias), quita fondo exterior conectado
y conserva detalles verdes encerrados. No amplifica una silueta incompleta para
rellenar. Un margen insuficiente queda marcado para revision sin zoom adicional.
Salida desplazada/incompleta conserva el original y ofrece recuperacion manual.
Los rectangulos legacy siguen con su detector; no se alteran bocetos guardados.

Check y 60 tests PASS, mas regresiones editor-tools. Cinco casos nuevos cubren
mascaras PSD reales, margen, coordenadas, fondo transparente, respuesta rectangular
incorrecta, huecos, mascara de edicion enviada y proveedor simulado de una llamada.
Vista programatica inspeccionada: private/guia-siluetas-margen.png. Es la guia,
no una respuesta de IA. Servidor local reiniciado en 127.0.0.1:4318.
No se realizaron llamadas pagas. Fidelidad generativa y QA visual de navegador
siguen PENDIENTE_EVIDENCIA; tests no garantizan cumplimiento por el modelo.
Rollback: retirar outputShape de generationLayout para volver al flujo anterior;
mantener soporte de importacion de variantes con silueta, originales e IndexedDB.

## 2026-10-18 - Registro por contorno y mangas posteriores

Se realizaron seis generaciones autorizadas con la referencia amarilla/verde:
cinco experimentos locales y una prueba completa en navegador interno. Las guias
usan contorno interior de registro y limite exterior del margen. El importador
registra el contorno observado a la mascara, retira tinta y conserva originales.
La primera importacion del navegador fallo en right por tinta suavizada; se
corrigio el reconocimiento cromatico sin aceptar contornos abiertos. La misma
salida pudo reajustarse sin otra generacion (contador 99 sin cambios).

Fito identifico que las mangas posteriores estaban intercambiadas. Se corrige
la seleccion de textura: vista posterior right toma left y left toma right,
tanto al dibujar como al ajustar. Las transformaciones siguen independientes.
Verificado visualmente en navegador interno con la misma variante guardada.

Sintaxis y 63 tests PASS, mas editor-tools con regresion de ambas asignaciones.
No se declara fidelidad generativa resuelta: esta salida aun advierte margen
no verificado y difiere de la referencia en distribucion de colores de mangas.
No se hicieron cambios de piloto, datos operativos ni despliegues. Los resultados
experimentales quedan en private/ ignorado. Rollback: quitar cutline/outerline
del layout de nuevas generaciones; conservar importacion y originales guardados.

## 2026-10-19 - Comparacion real de APIs con cuatro rectangulos

Fito pide probar ambas APIs con cuatro rectangulos en una sola imagen sobre
verde fluor. Alcance: dos llamadas pagas autorizadas desde DESARROLLO_LOCAL,
una por proveedor; sin reintentos ni cambio de proveedor/configuracion de la app.
Worktree SPORTEX, rama sportex-governance-20260801, TASK-20261018-001.

Procedimiento: private/compare-rectangles.mjs prepare, openai y gemini con
--env-file=.env.local. Misma referencia amarilla/verde, guia rectangular y prompt,
verificados por hashes iguales en ambos reportes. Salida solicitada/obtenida
1024x1024. GPT usa calidad medium y mascara que protege separadores;
Gemini usa 1K y thinking minimal, sin parametro equivalente de mascara binaria.
La guia indica ventana azul rectangular y 10% adicional por lado en durazno.
No incluye siluetas curvas. Cada proveedor recibe ambas imagenes.

| Proveedor/modelo | Entrada | Salida | Tiempo | USD estimados |
| --- | ---: | ---: | ---: | ---: |
| OpenAI gpt-image-2.5-sunburst | 2490 | 439 | 20.861 s | 0.031764 |
| Google gemini-nano-banana-2.1 | 2710 | 1824 | 11.611 s | 0.042945 |

OpenAI: 2048 tokens imagen de entrada a USD 8/M, 442 texto a USD 5/M,
439 salida a USD 30/M. Gemini: entrada a USD 1.50/M, 1120 tokens imagen
de salida a USD 30/M y 704 tokens restantes a USD 7.50/M. Ambos HTTP 200.
Son estimaciones por uso devuelto y tarifas Standard, no facturas; sin impuestos
ni cambio de moneda. Tokens de distintos proveedores no son equivalentes.
Fuentes consultadas 19/10: https://developers.openai.com/api/docs/guides/image-generation
y https://ai.google.dev/gemini-api/docs/pricing.

Resultado visual: ambos devuelven cuatro rectangulos completos. GPT conserva
mejor la trama observada en esta prueba; Gemini simplifica/reinterpreta motivos
y hombros. Ambos agregan franjas de puno pese a su exclusion; Gemini las ubica
a media manga. GPT tambien desplaza algunos limites respecto de la guia.
No se certifican margen ni encaje en mascara; esta prueba compara costo y salida,
no demuestra que las piezas reproduzcan la referencia al aplicarse al patron.
Gemini cuesta 35.2% mas que GPT en esta muestra; no es benchmark estadistico.

Reportes con usage completo: bocetos/private/compare-rect-openai-report.json y
compare-rect-gemini-report.json. Imagenes: compare-rect-openai-result.png y
compare-rect-gemini-result.png; guia, prompt y referencia de prueba en el mismo
directorio privado ignorado. Secretos no impresos, copiados a evidencia ni Git.
Se guarda bloqueo de repeticion en el script si ya existe el reporte.
Rollback: no hay cambios de runtime que revertir; originales/bocetos conservados.
Verificacion documental: workflow:sync y workflow:close --profile=auto.

## 2026-10-19 - Experimentos descartados y regreso a rectangulos

Fito mantiene OpenAI y permite punos generados. Dos pruebas de una llamada con
mascara mas explicita y referencia precolocada completaron los rectangulos pero
dejaron los laterales fuera de la zona visible: USD 0.029175 y 0.027395 estimados.
Un intento 512x512 fue rechazado HTTP 400 sin imagen ni usage: el proveedor exige
al menos 655360 pixeles. Se corrige densidad de salida conservando guia logica;
casos de una/dos piezas aumentan resolucion, no proporcion del patron.

Fito autorizo despues probar dos pasos. Primera llamada: 2488 tokens entrada,
439 salida, 18.636s, USD 0.031754. Segunda: 1385 entrada, 439 salida, 21.076s,
USD 0.023167. Total cuatro piezas: USD 0.054921 estimados, mismas tarifas Standard
citadas arriba. Reportes y originales privados: two-pass-*-report.json/result.png.
Dos consultas pequenas de coordenadas tampoco resolvieron el encaje y no se
incorporaron al producto. Los experimentos quedan en private/ ignorado.

Conservar 171114 pixeles visibles sin cambiar bytes demostro solamente el
composito. La salida final mostraba saltos de trama, cortes, cuello residual y
transiciones malas; NO queda aprobada visualmente. El replay con el molde raglan
actual tampoco pudo reutilizar las mangas del atlas anterior por diferencias de
medidas. No declarar eso como generacion integral validada.

Fito solicita finalmente descartar el experimento y volver a una llamada con
cuatro rectangulos completos medidos desde el patron y ajuste automatico.
Implementacion vigente: pattern-rectangles-v1, bleed=0, sin guia de siluetas,
sin segundo pase ni boton de reintento del margen. Frente/espalda/mangas usan
escala fisica comun; las mangas conservan su marco respecto del puno. Cada
recorte completo se adapta a las dos dimensiones del patron con contentWindow
0,0,1,1: sin recortar otro 10% ni aplicar zoom de margen. Se conserva densidad
nativa de salida. Mangas marcadas por defecto en bocetos nuevos. Formatos y
variantes existentes permanecen importables; no se elimina IndexedDB.

Pruebas focales: proporciones y escala comun, ajuste completo sin overscan,
una llamada OpenAI para las cuatro piezas, punos permitidos, rechazo del segundo
pase para el formato nuevo y destino correcto si se cambia de pestaña. Regresiones
historicas siguen activas. Replay aislado 127.0.0.1:4321 usa la respuesta rectangular
ya guardada compare-rect-openai-result.png; bloquea red externa y no consume API.
Servidor real conserva el origen 127.0.0.1:4318 y OpenAI. No hay nuevas generaciones
pagas desde que Fito pidio el regreso. No se afirma fidelidad de una nueva imagen
generativa sin observarla. Sin piloto, CRM, DB ni despliegues.

Rollback: quitar fittedRectangleVersion de nuevas guias para recuperar el formato
anterior; conservar importadores y originales. Los experimentos de dos pasos no
se usan por el boton Generar. Validacion final y cierre registrados en el checkpoint.

## 2026-10-19 - Deformar el rectangulo durante el montaje

Fito aclara que solicita deformacion, no escalado en ancho/alto. Se implementa
torso-warp.js: coordenadas inversas por fila y columna de la mascara real.
Los extremos horizontales de la textura siguen los laterales en cada altura;
los extremos verticales siguen hombros/cuello y bajo por columna. Se usa el
rectangulo completo, sin cortar ventanas de margen historicas. Esto modifica
la geometria de los motivos al montarlos, por pedido de la prueba.

Solo frente/espalda; mangas conservan su logica anterior. Logos, escudos,
nombres y numeros siguen independientes. El original generado no se reescribe
ni se modifica el prompt o la cantidad de llamadas. Movimiento, giro y escalas
manuales se aplican antes de la deformacion. Mapa por mascara y pixeles fuente
en cache; el resultado usa el cache existente del montaje. Preview, montaje
plano y render/export comparten la deformacion; esta QA no sustituye revision
humana del PNG exportado.

Sintaxis y 69 tests PASS. Casos nuevos: cintura sintetica conserva ambos bordes,
cuello/bajo se adaptan, no hay fugas ni cambios en la fuente, transformaciones
manuales y mas de 5000 comprobaciones de bordes sobre mascaras PSD reales de
frente/espalda comunes y raglan. API rectangular conserva sus pruebas anteriores.
Navegador interno: replay de imagen guardada sin gasto nuevo; frente y espalda
con panel lateral visible siguiendo cintura. Captura privada
bocetos/private/torso-warp-browser-check.jpg. Boceto actual restaurado tras
recarga en 127.0.0.1:4318, manteniendo variante y escudo del usuario.

Rollback: volver al dibujo rectangular en drawPowerClips/applyShirtPieces;
no se transforman ni eliminan archivos originales, clips o preferencias.

## 2026-10-19 - Solo costados y ranglan independiente

Fito limita la deformacion a los costados y pide separar ranglan del cuerpo.
torsoEnvelope conserva v=y/(alto-1) en todas las columnas: no curva las franjas
horizontales por el cuello o bajo. u sigue los laterales por fila. Rotacion y
movimiento manuales siguen aplicandose al rectangulo antes de esta deformacion.

Causa del acoplamiento: powerClipMask y resolvedMask elegian BodyRaglan;
drawPhotoshopGarment cambiaba el montaje plano del cuerpo al alternar la opcion.
Ahora frente/espalda usan Body fijo, tambien al generar y montar la variante
plana. Las mangas normales/ranglan se superponen despues del cuerpo; se pintan
siempre al final, sin depender del orden de claves de clips guardados. Las luces
ranglan se limitan a su mascara de mangas; fuera de ella se mantienen las luces
normales. El cuello y puños se componen como capas independientes.

Las 72 pruebas del editor y sintaxis PASS. Las nuevas regresiones verifican
mascara/encuadre identicos con ambos toggles, orden de superposicion y luces
invariables fuera de mangas. Las pruebas con mascaras PSD reales verifican que
las coordenadas verticales no se deforman (tolerancia de 1 nivel RGB por muestreo).

El navegador interno informo control desactivado en ajustes Work. No se busco
eludirlo. Se ejecuto una prueba de render offline con @napi-rs/canvas ya incluido
en el runtime, las funciones reales de app.js, mascaras PSD y textura rectangular
guardada; sin navegador ni red. verify-side-warp.mjs y reportes quedan privados.
La primera comparacion encontro desborde en el compositor de cache recortada:
la mascara completa transformada no limpiaba todo el lienzo pequeño del motor
de prueba. Se aplica ahora el recorte correspondiente de la mascara en pixeles
locales, cubriendo exactamente la cache. No se afirma que ese fallo del motor
nativo estuviera presente en el navegador; la operacion explicita es equivalente
y elimina la dependencia de recortar una mascara completa transformada.

Resultado final real de render: sameMasks=true, changedBodyBytes=0,
changedOutsideSleeves=0, unlitOutsideChanges=0; 58971 pixeles de manga cambian,
270108 pixeles opacos del cuerpo fuera de mangas comparados. Cero llamadas API.
Archivos: side-warp-render-report.json, side-warp-raglan-off.png y
side-warp-raglan-on.png en bocetos/private/. Prueba de shader/canvas local,
no captura de navegador ni certificacion visual humana. El servidor 4318 sirve
los archivos nuevos; la pagina abierta necesita recarga para tomarlos.

Rollback: recuperar v por columna y los selectores de cuerpo anteriores;
originales, transformaciones y preferencias guardadas no se reescriben.

## Short con deformacion lateral y medias fuera de IA (19/10)

Pedido de Fito: aplicar al short la misma deformacion de costados y quitar la
opcion de generar medias. drawPowerClips y clipDesignToPart usan la mascara
real del short por vista, con v uniforme y u entre los laterales exteriores.
El hueco de entrepierna queda transparente; no se duplica el rectangulo en cada
pernera. Seleccion y transformaciones usan el mismo encuadre, tambien en bocetos
anteriores que guardaban margen/contentWindow. El original no se reescribe.

Se retiro gen-socks de UI y lista de generacion; la API rechaza pedidos de medias
antes de OpenAI o del proxy. Se conservan controles lisos, copia de colores,
visibilidad y decodificacion de texturas anteriores de medias.

Pruebas primero: tres fallos reproducidos (encuadre antiguo de short, medias
seleccionables y solicitud API permitida). Luego las 75 pruebas del editor y
sintaxis PASS. Render real offline con funciones de app.js y PNG PSD, sin red:
523 filas, 14735 pixeles de entrepierna transparentes, cero errores de bordes en
montaje vivo/plano y cero errores verticales. Antes del cambio el montaje vivo
perdia 419 bordes y el plano 1032 en la prueba inicial de pixeles opacos.
La verificacion final mide el contorno alpha >=128, igual al algoritmo real;
no confunde el primer pixel totalmente opaco con el borde antialias del molde.
Script/PNG/reporte privados: bocetos/private/verify-short-warp.mjs,
short-warp-live.png, short-warp-flat.png y short-warp-render-report.json.
Cero llamadas API. No es una captura de navegador ni aprobacion visual humana.

Rollback: restaurar seleccion y rama de montaje anteriores; conservar
IndexedDB, preferencias y texturas fuente. Recargar la pagina para aplicar.

## Guia compacta para aprovechar resolucion (19/10)

Pedido: reducir espacio verde desperdiciado para dedicar mas pixeles a cada
recorte. La rejilla anterior reservaba 512x512 por pieza, incluso para mangas.
compact-v1 busca distribuciones sin rotar piezas, con escala fisica unica y
calles/margen de 16 px. Conserva los lienzos anteriores: cuatro piezas 1024x1024,
cinco 1536x1024; una llamada y calidad medium. No altera generacion de contenido,
deformacion del montaje, colores ni originales. La guia y prompt describen las
coordenadas nuevas; el servidor valida proporcion, escala comun y separacion
antes de llamar al proveedor. Recorte compacto encuentra piezas por su posicion
esperada, sin las divisiones artificiales de celdas. Lectura de rejillas previas
y correccion manual siguen disponibles. atlasTile conserva densidad nativa.

Pruebas RED: ocupacion antigua de 28,2% en fixture y fallo al separar cuerpos
que cruzan celdas. Tras el cambio, 79 tests del editor y sintaxis PASS, incluidas
las 31 selecciones de las cinco piezas PSD, sin regresion de densidad ni cambio
de proporciones; crops compactos a 1x/2x y rechazo de piezas unidas. API simulada
acepta cuatro/cinco piezas con una llamada por atlas y mismo tamaño/calidad;
solapamientos no llegan al proveedor. No se hicieron generaciones pagas.

Medicion con mascaras PSD reales, ambas mangas respecto del puño y short:
24,6675% -> 61,0916% de area util en 1536x1024; factor lineal 1,5739 y factor de
pixeles utiles 2,4766. Frente 483x738, espalda 488x755, mangas 117x209 y 113x205,
short 501x376. Recorte offline recupera las cinco piezas exactamente. Artefactos
privados: verify-compact-atlas.mjs, compact-atlas-report.json,
compact-atlas-guide.png y compact-atlas-comparison.png. La comparacion es un
diagrama de distribucion revisado visualmente, no una generacion IA ni captura
de navegador. Falta comprobar fidelidad de una nueva generacion del proveedor.

Rollback: volver a generationLayout de celdas y conservar lector compacto para
atlas ya guardados. No borrar IndexedDB, variantes, PNG fuente ni preferencias.

## Calidad del montaje y deformacion lateral localizada (19/10)

Fito reporta aspecto dentado y franjas deformadas tambien en el centro. Causa
reproducida: u=(x-left)/(right-left) cambiaba TODA la fila cuando variaba el
contorno. Extremos enteros agregaban escalones, y fragmentos de hombro/bajo
apretaban el dibujo. La vista ampliada copiaba el canvas de edicion 1080x1920.

torsoEnvelope mantiene ahora el 50% central en sus coordenadas originales.
Deforma solo los cuartos exteriores con transicion cuadratica de derivada 1
al entrar al centro. Estima extremos subpixel por alfa y filtra filas vecinas;
completa contornos desde filas de costados completos. Hombros y bajo recortan
sin convertir sus fragmentos en un nuevo ancho de estampado. Las filas con
solo antialias tambien reciben textura, evitando halos del color base.
Se conservan v uniforme, transformaciones manuales y hueco de entrepierna.

highResolutionSnapshot unifica ampliacion y descarga: PNG 2160x3840, assets
hires cacheados por sesion y regreso a edicion 1080x1920. Error y apertura
antes de cargar molde no bloquean botones ni guardan una cache vacia. No se
aumenta la resolucion del render interactivo. No cambia proveedor ni fuente IA.

Regresiones RED reproducidas: coordenada central desplazada; hombros/bajo
colapsados; preview 1080x1920; 30 pixeles de fila antialias sin textura. Las
85 pruebas del editor y sintaxis PASS tras correccion. Las pruebas anteriores
que exigian source-x=0/1 tambien en hombros y bajo eran parte del contrato
erroneo: ahora exigen centro fijo y bordes visibles en costados reales. En PSD
normal, error maximo de borde ~1,08 niveles RGB por interpolacion; centro
invariante a <1e-7. Alturas y originales se conservan.

Navegador interno disponible: se abrio 127.0.0.1:4318, restauro Boceto 1 con
franjas blanco/negro y se reviso con zoom, usando el mismo diseño guardado.
naturalWidth/Height del ampliado=2160x3840; al cerrar, canvas=1080x1920. Sin
errores de consola. Captura real privada: quality-fixed-browser.jpg, revisada
visualmente y mostrada a Fito. No se uso otra tecnologia para controlar UI.
Verificacion offline de ranglan mantiene changedBodyBytes=0 y cambios fuera
de mangas=0 (side-warp-render-report.json). Cero llamadas a servicios IA.
Entrada preventiva SPX-ERR-20261019-003.

Rollback: recuperar algoritmo de fila completa y snapshot normal; conservar
fuentes, posiciones, variantes e IndexedDB. Recarga aplica al boceto existente;
esta correccion no inventa detalle que falte en el PNG original.

## Hombros y bajo estables, sin abrir las franjas (19/10)

Fito señalo deformacion residual en ambos bordes. Un intento intermedio de
desactivar la deformacion en el 20% superior y 10% inferior abrio demasiado el
dibujo; Fito lo rechazo durante la prueba. Se retiro ese retorno a identidad.

Ahora se conserva el registro lateral del cuerpo vecino: el 10% superior toma
contorno a altura 20%; el 4% inferior toma altura 90%. Entre esas zonas y el
cuerpo, la coordenada que lee el contorno transiciona con derivada continua
(arriba 10%-30%; abajo 84%-96%). No se mueve la altura de muestreo del dibujo:
v sigue siendo y/(alto-1). Centro fijo, cuartos exteriores y fuente intactos.
Esto evita que las franjas se abran al llegar al bajo o se pinzen al hombro.

RED: fixture con costado recto y recortes extremos detecto que el borde perdia
el registro vecino al volver al rectangulo. Tras ajuste, 87 pruebas y sintaxis
PASS. Mascaras reales de frente, espalda y short verifican columnas estables
en ambas zonas terminales. La prueba de bordes visibles se limita al tramo
medio del costado, que es la zona donde corresponde adaptar su contorno.

Navegador interno: recarga del mismo Boceto 1 y revision con zoom 2x; nueva
captura shoulder-hem-stable-browser.jpg en bocetos/private/. Sin generacion,
sin cambio de proveedor ni consumo IA. Se reviso visualmente; aprobacion de
Fito pendiente. La captura intermedia shoulder-hem-fixed-browser.jpg conserva
el intento rechazado para comparar, no constituye aprobacion de ese estado.

Rollback: recuperar el ultimo torso-warp.js y sus tests. Conservar PNG fuente,
bocetos y transformaciones; no borrar almacenamiento del navegador.

## Seccion 03 Vivos (19/10)

Fito aprobo el ajuste anterior y pidio vivos de mangas, hombros, laterales de
camiseta, laterales y bajo de short. Diseño IA pasa a 04; copiar colores a 05.
Implementado en garment-trims.js: geometria local por contorno de las mascaras
PSD, marcos de manga medidos al puno, hombros por borde superior, laterales
con curva suave y bajos separados por pierna sin cruzar la entrepierna.
Una/tres lineas en mangas y hombros; short admite banda lisa, mitades arriba/
abajo, mitades lado a lado y dos lineas separadas con colores independientes.
Cada grupo tiene activacion y grosor. Capas debajo de cuello/punos y luces;
no modifican las fuentes de textura ni el algoritmo de deformacion aprobado.

Veinte controles entran en captureSketch/restoreSketch, historial y preferencias
IndexedDB. Bocetos anteriores los inicializan apagados. Ocultar no pierde
colores/modelos. Vista Base y Diseño comparten el mismo compositor; exportacion
2x usa la misma geometria logica y mascara nativa completa. Ninguna llamada IA.

RED: trims-ui.test.mjs fallo antes de implementar (numeracion y controles
ausentes). GREEN: npm run check y npm test, 96 tests Node PASS mas assertions
CJS. Siete tests nuevos geometricos con PSD reales cubren lados/vistas,
alineacion con puno, hombros, bandas bicolor, piernas separadas, clipping
nativo a 2x y herencia de preferencias; dos tests UI cubren orden y snapshot.
La regresion de ranglan comprueba que vivos se pintan despues de texturas y
antes de punos. No se modifica torso-warp.js ni el proveedor.

Navegador interno: mismo Boceto 1 restaurado, cinco grupos combinados, cambios
de modelos, colores y grosor por teclado; Base/Diseño, deshacer/rehacer y
recarga. Ampliacion verifico naturalWidth 2160 y naturalHeight 3840, sin consumo
(contador 96). Captura privada vivos-preview-browser.jpg muestra el ejemplo
combinado. Persistencia usa el debounce existente de 450 ms: una recarga
inmediata tras rehacer puede conservar la version previa; no se certifica
durabilidad sincrona al cerrar mientras se guarda. Controles probados a ancho
de ventana 959 px; layout movil hereda el apilado existente, sin QA fisica movil.

DESIGN.md registra runtime/modelo B, tokens y controles nativos existentes.
Auditor premium strict ejecutado con ownership nativo explicito: 31 hallazgos
preexistentes (30 falsos positivos de botones cuyo listener esta en app.js,
un textarea anterior con resize). No hay unresolved ni hallazgos de los vivos.
Informe private/premium-audit.json. No se acredita PASS del auditor global.
No se alteran botones ajenos ni textarea dentro de esta mejora focal.

Rollback: retirar seccion, import/compositor y garment-trims.js, conservando
los campos IndexedDB (ignorables por versiones previas), bocetos y PNG fuentes.

## Edicion de vivos por nodos (19/10)

Fito pidio manipular las lineas como en Corel: forma, estirado y ubicacion.
Editar vivos abre un dialogo con cada linea/vista en una lista y seleccion
directa sobre el dibujo. Nodos Bezier con tiradores de entrada/salida,
suavidad vinculada (Alt independiente), agregar nodo por division exacta
De Casteljau, quitar nodo (minimo dos), selector de nodo y movimiento por flechas.
Mover/estirar ofrece ocho tiradores, traslacion y rotacion; Shift ajusta a 15
grados. Rueda acerca, espacio/arrastre desplaza, Centrar pieza recupera encuadre.
Tiradores mantienen tamaño de pantalla; herramientas separadas evitan solapes.
Se recorta el exceso invisible del eje inicial de manga para ubicar los nodos
terminales cerca de la pieza. No se cambia la fuente ni el contorno PSD.

trim-path.js contiene geometria pura; trim-editor.js contiene interaccion SVG.
Las formas editadas se muestrean para el compositor existente y se recortan con
la mascara de cada prenda. Guardado normalizado por mascara, por grupo/pieza/
vista/linea en trimEdits; exportacion y ampliacion usan la misma geometria.
Preferencias se clonan al abrir otro boceto, evitando objetos compartidos.
Historial dentro del dialogo por gesto, RAF para el preview y una accion
principal al aplicar. Cancelar/Escape recupera toda la sesion; Restaurar vivo
recupera el trazado original. Controles del dialogo no entran en sketchInputIds.

RED: tests nuevos fallaron sin trim-path.js. GREEN: npm run check y 101 tests
Node PASS mas assertions CJS. Cinco regresiones nuevas comprueban division
sin cambio de curva, transformacion de nodos/tiradores, normalizacion y rechazo
de datos malformados, edicion de una sola linea/vista y copia de preferencias.
Navegador interno: agregar nodo, flechas, arrastrar nodo con mouse y estirar por
tirador; deshacer/rehacer local y desde el boceto. Curva de siete nodos persistio
al recargar; Restaurar recupero seis nodos del lateral original. Sin otra
generacion y contador 96. Se retiran las deformaciones de prueba antes de entregar.

Auditor premium strict actualizado: 43 hallazgos, cero unresolved: 42 botones
con listeners externos (incluye controles nuevos probados en navegador) y un
textarea previo. El analizador no resuelve addEventListener de archivos JS;
no se agregan onclick ficticios para ocultar esos falsos positivos. Informe
private/premium-audit.json; no se declara PASS global de esa auditoria.
Rollback: retirar dialogo/editor y lectura de trimEdits; conservar almacenamiento.

## Paneles, modelo de Fito y desvinculado por instancia (19/10)

Fito aclaro el modelo: una franja en manga; hombros solo en el frente, con una
franja del ancho de manga o tres lineas como ajusto; panel lateral de camiseta
relleno hasta el exterior de la mascara; short con una banda que ocupa la misma
envolvente que dos lineas. Se conserva el modelo de puño y las texturas.
trimPanelPolygon cierra cada curva interior contra el exterior de su mascara y
supera el ultimo pixel inferior para evitar un hueco en el bajo. Sigue recortado
con la mascara PSD completa. Los modelos de short tienen la misma envolvente.

Hubo una etapa breve con vinculado para dar forma parecida a los costados.
Fito luego pidio desvincularlos: el molde no es simetrico y terminara cada
instancia por separado. linkedVersion 3 duplica las curvas compartidas con sus
mismos valores, marco local y espejo de decodificacion, usando una clave
individual por grupo/pieza/vista/modelo/linea. Copias profundas conservan ajuste
actual sin vinculos mutables. Editar/restaurar/mover una instancia no cambia las
otras. Los modelos inicialmente ocultos conservan su trazado inicial.

Guardar modelo de vivos genera JSON schemaVersion 1, linkedVersion 3, con los
19 controles actuales y curvas individual:*; omite imagenes, logos y claves
historicas shared:*. El enlace de descarga queda disponible para reintentar.
Fito adjunto sportex-modelo-vivos.json (version vinculada 2). Se leyo como datos,
sin ejecutar contenido, y se preservo en private/modelo-vivos-fito-link-v2.json.
No se fijo ese borrador como base: Fito enviara el ajuste individual final.

RED: cuatro regresiones fallaron antes de paneles/ancho constante/cambio de
modelo. GREEN: sintaxis y 107 tests Node PASS mas assertions CJS. Cobertura de
envolvente de short, manga unica, hombro frontal, panel hasta exterior/bajo,
edicion aislada, migracion de curvas sin movimiento y exportacion sin imagenes.
Los tests anteriores de propagacion se reemplazaron por aislamiento conforme
a la correccion de Fito. Ninguna generacion ni cambio de proveedor.

## Modelo final de Fito y restriccion ranglan (19/10)

Entrada: sportex-modelo-vivos (1).json, schemaVersion 1 y linkedVersion 3.
Se valido como datos: 19 controles conocidos, colores hex, anchos acotados,
modelos admitidos y 32 curvas individuales con coordenadas numericas finitas.
public/trim-defaults.js fija exactamente ese archivo: manga 8, hombro triple 5,
curva lateral camiseta 7, short 12 (envolvente 15), bajo 14 px. El hombro simple
sigue el ancho de manga. Se conservan las formas y widthScale independientes.
assert.deepEqual comprueba igualdad completa entre archivo recibido, base
publicada y exportacion obtenida por el boton Guardar modelo en navegador.

La revision fito-20261019-final-v1 se aplica una vez por boceto y preferencias.
Conserva activaciones, molde y contenido ajeno a vivos; los cambios manuales
posteriores y su revision entran en cache, historial y preferencias nuevas.
El molde nuevo inicia con manga comun; no reemplaza elecciones ya guardadas.

Interpretacion comunicada a Fito: al activar manga ranglan no se ofrecen vivos
de mangas ni hombros por ahora. Se ocultan y deshabilitan sus controles, y se
excluyen sus batches de render y editor. Sus opciones quedan conservadas y
reaparecen al volver a manga comun. Laterales y short siguen disponibles.

RED: pruebas focales fallaron por modulo/helper ausentes. GREEN: sintaxis y
111 tests Node PASS, mas assertions CJS. Casos nuevos: grosores y curvas de la
base, adopcion sin alterar contenido, revision sin resetear ajustes posteriores
y restriccion ranglan sin mutar configuracion. QA navegador interno: ranglan
oculta ambos grupos; lista editable solo contiene laterales y short; volver a
manga comun recupera valores exactos. Exportacion completa identica al adjunto.
Capturas privadas vivos-modelo-final-browser.jpg y vivos-final-ranglan-browser.jpg.
La pestaña de QA conserva su boceto previo; no se confunde con la captura de Fito.

Auditor premium estricto: 44 findings, unresolved 0; mismos 43 falsos positivos
de botones con listeners externos y textarea legado con resize ya documentados.
No se declara PASS global de ese auditor. Servidor local reiniciado para ruta
trim-defaults.js; sin llamadas IA, secretos, cambios remotos ni despliegues.

## Bordes del logo de marca (19/10)

Fito reporta mala calidad en los bordes del logo. Diagnostico: la carga y cache
conservan el PNG original, de 1826x1592, con transparencia y antialias en origen.
El render de imagenes usaba imageSmoothingQuality low por defecto, reduciendo
ese original directamente a 48 px en edicion o 96 px en exportacion. Una prueba
real Chromium con el mismo archivo reproduce bordes dentados: apenas 38 pixels
de alpha parcial al reducir a 96x84. La version high produce 568, conservando
el area aproximada (1453.26 frente a 1452.90 px) y la forma original.

drawGraphicImage activa antialias y calidad high solo durante cada imagen y
restaura el contexto, para logo de camiseta y short, escudo y sponsors. No
cambia archivos originales, colores, coordenadas, proporciones ni dimensiones.
outlinedImage creaba su silueta en resolucion logica 1x incluso en exportacion
2x; ahora usa b.width/height * outputScale y el mismo filtro alto. No se toca
el escalado de texturas, el molde ni el historial de Fito.

RED: tests/logo-quality.test.mjs reproduce low en vez de high y contorno 48x42
en vez de 96x84 en render 2x. GREEN: tres casos focales y suite completa de
114 tests Node PASS, assertions CJS y npm run check. Regresiones de preview 2x
y restauracion del editor siguen verdes. QA real: pagina temporal local toma
drawLayer/outlinedImage/drawGraphicImage del archivo de produccion, renderiza
el logo real y confirma 568 pixels suavizados (PASS). Captura comparativa:
bocetos/private/logo-bordes-comparacion-browser.jpg. Vista ampliada 2160x3840
del editor cargada; contador de generaciones permanece 96, sin uso de IA.
Probe y adjunto quedan en private ignorado; ningun servidor externo ni secreto.

## Alto tipografico, Logo 2 y Setear parametros (19/10)

Fito pide alto y posicion constantes al cambiar de fuente, sin deformacion;
ajustar tamanos/posiciones en lienzo, Logo 2 y preparar parametros iniciales en
JSON, que luego ceden prioridad a la ultima configuracion usada. Corrige que
Logo 2 debe quedar dentro de Marca. Se implementa con controles nativos del
editor actual, sin abrir un segundo lienzo ni usar IA.

textLayout mide el contorno de la cadena actual a 1000px y calcula un unico
tamano de fuente para size * 0.7 * scaleY. Centra el contorno visible en x/y,
incluyendo sus espacios laterales y baseline. No usa scaleX ni maxWidth para
texto; cambia el ancho natural de la fuente. Cache por familia/peso/cadena,
limite 256, invalidada tras cargar/cambiar fuentes. Los tiradores mantienen
proporciones para nombre/numeros; centro opuesto estable. Las imagenes tienen
proporciones bloqueadas inicialmente y pueden desbloquearse manualmente.

Posicion y tamano selecciona elemento, centro X/Y y alto. Logo 2 se integra en
Marca (archivo/color/activacion), seleccion, lienzo, paleta, cache IndexedDB,
historial, serializacion, carga de snapshots antiguos y preferencias nuevas.
Las capas originales y sus posiciones previas no se reinician al migrar.

Setear parametros activa instrucciones y Guardar parametros y descargar JSON.
Exporta schemaVersion 1, kind sportex-initial-parameters, textSizing visible-height,
9 transformaciones fijas, 79 controles, estilos, activaciones, curvas de vivos
y nombres de archivos de logo. Omite imagenes, referencias, notes y contenido
de player-name/number. La base independiente vive en initialParameters; el
ultimo uso tiene prioridad sobre ella en inputs, capas, visibilidad y estilos.
Salir de configuracion conserva los cambios manuales; no simula cancelacion.
El enlace permite descargar de nuevo. Fito ajustara y enviara el JSON final;
no se promueven como base global los valores usados en QA.

RED: modulo faltante y luego tres casos de precedencia/opciones ausentes.
GREEN: 121 tests Node PASS y assertions CJS; npm run check PASS. Cobertura nueva:
alto visible/ancho natural entre metricas distintas, resize uniforme anclado,
preferencia reciente sobre base, exportacion completa sin imagenes/contenido,
fallback inicial y ejecucion real del handler de guardado/layout de texto.

QA en navegador interno con tipografias reales: numero de frente conserva
84px y (269,478) al alternar Alemania 2014/Jersey M54/Real Madrid 2024-25;
nombre 46.2px y (801,386) con Adidas 2018/Argentina Qatar/Nacional 2024-25.
Anchos cambian sin compresion. Repeticion con ajuste manual: 105px y (286,478),
anchos 86.86/94.35/93.74. Evidencia privada font-height-browser.json.

QA de configuracion en origen local 4321, separado del editor 4318: base con
90px, x275 y medias apagadas; cambio manual 105px, x286, medias activas. Nuevo
boceto y recarga conservan 105/x286/medias activas. Logo 2 conserva su archivo
original y 80px, (700,320), dentro de Marca. JSON original mantiene la base
90/x275/medias apagadas; 79 controles sin payload data:image. Archivo privado
parametros-iniciales-browser.json. Captura del editor principal disponible en
bocetos/private/setear-parametros-browser.jpg; solo se abre configuracion, sin
alterar parametros de Fito. El control del navegador se deshabilito durante el
trabajo y Fito confirmo habilitado; la comprobacion pudo retomarse.

Auditor premium: mismos 44 findings, unresolved 0: 43 falsos positivos de
listeners externos y textarea previo. No se declara PASS global del auditor.
Sin generaciones, proveedores, DB remota ni despliegues; servidor principal
local restablecido tras interrupcion. QA separado se retira al terminar.

## Modo general, multiseleccion y alineaciones (19/10)

Fito corrige Setear parametros: debe ser un modo general que registre todos
los ajustes, y solicita Shift/clic o mouse para seleccionar varios elementos,
alinearlos vertical/horizontalmente y centrarlos con la camiseta.

La barra global muestra modo activo, descarga JSON y Terminar modo. Cada
guardado automatico captura inputs de configuracion, transformaciones y
attachments de todos los elementos, estilos, curvas de vivos, fondo/paleta,
metadatos de sponsors, textos adicionales y colocacion de las texturas. Exportar
no termina el modo. La base vive aparte en IndexedDB, con el flag del modo;
los siguientes cambios normales conservan prioridad como ultimo uso. JSON sin
payload de imagen, referencia ni contenido del nombre/numero del jugador.
Archivos de logos y sponsors siguen guardados localmente con las preferencias.

element-selection.js calcula seleccion por recuadro, alternancia Shift y
alineacion por centros del grupo. La camiseta usa el eje de la mascara real de
cada vista; conserva Y, dimensiones, escala, rotacion y attachment. El grupo
puede moverse junto. Los gemelos de sponsor representan una sola seleccion.
Duplicar/restaurar individuales quedan desactivados cuando hay varios; eliminar
aplica a todos los seleccionados. Recuadro se dibuja por RAF sin recalcular luces.

La prueba visual detecto que el autoguardado de elementModel generaba una
entrada de historial sin cambio visual. Se excluye esta metadata de historyKey;
un cambio real vuelve atras en un solo paso. Regresion CJS agregada para undo y
redo, mas ejecucion del handler real de alineacion en VM.

Validacion: npm run check PASS; 127 tests Node PASS y assertions CJS. QA en
navegador interno, origen 4321 sin clave API: modo general, medias false y
ranglan true, numero delantero de alto110 y x274; recarga recupera todos los
valores sin pulsar guardar. Shift y recuadro seleccionan 2; alineacion vertical
igualo X=332.5828125 conservando Y380/992 y tamanos157.142857/134. Horizontal
igualo Y681.95 y un solo Deshacer recupero380/992. Centrado de camiseta igualo
X267, conservando alturas. Arrastre conjunto aplico +50.3606557/+37.7704918 a
ambos elementos. Terminar modo con baseX317.3606557 y cambio normal a290:
nuevo boceto hereda290/alto110 y JSON inicial permanece en317.3606557.
Consola sin errores ni warnings. QA tab/servidor retirados.

Editor principal4318 recargado, modo general abierto y dos elementos
seleccionados, sin modificar su geometria. Captura privada verificable:
bocetos/private/parametros-generales-alineaciones.jpg. Se preserva la pestaña
principal. El auditor premium usado en el checkpoint previo ya no esta en su
ruta instalada; no se adjudica su resultado anterior a estos controles nuevos.
Revision visual y controles nativos verificados en navegador.

Rollback: recuperar app/index/style, editor-geometry y element-layout anteriores;
retirar element-selection, su ruta y tests. Los nuevos campos de workspace son
opcionales. Conservar IndexedDB, fuentes, logos y bocetos; no hay migracion DB.
Sin generaciones, costos, operaciones remotas ni cambios en legado o warp.

## Color de varios elementos (19/10)

Pedido de Fito: cambiar el color de todos los elementos seleccionados excepto
escudos y sponsors. Color comun encima del lienzo cuando la seleccion es
multiple; selector nativo y paleta aplican al mismo grupo permitido: numeros,
nombre, textos libres, marca de camiseta, marca del short y Logo2. Marcas
activan el tinte personalizado. No se alteran colores originales, contornos o
geometria de escudos/sponsors. Una seleccion compuesta solo por excluidos no
puede caer al color activo de camiseta. Colores diferentes indican Varios;
selecciones mixtas aclaran que escudos/sponsors conservan su color.

Actualizacion agrupada por RAF, sin render por elemento. preferencesDirty hace
que se hereden y guarden los colores; modo general captura las mismas entradas.
Al confirmar, la adicion a la paleta precede al registro del historial para
evitar un paso de Deshacer que solo cambie la paleta.

Validacion: npm run check PASS; 131 tests Node PASS y assertions CJS. Cuatro
regresiones nuevas cubren filtro permitido, comando real con todos los tipos,
seleccion mixta cuyo elemento activo es sponsor y grupo de excluidos sin
fallback. Verifican geometria/estilos intactos, activaciones de marca y limites
del historial alrededor de la accion grupal.

QA navegador interno, origen4321 sin clave API: numero delantero y nombre
seleccionados por Shift. Selector #cc2244 aplica a ambos; paleta #ffffff aplica
a ambos; un Deshacer devuelve ambos a #cc2244. Tras recarga, selector #8899aa y
un Deshacer recupera #cc2244 directamente. Consola sin errores/warnings. Editor
4318 recargado sin recolorear el boceto del usuario; captura privada del control
en bocetos/private/color-grupal-browser.jpg. QA tab/servidor retirados.

Rollback: recuperar app.js, index.html, style.css y element-selection anteriores;
conservar workspace y archivos. No hay cambio de esquema ni migracion. Sin IA,
costos, despliegues o operaciones remotas.

## Reemplazar escudos y sponsors desde lienzo (19/10)

Fito solicita reemplazo directo desde el lienzo. Al seleccionar un escudo de
camiseta/short o un sponsor se muestra Reemplazar en la barra rapida. Selector
de archivo PNG/WebP/JPG hasta8MB. El destino queda fijado al abrir el selector;
cancelar, archivo invalido o cambios de boceto/fuente durante lectura no mutan
la imagen. El archivo se conserva a su resolucion original.

replacementImageSize conserva la altura efectiva al cambiar de proporcion:
size nuevo = size anterior * max(1,aspecto nuevo)/max(1,aspecto anterior).
Centro, escalas manuales, giro, attachment, contorno y visibilidad permanecen.
Ancho cambia proporcionalmente, sin deformacion adicional. El escudo mantiene
la fuente compartida de camiseta/short; recalcula size en ambas copias para
conservar sus altos. Sponsor mantiene id y gemelo de manga; duplicados no cambian.
Entradas de catalogo/sponsors se reemplazan de forma inmutable para no corromper
el historial ni imagenes compartidas por otros bocetos. Actualiza nombres en
selector y lista; preferencias quedan marcadas para cache y modo general.

Validacion: npm run check PASS; 137 tests Node PASS y assertions CJS. Seis
regresiones de reemplazo cubren proporciones, seleccion unica, alturas compartidas,
inmutabilidad, sponsors/duplicados, cancelacion/tamano/formato/error de lectura y
cambio asincrono de boceto o fuente. No se cambia el recorte de mascaras; el
preflight remitio a SPX-ERR-20261019-002 y se preserva esa solucion.

QA en navegador interno4321 sin clave API, con assets locales sportex-logo.png
y sportex-favicon.png. Escudo de alto72, centro(348,387): reemplazo mantiene
72 y centro, ancho pasa a72; Deshacer recupera nombre/archivo sportex-logo.png,
Rehacer devuelve sportex-favicon.png. Sponsor en right:front, centro(120.5,390),
alto64.27 y giro27: reemplazo y recarga mantienen todos los valores y el archivo
nuevo. Selector muestra el nombre actualizado. Consola sin errores/warnings.
QA tab/servidor retirados. Editor4318 recargado con escudo original seleccionado;
no se reemplazan archivos del usuario. Captura privada:
bocetos/private/reemplazar-desde-lienzo.jpg.

Rollback: recuperar app/index/style/element-layout previos y retirar los tests
de reemplazo. Conservar IndexedDB y archivos. Sin migracion ni efectos remotos,
generaciones o consumo de creditos.

## Edicion directa, base aprobada y composicion3:4 (19/10)

Fito pide laterales independientes para todos los elementos (tambien texto),
vertices proporcionales, espaciado de letras, retirar Posicion/tamano y los
botones de formato, convertir copia de colores en un boton final, mover Reemplazar
debajo del elemento, persistir Logo2, fijar la configuracion actual como base y
centrar/ampliar el montaje segun prendas. Se conserva como unica proporcion3:4.

Antes de editar se captura por el modo general el JSON actual aprobado de Fito
en bocetos/private/parametros-aprobados-20261019.json. Base canonica sin payloads
de imagen en public/initial-parameters.json; incluye fuentes SCInternacional2023
y RealMadrid2024-25, transformaciones, opciones, vivos y el texto adicional que
estaba configurado. El arranque usa esa base; workspace y ultimo uso siguen
prevaleciendo. Los archivos subidos no se publican en la base: siguen en IndexedDB.

resizedElement conserva proporcion solamente en vertices y mantiene la relacion
manual actual; laterales afectan un solo eje con ancla opuesta fija. Texto usa
scaleX/scaleY para deformacion explicita, manteniendo el alto visible al cambiar
fuente. letterSpacing se guarda en la capa/modelo. Glyph layout mide avances e
ink bounds, admite negativo y centra el texto; el contorno usa las mismas
posiciones. Cache de metricas de espaciado limitado a256 evita volver a medir
al mover. Escalar alto conserva ancho incluso con espaciado distinto de cero.

Selector de color, espaciado y reemplazo comparten controles contextuales debajo
del elemento; seleccion multiple mantiene color grupal. Se retiran el panel de
posiciones y ambos botones de formato. Copiar colores queda como accion final
del panel izquierdo, conservando estado y algoritmo; controles de comparacion
anteriores permanecen internos para compatibilidad. El boton aplica todo.

La composicion usa la union de mascaras de camiseta y short (segun activacion)
y ajuste uniforme con margenes de60 horizontal/80 vertical dentro de1440x1920.
Con medias usa identidad, conservando montaje anterior. Solo cambia el render
final: fuentes, mascaras, luces, elementos y texturas comparten transformacion,
sin mutar sus coordenadas. Puntero, tiradores, herramientas contextuales, editor
inline y controles de estampado usan el mismo marco/inversa. Preview y export
2x conservan la composicion. No se toca la deformacion de estampados aprobada.

Validacion: npm run check PASS; 144 tests Node PASS y assertions CJS. Siete
regresiones nuevas cubren UI retirada, mascaras PSD reales, centros/limites,
inversion del puntero y tamano de controles, laterales/vertices con proporcion
manual, espaciado positivo/negativo, altura independiente con spacing y cache,
base aprobada y prioridad de las preferencias con Logo2.

QA navegador interno4321: camiseta sola y camiseta+short centradas/ampliadas;
con medias montaje conservado. Seleccion y arrastre del numero usando el marco
adaptado: ensanchado de scaleX1 a2.1527477675 manteniendo scaleY1 y altura;
espaciado-3 visible. Captura privada camiseta-short-centrados.jpg. Origen4322
sin workspace previo: fuente/activaciones y coordenadas coinciden con base
aprobada (front x266.3421479, y473.6076680, escalas0.8954206675; Logo2 x797,
y315.3102756, escalas1.9268176170). Carga de Logo2, nuevo boceto y recarga
conservan archivo sportex-logo.png. Preview de camiseta sola:2880x3840.

Editor principal4318 recargado y Logo2 original de letras DELTA restaurado.
Selecciones reales de escudo y texto verifican boton Reemplazar debajo y campo
de espaciado. Capturas privadas reemplazar-debajo-elemento.jpg y
lienzo-simplificado.jpg. Consolas sin errores/warnings. Tabs/servidores QA
retirados; se conserva el editor principal y sus prendas/archivos actuales.

Rollback: recuperar app/index/style, element-layout, server y tests anteriores,
retirar initial-parameters.json. Conservar workspace y campos nuevos (ignorables
por version anterior); no borrar logos, preferencias ni bocetos. La anchura
manual nueva de texto requiere la version actual para representarse igual.
Sin llamadas IA, costos, operaciones remotas o cambios en legado.

## Nuevo boceto respeta la base general (19/10)

Pedido: Nuevo boceto debe abrir exactamente con los parametros base guardados.
Causa: newSketch mezclaba withPreferences por encima del modelo inicial. Ademas,
blankSketch persistido podia llevar una positionRevision antigua; restoreSketch
reiniciaba los elementos fijos y descartaba las escalas del modelo actualizado.

Correccion: crear con initialParameterSketch y versiones actuales, reutilizando
solo archivos de logos/sponsors. La base guardada manda sobre ajustes normales;
si no existe una base persistida se conserva initial-parameters.json. El modo
general actualiza tambien los archivos de la base para sobrevivir selecciones o
eliminaciones posteriores. El boceto anterior conserva sus cambios. Sin llamadas IA.

Validacion: check PASS; 147 tests Node PASS mas assertions CJS. Tres regresiones
cubren base vs ultimo uso, archivos/textos/sponsors e independencia, restauracion
antigua y el bloque real de migracion. Esta ultima reprodujo FAIL con x801/y320
sin escalas antes del arreglo; despues conserva x797/y315 y escalas1.9.

Navegador interno QA4323: base con Logo2 y sin medias; cambios normales a rojo,
con medias y Logo2 oculto. Nuevo boceto recupera azul, sin medias y Logo2 visible.
La pestaña anterior conserva rojo/medias/oculto. Tras recargar se crea otro y el
JSON de todos los parametros coincide exactamente con el exportado de la base.

La comprobacion principal4318 revelo el reinicio por version antigua antes del
ultimo arreglo. Se corrigio con regresion ejecutable. El control del navegador
quedo deshabilitado al intentar comprobarlo visualmente; se solicito habilitarlo.
No se considera evidencia valida la captura anterior nuevo-boceto-base.jpg.
Boceto1 original conservado; Boceto2 creado para la prueba anterior sigue abierto.

Rollback: restaurar funciones anteriores de app/element-layout y sus tests.
Conservar IndexedDB y archivos; ningun borrado ni cambio en legado o remoto.

### Comprobacion visual completada (19/10)

Continuacion en DESARROLLO_LOCAL, misma tarea/campaña/rama y worktree. El
servidor4318 estaba detenido; se inicio oculto desde platform/bocetos con su
configuracion local, sin mostrar secretos ni llamar a IA. El navegador interno
estaba en pagina de error y su politica bloqueo la observacion. Fito actualizo
manualmente; el control quedo restablecido por la via normal autorizada.

Nuevo Boceto2 creado desde la base actual del navegador. No hay reinicio de
escalas/posiciones ni superposicion de textos por migracion antigua. Recarga
completa, esperando la opcion del Logo2 de letras DELTA: comparacion de todos
los inputs/selects/textarea (excepto file) con el estado anterior = identicos.
Logo2 y los otros archivos siguen seleccionados. Boceto1 original sigue abierto;
no se activo el modo general ni se sobrescribio su base. Composicion visible,
fuentes y tamanos conservados tras recarga. Consola sin warnings ni errores.

Captura valida: bocetos/private/nuevo-boceto-base-verificado.jpg. Reemplaza como
evidencia visual la captura anterior al arreglo de version. Editor4318 queda
activo y abierto; 96 generaciones antes y despues. Sin costos, APIs remotas,
cambios de producto adicionales ni borrado de bocetos. Rollback del codigo ya
registrado en el apartado anterior; no retirar cache ni archivos del usuario.

## Texturas y ultimo ajuste de interfaz (19/10)

Tarea TASK-20261018-001, DESARROLLO_LOCAL, rama sportex-governance-20260801,
worktree canonico SPORTEX/platform. Se aplican tambien las correcciones de Fito
sobre avisos propios y botones verdes, recibidas durante el trabajo.

Cambios: comentarios informativos debajo del lienzo ocultos; errores conservan
estado accesible. Puño inicia apagado y es un overlay sobre mascara completa de
manga: su toggle no modifica limites, marco, escala ni posicion del estampado.
Migracion cuffOverlayVersion1 apaga la opcion anterior una vez, conservando sus
cambios posteriores. Nuevos bocetos empiezan sin puno. Se retira Parametros
generales; la base existente sigue separada y las ediciones normales se guardan.

Paneles laterales20% mas angostos y flechas independientes con aria-expanded,
preferencia local y riel36px. 05 Texturas permite IA/propia/oculta por pieza,
archivos PNG/JPG/WebP hasta15MB, transformaciones independientes, historial y
persistencia. Los dos botones abren el ajuste existente; se reactivan al salir.
No se mezclan texturas propias en nuevas variantes IA ni se dibuja el render
aplanado debajo de una pieza moderna oculta. Las mangas propias conservan su
archivo en ambas vistas y las IA mantienen el intercambio correspondiente.

Acciones rapidas: fuera boton multiple (Shift/recuadro conservados), T reconocible,
contorno contextual y selector Fuente debajo de color/espaciado para nombres,
numeros y textos. Cambiar fuente usa la normalizacion de altura existente.
Confirmar cierre usa dialog HTML estilizado propio, foco en Cancelar, Escape
cancela, fondo inerte y foco restaurado. No quedan window.confirm/alert/prompt.
Descargas superior/inferior con --accent SPORTEX (RGB207,230,78).

Validacion: npm run check y156 tests Node + assertions CJS PASS. Regresiones de
fuentes, fuentes de textura independientes, serializacion/hidratacion, mascara
estable con puno, ocultacion sin fondo aplanado, avisos silenciosos, cancelacion
modal y Escape en controles nativos. Migracion de bases anteriores conservada.

Navegador interno QA4324 sin API: carga en las5 piezas y recarga mantienen nombres,
selecciones y archivos. Ocultar/restaurar una textura funciona; ambos accesos
abren el ajuste. Rotacion17 grados de manga persiste al activar el puno. Fuente y
espaciado cambiados en un numero, contorno desde acciones rapidas. Cierre de
Boceto2: Cancelar y Escape conservan2 pestañas; confirmar deja Boceto1 intacto.
Panel medido356px frente a445px anteriores: ratio0.8; ambos plegados miden36px.
Vista600x820 sin desborde horizontal (ancho/contenido590px); override restablecido.

QA4326 con fixture HTTP propio en4325: atlas sintetico de rectangulos por color,
sin OpenAI/Gemini. Controles IA disponibles tras respuesta simulada. Apagar
frente conserva espalda/mangas; propio reemplaza IA solo en frente; reactivar IA
recupera su original y apaga propio; espalda se oculta independientemente. El
fixture de colores no modela contornos: aviso esperado de analisis incompleto,
sin efecto sobre visibilidad. El contador99 pertenece solo a ese origen de prueba.

Editor principal4318: recargado,96 generaciones intactas, fuente contextual
visible al seleccionar nombre, puño apagado, botones verdes y comentarios ocultos.
Sin warnings/errores de consola; sin cambiar prendas, logos ni textos del usuario.
Capturas privadas interfaz-texturas-controles.jpg y confirmacion-editor.jpg;
visibilidad-texturas-ia.jpg documenta la simulacion. QA y servidores efimeros se
retiran al cerrar;4318 se mantiene. No hubo consumo de API, deploy ni legado.

Auditoria premium estricta ejecutada, reporte private/editor-ui-audit.json:
46 hallazgos affordance.actionless-button, todos por el analizador literal de
HTML que solo reconoce onclick/@click y no los addEventListener del modulo JS.
No se acredita PASS de ese auditor; los bindings reales se comprueban en tests
y navegador. La incidencia real de Escape se registra aparte. No se agregan
handlers inline ficticios para silenciar la limitacion del analizador.

Rollback: recuperar app/index/style/element-layout/initial-parameters y tests del
checkpoint anterior. Mantener IndexedDB, campos nuevos ignorables y archivos.
La UI anterior no muestra customTextures; conservar datos para recuperar despues.
Sin borrados remotos ni cambios al Core. Aceptacion visual humana pendiente.

Ajuste final: flecha de Composicion a la izquierda del encabezado. Comprobado
en4318 que oculta y reabre el panel; captura interfaz-texturas-controles.jpg
actualizada. Ningun cambio de coordenadas o configuracion del boceto.

## Texturas PDF/CDR con conversion unica y trabajo liviano (19/10)

Pedido: Fito usa PDF/CDR habitualmente y exige no volver pesado el lienzo.
Implementado en el cargador canonico de las5 piezas. Imagenes hasta15MB y
PDF/CDR hasta50MB. PDF.js6.4.299 fijado con lockfile; npm audit0 vulnerabilidades
al instalar. Recursos/worker locales bajo demanda, sin libreria PDF durante el
render normal. Dialogo de pagina/preview/apply/cancel; no reemplaza hasta aceptar.
Max200 paginas, solo se renderiza la seleccionada. Cota2048px por lado; PNG
preparado en IndexedDB, sin PDF/CDR original ni reconversion al editar/recargar.
Cada bitmap de trabajo <=4.194.304 pixeles (16MiB RGBA); no se promete una cota
para toda la memoria del navegador. HistoryKey sustituye src por ID estable para
no volver a serializar megabytes por movimiento. Imagenes pequenas no se amplian.
PDF.js destruye tarea/worker y reduce canvas temporal a1x1 al cerrar.

CDR: endpoint localhost binario con limite50MB, firma RIFF/paquete Corel,
rechazo de Origin ajeno, un conversor a la vez, timeout60s y salidaPDF max80MB.
PowerShell usa CorelDRAW instalado, nueva instancia aislada, OpenDocumentAsCopy,
texto a curvas, todas las paginas; no guarda sobre el original. No acepta una
sesion previa del usuario como conversor. Temporales con nombre propio y guardia
de ruta; cleanup solo del PID nuevo y fecha exacta. Si Corel no esta disponible,
ocupado o el formato es mas nuevo, propone exportar PDF. No es soporte universal
de CDR en cualquier servidor: requiere Windows y Corel instalado/licenciado.

Pruebas: sintaxis PASS,161 tests Node + assertions CJS PASS. Guardias de formatos,
limites, aspecto/cota raster, rechazo de ZIP generico, CDR invalido sin lanzar
Corel, endpoint/origen, allowlist PDF.js y firma de historial de imagen2MB <500B.
Logs privados texture-document-check.log y texture-document-tests.log.

QA4324 en navegador interno, con fixtures propios (sin datos del usuario): PDF
vectorial2 paginas, elegir pagina2 y aplicar al frente; CDR real creado en
CorelDRAW2021, convertir/apply en espalda; PNG4096x6144 importado en manga.
Conversion CDR medida12229ms y4582B PDF. Recarga conserva nombre/pagina/fuente;
Cancelar y Escape conservan la anterior. PDF roto muestra error propio en espanol,
aceptar deshabilitado y Cancelar operativo. Selector nativo abierto con teclado;
600x820: dialogo556x655.6, contenido554px sin desborde; preview proporcional.
Detectada y corregida compresion CSS de preview: ahora dimensiones proporcionales
por ResizeObserver (1366x2048 ->252x378 en la vista normal). Rotacion3 grados del
frente confirmada desde el editor existente. Sin warnings/errores de consola.
Captura de prueba importar-textura-pdf.jpg. La captura inicial Corel anterior a
la correccion CSS se conserva solo como diagnostico, no certifica proporcion.

Auditoria premium estatica:52 actionless-button, misma limitacion del parser que
no detecta addEventListener externos. Nuevos botones tienen bindings reales y QA;
no se acredita PASS del auditor ni se introducen handlers inline ficticios.
Fuentes tecnicas: https://mozilla.github.io/pdf.js/getting_started/ y SDK local
Corel.Interop.VGCore + https://community.coreldraw.com/sdk/api/draw/23/m/document.exportbitmap
para contrastar capacidades de exportacion. La implementacion usa PublishToPDF.
Sin OpenAI/Gemini, costos, datos remotos, piloto ni legado. Rollback: retirar
importador/ruta Corel/dependencia y recuperar el cargador PNG previo; conservar
IndexedDB (los raster preparados siguen siendo PNG compatibles).

## Correccion de alcance: solo imagenes y PDF (19/10)

Fito aclara que el editor se publicara en un servidor sin CorelDRAW y pide
retirar CDR. Esta decision reemplaza la compatibilidad CDR del apartado anterior.
Eliminados corel-texture.mjs, scripts/corel-texture.ps1, ruta POST
/api/texture-corel e inyeccion del conversor en createEditorServer. El cargador
no ofrece ni acepta CDR y no envia documentos al servidor. El servidor solo
sirve los assets estaticos de PDF.js; procesamiento PDF y seleccion de pagina
en navegador, con las mismas cotas2048px, cache y liberacion del worker.
PNG/JPG/WebP siguen habilitados. Rasters preparados anteriormente permanecen
compatibles aunque su nombre original incluya.cdr; no se borran datos guardados.

Validacion: sintaxis y160 tests Node + assertions CJS PASS. Pruebas actualizadas
rechazan CDR por MIME/extension y comprueban404 del endpoint retirado. Se conservan
regresiones PDF.js, limites, geometria e historial liviano. No se desplego nada
ni se uso Corel, APIs de IA o creditos en este cambio. Rollback: restaurar los
archivos del checkpoint anterior solo si se revierte la decision de producto.

## Aspecto original de las texturas subidas (19/10)

Fito precisa que imagen/PDF debe conservar proporcion y no intentar rellenar;
la deformacion solo puede ser manual. Causa reproducida antes del cambio con
3 regresiones fallando: el montaje trataba custom como IA y aplicaba la envolvente
del torso; mangas usaban cover con bleed. Ahora textureBaseGeometry prioriza
custom con escala minima comun, sin contentWindow/bleed automaticos. Frente,
espalda y short custom evitan drawTorsoTexture; siguen la ruta de imagen directa
recortada por mascara, como mangas. texturePlacement y el render/export usan la
misma geometria. Se incluye custom en firma del cache. scaleX/scaleY/x/y/rotacion
manuales y fuentes guardadas se conservan; no se reescriben bocetos ni archivos.
El espacio sin imagen queda del color base y la mascara puede recortar sus
esquinas; no se extiende ni se comprime el contenido para cubrir esa forma.

Sintaxis PASS;164 tests Node y assertions CJS PASS, incluidos4 nuevos casos para
3 proporciones,5 piezas,1x/2x, escala manual y regresion IA. Logs privados
texture-aspect-check.log y texture-aspect-tests.log. PDF propio900x300 con grilla
y circulo: navegador interno QA4324 muestra rectangulo3:1, circulo redondo y
resto azul de la camiseta, sin completar la prenda. Arrastrar lateral cambio a
125% x100% (circulo ovalado solo tras esa accion); cancelar restituyo100%.
Captura privada textura-proporcion-conservada.jpg tomada antes de deformar.
Editor principal recargado con la textura PDF ya cargada por Fito; conserva su
archivo y configuracion, sin tocar sus transformaciones ni consumir creditos.
Incidencia y guardia en el registro oficial. Rollback: recuperar las dos funciones
de geometria/render anteriores; conservar IndexedDB y los raster fuente.

## Definicion del panel por empresa (19/10)

Pedido de Fito: alta manual para vender laboratorio, un acceso comun con
usuario/contrasena, sesion recordada, bloqueo al vencer y renovacion manual.
Panel con configuracion, logos, fondo, fuentes y consumo; moldes futuros.
Se preparo docs/superpowers/specs/2026-10-19-panel-bocetos-design.md para revision.
Se inspeccionaron contador localStorage/IndexedDB, servidor loopback sin auth,
usage devuelto por OpenAI y contratos de Core/identidad/configuracion existentes.
Se propone autoridad Core, recursos por tenant, reserva atomica e idempotencia,
proveedor simulado local y conciliacion de Costs API con clave por empresa.
La documentacion oficial consultada confirma amount y group_by api_key_id/project_id
en intervalos diarios; un reporte ausente no equivale a gasto cero.
Preflight focal: preservar sesion frente a errores de carga (SPX-ERR-20260819-002).
El documento distingue decisiones de Fito y precisiones propuestas, y define
pruebas de vencimiento, concurrencia, aislamiento, persistencia y costos.
Solo archivos documentales: no hay panel implementado, cuentas, secretos,
llamadas pagas, migraciones ni despliegue nuevo. Rollback: retirar la propuesta;
mantener editor, bocetos del navegador y runtime local anteriores.

Validacion de este checkpoint: npm run validate PASS (30 workflow/frontend,
59 Core/API, documentacion, tipos, SQL y build); git diff --check PASS. La primera
sincronizacion excedio el presupuesto de contexto; se compactaron resumen y
tarea sin ampliar el presupuesto ni retirar contratos. Spec revisada sin
placeholders, con decisiones confirmadas separadas de defaults propuestos.
