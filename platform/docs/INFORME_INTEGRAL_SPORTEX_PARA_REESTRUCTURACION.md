# Informe integral de SPORTEX para análisis y reestructuración

Fecha de corte: 2026-09-26

Repositorio: `https://github.com/kingsportuy-bit/Sportex.git`

Rama analizada: `sportex-governance-20260801`

Commit base al iniciar el informe: `2bcef6c6f9b830eb480038a49fb00fffcd03d059`

Entorno de esta tarea: `DOCUMENTACION`

Tarea: `TASK-20260926-002`

## 1. Propósito y forma correcta de leer este informe

Este documento reúne el contexto necesario para que Fito y otra IA puedan analizar SPORTEX y decidir una reestructuración desde cero sin depender del historial del chat.

No define todavía la arquitectura de reemplazo y no autoriza cambios de producto, código, datos o runtime. Su función es describir qué es SPORTEX, cómo se gobierna, qué intenta resolver, qué existe realmente, qué es legado, qué está incompleto y qué decisiones deben tomarse antes de reconstruirlo.

Las afirmaciones se clasifican así:

- **Rector:** regla vigente de producto, negocio, arquitectura o gobierno.
- **Implementado:** existe código o migración versionada que lo soporta.
- **Validado localmente:** fue probado con fixtures o infraestructura local, sin certificar el piloto.
- **Observado en piloto:** existe evidencia ligada a una versión de `PILOTO_DELTA`.
- **Histórico:** describe una observación anterior; debe revalidarse antes de actuar.
- **Objetivo:** comportamiento deseado todavía no probado.
- **Pendiente:** requiere definición, implementación o evidencia.

Regla de lectura: documentación deseada, código existente y runtime observado no son equivalentes. Cuando difieren, este informe lo señala explícitamente.

## 2. Resumen ejecutivo

SPORTEX busca ser un sistema operativo modular para empresas de indumentaria deportiva personalizada. Su recorrido objetivo empieza en una conversación comercial —principalmente WhatsApp— y continúa por venta, seña, pedido, diseño, impresión y compras, talleres, entrega y postventa.

La visión rectora es correcta y consistente en sus principios principales:

- WhatsApp es un canal, no la fuente de verdad.
- El Core decide reglas, permisos, estados y transiciones.
- La IA propone; el Core valida.
- Toda información operativa pertenece a una empresa o tenant.
- Una empresa equivale a una marca; SPORTEX no modela sucursales.
- El frontend presenta información y solicita comandos; no decide negocio.
- Los efectos externos deben ser autorizados, idempotentes, auditables y reversibles.

Sin embargo, el repositorio contiene cuatro realidades diferentes:

1. **Producto objetivo:** una plataforma integral para operar empresas de indumentaria deportiva.
2. **Plataforma nueva:** un monolito modular Node.js/TypeScript/Fastify con PostgreSQL, frontend web estático e integración Evolution.
3. **Producto implementado parcialmente:** CRM conversacional, clientes, pagos, pedidos iniciales, configuración de empresa, etapas y WhatsApp; muchos módulos productivos permanecen sólo definidos.
4. **Legado:** una aplicación Next.js separada en la raíz del repositorio, conservada como fuente de migración y no como base autorizada para desarrollo nuevo.

La principal oportunidad de la reestructuración es reducir el salto entre una visión tipo ERP integral y una implementación que hoy se concentra en CRM/WhatsApp. Para evitar repetir problemas de Barberox, primero debe definirse un producto inicial pequeño, cerrado y verificable; luego deben diseñarse módulos, datos y arquitectura exclusivamente alrededor de ese producto.

## 3. Identidad del producto

### 3.1 Qué es SPORTEX

SPORTEX es un software operativo para marcas que venden, diseñan, compran insumos, imprimen, confeccionan y entregan indumentaria deportiva personalizada.

El problema central es que gran parte del negocio ocurre en conversaciones, comprobantes, bocetos, listas, proveedores y talleres desconectados. SPORTEX pretende transformar esas señales en información estructurada y auditable:

- contactos y clientes;
- oportunidades y cotizaciones;
- señas certificadas;
- pedidos;
- procesos y etapas;
- trabajos y responsables;
- documentos versionados;
- costos estimados y reales;
- alertas, decisiones y evidencia.

### 3.2 Usuario piloto y mercado futuro

- **Delta Sport** es la empresa piloto y aporta el proceso operativo real.
- **Fito** es owner de producto, negocio, prioridad y operaciones reales.
- **SPORTEX** conserva arquitectura, código, estado, tareas, contratos, releases y evidencia.
- El producto futuro pretende servir a otras marcas, pero `PRODUCCION_COMERCIAL` permanece bloqueado hasta validación del piloto y GO explícito de Fito.

### 3.3 Objetivo de negocio

Permitir que una marca gestione el recorrido desde el primer contacto hasta la recompra sin depender de planillas desconectadas ni de la memoria de las personas.

### 3.4 Recorrido operativo objetivo

```text
VENTA
  -> DISEÑO
  -> LIBERACIÓN TÉCNICA
  -> IMPRESIÓN Y COMPRAS
  -> TALLER
  -> ENVÍO
  -> POSTVENTA
```

Ese recorrido completo es visión de producto. No todo está implementado.

## 4. Alcance funcional rector

### 4.1 Incluido en la visión

- Empresas/marcas y membresías.
- Leads, clientes, conversaciones y atribución comercial.
- Cotización, seña, saldo y certificación de pagos.
- Creación idempotente de pedidos.
- Productos, cantidades, variantes, talles y personalización.
- Procesos configurables y versionados.
- Diseño, bocetos, revisiones y aprobaciones.
- Impresión, compras, proveedores y materiales.
- Talleres, trabajos, incidencias y costos.
- Envíos, control final y confirmación de entrega.
- Documentos por etapa.
- Costos estimados y reales, precio y margen.
- Notificaciones y automatizaciones gobernadas.
- Postventa, satisfacción, reclamos y recompra.
- Seguridad, auditoría, observabilidad e idempotencia transversales.

### 4.2 Fuera de alcance o prohibido actualmente

- `PRODUCCION_COMERCIAL` sin un GO nuevo y específico.
- Tratar una sucursal como dimensión del modelo: una empresa es una marca.
- Escribir negocio directamente desde frontend, WhatsApp, Evolution o IA.
- Confiar en un `tenant_id` enviado libremente por el cliente.
- Certificar pagos mediante IA.
- Enviar mensajes reales sin autorización exacta.
- Desplegar, migrar, cambiar secretos o tocar datos reales por inferencia.
- Usar n8n como parte de la arquitectura objetivo.
- Modificar el legado de la raíz salvo tarea explícita de migración.

## 5. Reglas de negocio principales

### 5.1 Empresa y aislamiento

- Cada entidad operativa pertenece a un `tenant_id` o `empresa_id`.
- Una empresa equivale a una marca.
- No existe dimensión de sucursal.
- Usuarios, clientes, conversaciones, pedidos, proveedores, talleres, documentos y precios pertenecen a una empresa.

### 5.2 Canal comercial

- WhatsApp es el canal principal de venta y seguimiento.
- Un mensaje puede proponer un cambio, pero no modificar automáticamente datos críticos.
- Cliente, conversación y pedido deben vincularse explícitamente.
- Si existen varios pedidos activos, el sistema debe desambiguar.

### 5.3 Pago y alta de pedido

- `pago_detectado` no equivale a `pago_certificado`.
- Sólo una seña certificada puede activar un nuevo pedido.
- Una misma evidencia no puede crear dos pedidos.
- Revertir un pago debe conservar historia y auditoría.

### 5.4 Pedido

Un pedido objetivo conserva cliente, equipo, cotización, precio, seña, saldo, productos, cantidades, variantes, talles, personalización, proceso, costos, trabajos, responsables, documentos, bloqueos, fechas, entrega y postventa.

### 5.5 Producción

- Los procesos nacen desde plantillas editables por empresa y producto.
- Cambiar una plantilla no debe mutar pedidos ya iniciados sin migración explícita.
- Los trabajos son registros con responsable, estado, dependencia, costo y fechas; no columnas rígidas por proveedor o taller.
- Avanzar una etapa requiere permisos y gates satisfechos.

## 6. Gobierno del proyecto

### 6.1 Autoridad

La jerarquía documental vigente es:

1. autorización puntual de Fito para la operación exacta;
2. entrada del proyecto y contrato de entornos;
3. Biblia, negocio y arquitectura;
4. contratos transversales;
5. ficha del módulo, capa o superficie;
6. tarea activa;
7. evidencia ligada a versión y entorno;
8. histórico.

Una tarea no puede contradecir un contrato rector. Una evidencia antigua no describe automáticamente el runtime actual.

### 6.2 Flujo de trabajo

```text
necesidad
  -> orientación o diagnóstico
  -> tarea acotada
  -> contratos y owner
  -> implementación
  -> pruebas
  -> autorización remota, si aplica
  -> release inmutable
  -> observación
  -> evidencia y cierre
```

Reglas operativas:

- sólo una tarea material activa;
- todo cambio material tiene tarea, alcance, validación, evidencia y rollback;
- una consulta read-only no abre tarea;
- un PASS local no certifica el piloto;
- un deploy no autoriza mensajería ni migraciones adicionales;
- `SPORTEX_CLOSE=PASS` es obligatorio para cerrar un checkpoint;
- el repositorio remoto es la fuente de código y contratos;
- las vistas documentales generadas no se editan manualmente.

### 6.3 Estado y continuidad

La fuente canónica de trabajo vivo es `platform/docs/state/PROJECT_STATE.json`. Contiene campaña, tarea, objetivo, alcance, entornos, Git, migraciones, pruebas, despliegues, integraciones, riesgos y próximos pasos.

Las siguientes son vistas derivadas:

- `SESSION_STATE.md`;
- `TASKS/INDEX.md`;
- `generated/CURRENT_CONTEXT.md`;
- `state/CAMPAIGN_STATE.json`;
- `errors/index.json`.

## 7. Arquitectura rectora

### 7.1 Estilo

La arquitectura objetivo actual es un **monolito modular**. No se proponen microservicios al inicio. La separación debe provenir de módulos, puertos, contratos, ownership, pruebas y eventos.

### 7.2 Capas

| Capa | Responsabilidad | No debe hacer |
| --- | --- | --- |
| L1 Entradas | Autenticar y normalizar comandos/eventos | Decidir negocio |
| L2 Interpretación | Proponer hechos desde texto/archivos | Ejecutar acciones sensibles |
| L3 Aplicación | Autorizar, coordinar casos de uso y transacciones | Confiar en tenant del payload |
| L4 Dominio | Aplicar reglas e invariantes | Depender de proveedores o UI |
| L5 Persistencia | Guardar estado, auditoría, outbox y versiones | Escribir sin tenant o cruzar owners |
| L6 Salidas | Ejecutar efectos autorizados | Declarar éxito sin verificación |

### 7.3 Flujo de responsabilidad

```text
WhatsApp / frontend / pagos / archivos
                |
         adaptadores de entrada
                |
    interpretación y normalización
                |
       aplicación y autorización
                |
          módulos de dominio
          /               \
persistencia transaccional   outbox/jobs
                                  |
                         workers/integraciones
```

### 7.4 Invariantes del Core

- El Core es autoridad de reglas, permisos, estados, costos, versiones y efectos.
- Todo comando resuelve entorno, empresa y actor desde identidad confiable.
- La escritura sensible incluye auditoría y outbox en la misma transacción.
- Un worker vuelve a validar tenant, permisos y estado antes del efecto.
- No existen writers genéricos de estado.
- Los módulos se comunican mediante servicios de aplicación, puertos o eventos; no escriben tablas ajenas.

## 8. Mapa de módulos y madurez declarada

| Módulo | Propósito | Estado documental actual |
| --- | --- | --- |
| Identidad y empresas | Tenant, usuarios, membresías, roles y sesiones | En progreso |
| Clientes y leads | Identidad comercial, origen, oportunidades y conversión | Validado localmente sólo con fixtures persistentes |
| WhatsApp y conversaciones | Historial, mensajes, eventos y vínculos operativos | WhatsApp del piloto operativo; cronología candidata local |
| Pagos | Candidatos, certificaciones, señas, saldos y reversión | Implementado, no validado integralmente |
| Nuevo pedido | Crear expediente único desde seña certificada | Implementado, no validado integralmente |
| Costos | Estimados, reales, precio, ganancia y margen | En definición |
| Procesos | Plantillas, etapas, dependencias y transiciones | Handoff mínimo validado; motor configurable pendiente |
| Documentos | Generación, versiones, liberación y acceso | En definición |
| Diseño | Brief, bocetos, revisiones y aprobación | En definición |
| Impresión y compras | Proveedores, materiales, órdenes y recepción | En definición |
| Talleres | Trabajos, materiales, incidencias y finalización | En definición con ficha disponible |
| Envíos | Control final, logística y entrega | En definición |
| Notificaciones | Avisos internos/externos mediante outbox | En definición |
| Observabilidad | Logs, métricas, trazas, alertas y evidencia | En progreso |
| Seguridad | Autenticación, autorización, aislamiento e incidentes | En progreso |
| Postventa | Cierre, satisfacción, reclamos y recompra | En definición |

Conclusión: la documentación cubre un producto mucho más amplio que el código operativo actual. La reestructuración no debería implementar automáticamente los 16 módulos. Debe seleccionar el producto inicial y sólo conservar los módulos indispensables para ese recorrido.

## 9. Realidad implementada en `platform/`

### 9.1 Backend/Core

Existe un servicio TypeScript/Fastify que incluye:

- configuración validada con Zod;
- health y readiness;
- contexto autenticado y capacidades;
- stores en memoria, JSON local y PostgreSQL;
- clientes;
- certificación de pagos;
- creación idempotente de pedidos desde pagos certificados;
- transición inicial a producción;
- definición configurable de etapas comerciales y de pedidos;
- configuración de empresa;
- CRM conversacional;
- cronología de mensajes y eventos;
- media y estado de lectura de WhatsApp;
- webhook, ingreso y salida Evolution controlados por flags;
- auditoría, correlación y errores estables.

Las rutas HTTP versionadas conviven actualmente en archivos amplios. También conviven rutas locales de demo y rutas de integración real, separadas por guards de configuración.

### 9.2 Frontend nuevo

El frontend de `platform/frontend` es HTML, CSS y JavaScript sin framework. Consume exclusivamente `/v1` del Core.

Superficies visibles principales:

- Leads;
- Clientes;
- Pedidos;
- Mi empresa;
- panel de conversaciones WhatsApp;
- vistas derivadas y controles de demo local.

El archivo `frontend/app.js` concentra gran parte del estado, fetching, autenticación, navegación, rendering y comandos. `frontend/styles.css` concentra el sistema visual completo. Esto funciona como candidato, pero ambos son puntos claros de concentración para una reconstrucción.

### 9.3 Persistencia

El repositorio contiene 11 migraciones `up` y sus correspondientes rollbacks, desde fundación del Core hasta configuración de empresa.

El estado canónico registra nueve migraciones recientes aplicadas en `PILOTO_DELTA` (`002` a `006` y `008` a `011`) y 25 tablas con RLS forzado. La relación exacta entre las migraciones versionadas, la fundacional `001`, la `007` y el inventario real debe revalidarse antes de cualquier rediseño o migración. No debe asumirse que cada archivo versionado está aplicado.

### 9.4 Integración WhatsApp

Evolution actúa como adaptador:

- webhook autenticado;
- journal durable y deduplicación;
- proyección de conversaciones;
- outbox para mensajes;
- confirmación humana e idempotencia;
- kill switches para ingreso, salida, cronología, media y no leídos;
- soporte de texto e imagen manual.

El Core mantiene autoridad; Evolution no decide negocio.

### 9.5 Estado observado más reciente

El estado canónico previo a esta tarea registra:

- piloto Delta en release `d9c4f44`;
- Core/runtime saludable en la última evidencia de 2026-09-03;
- CRM y configuración de empresa desplegados;
- viñetas visuales aprobadas restauradas técnicamente;
- aceptación visual humana todavía pendiente;
- outbound real sin una primera prueba manual registrada;
- `PRODUCCION_COMERCIAL` bloqueado.

Este informe no revalidó el runtime remoto. Esas afirmaciones provienen del estado y la evidencia versionada, no de una observación realizada el 2026-09-26.

## 10. Tecnologías

### 10.1 Plataforma nueva

| Área | Tecnología |
| --- | --- |
| Runtime | Node.js 22 en contenedor |
| Lenguaje backend | TypeScript estricto, módulos ESM |
| HTTP | Fastify 5 |
| Validación | Zod 3 |
| Base de datos | PostgreSQL mediante `pg` |
| Identidad remota | Supabase Auth |
| Frontend | HTML, CSS y JavaScript vanilla |
| WhatsApp | Evolution API |
| Tests | Node test runner |
| E2E visual | Playwright Core |
| Build | TypeScript compiler, npm workspaces |
| Contenedores | Docker multi-stage |
| Orquestación actual | Docker Swarm stack |
| Proxy/TLS documentado | Traefik |
| Automatización de gobierno | Node.js `.mjs` y PowerShell |
| Control de versiones | Git/GitHub |

Versiones bloqueadas relevantes en `package-lock.json` al corte:

- `fastify` 5.10.0;
- `@fastify/static` 10.1.0;
- `pg` 8.22.0;
- `zod` 3.25.76;
- `typescript` 5.9.3;
- `tsx` 4.23.1;
- `playwright-core` 1.55.0.

### 10.2 Aplicación legado de la raíz

La raíz contiene una aplicación separada con:

- Next.js 16.1.6;
- React 19.2.3;
- TypeScript;
- Tailwind CSS 4;
- Supabase JS/SSR;
- React Hook Form;
- dnd-kit;
- Zod 4.

Por contrato, esta raíz es legado y fuente de migración. El desarrollo nuevo entra por `platform/`. No se debe mezclar accidentalmente el stack Next.js legado con la plataforma nueva sólo porque comparten repositorio.

## 11. Infraestructura y despliegue

### 11.1 Contenedor nuevo

La plataforma nueva usa un Dockerfile multi-stage:

- instala dependencias con `npm ci`;
- compila TypeScript;
- produce una imagen Node 22 Alpine;
- ejecuta como usuario no root;
- expone el puerto 8080;
- incluye healthcheck;
- sirve backend y frontend estático desde la misma imagen.

### 11.2 Stack versionado

El stack de despliegue incluye:

- una réplica del Core;
- secretos montados como archivos;
- filesystem de sólo lectura;
- `tmpfs` limitado;
- capabilities Linux eliminadas;
- límites y reservas de CPU/memoria;
- health/readiness;
- actualización `start-first` y rollback;
- Traefik y redes externas.

### 11.3 Deuda de nombres y acoplamiento de infraestructura

El stack y la configuración todavía usan nombres heredados de `staging`, aunque el modelo vigente es `PILOT_ONLY` y el entorno real se denomina `PILOTO_DELTA`.

También existe una referencia de red/label compartida con infraestructura nombrada para Barberox. Esto no prueba por sí mismo una falla, pero sí representa acoplamiento operativo y riesgo de confusión. Una reconstrucción limpia debe decidir explícitamente si SPORTEX tendrá infraestructura propia o compartida, con ownership, aislamiento y costos claros.

### 11.4 Legado histórico

Una inspección histórica de julio de 2026 describió un runtime Next.js con acceso directo a Supabase, RLS insuficiente, secretos mal gestionados y webhook heredado inseguro. Esa observación no describe automáticamente el runtime actual, pero el legado no debe reutilizarse sin auditoría, rotación de secretos y plan de migración.

## 12. Seguridad, datos y observabilidad

### 12.1 Seguridad rectora

- mínimo privilegio y denegación por defecto;
- tenant confiable resuelto por servidor;
- RLS forzado y pruebas cross-tenant;
- secretos fuera de Git, imágenes, frontend, logs y documentos;
- confirmación y auditoría para acciones sensibles;
- archivos privados, versionados y ligados a tenant;
- mensajes reales sólo con alcance y permiso exactos;
- IA sin autoridad para certificar pagos o ejecutar instrucciones de usuarios.

### 12.2 Datos

El modelo inicial implementado cubre tenants, membresías, clientes, pagos certificados, pedidos, auditoría y outbox. La vertical comercial agrega conversaciones, mensajes, etapas, próximas acciones, seguimientos y configuración de empresa.

El modelo integral de productos, costos, procesos, documentos, diseño, compras, talleres, envíos y postventa sigue incompleto o en definición.

### 12.3 Observabilidad

Se pretende correlacionar:

```text
mensaje -> interpretación -> comando -> módulo -> transacción -> job -> integración -> resultado
```

El código incluye logs estructurados, correlación, health/readiness y errores normalizados. Métricas, trazas externas, dashboards y alertas completas permanecen pendientes.

## 13. Inventario cuantitativo del código nuevo

Estimación obtenida directamente del árbol versionado:

- 36 archivos TypeScript de `core/src`, aproximadamente 7.301 líneas;
- `frontend/app.js`: aproximadamente 3.600 líneas;
- `frontend/styles.css`: aproximadamente 2.895 líneas;
- `frontend/index.html`: aproximadamente 341 líneas;
- 21 scripts `.mjs`, aproximadamente 3.352 líneas;
- 8 scripts PowerShell, aproximadamente 1.527 líneas;
- 15 archivos de tests versionados entre Core y workflow;
- 11 migraciones `up` y 11 `down`.

Archivos con mayor concentración de responsabilidad:

| Archivo | Líneas aproximadas |
| --- | ---: |
| `frontend/app.js` | 3.600 |
| `frontend/styles.css` | 2.895 |
| `commercial-replay-service.ts` | 945 |
| `core-service.ts` | 797 |
| `postgres-commercial-replay-store.ts` | 631 |
| `postgres-core-store.ts` | 610 |
| `http/routes.ts` | 553 |

Estas cifras no son una evaluación de calidad por sí mismas. Sí muestran hotspots que una reconstrucción debería dividir por responsabilidad y contrato, sin convertir cada archivo en un microservicio.

## 14. Calidad y pruebas

El repositorio dispone de:

- type checking estricto;
- tests unitarios y de integración del Core;
- tests de API, autorización, configuración, Evolution, replay y cronología;
- validación SQL;
- build reproducible;
- pruebas visuales de paridad para WhatsApp;
- scripts E2E para piloto y cronología;
- validadores de documentación, tareas, contexto, incidentes y worktrees.

El cierre de esta tarea documental ejecuta el perfil `docs`. Por lo tanto, este informe no debe presentarse como una nueva certificación del Core completo ni del runtime remoto.

El estado canónico registra cuatro vulnerabilidades altas pendientes en la tarea en cola `TASK-20260801-002`. Deben revalidarse contra el árbol y las dependencias que finalmente se decida conservar; no conviene invertir en remediar dependencias que serán eliminadas sin antes definir la arquitectura objetivo.

## 15. Entornos y autorizaciones

| Entorno | Uso | Estado |
| --- | --- | --- |
| `DOCUMENTACION` | Contratos, estado y decisiones | Disponible |
| `DESARROLLO_LOCAL` | Fixtures y pruebas sin datos reales | Disponible |
| `PILOTO_DELTA` | Sistema real restringido de Delta | Disponible con controles de producción |
| `PRODUCCION_COMERCIAL` | Empresas externas | Bloqueado |

No existe un STAGING permanente separado. Los nombres `staging` presentes en tablas, roles, stacks y variables son herencia técnica y no definen el modelo operativo vigente.

Toda operación sobre `PILOTO_DELTA` requiere tarea, versión, alcance exacto, preflight, rollback, criterio de detención, explicación previa y permiso de Fito.

## 16. Contradicciones y deuda que la nueva IA debe conocer

### 16.1 Producto demasiado amplio para el corte actual

La documentación describe un sistema operativo integral con 16 módulos, mientras el valor implementado se concentra en CRM, WhatsApp, clientes, pagos y pedidos iniciales. La reestructuración debe elegir un producto inicial concreto en lugar de reconstruir todo el mapa aspiracional.

### 16.2 Dos aplicaciones en un repositorio

El legado Next.js y la plataforma nueva tienen stacks, responsabilidades y modelos distintos. Debe decidirse si la reconstrucción:

- nace en un repositorio nuevo;
- reemplaza `platform/`;
- reutiliza selectivamente código;
- mantiene el legado sólo como referencia temporal.

No debe realizarse una mezcla incremental sin una frontera explícita.

### 16.3 Nombres de entorno desalineados

El gobierno habla de `PILOTO_DELTA`, pero el código y la infraestructura usan `staging`, `sportex_staging_` y roles del mismo nombre. Esto complica razonamiento, seguridad y releases.

### 16.4 Concentración de responsabilidades

Frontend, servicios comerciales, stores PostgreSQL y rutas HTTP contienen archivos grandes. La separación contractual existe en documentación, pero no siempre se refleja en tamaño y organización física.

### 16.5 Documentación temporal acumulada

Algunos documentos conservan estados históricos o afirmaciones superadas. Ejemplo: documentación del frontend menciona alternancia claro/oscuro, mientras la decisión vigente exige modo oscuro único. La reconstrucción necesita un nuevo conjunto mínimo de contratos, no copiar toda la historia.

### 16.6 Migraciones y runtime requieren reconciliación antes de mover datos

Hay más migraciones versionadas que migraciones listadas explícitamente como aplicadas. Antes de diseñar migración o cutover debe inventariarse el esquema real, roles, RLS, funciones, triggers, buckets y datos.

### 16.7 Infraestructura compartida

Existen redes y nombres vinculados a infraestructura compartida con otros proyectos. Para evitar repetir acoplamientos, SPORTEX debe tener una decisión explícita sobre aislamiento, ownership, secretos, costos y observabilidad.

### 16.8 Producto y experiencia aún no aprobados completamente

Un PASS técnico no equivale a aprobación del producto. La última evidencia deja pendiente confirmación visual humana de Fito y no certifica todas las transiciones comerciales/productivas.

## 17. Principios recomendados para una reconstrucción limpia

Estas recomendaciones no son todavía decisiones aprobadas:

1. Definir primero el producto inicial en una sola frase y un solo recorrido principal.
2. Escribir reglas de negocio y criterios de aceptación antes de elegir framework.
3. Distinguir capacidades imprescindibles, posteriores y explícitamente fuera de alcance.
4. Diseñar un modelo de datos mínimo alrededor del recorrido inicial.
5. Asignar un owner único a cada regla y entidad.
6. Mantener Core, UI, adaptadores y persistencia separados desde el primer corte.
7. Evitar rutas de demo y producción mezcladas en los mismos módulos ejecutables.
8. Definir entornos y nombres coherentes antes de crear infraestructura.
9. No migrar datos hasta conocer el esquema real y el producto nuevo.
10. Probar aislamiento, permisos, idempotencia y rollback desde la primera vertical.
11. Mantener documentación pequeña, canónica y ejecutable; archivar historia fuera del arranque.
12. Reutilizar código sólo cuando encaje en el nuevo contrato; no por costo hundido.

## 18. Decisiones que deben tomarse antes de escribir la nueva arquitectura

### Producto

1. ¿Cuál es el primer usuario y su trabajo principal?
2. ¿Cuál es el recorrido mínimo vendible o validable?
3. ¿SPORTEX comienza como CRM conversacional, gestión de pedidos o sistema de producción?
4. ¿Qué módulos quedan expresamente fuera de la primera versión?
5. ¿Qué resultado debe poder demostrar Delta de punta a punta?

### Negocio

6. ¿Cuándo un contacto se convierte en lead, cliente y pedido?
7. ¿Qué prueba convierte una seña en certificada?
8. ¿Qué etapas del pedido son universales y cuáles configurables?
9. ¿Qué datos son obligatorios antes de liberar producción?
10. ¿Qué acciones requieren aprobación humana?

### Arquitectura

11. ¿Monolito modular nuevo o evolución controlada del actual?
12. ¿Frontend separado o servido junto al Core?
13. ¿Supabase se usa sólo para PostgreSQL/Auth o también para archivos y realtime?
14. ¿Cómo se separan comandos, consultas, jobs y adaptadores?
15. ¿Qué eventos son realmente necesarios en la primera vertical?

### Datos y migración

16. ¿Se migran datos del legado o se comienza con una base nueva?
17. ¿Qué información histórica debe conservarse legal u operativamente?
18. ¿Cuál será el namespace definitivo y la estrategia de tenant?
19. ¿Cómo se prueba una restauración completa?

### Operación

20. ¿Dónde se ejecutará desarrollo, staging futuro, piloto y producción comercial?
21. ¿Qué infraestructura puede compartirse y cuál debe aislarse?
22. ¿Qué observabilidad mínima bloquea un release?
23. ¿Qué flags y kill switches son imprescindibles?

### Experiencia

24. ¿Cuál es la pantalla principal y qué decisión permite tomar?
25. ¿WhatsApp es navegación principal o contexto dentro de cada proceso?
26. ¿Qué información debe ver cada rol sin exponer datos innecesarios?

## 19. Propuesta de secuencia para el análisis externo

La otra IA debería trabajar en este orden:

1. resumir el problema de negocio sin hablar de tecnología;
2. proponer dos o tres alcances posibles para la primera versión;
3. comparar valor, complejidad y riesgo de cada alcance;
4. pedir a Fito las decisiones comerciales faltantes;
5. redactar el contrato de producto elegido;
6. definir entidades, estados, comandos y permisos mínimos;
7. diseñar arquitectura y stack;
8. crear plan de migración o abandono del código actual;
9. recién entonces producir backlog y plan de implementación.

La IA no debería tomar decisiones vigentes del repositorio como intocables si Fito desea rediseñar el producto. Sí debe tratarlas como evidencia de problemas ya encontrados: multitenancy, reglas duplicadas, efectos sin autorización, mezcla de capas, entornos confusos, secretos, RLS, idempotencia y acoplamiento de infraestructura.

## 20. Fuentes principales

Fuentes rectoras y de estado:

- `AGENTS.md`;
- `platform/AGENTS.md`;
- `platform/docs/INICIAL.md`;
- `platform/docs/OPERADOR_PROYECTO.md`;
- `platform/docs/BIBLIA_SPORTEX.md`;
- `platform/docs/BUSINESS.md`;
- `platform/docs/ARCHITECTURE.md`;
- `platform/docs/CORE_CONTRACT.md`;
- `platform/docs/ENVIRONMENTS_CONTRACT.md`;
- `platform/docs/DECISIONES.md`;
- `platform/docs/state/PROJECT_STATE.json`;
- `platform/docs/biblioteca/README.md` y sus fichas.

Fuentes técnicas:

- `platform/package.json` y `platform/package-lock.json`;
- `platform/core/package.json` y `platform/core/tsconfig.json`;
- `platform/core/src/`;
- `platform/core/tests/`;
- `platform/core/db/migrations/`;
- `platform/frontend/`;
- `platform/Dockerfile`;
- `platform/deploy/docker-stack.staging.yml`;
- `platform/scripts/`.

Fuente legado:

- aplicación de la raíz del repositorio, conservada como referencia de migración y excluida del desarrollo nuevo salvo tarea expresa.

## 21. Conclusión

SPORTEX tiene una visión de producto valiosa y reglas arquitectónicas razonables, pero su documentación, implementación y legado abarcan más de lo necesario para decidir el próximo producto. La reestructuración debe comenzar reduciendo el problema: elegir un recorrido principal, definir sus reglas y construir una arquitectura mínima alrededor de él.

El activo más importante a conservar no es necesariamente el código actual. Son los aprendizajes ya documentados: Core como autoridad, tenant confiable, frontend sin reglas, efectos idempotentes, pagos certificados, evidencia, rollback, separación de entornos y operaciones reales con permiso explícito.

La siguiente fase debe producir una decisión de producto y arquitectura aprobada por Fito. Sólo después corresponde decidir qué se reutiliza, qué se migra y qué se descarta.
