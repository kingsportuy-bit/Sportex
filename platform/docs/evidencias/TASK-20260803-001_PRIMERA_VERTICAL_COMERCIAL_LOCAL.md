# Evidencia TASK-20260803-001 - Primera vertical comercial local

- Estado: `PASS_LOCAL`
- Fecha: `2026-08-02`
- Entornos: `DOCUMENTACION`, `DESARROLLO_LOCAL`
- Worktree: `C:/Users/Fito/Documents/CODEX/SPORTEX`
- Rama: `sportex-governance-20260801`
- Datos: exclusivamente fixtures ficticios; sin secretos ni conexiones reales

## Preflight confirmado

- `NUL_SCAN_RESULT=clean`.
- `SPORTEX_CONTEXT=PASS` con cero tareas y campañas activas antes de abrir.
- `TASK-20260803-001` asignada por `npm run task:next-id`.
- `npm run task:doctor` en PASS; los cambios locales previos pertenecen al
  workflow documental cerrado y se preservan.
- Sin entradas conocidas en el registro de errores para `campaign` o
  `Evolution`.

## Alcance de la evidencia

Demostrar localmente las ramas `META_EXACTO` y `DESCONOCIDO`, deduplicación por
mensaje del proveedor, aislamiento por tenant, permisos, proyección de etapa y
próxima acción, y render visual de la mesa comercial.

## Resultados

### Contrato y Core

- `META_EXACTO`: el fixture con `externalAdReply.sourceId` conservó
  `ad-ficticio-*` como `adId` exacto.
- `DESCONOCIDO`: el fixture sin evidencia dejó `adId`, `sourceUrl`, `ctwaClid`
  y `ref` en `null`.
- Deduplicación: repetir el mismo `providerMessageId` con otra clave HTTP
  devolvió la misma proyección sin duplicar conversación, lead u oportunidad.
- Idempotencia HTTP: reutilizar una clave con otro payload produjo
  `idempotency_conflict`.
- Aislamiento: el mismo evento en dos tenants produjo proyecciones separadas.
- Permisos: sin `commercial.read` o `commercial.replay`, el Core denegó acceso.
- Guard de entorno: las rutas locales quedaron ausentes si faltó cualquiera de
  `development|test`, store `memory` o autenticación de desarrollo.

### API y frontend

- `POST /v1/local/evolution-replays` y `GET /v1/commercial/workspace` pasaron
  sus pruebas locales.
- La mesa comercial mostró 2 tarjetas: 1 exacta y 1 desconocida.
- Métricas visibles: conversaciones `02`, exactas `01`, desconocidas `01`,
  acciones pendientes `02`.
- Ambas oportunidades mostraron etapa `NUEVO` y próxima acción
  `Revisar conversación y calificar la consulta`.
- QA visual de escritorio y viewport móvil: sin overflow horizontal.
- Consola del navegador: `0` errores y `0` warnings.
- El servidor local se detuvo después de la prueba; puerto 8080 libre.

### Validación reproducible

- `node --check frontend/app.js`: PASS.
- `npm run test:workflow`: PASS, `8/8`.
- `npm test`: PASS, `20/20`.
- `npm run validate-docs`: PASS, 65 archivos rectores y 16 módulos.
- `npm run check`: PASS.
- `npm run validate-sql`: PASS estático, sin ejecutar migraciones.
- `npm run build`: PASS.
- `npm run validate`: PASS.
- `git diff --check`: PASS; solamente advertencias informativas de fin de
  línea del worktree.

La primera ejecución integral detectó vistas generadas desactualizadas después
del avance documental. Se ejecutó `npm run workflow:sync` y la validación
completa posterior pasó. No se ocultó ni se forzó el fallo.

El primer intento de cierre detectó el presupuesto de contexto `guidance` en
`35141/35000`; una primera compactación lo dejó en `35003/35000`. Se compactó
la misma regla una segunda vez sin ampliar el presupuesto. Resultado final:

- `SPORTEX_CLOSE=PASS`;
- campaña activa: `CAMP-20260803-001`;
- tarea activa: ninguna;
- próxima acción: esperar autorización explícita de Fito.

## Operaciones externas

- Mensajes enviados: `0`.
- Integraciones reales consultadas o modificadas: `0`.
- Migraciones ejecutadas: `0`.
- Deploys: `0`.
- Cambios en `PILOTO_DELTA` o producción: `0`.

## Rollback

Revertir los archivos de `TASK-20260803-001`. El store local es efímero y se
vacía al detener el proceso; no existe estado remoto que restaurar.
