# Contrato de entornos SPORTEX

## DOCUMENTACION

Define producto, contratos, tareas y gobernanza. No autoriza runtime, mensajes,
migraciones ni cambios remotos.

## DESARROLLO_LOCAL

Implementacion y pruebas en la computadora o entornos efimeros, con fixtures y
datos ficticios. No usa secretos, webhooks, numeros ni bases reales.

## PILOTO_DELTA

Unico entorno real mientras Delta construye y valida SPORTEX antes de ofrecerlo
al mercado. Puede contener datos y operaciones reales de Delta, por lo que se
gobierna como produccion restringida:

- acceso minimo y auditable;
- secretos fuera de Git;
- backup y rollback antes de migraciones;
- mensajeria real solo con alcance y permiso explicitos;
- release desde commit remoto y artefacto inmutable;
- observacion posterior y evidencia ligada al deployment;
- cambios reversibles y sin mezclar datos de otras marcas.

No existe un STAGING permanente separado. Los recursos con nombres
`sportex_staging_*` son transitorios heredados y no se renombran, eliminan ni
promueven sin una tarea de migracion.

## PRODUCCION_COMERCIAL

Estado futuro en el que SPORTEX admite empresas externas. Permanece bloqueado
hasta que Delta valide el piloto y Fito otorgue un GO especifico de salida al
mercado. Requiere como minimo:

- alcance comercial y soporte definidos;
- seguridad, aislamiento multitenant y recuperacion certificados;
- migracion y rollback ensayados;
- observabilidad y respuesta a incidentes;
- release exacto certificado en `PILOTO_DELTA`;
- decision explicita sobre datos, dominio, WhatsApp y facturacion.

## Reglas transversales

- Un tenant no representa un entorno.
- Desarrollo local no se conecta a datos reales.
- Una prueba exitosa no autoriza despliegue ni envios.
- La documentacion no inventa runtime: se verifica contra infraestructura.
- Todo cambio remoto requiere tarea, version, alcance, preflight, permiso,
  rollback y evidencia.
- Los secretos nunca se guardan en tareas, evidencias, memoria ni Git.

### Persistencia de la demo CRM

`SPORTEX_COMMERCIAL_DEMO_FILE` puede apuntar a un JSON local de fixtures solamente cuando coinciden `development|test`, store `memory` y `SPORTEX_DEV_AUTH=true`. El archivo queda ignorado por Git. Reiniciar conserva los cambios ficticios; esto no demuestra durabilidad remota ni autoriza promover datos.
