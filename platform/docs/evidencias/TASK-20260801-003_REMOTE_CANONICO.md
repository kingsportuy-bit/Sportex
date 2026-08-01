# Evidencia TASK-20260801-003 - Remote GitHub canonico

Fecha: 2026-08-01.

## Hallazgo

Al publicar el commit `9b66881`, GitHub acepto el push pero informo que el
repositorio fue movido a `https://github.com/kingsportuy-bit/Sportex.git`.

## Cambio

- `origin` fetch: `https://github.com/kingsportuy-bit/Sportex.git`.
- `origin` push: `https://github.com/kingsportuy-bit/Sportex.git`.
- referencias operativas actualizadas con el casing canonico;
- snapshots historicos conservados sin reescribir sus observaciones.

## Verificacion

- `git remote -v`: ambas URLs canonicas;
- `git ls-remote --heads origin sportex-governance-20260801`: commit remoto
  `9b6688193e0ed609b72b8e0d89233ef79e771e9d` antes del segundo commit;
- consistencia de tareas: PASS, 10 tareas y 1 activa durante la ejecucion;
- no se modifico runtime ni se reescribio historia.
