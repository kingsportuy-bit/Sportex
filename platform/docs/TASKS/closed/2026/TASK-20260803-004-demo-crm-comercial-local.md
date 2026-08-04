# Demo CRM comercial local navegable

id: TASK-20260803-004
owner: Codex
requester: Fito
estado: done
lifecycle: closed
completion_kind: local_demo_validated
work_type: feature
campaign: CAMP-20260803-001
context_focus: feature
development_guide_impact: required
updated_at: 2026-08-03

## objetivo

Ampliar la primera vertical de `CAMP-20260803-001` hasta una demo CRM
comercial local, navegable y funcional, con 18 leads completamente ficticios,
persistencia local y operaciones comerciales gobernadas por el Core.

## alcance_permitido

- extender la superficie Comercial y la arquitectura Core existentes;
- sembrar 18 leads ficticios con conversaciones, productos, anuncios, etapas,
  datos confirmados, faltantes y proximas acciones variados;
- mostrar tablero por etapas, filtros, lista y ficha comercial completa;
- cambiar etapa, editar proxima accion y registrar seguimiento interno;
- persistir el workspace ficticio en un archivo JSON local ignorado por Git;
- restaurar la semilla canonica mediante confirmacion explicita;
- actualizar contratos, estado, decisiones, evidencia y vistas generadas;
- ejecutar validaciones, QA visual de escritorio y movil, y dejar la demo
  local iniciada para validacion de Fito.

## alcance_prohibido

- datos, telefonos, conversaciones, IDs publicitarios o credenciales reales;
- Evolution, Meta, Chatwoot, Supabase remoto, VPS o cualquier integracion real;
- enviar mensajes, publicar, activar anuncios o producir efectos externos;
- IA real, pagos, pedidos, produccion o automatizacion comercial;
- migraciones, `PILOTO_DELTA`, deploy o `PRODUCCION_COMERCIAL`;
- crear una aplicacion paralela, escribir desde frontend a persistencia o
  trasladar reglas de negocio fuera del Core;
- commit, push, cierre de la campana o apertura de otra tarea.

## entradas

- `TASK-20260803-001` y su primera vertical local validada;
- `CAMP-20260803-001` activa;
- autorizacion explicita de Fito para `DOCUMENTACION` y `DESARROLLO_LOCAL`;
- plataforma, contratos y workflow vigentes de SPORTEX.

## salidas

- modelo comercial local ampliado y tenant-aware;
- semilla canonica de 18 casos ficticios;
- persistencia JSON local atomica, protegida por el guard local;
- API Core para consulta, cambio de etapa, proxima accion, seguimiento y reset;
- mesa comercial master-detail responsive y sin controles de envio;
- pruebas, evidencia, pendientes y proxima accion documentados.

## validacion

- 18 leads visibles con seis etapas, ambos productos, cuatro anuncios y cuatro
  casos `DESCONOCIDO`;
- busqueda y filtros combinables por etapa, producto y atribucion;
- ficha con conversacion ordenada, creativo, confirmados, faltantes, etapa,
  proxima accion e historial;
- cambios de etapa, proxima accion y seguimientos sobreviven reiniciar el Core;
- reset exige confirmacion y restaura exactamente la semilla ficticia;
- rutas y archivo local ausentes fuera de `development|test + memory + dev auth`;
- pruebas focales, `npm run validate`, QA a `1440x900` y `390x844`, y
  `SPORTEX_CLOSE=PASS`.

## evidencia

- `docs/evidencias/TASK-20260803-004_DEMO_CRM_COMERCIAL_LOCAL.md`;
- resultados reproducibles de API, persistencia, reinicio, reset y navegador.

## rollback

Detener el proceso local y revertir solamente los archivos enumerados en este
expediente. El archivo runtime ficticio puede regenerarse desde la semilla y
no contiene datos remotos ni reales.

## deuda_restante

- persistencia remota y migraciones quedan fuera;
- no hay integraciones reales, IA, mensajes, pagos, pedidos ni produccion;
- cualquier tarea posterior de la campana requiere nueva autorizacion de Fito.

## registro_de_avances

### 2026-08-03 - apertura y preflight

- Push exacto de `47d47e2` verificado en local, tracking y origin con
  divergencia `0/0` antes de abrir la tarea.
- `SPORTEX_CONTEXT=PASS`, `task:doctor` en PASS y proximo ID asignado
  `TASK-20260803-004` con cero tareas activas y worktree limpio.
- Alcance, archivos, modelo de datos, criterio de aceptacion y exclusiones
  informados a Fito antes del primer cambio.
- Handoff historico de DELTA preservado como solo lectura; la implementacion
  ocurre en el repositorio gobernado `C:/Users/Fito/Documents/CODEX/SPORTEX`.

## decisiones

- Extender la mesa Comercial y el puerto de persistencia existentes.
- Persistir solo fixtures en JSON local atomico; no usar `localStorage` ni una
  base o servicio remoto.
- `SENA_VALIDADA` es una etapa comercial ficticia visible como
  `SEÑA_VALIDADA`; no crea ni certifica pagos.
### 2026-08-03 - implementacion local validada

- La plataforma existente expone una mesa CRM master-detail; no se creo una aplicacion paralela.
- La semilla canonica contiene 18 leads ficticios: 9 de camisetas, 9 de equipo completo, 14 con atribucion exacta y 4 `DESCONOCIDO`.
- Las seis etapas quedaron distribuidas 4/4/3/3/2/2 y todos los expedientes tienen cuatro mensajes historicos ficticios con ambos sentidos.
- El Core gobierna transiciones, version esperada, proxima accion, seguimiento y reset; `SENA_VALIDADA` no certifica un pago.
- El store JSON local es tenant-aware, atomico, ignorado por Git y falla cerrado si el archivo esta corrupto.
- La prueba manual cambio etapa, proxima accion y seguimiento, reinicio el proceso, comprobo persistencia y restauro la semilla desde la confirmacion controlada.
- QA escritorio `1440x900`: 18 filas, 6 estaciones, ficha y reset visibles, sin overflow ni errores de consola.
- QA movil `390x844`: lista y ficha navegables, filtros en una columna, 4 mensajes visibles y sin overflow.
- `node --check frontend/app.js`, `npm run validate` y `git diff --check` pasaron; Core: 25/25, workflow: 8/8, documentacion: 65 archivos y 16 modulos.
- Demo disponible en `http://127.0.0.1:8080/` con persistencia ficticia restaurada a la semilla.

## cierre

- Resultado: demo CRM local navegable, persistente y funcional validada.
- Evidencia: `docs/evidencias/TASK-20260803-004_DEMO_CRM_COMERCIAL_LOCAL.md`.
- Campana: `CAMP-20260803-001` permanece `ACTIVE`.
- Tarea activa siguiente: ninguna.
- Proxima accion: Fito valida la interfaz local; cualquier nueva tarea requiere su autorizacion explicita.
- Acciones externas, integraciones, mensajes, deploy, datos reales y produccion: 0.