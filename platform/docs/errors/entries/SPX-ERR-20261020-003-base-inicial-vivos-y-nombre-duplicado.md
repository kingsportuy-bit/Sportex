# SPX-ERR-20261020-003 - Base inicial con vivos y nombre duplicado

- Fecha: 2026-10-20.
- Sintoma: Nuevas empresas/bocetos mostraban vivos activos y dos nombres.
- Causa raiz: El preset exportado incluia cuatro activaciones y un texto adicional; restoreWorkspace preferia su copia cacheada a la base corregida.
- Solucion: Cinco vivos apagados, nombre normal arriba y sin duplicado. Revision focal del preset defectuoso cacheado, conservando archivos y documentos.
- Prevencion/guardia: company-defaults y sketch-base prueban alta, base anterior en cache, nuevos bocetos y conservacion del documento editado.
