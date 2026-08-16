# SPX-ERR-20260816-001 - npm run consume opciones nombradas

- Fecha: 2026-08-16.
- Sintoma: `npm run context:library -- --limit=5 consulta` emitio `Unknown cli config` y no entrego `--limit` al script en este entorno Windows.
- Causa raiz: npm interpreto la opcion nombrada como configuracion propia durante el forwarding observado.
- Solucion: usar un limite posicional: `npm run context:library -- 5 "consulta"`.
- Prevencion/guardia: el parser acepta limite posicional entre 3 y 5 y los tests negativos rechazan valores fuera de rango.
