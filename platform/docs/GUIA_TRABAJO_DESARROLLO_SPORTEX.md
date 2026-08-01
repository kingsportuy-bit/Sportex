# Guia maestra del sistema de desarrollo SPORTEX

## Para que existe

SPORTEX es un software operativo complejo. Esta guia conecta producto,
documentacion, arquitectura, tareas, codigo, datos, pruebas y releases para que
el proyecto no dependa de la memoria de Fito, Codex ni una conversacion.

## Organigrama del sistema de desarrollo

```text
Fito / DELTA (producto y autorizaciones)
  -> pedido y criterio de aceptacion
SPORTEX / PROJECT_STATE (trabajo vivo)
  -> tarea activa y contratos focales
Biblioteca (owners por modulo, capa y superficie)
  -> codigo + migraciones + pruebas
Release governance (commit, alcance, artefacto, permiso, rollback)
  -> PILOTO_DELTA observado
Evidencia y feedback de DELTA
  -> cierre o siguiente tarea
```

## Arquitectura por responsabilidades

1. `INICIAL.md` enruta la intencion.
2. `PROJECT_STATE.json` conserva la continuidad canonica.
3. Las tareas delimitan el cambio; no reemplazan contratos.
4. La Biblioteca identifica el owner correcto.
5. Los contratos definen entradas, salidas, permisos y efectos.
6. Git identifica el cambio exacto.
7. Los tests prueban codigo y reglas.
8. La gobernanza de release prueba que se desplego el artefacto aprobado.
9. La observacion runtime prueba el estado real.
10. La evidencia permite cerrar sin afirmaciones de memoria.

## Flujo normal

```text
idea o problema -> guidance/diagnostico -> task corta -> rama -> implementacion
-> pruebas locales -> decision de Fito -> release inmutable -> PILOTO_DELTA
-> observacion -> validacion Delta -> cierre
```

`PRODUCCION_COMERCIAL` agrega un gate independiente de salida al mercado. La
validacion del piloto no lo activa automaticamente.

## Que fuente responde cada duda

| Duda | Fuente |
| --- | --- |
| que se esta haciendo | `state/PROJECT_STATE.json` |
| cual es el alcance | tarea en `TASKS/active/` |
| como se trabaja | esta guia y `MODOS_DE_TRABAJO.md` |
| quien decide una regla | `OPERADOR_PROYECTO.md` y contrato owner |
| donde vive una responsabilidad | `biblioteca/README.md` |
| que comportamiento debe existir | contrato del modulo + negocio |
| que codigo se entrego | commit Git y scope |
| que esta ejecutandose | observacion runtime y deployment |
| que fue probado | evidencia ligada a commit y entorno |
| que ocurrio antes | tareas cerradas, changelog e historico |

## Quien puede decidir que

- Fito: negocio, prioridad, alcance comercial, operacion real y salida al mercado.
- Tarea activa: que puede modificar Codex en el trabajo actual.
- Contrato owner: comportamiento y frontera tecnica permanente.
- Codex: implementacion tecnica dentro del alcance, pruebas y recomendacion.
- Runtime observado: unico que puede demostrar que algo esta activo.

Codex no convierte una idea aprobada en permiso de deploy. Fito no necesita
definir detalles tecnicos que ya estan dentro de un contrato aprobado, pero si
debe decidir cuando cambian alcance, riesgo, datos reales o compromisos.

## Tareas y continuidad

- Una sola tarea activa.
- Cola corta y ordenada.
- Cada tarea declara `work_type`, `context_focus`, `campaign` e impacto sobre
  esta guia.
- Cerrar exige evidencia, deuda restante y estado actualizado.
- Una tarea bloqueada se mueve a cola; no queda fingiendo actividad.
- Un objetivo grande puede usar una campana, pero cada cambio sigue teniendo
  su propia tarea y alcance.

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

## Como se mantiene actualizada esta guia

Si una tarea cambia entrada, modos, tareas, campanas, entornos, pruebas,
Biblioteca, release, deploy, evidencia o guards, declara
`development_guide_impact: required` y actualiza esta guia en el mismo cambio.

`scripts/validate-development-guide-sync.mjs` bloquea divergencias. Los detalles
viven en sus documentos owner; esta guia explica el mapa y no los duplica.

## Glosario simple

- **contrato**: regla estable que define una responsabilidad.
- **task**: cambio temporal con alcance y cierre.
- **owner**: modulo o documento responsable de una decision.
- **gate**: condicion bloqueante antes de avanzar.
- **evidencia**: prueba reproducible ligada a una version.
- **artefacto inmutable**: build identificado que no cambia despues de aprobarse.
- **rollback**: forma probada de volver al estado anterior.
- **drift**: runtime distinto al release esperado.
- **piloto**: uso real de Delta antes de abrir SPORTEX al mercado.
