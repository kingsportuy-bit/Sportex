# Guia maestra del sistema de desarrollo SPORTEX

## Para que existe

SPORTEX es un software operativo complejo. Esta guia conecta producto,
documentacion, arquitectura, tareas, codigo, datos, pruebas y releases para que
el proyecto no dependa de la memoria de Fito, Codex ni una conversacion.

## Organigrama del sistema de desarrollo

## Arquitectura por responsabilidades

Fito y DELTA definen producto y permisos. INICIAL/workflow resuelven contexto;
tarea y Biblioteca delimitan owners; Git/tests prueban el cambio; runtime y
evidencia demuestran lo activo.

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

Hay una sola tarea activa y una cola corta. Cada tarea declara tipo, foco,
campana e impacto sobre esta guia; su cierre registra evidencia, deuda, estado y
checkpoint. Una campana agrupa objetivos sin reemplazar tareas acotadas.

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

La validacion es proporcional: docs revisa vistas; fix reproduce; feature prueba
contrato/permisos; datos exige aislamiento/rollback; mensajeria idempotencia; y
release commit, artefacto, permiso y observacion.

`IMPLEMENTADO_NO_VALIDADO` es un estado valido. `CERTIFICADO_PILOTO` exige
evidencia real. `OPERATIVO_COMERCIAL` exige ademas el gate de mercado.

### Cierre ejecutable

```powershell
npm run workflow:close -- TASK-AAAAMMDD-NNN
```

`SPORTEX_CLOSE=PASS` exige tarea/estado, evidencia, decisiones, migraciones,
pruebas, despliegues, integraciones, pendientes y `npm run validate`.

Una consulta read-only cierra con `npm run workflow:check`. Ninguno de estos
comandos concede permisos de runtime.

## Como se mantiene actualizada esta guia

Si una tarea cambia entrada, modos, tareas, campanas, entornos, pruebas,
Biblioteca, release, deploy, evidencia o guards, declara
`development_guide_impact: required` y actualiza esta guia en el mismo cambio.

`scripts/validate-development-guide-sync.mjs` bloquea divergencias. Los detalles
viven en sus documentos owner; esta guia explica el mapa y no los duplica.

## Glosario simple

Contrato: regla estable. Gate: condicion bloqueante. Evidencia: prueba reproducible.

### Demos locales persistentes

Su cierre debe probar semilla ficticia, aislamiento tenant, reinicio del proceso, reset controlado y QA visual responsive. La persistencia local nunca se presenta como base real, migracion, integracion o certificacion de piloto.

### WhatsApp manual

Imagenes y estado no leido son contratos operativos separados de IA. Los bytes
son privados por tenant, el estado de lectura es por actor y conversacion, y
todo envio conserva previsualizacion, confirmacion humana e idempotencia.
En PILOTO_DELTA se promueven migracion primero, imagen despues y flags al final;
el cambio de Base64 conserva webhook/eventos previos y no autoriza mensajes.
