# SPX-ERR-20261019-002 - Mascara transformada incompleta en cache recortada

- Fecha: 2026-10-19.
- Sintoma: El render nativo de prueba dejaba pixeles fuera de las mangas al usar destination-in con una mascara completa transformada.
- Causa raiz: La combinacion de lienzo pequeno, traslacion y mascara grande no limpiaba toda la cache en el motor nativo; sin evidencia de fallo equivalente en navegador.
- Solucion: Restablecer transformacion y aplicar solo el recorte de mascara correspondiente a la cache, cubriendo todo el lienzo local.
- Prevencion/guardia: bocetos/private/verify-side-warp.mjs compara las funciones reales con mascaras PSD: cero cambios fuera de mangas y cero cambios en pixeles de cuerpo; no inferir fidelidad visual desde pruebas sinteticas.
