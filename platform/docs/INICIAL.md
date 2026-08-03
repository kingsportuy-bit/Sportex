# Entrada operativa SPORTEX

## Proposito

Esta es la puerta unica de entrada al proyecto. El estado actual no se deduce
del chat ni de documentos manuales: vive en `state/PROJECT_STATE.json` y se
proyecta en `SESSION_STATE.md` y `generated/CURRENT_CONTEXT.md`.

## Arranque obligatorio

Desde `platform/`:

```powershell
npm run scan:text
npm run context -- guidance
```

Para trabajo material, reemplazar `guidance` por la intencion correcta y leer
todos los archivos que el comando enumere bajo `READ:`. Un arranque sano debe
devolver `SPORTEX_CONTEXT=PASS` y mostrar campaña, tarea, objetivo, alcance,
entorno, riesgos, worktree, rama y proxima accion.

Fito no necesita pedir que se lea este archivo. `AGENTS.md` obliga a ejecutar
este arranque en cada hilo nuevo. Si aparece `SPORTEX_WORKFLOW=FAIL`, detener el
cambio material y reconciliar fuentes; `npm run workflow:sync` se usa solamente
cuando las fuentes son coherentes y las vistas quedaron desactualizadas.

## Router de intenciones

| Intencion | Uso | Mutacion |
| --- | --- | --- |
| `guidance` | entender el sistema o decidir por donde entrar | no |
| `documentation` | cambiar reglas, contratos o gobernanza | solo archivos |
| `architecture` | definir owners, capas y fronteras | con tarea |
| `feature` | agregar capacidad | con tarea |
| `fix` | corregir un fallo reproducible | con tarea |
| `operation` | migracion, deploy, secretos o runtime | con tarea y permiso |
| `incident` | responder a una falla del piloto/comercial | diagnostico primero |
| `product` | reglas y decisiones de negocio | con tarea si cambia fuente |
| `quality` | tests, evidencia y certificacion | segun tarea |
| `library` | localizar modulo, capa o superficie | normalmente no |

La resolucion completa vive en `MODOS_DE_TRABAJO.md`.

## Fuentes obligatorias

1. `OPERADOR_PROYECTO.md` para autoridad y comunicacion.
2. `state/PROJECT_STATE.json` para trabajo vivo.
3. `TASKS/INDEX.md` y la tarea activa para alcance.
4. `DOCUMENTATION_ARCHITECTURE.md` para jerarquia.
5. `ENVIRONMENTS_CONTRACT.md` para limites de entorno.
6. `BIBLIA_SPORTEX.md`, `BUSINESS.md` y `ARCHITECTURE.md` para producto.
7. `biblioteca/README.md` para ubicar owners y contratos focales.
8. `DECISIONES.md` para decisiones tecnicas durables.

## Reglas madre

```text
EL CORE DECIDE. EL FRONTEND PRESENTA.
WHATSAPP INFORMA. EL CORE VALIDA.
TODO DATO OPERATIVO PERTENECE A UNA EMPRESA.
NO MEZCLAR RESPONSABILIDADES ENTRE MODULOS.
SIN TAREA, EVIDENCIA Y ROLLBACK NO HAY CAMBIO MATERIAL.
```

## Limite actual

El proyecto usa `PILOTO_DELTA` en lugar de un STAGING separado. Esto no reduce
los controles: mientras Delta valida, el sistema puede manejar datos reales y
se trata como produccion restringida. Ninguna accion remota queda autorizada
por leer este documento.

Los nombres tecnicos heredados que contienen `staging` son artefactos de la
implementacion de julio de 2026. No definen el entorno objetivo y solo pueden
renombrarse o reutilizarse dentro de una tarea de migracion aprobada.

## Estado honesto

`IMPLEMENTADO_NO_VALIDADO`, `PENDIENTE_EVIDENCIA`, `BLOQUEADO`,
`CERTIFICADO_PILOTO` y `OPERATIVO_COMERCIAL` no son equivalentes. El runtime se
observa; no se declara manualmente desde la documentacion.

## Cierre obligatorio

- Consulta read-only: `npm run workflow:check`.
- Cambio material: actualizar tarea, estado, decisiones y evidencia; luego
  ejecutar `npm run workflow:close -- TASK-AAAAMMDD-NNN`.
- No declarar un checkpoint terminado sin `SPORTEX_CLOSE=PASS`.

El cierre ejecuta la validacion local completa de documentacion, workflow,
tipos, tests, SQL y build. No despliega ni concede permisos remotos.
