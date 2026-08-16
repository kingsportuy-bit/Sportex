# Arquitectura documental SPORTEX

## Objetivo

La documentacion es parte ejecutable del sistema de desarrollo. Debe permitir
retomar SPORTEX sin reconstruir decisiones desde conversaciones sueltas.

## Fuente canonica y vistas

- `docs/state/PROJECT_STATE.json`: estado de trabajo canonico.
- `docs/state/DOCUMENT_REGISTRY.json`: clasificacion, autoridad y router.
- `docs/DECISIONES.md`: decisiones tecnicas durables y reemplazos.
- `docs/TASKS/{active,queued,closed}`: contratos de trabajo.
- `docs/historico/PROJECT_HISTORY.json`: checkpoints anteriores retirados del
  estado vivo; no gobierna trabajo nuevo.
- `docs/SESSION_STATE.md`, `docs/TASKS/INDEX.md` y
  `docs/generated/CURRENT_CONTEXT.md`, `docs/state/CAMPAIGN_STATE.json` y
  `docs/errors/index.json`: vistas generadas; no se editan.
- Git: codigo, contratos y evidencia versionada.
- Observacion runtime: unica fuente para afirmar que un servicio esta activo.

## Jerarquia

Ante contradicciones:

1. autorizacion puntual de Fito para la operacion exacta;
2. `INICIAL.md` y `ENVIRONMENTS_CONTRACT.md`;
3. `BIBLIA_SPORTEX.md`, `BUSINESS.md` y `ARCHITECTURE.md`;
4. contratos transversales;
5. contrato y ficha del modulo, capa o superficie;
6. tarea activa;
7. evidencia ligada a version y entorno;
8. historico.

Una tarea no puede contradecir un contrato rector. Una evidencia vieja no
describe el runtime actual. El historico nunca gobierna trabajo nuevo.

## Clases

- **Rectores**: producto, negocio, arquitectura, seguridad y entornos.
- **Contratos**: entradas, salidas, permisos, datos, efectos y rollback.
- **Biblioteca**: indice de owners por modulo, capa y superficie.
- **Tareas**: objetivo temporal, alcance, validacion y evidencia.
- **Estado**: JSON canonico y vistas generadas.
- **Evidencia**: resultados reproducibles ligados a commit y entorno.
- **Historico**: decisiones reemplazadas o trabajo cerrado.

## Flujo

```text
pedido de DELTA -> decision de producto -> task SPORTEX -> evidencia -> rama
-> implementacion -> tests -> autorizacion remota -> release inmutable
-> observacion -> cierre -> siguiente task
```

DELTA administra prioridades y acepta resultados. No mantiene una copia de la
verdad tecnica de SPORTEX.

## Salud documental

La documentacion esta sana cuando:

- existe una entrada unica y una tarea activa como maximo;
- estado, tarea y vistas generadas coinciden;
- campaña, tarea, entorno, Git y evidencia quedan detectables sin leer chats;
- migraciones, pruebas, despliegues, integraciones, datos sensibles y
  pendientes tienen estado explicito;
- cada documento tiene owner, autoridad e intenciones de lectura;
- cada modulo tiene contrato comun, tests, evidencia y rollback;
- no hay NUL, BOM, mojibake ni referencias locales rotas;
- la guia maestra cambia junto con el sistema de desarrollo;
- los estados declarados no exceden la evidencia disponible.
- el cierre material devuelve `SPORTEX_CLOSE=PASS` despues de validar
  documentacion y regresiones locales de codigo.

## Presupuesto de contexto

El router carga solo documentos relevantes. Los presupuestos viven en
`state/DOCUMENT_REGISTRY.json`; ampliarlos requiere una tarea documental y una
justificacion. Reporta caracteres y tokens estimados; la estimacion usa cuatro
caracteres por token y no se presenta como consumo real. Historia y tareas
cerradas se consultan de forma focal.
