# SPX-ERR-20261019-001 - Salida de imagen menor al minimo de pixeles

- Fecha: 2026-10-19.
- Sintoma: OpenAI rechaza 512x512 y 1024x512 con HTTP 400.
- Causa raiz: La cuadricula logica de 512 por celda no alcanza el minimo de 655360 pixeles de salida.
- Solucion: Aumentar solo densidad de salida a multiplos de 16; conservar coordenadas logicas y proporcion.
- Prevencion/guardia: tests/fitted-rectangles.test.mjs y comprobacion de tamano en server.mjs; no reintentar una llamada paga sin revisar uso y respuesta.
