# SPX-ERR-20260903-001 - Viñetas perdidas por comparar contra baseline local

- Fecha: 2026-09-03.
- Sintoma: El release 51c2dfe conservó el CSS del checkout pero revirtió el diseño de viñetas ya activo en 8823a773.
- Causa raiz: El artefacto publicado contenía ajustes SVG/CSS no reconciliados en la rama local. La QA de navegación no comparó la geometría con el artefacto real.
- Solucion: Recuperar únicamente svgPath, drawWhatsAppTabbedPanelFrame y los estilos exactos del artefacto previo; mantener CRM/Core/Mi empresa nuevos.
- Prevencion/guardia: scripts/tests/whatsapp-visual-parity.test.mjs valida una referencia congelada recuperada de 8823a773 y rechaza 51c2dfe. No actualizar esa referencia sin aprobación visual explícita. Antes de promover, comparar las superficies protegidas contra el runtime saliente, no solo contra Git local.
