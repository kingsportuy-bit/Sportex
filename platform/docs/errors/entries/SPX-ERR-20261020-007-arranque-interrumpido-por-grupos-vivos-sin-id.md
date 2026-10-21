# SPX-ERR-20261020-007 - Arranque interrumpido por grupos de vivos sin id

- Fecha: 2026-10-20.
- Sintoma: Al iniciar se ven parametros HTML y error de moldes; al interactuar aparece la configuracion aplicada.
- Causa raiz: applyMockupAvailability busca tres grupos de vivos sin id en HTML; null.toggleAttribute interrumpe restoreSketch antes de actualizar el lienzo. init ya habia dibujado defaults.
- Solucion: Completar ids de los cinco grupos y activar assetsReady tras cargar parametros, dejando primer render a restoreSketch.
- Prevencion/guardia: editor-startup ejecuta init/restore y disponibilidad reales contra ids del HTML; primer frame configurado, preview, cache preservada y errores reales de imagen. RED/GREEN remoto, sin navegador simulado como QA visual.
