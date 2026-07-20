# Protocolo de despliegue SPORTEX

## Objetivo

Desplegar SPORTEX de forma reproducible, observable y reversible, separando estrictamente STAGING de producción y reemplazando el runtime legado mediante un cutover controlado.

Este protocolo aplica al Core, workers, frontend, Supabase, migraciones, Evolution y rutas Traefik.

## Topología objetivo

| Entorno | Aplicación | Tablas Supabase | Red privada | Dominio principal |
| --- | --- | --- | --- | --- |
| STAGING | `sportex_staging` | `sportex_staging_*` | `sportex_staging_net` | `sportex-staging.codexa.uy` |
| PRODUCCIÓN | `sportex_prod` | `sports_*` | `sportex_prod_net` | `sportex.codexa.uy` después del cutover |

Reglas:

- STAGING y producción usan la instancia Supabase actual;
- cada entorno tiene tablas, rol, grants, RLS, migraciones, buckets y credenciales de aplicación separados;
- `sportex_*` queda reservado al runtime legado durante la migración;
- STAGING nunca usa la instancia Evolution `DELTA` de producción;
- el stack legado `sportex` permanece intacto hasta que el reemplazo tenga rollback probado;
- los nombres finales pueden ajustarse antes de instalar, pero la separación no es negociable.

## Gate cero: capacidad del host

No se instala un nuevo stack mientras el host no cumpla capacidad y estabilidad.

Verificar y registrar:

- CPU, carga de 1/5/15 minutos y saturación;
- RAM disponible, swap utilizada y OOM recientes;
- disco disponible, crecimiento y capacidad para backups;
- cantidad y consumo de servicios;
- salud de Docker Swarm, Traefik y almacenamiento;
- margen para una falla o rollback simultáneo.

La fotografía del 2026-07-19 mostró 4 vCPU, 15 GiB de RAM, swap 2/2 GiB utilizada, 54 GiB libres y carga entre 8 y 9.8. Una segunda muestra mostró CPU steal entre 15% y 27%, varios procesos esperando CPU y Docker bajo carga elevada. No se instalará otro Supabase, pero el despliegue de nuevos servicios debe repetir esta medición y demostrar margen.

## Artefacto de release obligatorio

Cada despliegue genera un manifiesto con:

- `task_id` y alcance exacto;
- entorno destino;
- commit remoto;
- imagen y digest inmutable;
- migraciones incluidas y checksum;
- contratos/API afectados;
- variables requeridas, solo nombres;
- servicios, redes, volúmenes y dominios afectados;
- plan de validación;
- snapshot o backup previo;
- rollback exacto;
- responsable, fecha y autorización;
- resultados observados y evidencia.

Usar `DEPLOYMENT_MANIFEST_TEMPLATE.md` como base.

Una etiqueta como `latest` no identifica un release. No se despliega desde archivos locales sin commit remoto.

## Estados del release

- `planned`;
- `built`;
- `deployed_unverified`;
- `verified_staging`;
- `approved_production`;
- `production_observed`;
- `rolled_back`;
- `failed`.

Un healthcheck aislado no permite saltar estados.

## Protocolo STAGING

### 1. Preparación

- tarea aprobada para STAGING;
- árbol Git limpio y commit remoto verificado;
- alcance y archivos declarados;
- imagen construida desde ese commit y registrada por digest;
- secretos STAGING existentes sin valores en Git o logs;
- capacidad del host aprobada;
- migraciones probadas en una base descartable;
- rollback ensayable;
- Evolution STAGING con allowlist y sin números reales fuera de autorización.

### 2. Datos

- crear exclusivamente tablas `sportex_staging_*` mediante migraciones STAGING;
- usar un rol sin grants sobre `sportex_*`, `sports_*` ni tablas de otros productos;
- ejecutar migraciones versionadas;
- cargar datos ficticios o anonimizados autorizados;
- validar RLS, roles, tenant y buckets;
- verificar que STAGING no pueda leer o escribir tablas legado o de producción.

### 3. Despliegue

Orden recomendado:

1. Supabase y dependencias internas;
2. migraciones;
3. Core API con workers de efectos pausados;
4. workers y outbox;
5. frontend;
6. router Traefik de STAGING;
7. Evolution STAGING cuando el endpoint ya esté autenticado.

Cada servicio debe quedar `1/1` o en su réplica esperada y declarar health, readiness, límites y política de reinicio.

### 4. Certificación

Como mínimo:

- `/health` confirma proceso vivo;
- `/ready` confirma base, cola y dependencias requeridas;
- login, permisos y aislamiento entre dos tenants ficticios;
- flujo WhatsApp permitido: recepción, deduplicación, interpretación, comando y auditoría;
- pedido desde seña certificada hasta trabajos y documentos;
- outbox sin duplicados y reintento controlado;
- archivos privados y URLs temporales;
- restauración o rollback de migración;
- smoke visual del frontend en escritorio y móvil;
- logs, métricas, trazas y alertas básicas;
- ausencia de secretos y datos personales en evidencia.

Solo entonces el release puede quedar `verified_staging`. La certificación pertenece al commit, digest, migraciones y entorno exactos.

## Protocolo PRODUCCIÓN

### Autorización

Producción requiere autorización explícita de Fito para la tarea y la ventana concreta. Una aprobación de STAGING no autoriza producción.

### Gates previos

- mismo digest certificado en STAGING;
- cero cambios no evaluados desde la certificación;
- backup completo y restauración comprobable;
- snapshot de tablas legado `sportex_*`;
- ensayo de migración con snapshot, transformación, delta, reconciliación y rollback;
- capacidad del host con margen para convivencia temporal legado/nuevo;
- dominios, certificados y router alternativo comprobados;
- Evolution producción sin modificar hasta el gate de cutover;
- responsables y ventana de observación definidos.

### Despliegue paralelo

El nuevo sistema se instala al lado del legado:

1. crear las tablas `sports_*` mediante migraciones versionadas;
2. migrar el snapshot ensayado desde `sportex_*` hacia `sports_*`;
3. desplegar Core, workers y frontend con dominio temporal protegido;
4. validar internamente sin cambiar `sportex.codexa.uy`;
5. congelar escrituras legado durante la ventana acordada;
6. aplicar delta final y reconciliar conteos, relaciones y checksums;
7. ejecutar E2E productivo controlado sin mensajes masivos;
8. configurar el webhook directo de Evolution solamente cuando el Core esté listo;
9. cambiar Traefik hacia el nuevo frontend/Core;
10. observar antes de declarar `production_observed`.

No se usa dual-write improvisado. Si fuera necesario, requiere contrato y tarea propios.

### Reemplazo del legado

- el servicio legado no se borra durante el cutover;
- queda sin escrituras y disponible para rollback durante la ventana definida;
- el nuevo Core se convierte en única autoridad de negocio;
- el frontend nuevo no escribe Supabase directamente;
- las tablas legado `sportex_*` quedan como fuente archivada hasta certificar retención y eliminación;
- la retirada del legado es una tarea posterior, con backup y evidencia.

## Rollback

Disparadores mínimos:

- mezcla o acceso entre tenants;
- pérdida o discrepancia de datos;
- autenticación o permisos incorrectos;
- duplicación de mensajes, pagos, pedidos o jobs;
- migración incompleta;
- errores sostenidos de Core, DB, outbox o Evolution;
- falta de observabilidad para diagnosticar el estado.

Procedimiento general:

1. detener workers y efectos salientes nuevos;
2. restaurar router anterior;
3. desactivar webhook nuevo de Evolution;
4. reactivar legado solo si el modelo de datos y el delta lo permiten;
5. restaurar snapshot cuando corresponda;
6. preservar logs y evidencia;
7. marcar release `rolled_back` o `failed`;
8. documentar reconciliación antes de reintentar.

## Cierre del despliegue

Un despliegue se cierra solamente con:

- manifiesto completo;
- servicios y dominios observados;
- pruebas ejecutadas y resultados;
- versión y digest confirmados en runtime;
- migraciones verificadas;
- monitoreo sin alertas bloqueantes durante la ventana;
- rollback disponible;
- documentación, sesión, changelog y tarea actualizados.
