# Versionar OS y primera vertical comercial local

id: TASK-20260803-002
owner: Codex
requester: Fito
estado: done
lifecycle: closed
completion_kind: local_commit_ready
work_type: operacion
campaign: CAMP-20260803-001
context_focus: quality
development_guide_impact: none
updated_at: 2026-08-03

## objetivo

Revisar el conjunto completo de cambios locales pendientes, confirmar que
pertenece exclusivamente al OS de `TASK-20260802-001` y a la primera vertical
de `TASK-20260803-001`, repetir las validaciones y preparar un unico commit
local listo para subir a la rama actual, sin ejecutar el push.

## alcance_permitido

- inventariar y revisar todos los archivos modificados y no rastreados;
- clasificar cada cambio entre OS, primera vertical y registro de esta tarea;
- comprobar formato, ausencia de secretos y ausencia de material ajeno;
- ejecutar las validaciones focales y generales aplicables;
- actualizar tarea, estado, vistas y evidencia del versionado local;
- preparar el staging y crear un unico commit local en la rama actual;
- verificar el commit, la limpieza del worktree y la diferencia con upstream;
- informar el contenido exacto antes de solicitar autorizacion para push.

## alcance_prohibido

- corregir, ampliar o refactorizar el producto fuera de los cambios ya validados;
- abrir otra tarea funcional de la campana;
- hacer push o cualquier otra escritura en GitHub sin autorizacion nueva;
- deploy, migraciones o cambios en `PILOTO_DELTA` o `PRODUCCION_COMERCIAL`;
- Evolution, Meta, Chatwoot, Supabase, VPS, mensajes, datos o secretos reales;
- modificar el legado, otras ramas o worktrees.

## entradas

- worktree local de `sportex-governance-20260801` en el commit base
  `a5535ca8671ccf2ea1b0e29b12202aff7c6587ef`;
- cambios locales registrados por `TASK-20260802-001` y
  `TASK-20260803-001`;
- evidencias y expedientes cerrados de ambas tareas;
- autorizacion de Fito para preparar un commit local, con push retenido.

## salidas

- inventario completo clasificado;
- validaciones repetidas y evidencia registradas;
- un unico commit local verificable;
- worktree limpio y comparacion exacta con upstream;
- solicitud de autorizacion que identifique rama, commit y archivos a subir.

## validacion

- ningun archivo pendiente queda sin clasificacion;
- no se incluyen secretos, datos reales ni cambios ajenos;
- `git diff --check` y el control equivalente del staging pasan;
- `npm run validate` pasa sin ampliar alcance;
- el commit contiene solo OS, primera vertical y registros de esta tarea;
- la rama queda un commit por delante del upstream y el worktree queda limpio;
- no se ejecuta `git push`.

## evidencia

- `docs/evidencias/TASK-20260803-002_VERSIONADO_LOCAL.md`.

## rollback

Antes del push, el commit local puede preservarse sin publicar y sus cambios
pueden inspeccionarse contra el commit padre. No se reescribe, borra ni revierte
trabajo ajeno; cualquier rollback material requerira una instruccion posterior.

## deuda_restante

- el push a GitHub queda pendiente de autorizacion explicita de Fito;
- las vulnerabilidades y tareas en cola conservan su alcance independiente;
- esta tarea no certifica runtime, persistencia ni integraciones reales.

## registro_de_avances

### 2026-08-03 - auditoria y validacion completas

- Se clasificaron 57 rutas sin faltantes ni material ajeno: 17 del OS, 26 de
  la primera vertical, 12 compartidas o generadas y 2 de este expediente.
- El control de nombres y contenido no encontro archivos de riesgo, claves
  privadas, tokens conocidos, JWT ni asignaciones de secretos.
- El primer `git diff --cached --check` encontro seis lineas vacias extra al
  final de archivos nuevos. Se quitaron sin cambiar comportamiento y el control
  se repitio antes del commit.
- El primer `npm run validate` fue bloqueado por `guidance` en `35181/35000`;
  se compacto el estado sin ampliar el presupuesto.
- La repeticion integral paso: workflow 8/8, documentacion 65 archivos y 16
  modulos, TypeScript, Core 20/20, SQL estatico y build.
- `git fetch` confirmo que la rama y su upstream siguen en `0/0` sobre
  `a5535ca8671ccf2ea1b0e29b12202aff7c6587ef`.
- El staging y el commit se ejecutaron solamente despues de obtener
  `SPORTEX_CLOSE=PASS`. La verificacion posterior confirmo perfil release en
  PASS, worktree limpio y una sola diferencia local contra upstream.

### 2026-08-03 - apertura y preflight

- `SPORTEX_CONTEXT=PASS` para intencion `operation`.
- `task:doctor` confirmo cero tareas activas, la rama esperada y asigno
  `TASK-20260803-002`.
- Git registro 55 archivos sucios antes de abrir esta tarea: cambios del OS y
  de la primera vertical aun sin commit ni push.
- El upstream configurado es `origin/sportex-governance-20260801`.
- La primera validacion integral se detuvo en el presupuesto documental
  `guidance` (`35181/35000`). Se compacto el estado de esta misma tarea sin
  ampliar el limite y se programo una repeticion completa.
- No se accedio a servicios, datos sensibles ni entornos remotos.

## decisiones

- Se preparara un solo commit local para conservar juntos el OS y la primera
  vertical que depende de ese OS.
- El push es una operacion separada: se detiene hasta informar su contenido
  exacto y recibir autorizacion explicita de Fito.

## cierre

- Resultado: conjunto completo auditado, validado y preservado en un commit
  local unico.
- Campana activa: `CAMP-20260803-001`.
- Tarea activa siguiente: ninguna.
- Proxima accion: informar el SHA y contenido exacto que se subiria y esperar
  autorizacion explicita para push.
