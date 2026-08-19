# SPX-ERR-20260819-002 - Recarga devolvía al login ante una falla no autenticada

- Fecha: 2026-08-19.
- Sintoma: Al recargar, una sesión válida volvía a la pantalla de login si fallaba una carga inicial del puesto.
- Causa raiz: El arranque borraba la sesión ante cualquier error de carga, sin distinguir autenticación de datos o disponibilidad puntual.
- Solucion: Validar sesión primero, mostrar el puesto y conservarla ante fallas de datos; sólo borrar cuando Core confirme autenticación inválida.
- Prevencion/guardia: Los flujos de arranque deben separar errores de identidad de errores de carga y probar ambos caminos.
