# Prueba de camiseta propia

Prototipo local de una camiseta con frente y espalda y tres cuellos:
redondo, V y polo. No reemplaza Fútbol básico ni está publicado en el catálogo.

## Abrir

Desde `platform/`:

```powershell
node bocetos/prototypes/football-own-v1/server.mjs
```

Abrir `http://127.0.0.1:4321/`. Solo escucha en la computadora local.
El visor no usa claves, API, persistencia ni datos de empresas.

## Qué se puede comprobar

- Cambiar de cuello sobre el mismo cuerpo, frente y espalda.
- Colores independientes para camiseta, franjas, mangas y cuello.
- Pruebas de blanco, negro, rojo y franjas.
- Ver la separación inicial de cuerpo y mangas.
- Descargar la vista compuesta en PNG transparente.
- Comparar los tres cuellos sin cambiar el estampado.

## Recursos y técnica

`assets/` contiene los cuatro recursos generados con imagegen integrado:
un cuerpo neutro continuo y un par frente/espalda por cada tipo de cuello.
`prompts.json` documenta las instrucciones y referencias utilizadas.

La máscara se deriva del alfa real y de su componente principal; se descartan
residuos blancos de generación. El cuerpo y las mangas usan el mismo tejido.
Las divisiones de manga se trazaron como una primera aproximación sobre las
costuras visibles; necesitan revisión antes de usarlas en producción.

El gris neutro permite derivar mapas de sombreado y brillo para recolorear.
Son una aproximación de iluminación a partir de la imagen, no pases físicos
de un render 3D. El interior del cuello se monta por separado. La abertura
superior se adapta al cuello seleccionado y conserva el cuerpo bajo ella.
La sombra de contacto se calcula al superponer la banda. No hay sombreado
del cuello redondo incorporado a la base común.

La colocación aplica escala uniforme a cada cuello. El cuerpo y el muestreo
de las franjas comparten coordenadas en las tres variantes. El visor guarda
como máximo dos pinturas por material, agrupa los cambios por cuadro y solo
compone la comparación triple cuando está abierta.

`layers/` incluye máscaras, sombras y brillos exportados en coordenadas locales
por vista; `manifest.json` describe sus dimensiones, origen y colocación.
`comparison.jpg` y `proof-*.png` son renders reales del módulo del visor.

## Estado y siguientes ajustes

Esta prueba verifica el montaje 2D y la independencia de los cuellos. Antes de
registrarla como kit del laboratorio hay que aprobar la silueta, afinar las
costuras de mangas y el encaje de cuellos, definir el mapeo del estampado y
revisar la interfaz en el navegador. El control del navegador interno estaba
deshabilitado durante esta sesión: no se afirma QA visual de la página.

La comprobación visual se hizo sobre los PNG del renderer con Canvas nativo,
no sobre capturas de la interfaz. No hubo revisión independiente con subagentes.
El sistema visual del prototipo conserva los colores y controles de SPORTEX.

## Revertir

Detener el servidor del prototipo y retirar esta carpeta. El editor y los
bocetos existentes no dependen de ella.
