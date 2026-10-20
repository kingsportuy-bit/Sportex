# Contrato del laboratorio local de bocetos

Owner: modulo diseno. Decision: SPORTEX-DEC-022. Task: TASK-20261018-001.

## Alcance y estado

`bocetos/` es la fuente canonica del laboratorio importado de DELTA por pedido
explicito de Fito. Solo DESARROLLO_LOCAL; independiente del CRM. No autoriza
publicacion, acceso real ni escrituras a Core/DB.

## Entradas y salidas

Imagenes, logos y edicion en navegador -> preview y PNG descargable.
La persistencia actual es IndexedDB/localStorage por origen y perfil, sin
promesa de backup remoto. Mantener 127.0.0.1:4318 y nombres de stores anteriores.
Los PNG de molde son assets fijos, no una importacion de PSD por cliente.

POST `/api/reference-colors` recibe la referencia como data URL PNG/JPEG/WebP
validado en longitud y sintaxis. Usa Responses con esquema estricto de diez
colores HEX o null: cuello, punos, numeros frente/espalda/short, nombre, marca
camiseta/short, short y medias. Null conserva valor actual. No genera imagen.
La UI valida nuevamente antes de aplicar; cambio manual concurrente prevalece,
y una referencia/boceto diferente no recibe el resultado. Historial reversible.
Cache RAM acotada por hash de referencia/modelo; sin persistencia de respuesta.
El contexto extendido opcional agrega elementos (incluido brand2/Logo2), vista
actual y texturas existentes para contornos/registro. La primera imagen enviada
es siempre la referencia cargada, autoridad del color deseado; la vista actual
se etiqueta como estado presente, no como diseno deseado. IDs ajenos al editor
se rechazan antes del proveedor. TASK-20261020-005 cubre paquete real de UI,
HTTP autenticado, analisis simulado y consumo por empresa; sin llamadas pagas.

## Permisos y efectos

Servidor solamente loopback, para un operador local. Las acciones de IA parten
de botones del usuario. Los tests usan fetch simulado y no consumen API.
Claves solo en entorno o .env.local ignorado, nunca en frontend/fixtures.
No hay mensajes, pedidos, aprobaciones, workers ni efectos de negocio.

## Gate pendiente antes de piloto

Autenticacion, tenant desde sesion confiable, aislamiento de archivos y cache,
auditoria, cuotas/creditos gobernados por Core, pruebas de acceso negativo,
licencias de fuentes y QA visual humana. Esta task no certifica esos puntos.
El laboratorio local no se incluye en el Dockerfile del CRM.
Panel local por empresa: TASK-20261019-001. Spec aprobada en
docs/superpowers/specs/2026-10-19-panel-bocetos-design.md. Reglas en Core/bocetos,
adaptador JSON privado atomico, cookies HttpOnly y sesiones revocables. Solo
loopback y fixtures; no sustituye Auth/DB reales ni habilita comercial.
`npm --prefix bocetos run start:panel` abre 4319/admin; 4318 conserva el editor.
Alta/renovacion manual, vencimiento inclusivo Montevideo, cuota atomica e
idempotencia. Estado bloqueado se valida en servidor aunque la sesion persista.
Logos/Logo2/fondo/fuentes privados por empresa; caches e IndexedDB separados.
Clave principal y respaldo compartidos, solo en servidor. Cada llamada registra
operacion, tenant/actor validados, modelo, clave usada, request ID, estado y usage.
Respaldo solo ante 401/429 confirmado, una vez; incertidumbre no se reenvia.
Replay/caches no duplican llamadas; analisis tiene cache aislada por empresa.
Panel muestra llamadas/tokens por empresa. Costs API concilia el total oficial,
con IDs de claves opcionales o alcance organizacion explicito; no asigna USD
oficiales por tenant. Ausente es desconocido, no cero.
Sin nuevas dependencias, cobros automaticos, cuentas reales o migraciones.

## Pruebas y rollback

03 Vivos (IA 04, copia como boton final): manga con una franja; hombros solo frontales con una
franja del ancho de manga o tres lineas. Camiseta con panel lateral relleno;
short con banda lisa/bicolor o dos lineas en el mismo ancho, y bajo por pierna.
Cinco grupos apagables con color/grosor; edicion Bezier, cache e historial. Recorte PSD en ambas
vistas y PNG 2x, debajo de cuello/punos y luces. Sin IA ni cambios del estampado.
Detalles y sistema visual: bocetos/DESIGN.md y evidencia de esta task.
Editar vivos permite nodos/tiradores, movimiento, estirado y rotacion por linea
y vista, agregar/quitar nodos, restaurar y cancelar la sesion. trimEdits guarda
coordenadas relativas a la mascara; se heredan como preferencia, sin compartir
objetos mutables. Historial local por gesto y una accion al aplicar al boceto.
La version 3 separa cada lado/vista conservando la forma del vinculado anterior.
Guardar modelo exporta JSON solo de vivos, con coordenadas independientes;
Base final de Fito aplicada una vez; conserva cambios posteriores y activacion.
Ranglan oculta/excluye hombros y mangas; manga comun recupera sus ajustes.
Logos: suavizado alto al reducir; contorno a densidad de exportacion.
Cambiar fuente conserva alto/centro. Edicion manual: laterales libres, vertices proporcionales.
Texto con espaciado por elemento. Sin panel Posicion/tamano ni botones de formato; solo3:4.
Encuadre centra/amplia camiseta o camiseta+short; con medias conserva el conjunto.
Nuevo boceto aplica la base guardada; modo general retirado.
20/10: la base generica apaga los cinco vivos y conserva solo el nombre normal
arriba del numero. presetRevision actualiza exclusivamente la base defectuosa
publicada el19/10 en cache, sin cambiar documentos existentes ni archivos propios.
Bases personalizadas siguen prevaleciendo; los bocetos nuevos usan la base limpia.
Fito ajusta nombre18px mas arriba y nombre/numero centrados en cuerpo posterior
(mascara x625/ancho344, eje797); numero frontal apagado. Revisionv3 migra tambien
la basev2, conservando tamanos, escalas y documentos ya guardados.
Shift/clic o recuadro: multiseleccion, ejes comunes y centrado con camiseta. Logo 2 en Marca.
Color grupal desde selector/paleta: numeros, nombres y marcas; excluye escudos/sponsors.
Reemplazar debajo del elemento conserva alto, centro, giro y ubicacion.
05 Texturas: IA/propia/oculta por pieza, ajuste compartido e IndexedDB. Puno encima, sin reencuadre; inicia apagado.
Laterales -20%, plegables. Fuente/contorno contextuales. Avisos propios y descarga verde.
Texturas: imagenes y PDF (max50MB), pagina a elegir y raster max2048px en cache.
PDF en navegador, sin IA ni programas nativos en servidor. CDR no admitido.
Subidas conservan aspecto (contain), sin deformar/rellenar; ancho/alto manuales.
initial-parameters.json fija la base inicial; una base general guardada prevalece.
Altas nuevas usan esa geometria, colores y opciones sin archivos ni referencias
de marca/escudo. Fondo Delta no se ofrece ni se carga en altas nuevas; un boceto
antiguo que ya lo usa puede recuperarlo. Cada logo, Logo2, escudo o fondo cargado
reemplaza el anterior del mismo espacio, manteniendo otros bocetos. Nuevos bocetos
reutilizan el ultimo archivo; el historial libera fuentes que ya no necesita.
Login de laboratorio sin tarjeta ni textos introductorios: logo centrado,
Laboratorio de bocetos y formulario. Panel administrativo conserva su presentacion.

Preferencias locales: IndexedDB conserva archivos de logo y elecciones de
fuente, dimensiones, posiciones y estilos por boceto; Nuevo boceto aplica la
base general y reutiliza archivos, incluido Logo2, sin heredar ajustes normales.
Marcas de version antiguas no reinician esa base. Las pestañas reutilizan numeros sin
renumerar los bocetos abiertos. Fuentes iniciales: SC Internacional 2023 para
numeros y Real Madrid Font 2024-2025 para nombres; archivos servidos con cache
de navegador. Una pieza de estampado permanece activa hasta confirmar o cancelar.

Mangas: marcos medidos respecto del puno por vista. Corregir franjas existentes
requiere repeticiones y paletas compatibles; fidelidad generativa requiere QA.

Corregir separacion valida recortes manuales sobre el original sin otra llamada;
crea una variante atomica y conserva la anterior. No acredita fidelidad visual.

Desde 19/10, por pedido de Fito: pattern-rectangles-v1 genera rectangulos
completos sobre verde fluor, proporcionales a los patrones medidos de frente,
espalda y mangas. Una llamada OpenAI; sin pases de extension ni margen extra.
La guia compact-v1 distribuye las piezas a escala comun con calles verdes de
16 px; conserva el tamaño de imagen y el recorte a densidad nativa. Bocetos
anteriores mantienen su distribucion guardada. La API valida escala y separacion.
En montaje, frente/espalda y short conservan el 50% central y deforman suavemente
los cuartos exteriores. Hombros y bajo estabilizan el registro del costado vecino,
sin volver al ancho original del rectangulo. Contorno subpixel filtrado; recortan sin
pinzar filas. Cada fila conserva su altura. Mascara y encuadre fijos; ranglan
solo cambia la superposicion de mangas y sus luces. Coordenadas/fuente en cache;
mover, rotar y dimensionar actua antes de deformar. Punos generados permitidos.
Formatos anteriores siguen importables; originales y bocetos se conservan.
El short conserva el hueco de entrepierna y usa cada mascara frontal/posterior.
Las medias quedan fuera de generacion IA (UI y API), manteniendo color liso,
copia de colores y compatibilidad con texturas guardadas anteriormente.
Vista ampliada y exportacion comparten render 2x con assets de alta resolucion;
la edicion retorna a 1x. No crea detalle ausente en la textura fuente.
Las pruebas geometricas no certifican fidelidad de cualquier referencia.

`npm run check:bocetos`, `npm run validate` y evidencia de la task.
Restaurar el editor DELTA conservado; no eliminar IndexedDB ni secretos privados.

## Registro por contorno (18/10)

Importacion historica: cutline/outerline registran mascara y margen; linea
abierta se rechaza y tinta se elimina. Mangas posteriores intercambiadas.

## Runtime independiente autorizado (TASK-20261020-001)

Fito pide publicar laboratorio y panel en los dos subdominios kodebix.com.
El runtime nuevo usa identidad propia scrypt/sesiones revocables del Core y
SQLite exclusivo FULL en volumen privado; sustituye JSON local para servidor.
No requiere reutilizar Auth/DB del CRM. La decision anterior de conectar Auth/DB
externos se reemplaza para este despliegue acotado; sigue pendiente certificar
salida comercial general del CRM. Una replica, sin puertos publicos directos,
usuario no root, imagen inmutable, secretos Swarm y dominios HTTPS separados.
Cookie __Host- Secure/HttpOnly, origen exacto y bootstrap administrativo privado.
Snapshot SQLite consistente incluye blobs; arranque/diario/cierre, restauracion
ensayada. Sin importar fixtures o cache local. Rollback solo del servicio nuevo.

## Eliminacion de empresas (TASK-20261020-003)

POST `/api/lab/admin/companies/:id/delete` exige administrador, origen exacto,
version vigente y confirmation igual al usuario. El panel pide escribirlo en
un dialogo propio. Una operacion o llamada processing impide la eliminacion.
El Core purga empresa, usuarios, sesiones, configuracion, assets, operaciones,
usage, idempotencia y auditoria tenant. Conserva un evento administrativo sin
identificador de empresa y el reporte global de cargos compartidos.
SQLite confirma metadatos y blobs juntos; las escrituras de archivos/resultados
son parte de la misma transaccion para evitar carreras y archivos huerfanos.
Se limpian blobs sin referencias de versiones anteriores, conservando todos los
referenciados por otras empresas. secure_delete no promete borrado forense.
El adaptador JSON local confirma metadatos antes de limpiar archivos; un fallo
se informa y el reintento idempotente repite la limpieza. No se usa en servidor.
Fito eligio conservar respaldos anteriores; los bocetos del navegador siguen
bajo responsabilidad del usuario. Recrear el usuario genera otro tenant ID.
No se prueba borrando empresas reales ni se consumen llamadas IA.
