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
la tarea activa que indique la vista generada.

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
