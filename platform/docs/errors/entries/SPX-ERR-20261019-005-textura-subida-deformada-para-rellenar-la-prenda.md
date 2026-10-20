# SPX-ERR-20261019-005 - Textura subida deformada para rellenar la prenda

- Fecha: 2026-10-19.
- Sintoma: Imagenes y PDF cargados se estiraban o deformaban automaticamente al montar frente, espalda y short.
- Causa raiz: drawPowerClips y texturePlacement usaban la envolvente del molde para todo clip, incluido custom; la geometria generica de mangas usaba cover y bleed.
- Solucion: Uploads custom usan ajuste proporcional contain sin bleed y no pasan por drawTorsoTexture. Controles, render y exportacion comparten la misma base; scaleX/scaleY manuales se respetan.
- Prevencion/guardia: tests/custom-texture-aspect.test.mjs verifica aspecto, contain, las cinco piezas a1x/2x, edicion independiente y regresion del montaje IA. PDF horizontal con circulo confirmado en navegador.
