# Entrada operativa SPORTEX

## Propósito

Este documento es la puerta de entrada al proyecto SPORTEX.

## Estado actual

- Modo: `STAGING`.
- Runtime legado: operativo en `https://sportex.codexa.uy`, no certificado para la arquitectura objetivo.
- Nuevo Core modular: autenticación, membresías y primera vertical implementadas localmente, no certificadas en STAGING.
- Nuevo frontend sin lógica: implementado localmente, no desplegado.
- Base reutilizable: SPORTEX anterior con baseline inicial y auditoría formal pendiente; migración nueva todavía no ejecutada.
- Empresa piloto: Delta Sport.

## Orden obligatorio de lectura

1. `DOCUMENTATION_ARCHITECTURE.md`.
2. `ENVIRONMENTS_CONTRACT.md`.
3. `SESSION_STATE.md`.
4. `TASKS/README.md`.
5. tarea activa, si existe.
6. `BIBLIA_SPORTEX.md` y `BUSINESS.md`.
7. contratos transversales afectados.
8. `biblioteca/README.md` y ficha del módulo, capa o superficie.

Para infraestructura leer además `CURRENT_RUNTIME_BASELINE.md`, `INFRASTRUCTURE_CONTRACT.md`, `CONNECTIONS.md`, `SUPABASE_CONTRACT.md`, `EVOLUTION_CONTRACT.md`, `GIT_RELEASE_CONTRACT.md`, `DEPLOYMENT_PROTOCOL.md` y `DEPLOYMENT_MANIFEST_TEMPLATE.md`.

## Modos

- `DOCUMENTACION`: definición de producto, contratos y tareas; no crea runtime.
- `DESARROLLO`: implementación local sin datos ni servicios reales.
- `STAGING`: integración y certificación aislada antes de producción.
- `PRODUCCION`: operación real, únicamente con autorización explícita de Fito.

## Reglas madre

```text
EL CORE DECIDE. EL FRONTEND PRESENTA.
WHATSAPP INFORMA. EL CORE VALIDA.
TODO DATO OPERATIVO PERTENECE A UNA EMPRESA.
NO MEZCLAR RESPONSABILIDADES ENTRE MÓDULOS.
```

## Fronteras

- Una empresa equivale a una marca; no existen sucursales.
- Ningún módulo puede leer o modificar información de otra empresa.
- Evolution API es un adaptador de WhatsApp, no una autoridad del negocio.
- SPORTEX no utiliza n8n; Evolution API se conecta directamente con el Core.
- Los cambios de fase se realizan mediante comandos validados por el Core.
- Pagos, aprobaciones, compras, producción y envíos conservan evidencia y auditoría.
- Toda transferencia de responsabilidad puede generar un documento versionado.

## Estado honesto

Estados documentales permitidos:

- `NO_INICIADO`;
- `EN_DEFINICION`;
- `EN_PROGRESO`;
- `IMPLEMENTADO_NO_VALIDADO`;
- `PENDIENTE_EVIDENCIA`;
- `PENDIENTE_DOCUMENTACION`;
- `BLOQUEADO`;
- `CERTIFICADO_STAGING`;
- `OPERATIVO_PRODUCCION`.

## Validación

Desde la raíz `sportex/`:

```powershell
npm run validate-docs
```

El validador debe pasar antes de cerrar una tarea documental.
