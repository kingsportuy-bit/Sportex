# SPX-ERR-20261019-004 - Escape del selector cerraba el ajuste de texturas

- Fecha: 2026-10-19.
- Sintoma: Al usar el selector de pieza podia cerrarse el ajuste completo y quedar controles de pieza fuera del modo.
- Causa raiz: El handler global de Escape no excluia inputs/selects; beginPieceEdit no exigia el modo activo.
- Solucion: Respetar Escape de controles nativos y modales propios; exigir editingTexture antes de iniciar pieza.
- Prevencion/guardia: bocetos/tests/canvas-controls.test.mjs verifica Escape de selector frente a Escape del lienzo. QA interno confirma selector y rotacion persistidos.
