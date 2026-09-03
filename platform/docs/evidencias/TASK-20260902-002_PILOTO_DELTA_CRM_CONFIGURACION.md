# Evidencia TASK-20260902-002

Estado: PASS_PILOTO_DELTA_DESPLEGADO_Y_VERIFICADO
Entorno: PILOTO_DELTA
Fecha: 2026-09-03

## Autorización y alcance

Fito autorizó aplicar en la producción restringida de Delta los cambios locales
de `TASK-20260902-001`. El alcance incluye commit remoto, backup/restore,
migración 011, capacidades mínimas, despliegue y verificación de solo lectura.
Quedan excluidos mensajes, pedidos, pagos, Evolution, Meta Ads, otros tenants y
`PRODUCCION_COMERCIAL`.

## Preflight inicial

- `npm run scan:text`: `NUL_SCAN_RESULT=clean`.
- `npm run context -- operation`: `SPORTEX_CONTEXT=PASS`.
- `npm run task:doctor`: PASS; siguiente ID `TASK-20260902-002`.
- Público observado: `/health=200`, `/ready=200`.
- Servicio `sportex_staging_core`: 1/1 sobre
  `sportex-staging:8823a77365f78f25`.
- Release público observado: `8823a77365f78f25db9fbf7afb5decd21e59f547`.
- Imagen de rollback observada por ID sin registrar secretos.
- La documentación previa apuntaba a 4898d55; se actualiza la verdad desde la
  observación actual antes de cualquier mutación.
- En este punto del registro no se habían realizado acciones remotas de
  escritura.

## Plan de promoción

1. Crear y publicar un commit exacto del alcance aprobado.
2. Ejecutar release guard y producir bundle/hash inmutables.
3. Respaldar DB y capacidades; ensayar restore y migración en base aislada.
4. Aplicar 011 y verificar RLS/aislamiento con el rol de aplicación.
5. Construir/desplegar la imagen exacta y observar servicio/endpoints.
6. Verificar login y superficies sin ejecutar acciones comerciales.

## Certificación local previa al commit

- El `checkReady()` PostgreSQL del candidato comprueba acceso a perfiles,
  talles, productos, escalas y recursos; la imagen no podrá quedar ready sin
  los objetos de 011.
- El seed Delta incorpora las capacidades `company.read` y `company.manage`;
  la asignación real se hará de forma acotada sobre membresías activas del
  tenant Delta y con snapshot previo.
- `git diff --check`: PASS; único aviso informativo CRLF/LF en HTML.
- `npm run validate`: PASS.
- Workflow: 26/26; Core/API: 59/59; SQL final: 25 tablas incluyendo
  `stage_definitions`, RLS forzado y rollback; documentación, TypeScript y
  build: PASS.
- No hubo mutación remota durante esta certificación.

## Reconciliación del inventario SQL

- La base real contiene 20 tablas `sportex_staging_*`, todas con RLS forzado.
- La migración 011 todavía no está aplicada y agrega cinco tablas: el total
  posterior correcto es 25.
- El validador omitía `stage_definitions` y no exigía explícitamente los archivos
  007--010. Se corrigió antes de cualquier mutación remota y el candidato será
  recertificado con el conteo completo.

## Rollback fijado

Volver primero a `sportex-staging:8823a77365f78f25`, comprobar 1/1 y
health/ready. Conservar 011; cualquier `down` o restore real queda fuera de este
gate. Las capacidades pueden volver al snapshot previo si fuera necesario.

## Candidato inmutable

- Commit y release:
  `51c2dfea8abcc05bcce56a015c5ed2b2295a9ee8`.
- Imagen: `sportex-staging:51c2dfea8abcc05b`.
- ID de imagen:
  `sha256:d40ef5d4532afc18ea005b93b6fba5fcd8f9cc894b077351d27caa2359a64c3c`.
- SHA-256 del bundle completo:
  `0e48f5bc434c91ddee906e6e788cb971d638295cb4004035cf9009f36a318af4`.
- El release guard validó commit remoto, alcance, tarea autorizada y bundle
  antes de la primera mutación del piloto.

## Backup, restore y migración

- Backup privado: `/var/backups/sportex/TASK-20260902-002-51c2dfe`.
- SHA-256 del dump:
  `75a00900978c2cb5f0ada0e41b84001cc2dfd9982dc63432a7370239c72614b9`.
- Restore aislado en `sportex_restore_task_20260902_002`: PASS.
- Ensayo aislado: 20 tablas iniciales, 25 después de 011, 20 después del
  rollback y 25 tras reaplicar. El tenant correcto vio una fila de prueba y el
  tenant cruzado vio cero.
- Aplicación real: 20 -> 25 tablas, 25/25 con RLS forzado y cinco tablas nuevas
  de configuración de empresa.
- La migración se aplicó antes de cambiar la imagen, como exigía el gate.

## Despliegue y capacidades

- `sportex_staging_core` convergió 1/1 sobre la imagen exacta.
- `/health=200`, `/ready=200` y release público igual al commit completo.
- Los flags existentes de Evolution, timeline, media y no leídos se
  preservaron; no se cambiaron webhooks, secretos ni DNS.
- Existe una membresía activa de Delta y recibió únicamente
  `company.read`/`company.manage`.
- El contador de outbound fue 18 antes y después de migración, capacidades,
  despliegue y QA.
- Cero errores críticos (`Unhandled`, `uncaught` o `fatal`) atribuibles al
  candidato durante la observación.

## QA autenticada de solo lectura

- Login PASS con la cuenta operativa ya disponible en el navegador.
- Leads PASS: 25 conversaciones visibles y plantilla inicial de etapas Delta.
- Clientes PASS: mismo módulo visual de WhatsApp, con su clasificación propia.
- Pedidos PASS: tablero y planilla disponibles, más configuración de columnas.
- Parametrización PASS: el editor de etapas de Leads cargó agregar, editar,
  ordenar y eliminar; se cerró sin guardar cambios.
- Mi empresa PASS: carga tenant-aware de marca, productos/precios, talles,
  recursos y reglas de venta/producción; no se pulsó guardar.
- Ancho móvil 390x844: formulario de Mi empresa visible y adaptado a una columna,
  con navegación horizontal interna y botón de menú; luego se restauró el
  viewport normal. No se certificó el flujo completo móvil de conversación.
- Consola del navegador: cero errores.
- No se abrió ninguna conversación, no se respondió WhatsApp y no se creó ni
  modificó ningún pedido, pago o dato comercial.

## Check final

- Imagen/release exactos, servicio 1/1, health/ready 200.
- Endpoint `/v1/company/configuration` sin sesión: 401.
- 25 tablas `sportex_staging_*`, 25 con RLS forzado y cinco tablas de empresa.
- Una membresía Delta con las capacidades mínimas.
- Outbound: 18, sin variación.
- Errores críticos: 0.
- Resultado: `SPORTEX_FINAL_CHECK=PASS`.

## Incidentes controlados y riesgo residual

- El primer extractor del bundle no pudo usar `unzip`, que no está instalado;
  se reemplazó por `python3 -m zipfile` antes de cualquier mutación.
- El rol `postgres` no podía ejecutar SET ROLE en el restore; la sesión de
  ensayo se abrió con `supabase_admin` para asumir el rol de prueba y comprobar
  RLS. El ensayo pasó antes de aplicar 011 al piloto.
- El primer intento de deploy falló al interpretar nombres de secretos y se
  detuvo antes de cambiar Swarm; corregido el parser, el despliegue pasó.
- `npm audit` del build informa una vulnerabilidad moderada y cuatro altas ya
  tratadas como deuda; no se amplió alcance para actualizar dependencias en esta
  promoción.

## Resultado

`PILOTO_DELTA` quedó operativo sobre el candidato exacto y listo para la prueba
manual de Fito. `PRODUCCION_COMERCIAL`, mensajes reales, conversiones y pagos
permanecieron fuera de alcance.

El cierre documental posterior volvió a ejecutar la suite completa:
26/26 workflow, 59/59 Core/API, 25 tablas SQL, TypeScript y build PASS;
`SPORTEX_CLOSE=PASS`, perfil `pilot-release` y ninguna tarea activa.
