# Evidencia TASK-20260902-001

Estado: COMPLETADO_LOCAL
Entorno: DESARROLLO_LOCAL
Fecha: 2026-09-02

## Autorización y alcance

Fito aprobó pasar del prototipo a implementación local y pidió que la base de
datos soporte la configuración de la empresa. El diseño visual vigente del
panel WhatsApp queda fuera de cambios y deberá reutilizarse directamente.

## Preflight inicial

- `npm run scan:text`: `NUL_SCAN_RESULT=clean`.
- `npm run context -- feature`: `SPORTEX_CONTEXT=PASS`, sin tarea activa previa.
- `npm run task:doctor`: `SPORTEX_TASK_DOCTOR_RESULT=pass`.
- Worktree canónico limpio en `2713e85a125c8c981dea966b3e04749cbd41f110`.
- Sin acciones remotas, mensajes, datos reales ni migraciones ejecutadas.

## Resultado implementado

- La navegación visible quedó en `Leads`, `Clientes`, `Pedidos`, `Mi empresa`.
- Leads y Clientes reutilizan el mismo `#whatsapp-view`, su mismo DOM y sus
  estilos vigentes. Leads excluye conversaciones convertidas; Clientes muestra
  las convertidas y usa las etapas configurables del pedido.
- La conversión existente mueve la conversación de Leads a Clientes y conserva
  el vínculo con Cliente, seña y Pedido gobernado por el Core.
- Pedidos conserva tablero Kanban, planilla y edición de columnas.
- Se eliminaron textos que presentaban a Delta como identidad del producto;
  Delta sigue siendo una empresa usuaria, no SPORTEX.

## Mi empresa

La nueva superficie permite editar y guardar:

- identidad y contacto de la marca;
- moneda, seña, vigencia de presupuesto y plazo inicial;
- medios de pago, entregas, condiciones de venta y notas productivas;
- productos con mínimo, plazo, tabla de talles y escalas de precio;
- tablas de talles con medidas flexibles;
- fotos de tela, imágenes, guías y documentos de uso frecuente.

El formulario está conectado a `GET/PUT /v1/company/configuration`; no escribe
la base desde el navegador.

## Modelo y persistencia

- Agregado `CompanyConfiguration` versionado por tenant.
- Capacidades separadas `company.read` y `company.manage`.
- Escritura idempotente, control de versión optimista y evento de auditoría.
- Adaptadores equivalentes en memoria y PostgreSQL.
- Migración `20260902_011_company_configuration` con perfiles, productos,
  escalas de precio, tablas de talles y recursos.
- Las cinco tablas habilitan y fuerzan RLS por `app.tenant_id`; rollback sólo
  elimina los objetos nuevos.
- La migración quedó preparada pero no fue ejecutada en PILOTO_DELTA ni en
  ningún entorno remoto.

## Validación automática

- `node --check frontend/app.js`: PASS.
- `git diff --check`: PASS; sólo advertencia informativa CRLF/LF en HTML.
- `npm run validate`: PASS.
- Workflow: 26/26 regresiones PASS.
- Core/API: 59/59 tests PASS, incluidos versión, idempotencia, permisos y
  aislamiento de configuración entre tenants.
- SQL: 24 tablas verificadas, RLS forzado y rollback presente.
- TypeScript check y build: PASS.
- Documentación: 77 archivos requeridos y 16 módulos PASS.

## QA visual y operativa local

Se levantó únicamente la demo persistente local en `127.0.0.1:18091` y se
verificó mediante navegador:

- Leads conserva la superficie visual WhatsApp con sus 18 conversaciones;
- Clientes usa la misma superficie y presenta etapas de pedidos;
- Pedidos abre tablero/planilla y `Revisar lead` lleva al chat correcto;
- Mi empresa agrega producto, escala, tabla y recurso, guarda versión 1 y
  recupera los valores después de recargar;
- desktop y viewport móvil 390 x 844 sin errores de consola;
- el nombre configurado de la marca aparece como autor de mensajes salientes.

Los datos usados en Mi empresa fueron ficticios y permanecieron sólo en la
memoria del servidor local de prueba.

## Límites y próximos gates

- No hubo push, deploy, migración remota, acceso a secretos, mensajes ni datos
  reales.
- PILOTO_DELTA continúa exactamente en el runtime previamente publicado.
- Aplicar `20260902_011`, asignar capacidades reales y desplegar requiere una
  tarea posterior con GO exacto, backup/rollback y certificación.
- El flujo explícito de reposiciones y la asistencia/bot de ventas quedan para
  cortes posteriores; no se simulan como completados en esta tarea.
