# Panel sencillo de bocetos — Implementation Plan

> For agentic workers: usar superpowers:executing-plans en esta sesion, sin subagentes.

**Goal:** Alta manual, acceso, bloqueo al vencer y configuracion por empresa.
**Architecture:** Un modulo ESM del Core, store JSON local atomico y adaptador
HTTP en el servidor existente. Identidad local con hash y sesiones revocables;
Auth/DB reales se conectan despues, antes de publicarlo. Sin otro proceso Core.
**Tech Stack:** Node, ESM, crypto, HTML/CSS/JS existentes; sin dependencias nuevas.
**Spec:** docs/superpowers/specs/2026-10-19-panel-bocetos-design.md

## Global Constraints

- DESARROLLO_LOCAL, loopback, datos ficticios y proveedores simulados en pruebas.
- Core decide tenant, vencimiento, permisos y creditos; frontend solo solicita.
- Usuario/contrasena, renovacion manual y bloqueo con sesion recordada.
- Tema oscuro SPORTEX; dialogos propios; conservar el editor y sus bocetos.
- Sin subagentes ni cambios de CRM, base real, despliegue o secretos versionados.

## Review Focus

- Vencimiento con sesion abierta o reinicio: vuelve a comprobar servidor.
- Doble envio con ultimo credito: reserva atomica e idempotencia.
- Reinicio o fallo de guardado: no inventar saldo ni perder aislamiento.
- Costo ausente/repetido: desconocido no es cero ni doble cargo.
- Cambio de empresa: recursos/cache/bocetos no se mezclan.

### Task 1: Reglas y persistencia

**Files:** core/bocetos/{store,service,costs}.mjs;
bocetos/tests/lab-service.test.mjs.
**Interfaces:** createLabService({store,clock}) -> servicio con setup, login,
session, createCompany, updateCompany, saveAsset, beginOperation, finishOperation,
recordCosts; store.read()/store.transaction(fn), estado privado tenant-aware.

- [x] Escribir tests de permisos, expiracion exacta, renovacion, ultimo credito,
  idempotencia, reinicio, activos privados y cargos repetidos/ausentes.
- [x] Ejecutarlos: deben fallar por capacidad ausente.
- [x] Implementar modulo minimo, archivos privados y sincronizador inyectable.
- [x] Ejecutar node --test bocetos/tests/lab-service.test.mjs: PASS.

### Task 2: Adaptador HTTP y panel

**Files:** bocetos/lab-http.mjs, public/panel.{html,js,css},
public/lab-client.js, server.mjs; tests/lab-http.test.mjs.
**Interfaces:** createLabHttp({service}) -> handle(req,res,path); cookies HttpOnly
y comprobacion de origen en mutaciones; tenant desde sesion, nunca payload.

- [x] Escribir pruebas HTTP de login, roles, recursos privados y vencimiento.
- [x] Ejecutarlas: FAIL por rutas ausentes.
- [x] Implementar rutas/panel compacto con alta, renovar, suspender, recursos y
  consumo; campos secretos enmascarados; formularios preservan errores.
- [x] Ejecutar pruebas HTTP: PASS. Revisar navegador interno y viewport estrecho.

### Task 3: Conectar editor y cerrar

**Files:** public/app.js, public/index.html, public/lab-client.js,
server.mjs, DESIGN.md, contrato, tarea, estado y evidencia.
**Interfaces:** sesion/configuracion bootstrap antes de abrir store del editor;
API gestionada reserva consumo y contabiliza usage, sin contador autoritativo local.

- [x] Probar API gestionada: sin sesion no genera; repeticion no llama otra vez;
  resultado ambiguo no reintenta; empresa B no obtiene recursos de A.
- [x] Conectar namespace de cache y defaults/recursos, sin migracion automatica.
- [x] Ejecutar check:bocetos y validate; probar alta/login/bloqueo/renovacion.
- [x] Revision propia de seguridad y UI; evidencia y workflow:close PASS.

## Ejecucion y continuidad

Fito pide proceder con desarrollo chico. Se ejecuta directamente en el checkout
actual para reutilizar el editor local sin copiar sus assets privados. El plan
es la guia de ejecucion y se marca cada tarea al validar. No se crea otro stack,
infraestructura o sistema de pagos. La adaptacion local no se declara comercial.

## Correccion de Fito: claves compartidas y registro por llamada

- [x] Core conserva cada intento con tenant/actor trusted, usage y request ID.
- [x] Principal/respaldo compartidos; 401/429 permite un intento adicional.
- [x] Cache por tenant; replay y reinicio no repiten llamadas inciertas.
- [x] Panel Ver consumo y conciliacion oficial global, sin bindings por empresa.
- [x] Pruebas simuladas, regresiones y QA interno, sin gasto real.
