# SPX-ERR-20261019-006 - Scope de release eliminaba el punto de dotfiles

- Fecha: 2026-10-19.
- Sintoma: El bundle rechazaba platform/.dockerignore pese a estar declarado en scope.
- Causa raiz: TrimStart eliminaba caracteres punto y barra en lugar del prefijo literal ./.
- Solucion: Conservar dotfiles y quitar solo ./; mismo criterio en guard y bundle.
- Prevencion/guardia: Test ejecuta normalizador real: dotfiles y rutas Windows; rutas absolutas/traversal rechazadas.
