# Registro de errores y fricciones SPORTEX

Un error se registra cuando obliga a cambiar metodo, herramienta, sintaxis,
arquitectura o guardia. El objetivo es no pagar dos veces el mismo aprendizaje.

## Flujo

1. Antes de una accion riesgosa, ejecutar un preflight focal:
   `powershell -File scripts/codex-preflight-errors.ps1 <palabras>`.
   El modo por defecto es `Ranked`: usa OR, puntua titulo/contenido/ruta y
   muestra las seis coincidencias mas relevantes. `-Match All` conserva la
   semantica historica AND cuando se necesita una coincidencia estricta.
2. Si un problema nuevo cambia el metodo, registrarlo con
   `scripts/codex-register-error.ps1`.
3. Agregar causa confirmada o claramente marcada como pendiente.
4. Registrar solucion y prevencion/guardia verificable.
5. Regenerar y validar la documentacion.

Las entradas viven en `docs/errors/entries/`; `docs/errors/index.json` es
generado y no se edita.
