# Automatizar contexto, tareas y cierre de SPORTEX

id: TASK-20260802-001
owner: Codex
requester: Fito
estado: done
lifecycle: closed
completion_kind: ready_for_campaign
work_type: documentacion
campaign: none
context_focus: documentation
development_guide_impact: required
updated_at: 2026-08-02

## objetivo

Completar y validar el sistema operativo documental de SPORTEX para que cada
hilo recupere automaticamente campaña, tarea, objetivo, alcance, entorno,
riesgos y proxima accion, y para que cada checkpoint material cierre con
documentacion, codigo, pruebas, pendientes y evidencia verificables.

## alcance_permitido

- auditar la gobernanza y scripts ya existentes de SPORTEX;
- preservar y extender el estado canonico y sus vistas generadas;
- agregar comandos ejecutables de contexto, chequeo, sincronizacion y cierre;
- registrar rama/worktree, entornos, migraciones, pruebas, despliegues,
  integraciones, datos sensibles y ultima evidencia sin copiar secretos;
- agregar registro durable de decisiones y evidencia de esta tarea;
- agregar pruebas automaticas del workflow;
- validar documentacion y regresiones locales.

## alcance_prohibido

- abrir o iniciar la campaña `SPORTEX — Sistema Comercial Asistido de Delta`;
- modificar el Core, frontend o reglas de negocio;
- ejecutar migraciones, despliegues o cambios remotos;
- leer, copiar o almacenar secretos o datos reales;
- modificar `PILOTO_DELTA`, `PRODUCCION_COMERCIAL` o el legado;
- borrar, reordenar en masa o sobrescribir trabajo existente.

## entradas

- gobernanza vigente de SPORTEX bajo `platform/`;
- referencias de workflow solicitadas desde DELTA;
- rama `sportex-governance-20260801` y worktree canonico de SPORTEX;
- pedido explicito de Fito del 2026-08-02.

## salidas

- workflow SPORTEX adaptado al desarrollo de software;
- estado canonico ampliado y vistas regenerables;
- comandos con `SPORTEX_CONTEXT=PASS` y `SPORTEX_CLOSE=PASS`;
- pruebas automaticas del workflow;
- guia, reglas, decisiones, tarea y evidencia sincronizadas;
- siguiente accion exacta, sin campaña activa.

## validacion

- `SPORTEX_CONTEXT=PASS` con campaña, tarea, alcance, entorno, Git y riesgos;
- guard negativo de cierre incompleto en PASS;
- 7/7 pruebas automaticas del workflow;
- scan anti-NUL en PASS;
- vistas idempotentes y actualizadas;
- documentacion full en PASS, 65 archivos y 16 modulos;
- consistencia de 11 tareas durante el trabajo;
- TypeScript en PASS;
- 16/16 tests del Core en PASS;
- SQL en PASS, 9 tablas transitorias con RLS forzado y rollback;
- build en PASS;
- `git diff --check` en PASS.
- `SPORTEX_CLOSE=PASS`, sin campaña ni tarea activa.

## evidencia

- `docs/evidencias/TASK-20260802-001_WORKFLOW_DOCUMENTAL.md`;
- `npm run validate` ejecutado el 2026-08-02;
- cierre final mediante `npm run workflow:close -- TASK-20260802-001`.

## rollback

Revertir unicamente los archivos de gobernanza, workflow, pruebas y vistas de
esta tarea. No hay rollback remoto porque no se autorizaron ni ejecutaron
cambios fuera del worktree local.

## deuda_restante

- La campaña comercial permanece sin iniciar.
- `TASK-20260801-002` y `TASK-20260719-007` conservan su estado previo en cola.
- Commit, push o integracion de rama requieren un paso Git posterior si Fito lo
  solicita; no son necesarios para validar este checkpoint local.

## registro_de_avances

### 2026-08-02 - cierre validado

- Se adapto la base existente sin reemplazarla ni tocar codigo de producto.
- Se agrego el workflow unico, su wrapper PowerShell, estado operativo ampliado,
  decisiones, vistas derivadas y pruebas automaticas.
- Se corrigio una no-idempotencia: el presupuesto de contexto usaba el tamaño
  anterior de `SESSION_STATE.md`; una prueba evita su regresion.
- Se adapto la invocacion de npm del cierre a Windows mediante `cmd.exe` y se
  cubrieron el TASK-ID posicional y el transporte multiplataforma con tests.
- La validacion local completa paso y la campaña siguio en `none`.

### 2026-08-02 - auditoria inicial

- Estado previo: documentacion full en PASS, Git limpio y cero tareas activas.
- Hallazgo: existian estado canonico, router, vistas y validadores, pero faltaba
  un workflow unico con PASS explicito de contexto/cierre, campos operativos
  completos y pruebas automaticas del cierre.

## decisiones

- `SPORTEX-DEC-001`: una fuente canonica y vistas derivadas.
- `SPORTEX-DEC-002`: cierre local completo, sin permiso remoto implicito.
- `SPORTEX-DEC-003`: campaña comercial no iniciada implicitamente.

## cierre

- Resultado: sistema operativo documental instalado y validado localmente.
- Campaña activa: ninguna.
- Tarea activa siguiente: ninguna.
- Proxima accion: abrir `SPORTEX — Sistema Comercial Asistido de Delta`.
