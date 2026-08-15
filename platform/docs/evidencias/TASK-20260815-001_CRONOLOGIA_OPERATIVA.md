# Evidencia — cronología operativa WhatsApp

Fecha: 2026-08-15
Task: `TASK-20260815-001`
Entorno ejecutado: `DESARROLLO_LOCAL`
Destino preparado: `PILOTO_DELTA`

## Resultado corregido después del NO-GO

Mensajes WhatsApp y eventos operativos son clases distintas. La cronología es
derivada y reconstruible: un fallo de lectura o escritura de su tabla se aísla
con savepoint, se registra sin contenido sensible y no revierte conversación,
mensaje, oportunidad ni `activity_data`. Al leer se fusionan fuente y
proyección por ID determinista, por lo que un evento fuente no desaparece.

`ASSISTANT` sigue siendo solo actor/origen pasivo. No existe proveedor, prompt,
job, worker, propuesta, activación o salida automática de IA.

## Corte técnico

- ID acotado `activity:<md5>` calculado con el mismo contrato de longitudes en
  TypeScript y SQL. La nota canónica admite 1000 caracteres y el detalle
  derivado 1015, por lo que el prefijo más largo no provoca pérdida.
- Humanización type-aware: seguimiento traduce solo el resultado anterior a
  `: `; etapa solo `previous/next`; motivo, nota y otros textos libres quedan
  byte-for-byte. La función temporal del backfill replica esa estructura.
- Migración `005` con preflight de array, nulls, longitudes y timestamps,
  backfill, RLS, privilegios mínimos y down que no toca mensajes.
- `/ready` verifica workspace comercial y tabla `005` aun con flag visual OFF.
- Stack start-first usa healthcheck `/ready`; la migración debe preceder imagen.
- Rollback vuelve primero a la imagen anterior; el down es posterior y separado.
- UI preserva borrador y posición de lectura al abrir/cerrar Detalles.

## Pruebas automatizadas

- TypeScript y build: PASS.
- Core: 52/52 PASS.
- Documentación/workflow: PASS.
- SQL estático: 17 tablas, RLS, preflight y rollback: PASS.
- `git diff --check`: PASS.
- E2E reproducible: `npm run test:e2e:timeline`.
- PostgreSQL reproducible: `npm run test:postgres:timeline`.

## PostgreSQL 16 real local

Se aplicaron `001` a `005` sobre un contenedor temporal y dos tenants
ficticios. El rehearsal produjo:

```text
SPORTEX_COMMERCIAL_POSTGRES_REHEARSAL=PASS
TIMELINE_DEGRADED_MAIN_MUTATION_PRESERVED=true
FOLLOW_UP_MAX_NOTE_LENGTH=1000
FOLLOW_UP_MAX_DETAIL_LENGTH=1015
TIMELINE_PROJECTION_FAILURES=read,write
RLS_APP_TENANT_A_OWN=2
RLS_APP_TENANT_A_CROSS=0
RLS_APP_TENANT_B_OWN=1
REUP_MAX_NOTE_RECONSTRUCTED=true
REUP_FREE_TEXT_TOKENS_PRESERVED=true
SPORTEX_TIMELINE_POSTGRES_HARNESS=PASS
```

La prueba renombró temporalmente solo la tabla derivada: `/ready` falló, una
mutación de seguimiento confirmó versión 3 y guardó su actividad fuente, y la
lectura degradada reconstruyó el evento. La tabla se restauró y `/ready` volvió
a PASS.

El rol real `sportex_staging_app`, con `app.tenant_id` de A, observó 2 eventos
propios y 0 de B; con tenant B observó 1 propio. El transcript completo está en
`TASK-20260815-001_POSTGRES_TRANSCRIPT.md`.

## Migración, rollback y límites legacy

- Mensajes antes del down: 3; después del down: 3.
- Preflight con actor nulo: rechazado antes de crear tabla.
- Preflight con correlación de 201 caracteres: rechazado.
- Preflight con fecha imposible: rechazado como timestamp inválido.
- Tras restaurar las fuentes válidas, re-up/backfill: 5 eventos.
- La nota máxima repite todos los tokens técnicos y fue reconstruida con 1015
  caracteres: prefijo legible exacto y nota literal sin sustituciones.
- El contenedor temporal se verificó y eliminó.

## Navegador desktop y mobile

`npm run test:e2e:timeline` es autocontenido: compila, comprueba que 8091 esté
libre, levanta una demo ficticia aislada, ejecuta Chrome headless y siempre
detiene el servidor y elimina su JSON temporal. Genera capturas ignoradas en
`.sportex-local/e2e-conversation-timeline/`.

- Desktop 1280×480 y mobile 390×844 se ensayan en claro y oscuro.
- El cierre de Detalles conserva estilo local, `aria-label`, click y contraste:
  claro 16.35:1 texto/fondo y borde/cabecera; oscuro 11.74:1 y 12.30:1.
- Scroll, compositor, borrador, posición y retorno desde Detalles se preservan.
- Texto secundario de evento: 10 px mínimo medido; 2 eventos visibles.
- Se generan capturas antes y después del cierre para las cuatro combinaciones.
- Resultado final: `SPORTEX_TIMELINE_E2E_SELF_CONTAINED=PASS` y puerto 8091
  libre después del ensayo.

## Límites y efectos externos

- No se modificaron reglas comerciales, Delta ADS, Meta ni estados reales.
- No hubo push, deploy, migración remota ni mensaje real.
- `fca96c2`, `c22a714` y `e455915` permanecen como candidatos rechazados y no
  deben promoverse.

## Promoción y rollback preparados

La promoción futura exige nuevo candidato publicado y revisado, backup/restore,
migración `005`, smoke con rol app, `/ready=200` y GO exacto. El rollback de
runtime es `sportex-staging:3c8c9da25ba1fae3`; se vuelve primero a esa imagen y
se conserva la tabla aditiva. El flag OFF solo oculta UI, no reemplaza la
migración ni el readiness.
