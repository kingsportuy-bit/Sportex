# SPX-ERR-20260801-001 - Guidance mutaba la vista de contexto

- Fecha: 2026-08-01.
- Sintoma: `generate-docs` terminaba en PASS, pero la siguiente validacion informaba `CURRENT_CONTEXT.md is stale`.
- Causa raiz: el modo `--print-context` escribia las vistas generadas con la intencion temporal `guidance` en lugar de limitarse a imprimir.
- Solucion: separar la salida de consulta de la escritura; `--print-context` ya no modifica archivos.
- Prevencion/guardia: la validacion ejecuta una consulta guidance y vuelve a comprobar que las vistas persistidas siguen idempotentes.
- Alcance: sistema documental SPORTEX; no afecto runtime ni codigo de negocio.
