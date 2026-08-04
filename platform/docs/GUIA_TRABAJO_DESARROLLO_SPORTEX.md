# Guia maestra del sistema de desarrollo SPORTEX

## Para que existe

SPORTEX es un software operativo complejo. Esta guia conecta producto,
documentacion, arquitectura, tareas, codigo, datos, pruebas y releases para que
el proyecto no dependa de la memoria de Fito, Codex ni una conversacion.

## Organigrama del sistema de desarrollo

Fito y DELTA definen producto y autorizaciones; SPORTEX convierte ese alcance en estado, tarea, contratos, codigo, pruebas, release y evidencia.

## Arquitectura por responsabilidades

1. INICIAL.md y el workflow resuelven contexto y estado canonico.
2. La tarea y Biblioteca delimitan owner, contratos y codigo.
3. Git y tests identifican y prueban el cambio.
4. Release, runtime y evidencia demuestran lo entregado sin sustituirse entre si.

## Flujo normal

```text
idea o problema -> guidance/diagnostico -> task corta -> rama -> implementacion
-> pruebas locales -> decision de Fito -> release inmutable -> PILOTO_DELTA
-> observacion -> validacion Delta -> cierre
```

`PRODUCCION_COMERCIAL` agrega un gate independiente de salida al mercado. La
validacion del piloto no lo activa automaticamente.

## Que fuente responde cada duda

PROJECT_STATE.json responde el trabajo vivo; la tarea delimita alcance; Biblioteca y contratos definen responsabilidad; Git, tests, runtime y evidencia prueban resultados.

## Quien puede decidir que

Fito decide negocio, prioridad y operacion real. La tarea y el contrato owner delimitan la implementacion de Codex; solo el runtime observado demuestra que algo esta activo.

## Tareas y continuidad

- Una sola tarea activa.
- Cola corta y ordenada.
- Cada tarea declara `work_type`, `context_focus`, `campaign` e impacto sobre
  esta guia.
- Cerrar exige evidencia, deuda restante y estado actualizado.
- Una tarea bloqueada se mueve a cola; no queda fingiendo actividad.
- Un objetivo grande puede usar una campana, pero cada cambio sigue teniendo
  su propia tarea y alcance.
- Cada hilo material registra un checkpoint en la tarea, el estado canonico,
  decisiones y evidencia antes del cierre.
- Una campaña se abre en `PROJECT_STATE.json`; su vista es
  `CAMPAIGN_STATE.json`. Activa: `nextCampaign: null`.

## Entornos

- `DOCUMENTACION`: reglas sin runtime.
- `DESARROLLO_LOCAL`: fixtures y pruebas sin datos reales.
- `PILOTO_DELTA`: uso real restringido, con controles de produccion.
- `PRODUCCION_COMERCIAL`: futuro, bloqueado por gate comercial explicito.

La ausencia de STAGING separado reduce infraestructura, no controles. El piloto
debe ser reversible, observable y recuperable.

## Arquitectura y Biblioteca

Una capacidad de negocio es un modulo. El recorrido tecnico se divide en capas.
API, web, DB, WhatsApp, Evolution, archivos, workers y VPS son superficies. Un
cambio puede tocar varias piezas, pero cada responsabilidad conserva un owner.

Todo modulo documenta responsabilidad, permisos, entrada, salida, persistencia,
auditoria, efectos, workers, tests, evidencia, rollback y estado.

## Calidad y cierre

La validacion debe ser proporcional al riesgo:

- documentacion: generados, enlaces, estructura, semantica y Git;
- fix: reproduccion que falla antes y pasa despues;
- feature: contrato, unitarias, integracion, permisos y regresion;
- datos: migracion, aislamiento, backup y rollback;
- mensajeria: idempotencia, allowlist/alcance y no duplicacion;
- release: commit remoto, scope, artefacto, permiso y observacion.

`IMPLEMENTADO_NO_VALIDADO` es un estado valido. `CERTIFICADO_PILOTO` exige
evidencia real. `OPERATIVO_COMERCIAL` exige ademas el gate de mercado.

### Cierre ejecutable

```powershell
npm run workflow:close -- TASK-AAAAMMDD-NNN
```

Antes de emitir `SPORTEX_CLOSE=PASS`, el workflow exige coincidencia de tarea y
estado, cambio reciente, decision y evidencia, estado explicito de migraciones,
pruebas, despliegues, integraciones y datos sensibles, pendientes y proxima
accion. Luego regenera las vistas y ejecuta `npm run validate`, que cubre scan,
tests del workflow, documentacion, TypeScript, tests del Core, SQL y build.

Una consulta read-only cierra con `npm run workflow:check`. Ninguno de estos
comandos concede permisos de runtime.

## Como se mantiene actualizada esta guia

Si una tarea cambia entrada, modos, tareas, campanas, entornos, pruebas,
Biblioteca, release, deploy, evidencia o guards, declara
`development_guide_impact: required` y actualiza esta guia en el mismo cambio.

`scripts/validate-development-guide-sync.mjs` bloquea divergencias. Los detalles
viven en sus documentos owner; esta guia explica el mapa y no los duplica.

## Glosario simple

Contrato: regla estable. Task: cambio acotado. Gate: condicion bloqueante. Evidencia: prueba reproducible. Piloto: uso real restringido previo al mercado.

### Demos locales persistentes

Su cierre debe probar semilla ficticia, aislamiento tenant, reinicio del proceso, reset controlado y QA visual responsive. La persistencia local nunca se presenta como base real, migracion, integracion o certificacion de piloto.
