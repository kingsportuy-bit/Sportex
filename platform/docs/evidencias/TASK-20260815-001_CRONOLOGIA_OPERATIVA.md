# Evidencia — cronología operativa WhatsApp

Fecha: 2026-08-15  
Task: `TASK-20260815-001`  
Entorno ejecutado: `DESARROLLO_LOCAL`  
Destino preparado: `PILOTO_DELTA`

## Resultado

SPORTEX puede proyectar en una misma cronología los mensajes de WhatsApp y los
hitos operativos ya aceptados por el Core, manteniéndolos como clases distintas.
Los mensajes conservan sus burbujas; los hitos aparecen como separadores
compactos con lenguaje operativo. La presentación está protegida por
`SPORTEX_CONVERSATION_TIMELINE_ENABLED`, apagado por defecto.

El contrato admite `actorKind=ASSISTANT` y `origin=ASSISTANT` solo como datos
pasivos. No se agregó proveedor, prompt, job, worker, propuesta, endpoint de
activación ni salida automática de IA.

## Corte técnico

- Modelo discriminado `MESSAGE | OPERATIONAL_EVENT`.
- Proyección determinista desde las actividades existentes del Core.
- Persistencia tenant-aware en
  `sportex_staging_conversation_timeline_events`.
- Migración aditiva `20260815_005_conversation_timeline` con backfill, RLS,
  grants mínimos y down que no toca mensajes.
- API retrocompatible: `messages` se conserva y `timeline` es adicional.
- UI WhatsApp-first: burbujas y compositor no cambian; los eventos se
  intercalan como información interna.

## Pruebas automatizadas

- TypeScript: PASS.
- Core: 48/48 PASS.
- SQL: PASS, 17 tablas esperadas, RLS forzado y rollback presente.
- Build: PASS.
- `git diff --check`: PASS.
- Casos focales: separación de tipos, reproyección sin duplicados,
  compatibilidad pasiva del actor asistente y flag opt-in.

## Ensayo PostgreSQL real local

Se ejecutaron las migraciones `001` a `005` en PostgreSQL 16 temporal con dos
tenants ficticios.

- Rehearsal comercial: PASS.
- Journal, outbox e idempotencia: PASS.
- Cronología antes del down: 4 entradas; mensajes: 3.
- Después del down: los 3 mensajes permanecieron.
- Después del re-up/backfill: 4 entradas recuperadas.
- Aislamiento RLS: tenant A vio 2 eventos y tenant B vio 1.
- El contenedor temporal fue detenido y eliminado después de verificarlo.

## Prueba visual local

En navegador de escritorio, el chat seleccionado mostró cuatro burbujas
WhatsApp y dos eventos operativos separados, con texto simple, compositor y
panel de detalles disponibles. El DOM accesible confirmó que los eventos no
usan nombres técnicos. La revisión mobile previa del mismo corte visual mostró
los separadores legibles y el compositor conservado; el flag agregado después
solo decide si se usa `timeline` o el fallback existente de `messages`.

## Pruebas negativas y límites

- No existe una ruta nueva para activar un asistente.
- No existe runtime, proveedor, prompt, job o worker de IA.
- Un evento con actor futuro `ASSISTANT` no puede convertirse en una burbuja.
- No se modificaron reglas comerciales, campañas, Meta/ADS ni estados Delta.
- No se desplegó, migró ni envió un mensaje real en esta task.

## Promoción y rollback preparados

La promoción requiere un candidato publicado exacto, backup verificado,
restore ensayado, migración `005`, flag de presentación en `true` y un GO
propietario que coincida exactamente con el guard. Hasta entonces la capacidad
permanece local y apagada por defecto.

Rollback de runtime: `sportex-staging:3c8c9da25ba1fae3`. El rollback de
presentación es apagar el flag. El down de `005` elimina solo la proyección
derivada; nunca mensajes, journal, outbox ni actividades fuente.
