# Prueba de cuellos sobre Fútbol básico

Fito priorizó conservar el mockup actual y preparar solo los cuellos.
La vista activa monta redondo, V y polo sobre las máscaras y luces de Fútbol
básico, con frente y espalda. Todavía no está integrada al catálogo publicado.

## Abrir

Desde `platform/`:

```powershell
node bocetos/prototypes/football-own-v1/server.mjs
```

Abrir `http://127.0.0.1:4321/`. Solo escucha en la computadora local.
El visor no usa claves, API ni datos de empresas. Guarda solo los anclajes
en localStorage, por modelo y versión del cuerpo.
Los valores iniciales de frente son los del JSON aprobado por Fito, archivado
en `approved-anchors.json`. La configuración local posterior tiene prioridad.

## Qué se puede comprobar

- Cambiar de cuello de frente sobre el mismo cuerpo; la espalda conserva
  siempre su cuello redondo original, sin aplicar anclajes traseros guardados.
- Colores independientes para camiseta, franjas, mangas y cuello.
- Pruebas de blanco, negro, rojo y franjas.
- Ver la separación inicial de cuerpo y mangas.
- Descargar la vista compuesta en PNG transparente.
- Comparar los tres cuellos sin cambiar el estampado.
- Mover el cuello y redimensionarlo con ocho tiradores o campos de posición,
  ancho y alto. Bloqueo de proporción, deshacer y restablecer por anclaje.
- Ajustar los tres anclajes de frente por separado. La espalda no se edita.
- Acercar al cuello. Flechas desplazan 1 px y Shift + flechas, 10 px.
  Escape o cancelar el puntero revierte un arrastre.
- Exportar/importar JSON. El archivo valida modelo, versión, seis anclajes y
  rangos antes de reemplazar los valores; los perfiles ajenos se rechazan.
  Los registros traseros se conservan por compatibilidad, pero no alteran el render.

## Recursos y técnica

La vista actual lee el kit PSD existente en `../../public/assets/psd-kit/`.
El redondo se registra con su máscara original. El V y el polo usan materiales
neutros separados. Las máscaras de mangas y luces siguen siendo las del kit.
Solo la banda/interior del cuello anterior reciben tejido de reemplazo,
muestreado en la fila de tejido inmediatamente inferior. Hay que revisar ese
encaje antes de integrar al laboratorio. No se afirma reconstrucción perfecta
de tela ni encaje automático en cualquier mockup.

`basic-renderer.js` implementa este montaje. `basic-anchors.json` conserva los
anclajes iniciales; `basic-verification.json` registra seis checks de render.
`basic-comparison.jpg` y `basic-*-neck.png` son renders reales del módulo activo.
El PNG descargado siempre contiene frente/espalda, sin guías ni zoom.

Como antecedente se conservan los cinco recursos de imagegen integrado:
dos cuerpos exploratorios y un par frente/espalda por cada tipo de cuello.
`prompts.json` documenta las instrucciones y referencias utilizadas.

En los recursos generados, la máscara se deriva del alfa real y de su componente
principal; se descartan residuos blancos. El cuerpo exploratorio tenía divisiones
de manga aproximadas; la vista activa usa las máscaras originales de Fútbol básico.

El gris neutro permite derivar mapas de sombreado y brillo para recolorear.
Son una aproximación de iluminación a partir de la imagen, no pases físicos
de un render 3D. El interior del cuello se monta por separado. La abertura
superior se adapta al cuello seleccionado y conserva el cuerpo bajo ella.
La sombra de contacto se calcula al superponer la banda. No hay sombreado
del cuello redondo incorporado a la base común.

La colocación conserva proporción por defecto; desbloquear permite ancho y
alto independientes. El cuerpo y el muestreo
de las franjas comparten coordenadas en las tres variantes. El visor guarda
como máximo dos pinturas por material y cuatro vistas, agrupa los cambios por cuadro y solo
compone la comparación triple cuando está abierta.

El experimento de cuerpo propio queda como referencia, sin más desarrollo.
Sus `layers/` incluyen máscaras, sombras y brillos exportados en coordenadas locales
por vista; `manifest.json` describe sus dimensiones, origen y colocación.
`comparison.jpg` y `proof-*.png` son renders reales del módulo del visor.

## Estado y siguientes ajustes

Esta prueba verifica el montaje 2D y la independencia de los cuellos. Antes de
registrarla como kit del laboratorio hay que aprobar el encaje de cuellos,
preparar las capas finales en alta resolución y
revisar la interfaz en el navegador. El control del navegador interno estaba
deshabilitado durante esta sesión: no se afirma QA visual de la página.

La comprobación visual se hizo sobre los PNG del renderer con Canvas nativo,
no sobre capturas de la interfaz. No hubo revisión independiente con subagentes.
El sistema visual del prototipo conserva los colores y controles de SPORTEX.

## Revertir

Detener el servidor del prototipo y retirar esta carpeta. El editor y los
bocetos existentes no dependen de ella.
