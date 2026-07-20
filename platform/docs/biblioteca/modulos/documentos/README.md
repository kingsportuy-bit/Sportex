# Módulo documentos

## Responsabilidad

Crear slots, generar, validar, versionar, liberar y controlar acceso a fichas y archivos operativos.

## Fuente/decisión

`DOCUMENTS_CONTRACT.md` y skills del proyecto.

## Owner

Core SPORTEX; cada tipo de documento tiene owner de aprobación.

## Permisos

Crear borrador, revisar, liberar y descargar son capacidades separadas.

## Contrato de entrada

Tenant, pedido, etapa, tipo documental, fuentes vigentes y skill/version.

## Contrato de salida

Documento, versión, checksum, estado, validación, reemplazo y acceso seguro.

## Persistencia

Metadata, fuentes, versiones, archivos privados, checksums y aprobaciones.

## Auditoría

Generación, revisión, descarga, liberación, reemplazo y fallo.

## Side effects

Invoca generadores, almacenamiento y notificaciones; no mueve etapa sin evento del proceso.

## Workers

Generación, renderizado, validación, antivirus futuro y conversión.

## Tests

Datos faltantes, nueva versión, acceso cruzado, skill fallida, archivo inmutable y reemplazo.

## Evidencia

Skill de ficha de taller y ejemplos Delta existentes.

## Rollback

Marcar versión como reemplazada y restaurar acceso a una anterior sin sobrescribir.

## Estado

EN_DEFINICION.

## Cierre documental

Requiere almacenamiento elegido, primer contrato API y ficha de taller integrada en STAGING.
