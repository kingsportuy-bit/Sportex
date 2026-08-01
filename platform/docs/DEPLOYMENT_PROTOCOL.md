# Protocolo de despliegue SPORTEX

## Proposito

Desplegar de forma reproducible, observable y reversible sin confundir una
build, un documento o un healthcheck con un producto operativo.

## Estado actual

No hay un destino de despliegue aprobado en esta tarea documental. El stack,
dominio, tablas y secretos observados en julio de 2026 son evidencia historica.
Antes de reutilizarlos debe existir una tarea `PILOTO_DELTA` que revalide
infraestructura y resuelva los nombres tecnicos heredados de STAGING.

## Precondiciones

1. tarea de operacion aprobada;
2. alcance y recursos exactos;
3. runtime actual observado;
4. commit remoto y artefacto inmutable;
5. tests aplicables en PASS;
6. secretos disponibles fuera de Git;
7. backup y rollback ensayables;
8. criterio de detencion y ventana;
9. explicacion previa y GO exacto de Fito.

## Flujo PILOTO_DELTA

1. Ejecutar preflight de capacidad, salud y dependencias.
2. Verificar DB, tenant, dominio, Evolution y outbound permitidos.
3. Ejecutar `release-governance-guard.ps1` con tarea, commit, scope y GO.
4. Crear bundle desde Git y registrar SHA256/digest.
5. Tomar backup o checkpoint necesario.
6. Aplicar migraciones compatibles y verificables, si fueron autorizadas.
7. Desplegar el artefacto exacto.
8. Observar servicios, logs, rutas, version y dependencias.
9. Ejecutar smoke tecnico y recorrido de negocio acordado.
10. Detener o revertir si se cumple un criterio de corte.
11. Persistir evidencia y actualizar estado.

## Mensajeria y datos reales

El deploy de codigo no autoriza mensajes reales. Webhooks, outbound, imports,
migraciones y automatizaciones necesitan alcance y permiso propios. Nunca se
usan datos de otras marcas para validar Delta.

## Rollback

Cada deployment identifica version anterior, datos afectados, comando o
procedimiento de retorno y comprobacion posterior. Si una migracion no es
reversible, debe existir backup restaurable y criterio de no retorno aprobado.

## PRODUCCION_COMERCIAL

Ademas del flujo anterior exige el gate de salida al mercado del contrato de
entornos. Se despliega el mismo artefacto certificado o se recertifica toda
diferencia. Requiere un GO comercial nuevo.

## Cierre

Registrar task, commit, digest, scope, aprobacion, timestamps, migraciones,
observaciones, pruebas, incidentes, rollback disponible y deuda restante.
