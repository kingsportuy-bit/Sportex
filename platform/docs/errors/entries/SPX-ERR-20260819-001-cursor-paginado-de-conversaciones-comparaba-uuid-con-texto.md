# SPX-ERR-20260819-001 - Cursor paginado de conversaciones comparaba UUID con texto

- Fecha: 2026-08-19.
- Sintoma: Luego de autenticar, la carga inicial mostraba Unexpected internal error.
- Causa raiz: La consulta PostgreSQL tipaba el cursor como texto y lo comparaba con workspace_id UUID.
- Solucion: Tipar el cursor como UUID en la consulta y validarlo como UUID en la ruta HTTP.
- Prevencion/guardia: Toda consulta con cursor debe conservar el tipo de la clave comparada; validar con la consulta real en modo solo lectura antes de desplegar.
