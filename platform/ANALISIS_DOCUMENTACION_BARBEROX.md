# Análisis de la estructura documental de BARBEROX para SPORTEX

Fecha del análisis: 2026-07-19.

Origen analizado: `C:\Users\Fito\Documents\CODEX\BARBEROX`.

Alcance: lectura de la entrada operativa, arquitectura documental, estado de sesión, tareas, biblioteca, fichas de módulos y capas, contratos del Core, protocolos de agentes y validadores. No se modificó BARBEROX ni se operó sobre producción.

## Conclusión

BARBEROX tiene un sistema documental útil para un producto complejo porque separa:

- reglas permanentes;
- estado vivo;
- tareas con alcance cerrado;
- contratos por módulo y capa;
- evidencia;
- campañas temporales;
- historial;
- validación automática.

SPORTEX debería conservar ese modelo, pero comenzar con una versión más pequeña y ordenada. No conviene copiar todos los documentos, nombres, campañas ni deuda histórica de BARBEROX.

La recomendación es construir primero el sistema documental de SPORTEX y luego adaptar el código anterior detrás de un Core nuevo.

## Cómo está organizada la documentación de BARBEROX

### 1. Entrada única

`docs/INICIAL.md` es la puerta obligatoria.

Define:

- modo operativo;
- límites entre STAGING y producción;
- control de integridad;
- orden de lectura;
- tarea activa;
- preflight antes de acciones riesgosas;
- reglas contra falsos cierres;
- contratos que deben consultarse según el trabajo.

La ventaja es que una IA o persona nueva no tiene que adivinar por dónde comenzar.

### 2. Contexto del operador

BARBEROX separa:

- `OPERADOR.md`: cómo trabajar y comunicarse con Fito;
- `OPERADOR_PROYECTO.md`: qué hace Fito específicamente dentro de BARBEROX;
- `GUIA_OPERADOR_BARBEROX.md`: mapa simple del producto y su operación.

Esto evita mezclar preferencias personales, responsabilidades del proyecto y documentación técnica.

### 3. Jerarquía documental

`DOCUMENTATION_ARCHITECTURE.md` define qué documento prevalece cuando existe una contradicción.

El orden general es:

1. entrada y límites;
2. contrato de entornos;
3. doctrina del producto;
4. ley arquitectónica;
5. contratos globales;
6. contrato específico del módulo;
7. ficha de biblioteca;
8. tarea activa;
9. campaña temporal;
10. evidencia e historial.

Una tarea no puede contradecir una regla madre y un documento histórico no puede modificar el comportamiento vigente.

### 4. Documentos permanentes

BARBEROX conserva documentos separados para:

- visión y doctrina del producto;
- reglas del negocio;
- arquitectura y separación de capas;
- contratos del Core;
- seguridad y permisos;
- frontend;
- API, base de datos y notificaciones;
- despliegues y rollback;
- QA y regresiones;
- workflow de trabajo;
- registro de errores;
- changelog y backlog.

La separación permite actualizar una regla sin reescribir un documento gigante.

### 5. Estado vivo de sesión

`SESSION_STATE.md` conserva continuidad entre sesiones:

- entorno;
- objetivo actual;
- decisiones;
- tarea activa;
- evidencia reciente;
- pendientes;
- bloqueos;
- versión o despliegue vigente;
- próximo paso.

El concepto es correcto, pero el archivo actual de BARBEROX supera las tres mil líneas porque también acumuló una bitácora extensa. En SPORTEX conviene separar:

- `SESSION_STATE.md`: fotografía corta y reemplazable del estado actual;
- `CHANGELOG.md`: cambios ya cerrados;
- tarea activa: alcance y evidencia;
- `historico/sesiones/`: bitácoras anteriores cuando sea necesario conservarlas.

### 6. Tareas con contrato

Cada tarea vive en un archivo `TASK-YYYYMMDD-###-nombre.md`.

Campos mínimos:

- identificador;
- owner;
- requester;
- estado;
- objetivo;
- alcance permitido;
- alcance prohibido;
- entradas;
- salidas;
- validación;
- evidencia.

`docs/TASKS/README.md` funciona como índice y estado general. Los validadores comprueban que el índice, el archivo de tarea y `SESSION_STATE.md` coincidan y que no exista más de una tarea ejecutable.

### 7. Biblioteca documental

`docs/biblioteca/README.md` es el índice operativo. Antes de buscar documentos al azar, se elige:

- una capa;
- un módulo;
- una superficie.

La biblioteca no reemplaza los contratos. Indica qué documentos leer y actualizar para cada parte del sistema.

#### Capas

Representan responsabilidades del recorrido técnico. En BARBEROX existen capas de contexto, detección, clasificación, routing, handlers, respuesta, ejecución y escritura de estado.

#### Módulos

Representan capacidades de negocio, por ejemplo agenda, cancelación, notificaciones, permisos, onboarding o canal de WhatsApp.

#### Superficies

Representan lugares donde aparece o se ejecuta el sistema:

- API;
- web;
- base de datos;
- Evolution API.

Esta distinción ayuda a no confundir una capacidad del negocio con la tecnología que la transporta.

### 8. Ficha estándar de módulo

BARBEROX exige que cada módulo documente:

- responsabilidad;
- fuente o decisión;
- owner;
- permisos;
- contrato de entrada;
- contrato de salida;
- persistencia;
- auditoría;
- efectos externos;
- workers;
- tests;
- evidencia;
- rollback;
- estado;
- cierre documental.

Este formato es especialmente útil para SPORTEX porque cada etapa de producción tendrá un owner, datos, documentos y efectos diferentes.

### 9. Campañas temporales

Una campaña agrupa un objetivo temporal grande, como una migración o preparación para producción.

Las campañas:

- tienen inicio y condición de cierre;
- pueden contener roadmap, matriz y evidencias;
- no reemplazan contratos permanentes;
- se archivan completas cuando terminan.

SPORTEX no necesita una campaña al comenzar. Primero necesita contratos y módulos. Una futura campaña podría ser `delta-piloto-operativo` o `migracion-sportex-anterior`.

### 10. Evidencias, generados e históricos

BARBEROX diferencia:

- `evidencias/`: pruebas que justifican estados o decisiones;
- `generated/`: información producida automáticamente y no editada a mano;
- `historico/`: contratos reemplazados y campañas cerradas;
- código o documentos rectores de módulos especiales fuera de `docs/`, registrados explícitamente.

Archivar no significa borrar. Cada movimiento debe indicar qué documento reemplaza la responsabilidad anterior.

### 11. Validación automática

BARBEROX ejecuta validadores que controlan:

- documentos requeridos;
- archivos vacíos;
- bytes NUL;
- UTF-8 con BOM inesperado;
- mojibake;
- referencias rotas;
- documentos obligatorios fuera de Git;
- módulos sin ficha o sin secciones requeridas;
- módulos ausentes del índice;
- tareas con formato o estado inválido;
- contradicciones entre tarea, índice y estado de sesión;
- más de una tarea ejecutable;
- documentos protegidos modificados.

Esto convierte la documentación en parte verificable del sistema y no solamente en texto de referencia.

### 12. Agentes y skills

BARBEROX documenta responsabilidades y límites de los agentes. También tiene recursos locales para contratos, encoding y deploy.

Para SPORTEX conviene utilizar skills de proyecto completas, cada una con `SKILL.md`, cuando una tarea pueda repetirse. Ya existe la primera capacidad reutilizable de Delta: la generación de la ficha de taller.

## Qué funciona bien y conviene conservar

1. Una entrada única y corta.
2. Jerarquía explícita cuando dos documentos se contradicen.
3. Separación entre reglas permanentes y objetivos temporales.
4. Tareas con alcance permitido y prohibido.
5. Una sola tarea ejecutable.
6. Biblioteca por módulos, capas y superficies.
7. Ficha estándar de responsabilidad por módulo.
8. Evidencia y rollback como parte del cierre.
9. Estado honesto: implementado no significa certificado.
10. Validación automática de documentación.
11. Frontend sin autoridad para decidir reglas del negocio.
12. Historial conservado sin tratarlo como contrato vigente.

## Qué no conviene copiar literalmente

1. La cantidad actual de documentos globales antes de que SPORTEX los necesite.
2. El `SESSION_STATE.md` como bitácora acumulativa de miles de líneas.
3. Campañas, reglas de entorno y contratos específicos de barberías.
4. Estados de tarea demasiado especializados desde el primer día.
5. Validaciones con nombres de tareas o textos coyunturales escritos directamente en el código.
6. Documentos duplicados entre índice, tarea, campaña y estado vivo.
7. Directorios y archivos históricos mezclados en la raíz del proyecto.
8. Skills incompletas sin `SKILL.md` formal.

## Estructura recomendada para SPORTEX

La primera versión debería ser pequeña:

```text
sportex/
  README.md
  docs/
    INICIAL.md
    DOCUMENTATION_ARCHITECTURE.md
    OPERADOR_PROYECTO.md
    BIBLIA_SPORTEX.md
    BUSINESS.md
    ARCHITECTURE.md
    CORE_CONTRACT.md
    WHATSAPP_EVENT_CONTRACT.md
    SESSION_STATE.md
    ROADMAP.md
    CHANGELOG.md
    BACKLOG.md
    ERROR_REGISTRY.md
    TASKS/
      README.md
      TEMPLATE.md
    biblioteca/
      README.md
      capas/
      modulos/
      superficies/
    evidencias/
      README.md
    generated/
      README.md
    historico/
      README.md
  .agents/
    SKILLS.md
    skills/
  core/
  frontend/
  scripts/
```

No es necesario crear todos los contratos de una vez. La estructura sirve para asignarles un lugar estable cuando aparezcan.

## Biblioteca inicial de SPORTEX

### Módulos

- `clientes`;
- `leads_conversaciones`;
- `pagos`;
- `nuevo_pedido`;
- `costos`;
- `procesos`;
- `documentos`;
- `diseño`;
- `impresion_compras`;
- `taller`;
- `envio`;
- `notificaciones`;
- `postventa`.

### Capas

- `L1_ENTRADAS`: WhatsApp, frontend, pagos y proveedores;
- `L2_INTERPRETACION`: extracción de hechos y nivel de confianza;
- `L3_APLICACION`: comandos, validaciones e idempotencia;
- `L4_DOMINIO`: reglas de pedidos, costos y producción;
- `L5_PERSISTENCIA`: base, auditoría, archivos y versiones;
- `L6_SALIDAS`: notificaciones, documentos e integraciones.

### Superficies

- `whatsapp`;
- `evolution`;
- `api`;
- `web`;
- `db`;
- `archivos`.

## Relación con el SPORTEX anterior

El proyecto anterior puede aportar:

- interfaz;
- clientes y leads;
- pedidos e ítems;
- etapas configurables;
- Kanban;
- transacciones e historial.

Antes de reutilizar código habrá que:

- mover reglas y escrituras del frontend al Core;
- implementar el webhook directo de Evolution API como adaptador de entrada;
- reemplazar movimientos libres por comandos validados;
- ampliar el pedido con pagos, costos desglosados, documentos, trabajos y versiones;
- modelar empresa como marca, sin sucursales;
- agregar eventos, auditoría e idempotencia.

## Validadores mínimos recomendados

SPORTEX debería incorporar desde el comienzo un comando `validate-docs` que controle:

- existencia de documentos rectores;
- UTF-8 limpio, sin NUL ni mojibake;
- enlaces locales válidos;
- tareas con campos obligatorios;
- coincidencia entre tarea activa, índice y `SESSION_STATE.md`;
- una sola tarea ejecutable;
- cada módulo presente en la biblioteca;
- secciones obligatorias de cada ficha;
- límite de tamaño o formato corto para `SESSION_STATE.md`;
- archivos protegidos sin modificaciones accidentales.

El validador debe comprobar estructura y contratos generales. Las reglas temporales de una tarea deben vivir en la tarea o en tests propios, no quedar codificadas para siempre en el validador global.

## Orden recomendado para construir SPORTEX

1. Aprobar esta arquitectura documental reducida.
2. Crear la estructura `docs/` y los documentos base.
3. Escribir la Biblia de producto y reglas del negocio desde la documentación actual de Delta.
4. Definir arquitectura del Core y contrato de eventos de WhatsApp.
5. Crear las fichas de `nuevo_pedido`, `costos`, `procesos`, `documentos` y `taller`.
6. Registrar como primera tarea formal la auditoría del SPORTEX anterior.
7. Diseñar el modelo de datos objetivo.
8. Reutilizar solamente las piezas del sistema anterior que respeten los nuevos contratos.
9. Construir el Core antes de conectar el frontend definitivo.
10. Integrar WhatsApp inicialmente en modo propuesta y validación humana.

## Estado de este trabajo

- Carpeta `sportex/`: creada.
- BARBEROX: analizado en modo lectura.
- SPORTEX anterior: no modificado ni copiado.
- Nueva estructura documental: propuesta, todavía no creada.
- Core y frontend: no iniciados.
