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
