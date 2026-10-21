# Arranque del lienzo

20/10/2026 America/Montevideo. Task TASK-20261020-008, PILOTO_DELTA,
CAMP-20260803-001. Worktree SPORTEX/platform, rama codex/desplegar-bocetos-20261020.

Fito confirma guardado/publicacion correctos y pide arreglar la carga inicial del
editor desplegado, manteniendo autorizacion del turno anterior. Alcance frontend,
sin datos de negocio ni APIs pagas. Rollback deee450 con backup previo.

## Diagnostico

applyMockupAvailability busca trim-shirt-side-group, trim-short-side-group y
trim-short-hem-group. Esos tres div.trim-group carecen de id en index.html.
La excepcion ocurre antes de updateFrame/updateViewButtons en restoreSketch.
init ya dibujo colores y elementos de HTML antes de aplicar la configuracion,
por eso quedan visibles hasta otro evento. El catch general informa moldes.

Navegador interno no disponible: getState devuelve disabled. No se accede por
otro controlador. Tests ejecutaran codigo real con DOM de fixtures del HTML.

## Reproduccion

Imagen desplegada deee450 healthy confirmada. Prueba ejecuta init, captureSketch,
restoreSketch y applyMockupAvailability reales con ids derivados de index.html.
No es un navegador ni prueba de raster. Con codigo/HTML desplegado, el arranque
de empresa y preview fallan por null.toggleAttribute antes de updateFrame.

GREEN con tres ids añadidos y primer render diferido hasta restore: empresa,
opciones de vivos, configurador y preview pasan sin interaccion. Se comprueba
tambien preservacion de documento cacheado y aviso ante imagen ausente.
Sin modificar SQLite real, sin IA ni cache del usuario.
