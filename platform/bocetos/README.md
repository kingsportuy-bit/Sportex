# SPORTEX · Laboratorio de bocetos



Fuente tecnica del editor importado el 2026-10-18 desde bocetos-delta.

Desarrollo y pruebas locales; no es el CRM ni una capacidad certificada del

piloto. La copia DELTA queda como respaldo, sin nuevos cambios.



## Ejecutar



Desde `platform/`: `npm run dev:bocetos`.

Abre http://127.0.0.1:4318, siempre enlazado solo a loopback.

Node 22 o superior; no requiere instalar dependencias para el editor.



La configuracion privada vive en `bocetos/.env.local`, ignorada por Git.

Usar `.env.example` como plantilla. No pegar claves en el navegador ni en chat.

`OPENAI_IMAGE_MODEL` conserva el modelo de generacion existente;

`OPENAI_COLOR_MODEL` configura el analisis de colores (gpt-4.1-mini por defecto).

El arranque no realiza llamadas pagas. Generar o copiar colores si usa la API.



Se conserva el origen http://127.0.0.1:4318 y los identificadores anteriores de

IndexedDB/localStorage para mantener los bocetos y el contador del navegador.

Otro puerto, host o perfil de navegador tiene almacenamiento distinto.

No hay migracion de archivos de clientes al repositorio.



## Cambios de TASK-20261018-001



- Imagen ampliada: rueda para zoom 1x–8x, arrastre para recorrerla.

  Teclas +/−, flechas y 0 para ajustar. X o Escape cierra la vista.

  Sus transformaciones no forman parte del historial del boceto.

- Seccion 04, plegada al iniciar: Copiar colores de la referencia.

  Detecta cuello, punos, tres numeros independientes, nombre, marca de camiseta,

  marca del short, base del short y medias. No altera escudos ni sponsors.

- Las partes ausentes o inciertas mantienen su color. El resultado es una

  estimacion visual, revisable en los selectores existentes.

- Los colores entran en la paleta y en el historial. Un cambio manual durante

  el analisis prevalece. Cambiar de boceto o referencia descarta la aplicacion.

- Cache de analisis en RAM: hasta 12 referencias durante 10 minutos; nunca

  guarda imagenes ni claves en logs. Una copia de colores no descuenta el

  contador local de generaciones de imagen; el analisis tiene consumo API.



La seccion 04 tambien ofrece Detectar contornos y Ajustar estampado. Aplicar

referencia realiza un unico analisis visual: referencia, mock actual y texturas

planas independientes. Devuelve contorno externo (presencia, color y ancho) de

numeros, nombre, marcas, escudos y sponsors, y registro aproximado de texturas

por pieza/vista (desplazamiento, escala uniforme y rotacion). Conserva mascaras,

fuentes de textura y la independencia entre mangas/vistas. El contexto completo

forma parte de la clave de cache, para no reutilizar ajustes de otro estampado.



Los valores observados se distinguen de los inferidos. Ante falta de evidencia,

se reutiliza la familia de tinta/contorno de numeros o marcas relacionados; sin

evidencia de contorno se asume ninguno. Una vista ausente de la misma manga

puede heredar escala y altura con angulo/desplazamiento horizontal opuestos.

Sin motivos comparables, el estampado queda centrado a escala natural y sin

rotacion. No se afirma registro exacto: son aproximaciones editables. No cambia

la forma de las prendas. Las inferencias se listan al aplicar, y toda la

operacion se deshace en un paso. No pisa ediciones hechas durante el analisis.



## Pruebas



### Separacion de texturas



Las nuevas generaciones usan un fondo fluo uniforme verde o magenta, elegido

segun la referencia. El recorte identifica exclusivamente el fondo conectado

al exterior; no elimina detalles de ese color encerrados dentro del estampado.

Cada pieza debe tener un unico rectangulo completo, en su sector y con tamano,

proporcion y relleno compatibles con la plantilla. Se rechazan piezas unidas,

fragmentadas, faltantes o ambiguas antes de aplicar cualquiera de ellas.



Un fallo de separacion conserva el original en una nueva pestana y mantiene el

diseno anterior sin sustituirlo por un recorte incompleto. La generacion de

imagen completada sigue consumiendo su credito aunque falle el recorte local.

Las versiones guardadas con fondo gris se recuperan con deteccion del fondo

exterior, conservando los desplazamientos, escalas y rotaciones de cada pieza.



Desde `platform/`: `npm run check:bocetos`.

Incluye regresiones heredadas del editor, zoom/pan, aplicacion de colores,

errores y ruta HTTP con proveedor simulado; no llama a OpenAI.

`tests/piece-mapping-browser.js` conserva fixtures historicos de canvas y puede

requerir recursos externos de prueba que no se importaron. No corre en CI.



Los PNG de `public/assets/psd-kit` y los `kit-photo*.png` de alta resolucion

conservan las capas de frente y espalda. Para regenerarlos desde PSD privados:

`python scripts/export_psd_kit.py --source <carpeta-PSD>`.

Requiere psd-tools, Pillow, numpy y opencv-python; no son dependencias de runtime.



## Limites de esta incorporacion



Editor local de un operador: no hay autenticacion, aislamiento multitenant,

creditos comerciales ni vinculacion a pedidos. Prohibido exponer este servidor

en red o desplegarlo al piloto sin integrar el contrato del Core y los permisos.

El contador existente es una preferencia local, no facturacion.

Las fuentes se importaron como recursos del prototipo: sus licencias deben

verificarse antes de distribucion comercial.



Rollback: detener el proceso local nuevo y usar el editor DELTA conservado.

No borrar datos del navegador. El piloto y sus despliegues no se modificaron.



## Documentacion del analisis



- https://developers.openai.com/api/docs/guides/images-vision

- https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses

- https://developers.openai.com/api/docs/models/gpt-4.1-mini



## Comparar ajustes de referencia



La seccion 04 separa los colores de cuello y puños, medias, short, numeros de

camiseta, nombre, numero del short y logos de camiseta y short. Al desmarcar

un ajuste se recupera su valor previo al analisis; al volver a marcarlo se

reaplica el resultado guardado, sin consultar nuevamente a la IA. Contornos y

estampado admiten la misma comparacion. El antes y despues se guardan por boceto

en el navegador y participan del historial de deshacer.



Al terminar una generacion se analizan y activan todos los ajustes. Si el boceto

esta en otra pestaña, el analisis queda pendiente hasta abrirlo. Un fallo del

analisis conserva el diseño generado y permite reintentar con Aplicar referencia.

Cambiar o recortar la referencia inicia una comparacion nueva.



## Registro del estampado con el patrón (v4)

La geometría se mide en las máscaras PSD que usa el lienzo. Se toman los
componentes de alfa >= 128 y se descartan islas menores al 1% del componente
principal. Las máscaras originales mantienen sus píxeles de suavizado; éstos
no definen las dimensiones del estampado. Las mangas se separan por lado
anatómico y se mide también su proyección en espalda.

Con ranglan y puños activos, en coordenadas lógicas del lienzo 1080 × 1920:

| Pieza | Frente | Espalda |
| --- | --- | --- |
| Cuerpo | 299 × 512 | 307 × 527 |
| Manga derecha | 161 × 192 | 176 × 193 |
| Manga izquierda | 157 × 185 | 179 × 187 |

Causa reproducida: el umbral anterior de alfa > 24 incluía residuos de mangas
al medir el cuerpo. El frente ranglan pasaba a 454 × 523; el ancho de las
franjas resultaba inflado aproximadamente un 52%. La geometría `cover/max`
y el zoom posterior estimado por visión añadían otra fuente de escalado.

Generación, recorte, render, ajuste y exportación usan ahora el mismo patrón.
La ventana visible se mapea directamente a sus dos ejes; el 10% por borde
permanece afuera. El analizador de colores y contornos no recibe fuentes ni
pide escalas para estos estampados registrados. Aplicar referencia restaura
su encaje medido, y los tiradores manuales siguen disponibles.

La guía incluye las dimensiones de cada patrón. El servidor valida la relación
de aspecto antes de llamar al proveedor. Se mantiene una sola llamada de imagen.
El margen debe ser generado por IA: el código no inventa continuidad ni garantiza
que el proveedor haya reproducido todos los motivos correctamente.

Los diseños previos conservan su geometría. En «Ver imagen original IA» aparece
«Reajustar al molde · sin generar»: crea otra versión con los mismos píxeles,
encajada al patrón actual y sin consumo. Conserva la anterior, permite deshacer,
y no regenera ni altera cuellos, puños, números, nombres o logos. Si un archivo
antiguo no declara ventana visible, se encaja completo sin suponer sangrado.

Validación: máscaras reales, cada manga, correspondencia de puntos del estampado,
exportación a doble resolución, conservación de diseños anteriores y protección
frente a escalas arbitrarias de visión. En Boceto 10 se reutilizó el atlas real
como Diseño IA 2, sin nueva llamada paga; ver evidencia privada local.

### Guia compacta actual (19/10)

Las nuevas generaciones usan `compact-v1`: piezas completas distribuidas a
escala fisica comun, con 16 px de verde entre ellas y en los bordes. Mantiene
el mismo tamaño de imagen, calidad medium y una sola llamada. El recorte usa
las posiciones compactas y conserva la densidad nativa; los atlas anteriores
siguen leyendo su rejilla guardada. Con las cinco piezas reales del molde, el
area util pasa de 24,7% a 61,1%: aproximadamente 2,48 veces los pixeles de diseño.
La mejora corresponde a generaciones futuras; no agrega detalle a PNG previos.

## Servidor independiente

`production-start.mjs` requiere NODE_ENV=production, SPORTEX_DATA_DIR absoluto,
SPORTEX_LAB_URL y SPORTEX_PANEL_URL HTTPS distintos, OPENAI_API_KEY_FILE y
SPORTEX_RELEASE. SQLite y blobs viven fuera de la imagen; una replica. Preparar
el administrador con admin-bootstrap.mjs y un JSON privado antes de arrancar.
No se habilita /api/lab/setup en publico ni se importan los datos locales.
Dockerfile y stack en ../deploy/. Snapshot al iniciar, diario y al detener.
Nunca imprimir ni versionar claves, contrasenas o archivos bootstrap.
