# Canonizar remote GitHub de SPORTEX

id: TASK-20260801-003
owner: Codex
requester: Fito
estado: done
lifecycle: closed
completion_kind: ready_for_task
work_type: fix
campaign: none
context_focus: documentation
development_guide_impact: none

## objetivo

Eliminar el redirect del remoto GitHub y alinear las referencias operativas con
la ubicacion canonica `kingsportuy-bit/Sportex`.

## alcance_permitido

- actualizar el remote local `origin` del nuevo worktree;
- corregir referencias operativas vigentes;
- conservar snapshots y evidencias historicas sin reescribir sus hechos;
- validar documentacion, Git y publicacion de la rama.

## alcance_prohibido

- reescribir commits publicados;
- modificar `main` o la rama `sportex-task007-staging`;
- desplegar o tocar runtime;
- borrar carpetas o historia.

## entradas

- redirect informado por GitHub al publicar `9b66881`;
- remote anterior `https://github.com/kingsportuy-bit/sportex.git`;
- remote canonico `https://github.com/kingsportuy-bit/Sportex.git`.

## salidas

- `origin` sin redirect;
- documentos operativos con casing canonico;
- segundo commit publicado en la rama de gobernanza.

## validacion

- `git remote -v`;
- `git ls-remote` sobre la rama;
- `npm run validate-docs:release`;
- worktree limpio y rama sincronizada.

## evidencia

- `docs/evidencias/TASK-20260801-003_REMOTE_CANONICO.md`.

## rollback

Restaurar la URL anterior del remote; los dos endpoints apuntan al mismo
repositorio, pero se conserva el canonico para evitar redirects.

## deuda_restante

Ninguna dentro del cambio de URL. Las tareas de seguridad y piloto conservan
su prioridad independiente.
