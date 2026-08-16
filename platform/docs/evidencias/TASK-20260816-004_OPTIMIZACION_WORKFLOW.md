# Evidencia — optimizacion del workflow SPORTEX

Task: `TASK-20260816-004`
Fecha: `2026-08-16`
Entorno: `DOCUMENTACION`
Runtime afectado: no

## Resultado

- `PROJECT_STATE.json` conserva solo cinco cambios recientes y deriva el resto
  a `docs/historico/PROJECT_HISTORY.json`, sin eliminar entradas.
- La Biblioteca resuelve una consulta por ranking OR y devuelve entre tres y
  cinco fuentes focales.
- El preflight de errores usa ranking OR por defecto y conserva `-Match All`.
- `check` y `close` aplican perfiles `docs`, `local` y `pilot-release`; el perfil
  inferido puede escalar, pero no degradarse manualmente.
- Las fichas WhatsApp, Evolution, DB y VPS reflejan el estado certificado del
  piloto sin exponer secretos ni operar sobre el runtime.

## Metricas antes y despues

| Metrica | Antes | Despues | Variacion |
|---|---:|---:|---:|
| Contexto `guidance` | 34.743 caracteres / 8.686 tokens estimados / 13 fuentes | 17.046 caracteres / 4.262 tokens estimados / 5 fuentes | -50,9 % estimado |
| Estado vivo | 25.518 caracteres | 11.966 caracteres cerrado | -53,1 % |
| Historial visible en estado | 26 cambios | 5 cambios | 21 archivados, 0 perdidos |
| Consulta Biblioteca `WhatsApp Evolution DB VPS piloto` | sin selector focal | 5 fuentes / 4.946 caracteres / 1.237 tokens estimados | carga acotada |

La estimacion usa `ceil(caracteres / 4)` y sirve para comparar el paquete
documental; no representa facturacion exacta del modelo.

## Validaciones

- `npm run context -- guidance`: PASS; 5 fuentes, 0 referencias duplicadas.
- `npm run context:library -- 5 "WhatsApp Evolution DB VPS piloto"`: PASS.
- `npm run errors:preflight -- "npm opcion limit query"`: PASS con ranking OR.
- `npm run test:workflow`: PASS, 13/13 casos positivos y negativos.
- `npm run validate:docs`: PASS.
- `npm run validate-docs`: PASS, 69 documentos requeridos y 16 modulos.
- `npm run validate`: PASS; 55/55 tests Core, 19 tablas con RLS, SQL y build.
- `git diff --check`: PASS.

## Limites y rollback

No se tocaron `PILOTO_DELTA`, runtime, datos, mensajes, secretos ni Meta. No se
agrego STAGING y no se debilitaron gates sensibles. El rollback consiste en
revertir el commit local de esta task y regenerar las vistas; el historial
derivado permanece trazable.
