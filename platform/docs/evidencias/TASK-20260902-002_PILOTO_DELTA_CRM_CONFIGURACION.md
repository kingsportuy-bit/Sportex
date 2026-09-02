# Evidencia TASK-20260902-002

Estado: PREFLIGHT_EN_CURSO
Entorno: PILOTO_DELTA
Fecha: 2026-09-02

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
- No se realizaron todavía acciones remotas de escritura.

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
- Workflow: 26/26; Core/API: 59/59; SQL inicial: 24 tablas con RLS forzado y rollback;
  documentación, TypeScript y build: PASS.
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
