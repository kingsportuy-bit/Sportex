# Contrato multitenant SPORTEX

## Modelo

Cada `tenant` representa una empresa o marca. No existen sucursales.

Los usuarios se vinculan a empresas mediante membresías y roles. Un usuario de plataforma puede administrar varias empresas solamente con permiso explícito y auditado.

## Aislamiento obligatorio

- Toda entidad operativa incluye `tenant_id`.
- El Core obtiene `tenant_id` desde sesión, token o credencial de integración; nunca confía en un valor libre enviado por el cliente.
- Todas las consultas filtran por tenant.
- Claves únicas de negocio incluyen tenant cuando corresponde.
- Archivos se almacenan en rutas o buckets particionados por tenant.
- Jobs, outbox, eventos, caché y locks conservan tenant.
- Prompts y contexto IA se arman solamente con información del tenant activo.

## Defensa en profundidad

- autorización en Core;
- repositorios tenant-aware;
- políticas de base de datos cuando la tecnología lo permita;
- pruebas automáticas de aislamiento;
- auditoría de accesos administrativos;
- métricas de intentos cross-tenant.

## Identificadores

Los identificadores internos pueden ser UUID. Los números visibles, como `DELTA-2026-0001`, son únicos dentro de la empresa y nunca se usan solos para autorizar acceso.

## Integraciones

Cada conexión de WhatsApp, token, webhook, proveedor o almacenamiento pertenece a un tenant y a un entorno.

Una clave de integración identifica el tenant antes de aceptar eventos. Los mensajes que no puedan vincularse de forma segura quedan en cuarentena.

## Observabilidad segura

Logs y métricas pueden incluir identificadores internos de tenant, pero no nombres, teléfonos, mensajes, comprobantes ni datos personales como etiquetas de alta cardinalidad.

## Operaciones de plataforma

El soporte cross-tenant requiere:

- rol de plataforma;
- motivo;
- confirmación para mutaciones;
- auditoría;
- límites de tiempo cuando corresponda.

## Validación mínima

- usuario A no puede leer empresa B;
- webhook A no puede escribir empresa B;
- worker A no procesa job B;
- archivo A no se descarga desde empresa B;
- búsqueda global no filtra datos entre empresas;
- cache keys y locks no colisionan entre tenants.
