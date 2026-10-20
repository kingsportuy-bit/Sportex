# SPORTEX · Laboratorio de bocetos

## Contexto y propiedad

Editor local de indumentaria para Fito. Una pantalla con insumos a la izquierda,
lienzo al centro y composición a la derecha; controles apilados en móvil.
La implementación existente es la fuente visual, sin cambio de marca.
Contrato de comportamiento: `../docs/BOCETOS_LOCAL_CONTRACT.md`.

## Administración local por empresa

### Mockups

Modo Operate, extensión del panel actual con navegación Empresas / Mockups.
Tabla de configuraciones: nombre/molde, versión publicada, borrador y acciones.
Configurar y Probar abren el lienzo existente en una pestaña; Publicar usa diálogo
propio que explica el efecto solo en bocetos nuevos. Nueva configuración clona
el molde preparado; se declara cuál es, sin fingir importación de otro PSD.

El lienzo de administración muestra barra compacta con nombre, disponibilidad
de opciones y Guardar configuración inicial. El resto conserva controles de
color, elementos y curvas. Opciones disponibles define qué puede activar la
empresa; el estado inicial se decide con los controles normales del lienzo.
Logos de muestra permiten dimensionar sin incorporar imágenes de empresas al
catálogo. IA apagada. Probar usa el borrador guardado y no escribe preferencias.
Estado inline de guardado/error y conflicto entre ventanas; salir por Volver
con cambios usa el diálogo canónico. Configuraciones y documentos versionados.

El acceso `/login` usa verde liso, logo SPORTEX centrado, subtitulo Laboratorio de
bocetos y formulario sin tarjeta, titulo ni descripcion. Entrar centrado.
Columna maxima360px, inputs/boton48px y etiquetas visibles;
en movil conserva margenes24px. `/admin` mantiene su cabecera y contenedor.

`panel.html/js/css` reutiliza los tokens de `style.css`: tabla operativa,
acciones verdes y formularios compactos en dialogos propios. No hay nuevas
dependencias UI. El panel se abre en `/admin`, el acceso de empresa en `/login`.
Native select, date, checkbox e inputs son owners; dialog nativo conserva foco
y Escape solicita descartar cambios. Formularios validan inline y no borran
datos ante error. Búsqueda local con limpiar, tabla desplazable en móvil,
feedback con region viva y estados de carga/vacio/error. Password enmascarada
con control Mostrar; no se guarda en navegador. Configurar conserva el listado.
Subir recurso guarda inmediatamente; el resto requiere Guardar cambios.
El laboratorio gestionado usa aviso propio cuando vence o se revoca la sesión.
No hay borrado definitivo en esta versión. Cuenta y recursos se rigen por Core.
Ver consumo abre detalle inline por empresa, con fecha, operación, modelo,
principal/respaldo, resultado, tokens entrada/salida y request ID. Desglose nativo
muestra contadores adicionales. Últimas 100 llamadas, carga/error/vacío y cierre
con retorno de foco; tablas desplazan horizontalmente. Sin campos de clave por
empresa: claves compartidas privadas. El reporte monetario global indica alcance.

Runtime canónico: `public/style.css`, `public/index.html`, `public/app.js`.
Este documento refleja ese runtime (modelo B); no es una segunda hoja de tokens.

## Identidad existente

- Página `--page: #0e1310`; panel `--panel: #171d19`.
- Superficie elevada `--raised: #1d241f`; campo `--field: #252d27`.
- Texto `--ink: #edf3ee`; secundario `--muted: #b0bcb3`.
- Bordes `--line: #303a33`; acción/acento `--accent: #cfe64e`.
- Foco `--focus: #e2f18e`; error `--error: #e8a391`.
- Segoe UI/Arial; encabezados Bahnschrift SemiCondensed/Segoe UI.
- Acordeones de pasos con número lima, campos nativos, contornos discretos,
  radios de 5–8 px. Sin nuevas tarjetas ni ornamentación en el lienzo.

## Dueños de controles

| Capacidad | Dueño canónico | Comportamiento |
| --- | --- | --- |
| Select/Listbox | `native` HTML select, `.field select` | Opciones fijas y selección por teclado |
| Activación | `native` checkbox, `.toggle-field` | Mostrar ajustes sin descartar sus valores |
| Color | `native` input color, `.swatch-control` | Vista inmediata, paleta compartida |
| Grosor | `native` input range, `.trim-width` | Teclado, etiqueta asociada y valor en px |
| Sección | `native` details/summary, `.step-section` | Abrir/cerrar sin cambiar el diseño |
| Lienzo | Canvas existente y máscaras PSD | Capas independientes; luces y elementos encima |
| Historial/guardado | Flujo existente en `app.js` | Deshacer/rehacer sin cambiar zoom; IndexedDB |

## Vivos (03)

Mangas, hombros, laterales de camiseta, laterales de short y bajo de short.
Cada grupo comienza apagado, se puede combinar y guarda modelo, colores y grosor.
La base inicial del20/10 confirma los cinco grupos apagados; el nombre normal
queda arriba del numero, sin texto adicional. Nuevo boceto actualiza solo la
base generica antigua guardada en cache y conserva los documentos existentes.
Los ajustes aparecen debajo de su activación. El segundo color aparece solamente
cuando el modelo lo utiliza. No hay llamada IA ni estado de carga en este flujo.
La manga lleva una sola franja. Hombros: una franja del ancho de manga o tres
líneas, solo en el frente. El short admite banda lisa, mitades horizontales/
verticales o dos líneas separadas dentro del mismo ancho total. El lateral de
camiseta es una pieza rellena entre su curva interior y el borde de la máscara.
Los vivos siguen máscaras reales en ambas vistas y en exportación 2×.
Apagar recupera la superficie anterior; no modifica las texturas ni su ajuste.

### Edición de curvas

El botón Editar vivos abre un diálogo dedicado con selección de línea/vista,
herramientas Nodos y Mover / estirar, zoom y desplazamiento. Nodos Bézier con
tiradores vinculados (Alt los independiza); agregar/quitar nodos, restaurar,
deshacer/rehacer, confirmar o cancelar la sesión completa. Flechas mueven el
nodo 1 px; Shift, 5 px. Transformación por rectángulo con ocho tiradores y
rotación (Shift ajusta a 15°). Los controles mantienen tamaño en pantalla.
Las curvas se guardan normalizadas por máscara en trimEdits por línea/vista;
el recorte final sigue siendo la prenda. No hay operaciones IA en este editor.
RAF agrupa actualizaciones de arrastre y mantiene un historial por gesto.
La versión 3 congela el ajuste anteriormente vinculado en cada instancia;
no hay propagación entre costados ni vistas. Guardar modelo descarga JSON con
controles y curvas independientes, sin imágenes. El modelo final de Fito del
19/10 fija las 32 curvas y sus grosores exactos. Se aplica una sola vez por
revisión, conservando activaciones y refinamientos posteriores. Manga ranglan
oculta y desactiva los vivos de mangas y hombros en controles, render y edición;
volver a manga común recupera las elecciones. El molde inicial es manga común.

## Elementos y parámetros iniciales

La base guardada se conserva; se retiró el modo de parámetros generales.
La edición se hace desde el lienzo: laterales
cambian ancho o alto de cualquier elemento, incluso texto; vértices amplían
manteniendo su proporción actual. Cambiar de fuente conserva alto y centro y
respeta las escalas manuales. Espaciado de letras debajo del texto seleccionado,
de -20 a 100px antes de la transformación manual, guardado por elemento. Debajo
aparece Fuente para nombres, números y textos propios; reutiliza el selector
canónico y conserva altura/centro. Contorno en acciones rápidas abre los mismos
controles debajo del elemento. Las
métricas se reutilizan durante el arrastre. Logo 2 vive en Marca y conserva archivo, color,
activación, posición y tamaño propios en el navegador.

El guardado automático registra elementos, fuentes, activaciones, colores,
contornos, vivos, textos, sponsors y colocación de estampados. IndexedDB conserva
la base aparte; los cambios normales quedan en ese boceto. Nuevo boceto aplica
la base guardada, incluyendo fuentes, colores, opciones, geometría y textos;
reutiliza los archivos en caché sin copiar ajustes del último boceto. La base
aprobada por Fito vive en initial-parameters.json: posiciones, escalas,
fuentes y opciones. El20/10 corrige vivos apagados y nombre unico arriba del
numero, sin texto adicional. Nombre y numero posterior comparten el eje del
cuerpo (x797); el nombre sube18px respecto de la primera correccion. Numero
frontal desactivado en la base. No incorpora imágenes subidas; esos archivos
continúan en el navegador. Las bases antiguas no reinician las
posiciones al crear un documento con la versión actual.

Shift + clic alterna elementos; arrastrar desde una zona vacía selecciona por
recuadro, sin botón de selección múltiple. Hay movimiento conjunto. La barra alinea
centros en un eje vertical, a la misma altura o sobre el eje de cada camiseta
según su máscara frontal/posterior. No altera tamaños ni rotaciones. Cada
alineación se deshace en un paso, sin pasos vacíos por guardar la base.

Al seleccionar varios aparece Color encima del lienzo; el selector y la paleta
aplican al conjunto de números, nombres, textos y logos de marca. Los escudos y
sponsors conservan sus colores. Si hay mezclas se muestra Varios y, si hay
exclusiones, se aclaran junto al control. Sin elementos coloreables se oculta
el selector y la paleta no cambia otra parte del diseño. Las marcas activan su
color personalizado. Un render por cuadro y una acción para Deshacer/Rehacer;
el guardado del color en la paleta forma parte de esa misma acción.

Seleccionar un escudo o sponsor muestra Reemplazar debajo del elemento.
Admite PNG, WebP y JPG hasta 8 MB. Sustituye el archivo conservando alto visible,
centro, escalas, rotación, contorno y ubicación; el ancho respeta la proporción
del archivo nuevo. El escudo usa la fuente compartida de camiseta/short y ajusta
ambos tamaños para mantener sus altos. Cada sponsor conserva su identidad y
gemelo de manga. Cancelar o un archivo inválido conservan el original. Historial
antes/después y guardado normal en IndexedDB; cambiar de boceto o de fuente
durante la lectura aborta el reemplazo. Los nombres de archivo se actualizan en
los controles. El botón se oculta para otros elementos y selección múltiple.

## Composición y ayudas rápidas

Formato único 3:4, sin botones de formato ni panel Posición y tamaño. Exporta
2880 × 3840px. Camiseta sola y camiseta/short se centran y amplían con las
máscaras reales, conservando unidos prendas, luces, diseños y elementos. Con
medias se conserva el montaje anterior. El cambio de presentación no modifica
las coordenadas ni ajustes guardados. Punteros y controles usan su inversa.
Copiar colores de la referencia es un único botón al final del panel izquierdo,
con su estado de análisis; se mantienen el análisis y el historial existentes.

Los paneles laterales son un 20% más angostos que el montaje anterior. Cada uno
tiene una flecha nativa con aria-expanded/controls; cerrado queda un riel de36px
y el lienzo recupera su espacio. La elección se recuerda por navegador; en móvil
se pliega el contenido manteniendo el apilado y el desplazamiento del documento.
Composición tiene su flecha a la izquierda. Plegar conserva zoom y coordenadas.
El ancho vive en style.css:
--side-panel-width = calc(16% +151.2px), derivado del 80% del ancho previo.

## Texturas (05) y puños

Frente, espalda, manga derecha, manga izquierda y short tienen fuente propia:
diseño IA, textura cargada o ninguna. Las fuentes se alternan sin perder archivos
ni ajustes. Mostrar diseño IA aparece deshabilitado si no existe una generación
para esa pieza. Cargar PNG/JPG/WebP (hasta15MB) activa la propia y muestra su
nombre y activación. Cada archivo, fuente y transformación queda en el boceto,
con historial y persistencia IndexedDB. Los bocetos nuevos empiezan sin esas
texturas. La carga no usa IA; un cambio de boceto durante la lectura la descarta.

PDF admite hasta50MB y200 páginas: diálogo propio con archivo, selector
nativo de página, vista previa proporcional, estado y Usar esta página/Cancelar.
No modifica el boceto hasta aceptar. Escape cancela; los errores conservan la
textura anterior y permiten cerrar/reintentar. PDF.js6.4.299 se carga bajo demanda,
desde recursos locales con worker; renderiza solo la página elegida y libera el
documento/worker/lienzo temporal al cerrar. No evalúa scripts del PDF ni usa XFA.
PNG/JPG/WebP mantienen límite15MB y se reducen solo si exceden2048px por lado;
PDF se rasteriza a esa cota, conservando proporción. La textura PNG preparada
entra en el render y en IndexedDB. No se guarda el documento pesado ni se vuelve
a convertir durante mover/rotar/escalar, recargar o exportar. El historial usa ID
de fuente para comparar cambios, sin serializar otra vez la imagen completa.

La colocación de archivos subidos conserva su relación de aspecto: se centra
con escala uniforme para entrar dentro del marco de la pieza (contain), sin
sangrado añadido, ampliación para cubrir ni deformación de costados. El área no
cubierta conserva el color base. La máscara solo recorta; no remapea el archivo.
Los tiradores laterales permiten cambiar ancho/alto manualmente y los vértices
conservan su proporción actual. Esas escalas y posiciones se mantienen al guardar.
El montaje IA conserva su deformación de costados. La bandera custom participa
en la firma del caché para que cambiar de fuente no reutilice un montaje distinto.

Formatos admitidos: imágenes PNG/JPG/WebP y PDF. Se retiraron la ruta y el
conversor CDR por decisión de Fito: el destino es un servidor sin CorelDRAW.
El PDF se procesa íntegramente en el navegador; el servidor solo sirve recursos
estáticos de PDF.js. Sin programas nativos, envío de documentos ni créditos.

Ir a ajustar texturas y Ajustar texturas sobre el lienzo abren el mismo editor.
Aceptar/cancelar conserva la separación entre IA y archivo propio. La pieza
sigue activa hasta ✓/✕; Escape en un selector cierra su menú sin cerrar el ajuste.
Las mangas propias no intercambian sus archivos en la espalda; los recortes IA
mantienen el intercambio correcto por vista. Las piezas modernas se dibujan
desde sus clips: apagar una no revela el render aplanado antiguo de debajo.

Puño empieza apagado, también para bases anteriores. Al activarlo es una capa
encima del estampado: la máscara completa y su marco no cambian, así no se mueve
ni escala la textura. Su elección posterior se conserva en el boceto.

## Avisos y descarga

Los comentarios informativos debajo del lienzo se ocultan. Los errores de carga
siguen visibles y accesibles. Cerrar boceto usa un dialog propio con título,
descripción, foco inicial en Cancelar, fondo inerte y Escape equivalente a cancelar.
Confirmar cierra solo la pestaña elegida y devuelve el foco al boceto activo.
Los dos botones de descarga usan fondo --accent SPORTEX y texto oscuro.

## Verificación y límites

Los gráficos importados se reducen con antialias y filtro alto, conservando
fuente, forma y transparencia. Los contornos rasterizan a la densidad de salida
(2× al ampliar/exportar); el filtro se restaura después de dibujar cada imagen.

Sintaxis: `npm run check`. Regresiones: `npm test`.
Geometría y escalado: `tests/garment-trims.test.mjs` con las máscaras PSD reales.
UI/guardado: `tests/trims-ui.test.mjs` y prueba manual en navegador interno.
No requiere servidor externo ni consumo de créditos. Evidencia detallada en
`../docs/evidencias/TASK-20261018-001_LABORATORIO_BOCETOS.md`.
