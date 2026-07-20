# Arquitectura documental SPORTEX

## Objetivo

La documentación es parte del sistema. Define responsabilidades y permite que una IA o equipo retome el proyecto sin reconstruir decisiones desde conversaciones sueltas.

## Jerarquía

Ante contradicciones se aplica este orden:

1. `INICIAL.md`;
2. `ENVIRONMENTS_CONTRACT.md`;
3. `BIBLIA_SPORTEX.md`;
4. `BUSINESS.md`;
5. `ARCHITECTURE.md`;
6. contratos transversales del Core, multitenancy, seguridad, WhatsApp y observabilidad;
7. ficha del módulo, capa o superficie;
8. tarea activa;
9. evidencia;
10. histórico.

Una tarea no puede contradecir un contrato rector. Un documento histórico nunca modifica el comportamiento vigente.

## Clases de documentos

### Rectores

Definen producto, negocio, arquitectura, seguridad, entornos y contratos permanentes.

### Biblioteca

Indexa capas, módulos y superficies. Cada ficha declara responsabilidad, owner, entradas, salidas, persistencia, auditoría, efectos, tests, evidencia y rollback.

### Tareas

Definen un resultado concreto con alcance permitido y prohibido. Solamente puede existir una tarea ejecutable.

### Evidencias

Prueban decisiones, validaciones y resultados. No reemplazan contratos.

### Generados

Artefactos producidos automáticamente. No se editan manualmente.

### Históricos

Documentos reemplazados o cerrados. Deben conservar índice, motivo y reemplazo vigente.

## Flujo de trabajo

```text
INICIAL
  -> SESSION_STATE
  -> tarea activa
  -> biblioteca
  -> contratos afectados
  -> implementación
  -> validación
  -> evidencia
  -> actualización documental
  -> cierre de tarea
```

## Regla para SESSION_STATE

`SESSION_STATE.md` es una fotografía corta del estado actual, no una bitácora acumulativa. Debe contener modo, objetivo, tarea, decisiones, archivos relevantes, evidencia, bloqueos y siguiente paso.

Los cambios cerrados van a `CHANGELOG.md`; el detalle de alcance va a la tarea; la evidencia va a `evidencias/`.

## Salud documental

La documentación está sana cuando:

- existe una entrada única;
- hay como máximo una tarea ejecutable;
- cada módulo está indexado;
- cada responsabilidad tiene owner;
- contratos, tarea y estado coinciden;
- no hay NUL, BOM, mojibake ni referencias rotas;
- el estado declarado tiene evidencia correspondiente;
- el histórico no se usa como fuente operativa.
