# Plantilla de manifiesto de deployment SPORTEX

## Identidad

- task_id:
- entorno: `PILOTO_DELTA | PRODUCCION_COMERCIAL`
- source_commit:
- branch:
- scope_paths:
- artifact_reference:
- artifact_sha256_o_digest:
- approval_exacta:
- operador:
- inicio_utc:
- fin_utc:

## Runtime previo

- version observada:
- servicios y replicas:
- dependencias:
- dominio/rutas:
- estado de datos:

## Preflight

- tests:
- capacidad:
- secretos sin exponer:
- backup/checkpoint:
- rollback ensayado:
- criterio de detencion:

## Cambios

- componentes:
- migraciones:
- variables/configuracion:
- webhooks/mensajeria:
- datos reales afectados:

## Observacion posterior

- version observada:
- servicios y replicas:
- logs:
- smoke tecnico:
- recorrido de negocio:
- drift:

## Rollback

- version objetivo:
- procedimiento:
- datos:
- resultado si se ejecuto:

## Cierre

- estado: `PENDIENTE_EVIDENCIA | CERTIFICADO_PILOTO | OPERATIVO_COMERCIAL | ROLLED_BACK | BLOQUEADO`
- evidencia:
- deuda restante:
- siguiente accion:
