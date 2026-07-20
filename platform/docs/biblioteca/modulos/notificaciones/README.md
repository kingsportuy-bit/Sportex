# Módulo notificaciones

## Responsabilidad

Crear avisos internos y externos desde eventos autorizados y entregarlos mediante outbox.

## Fuente/decisión

`NOTIFICATIONS_CONTRACT.md`.

## Owner

Core SPORTEX decide; workers transportan.

## Permisos

Cada audiencia, canal y propósito define permisos y confirmaciones.

## Contrato de entrada

Evento, tenant, audiencia, propósito, prioridad, plantilla y correlación.

## Contrato de salida

Notificación omitida, pendiente, enviada, reintentando o fallida terminal.

## Persistencia

Reglas, plantillas, outbox, intentos, resultados y preferencias.

## Auditoría

Creación, aprobación, omisión, envío, error y reintento.

## Side effects

WhatsApp, email u otros canales futuros.

## Workers

Entrega, reintentos, expiración y cola muerta.

## Tests

Idempotencia, allowlist, preferencia, estado cambiado, error proveedor y tenant.

## Evidencia

Pendiente.

## Rollback

Cancelar pendientes; un envío realizado no se borra y puede requerir corrección.

## Estado

EN_DEFINICION.

## Cierre documental

Requiere outbox, políticas y pruebas de transporte STAGING.
