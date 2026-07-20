# Roadmap SPORTEX

## F0 - Fundación documental

Estado: `COMPLETADO`.

- documentos rectores;
- biblioteca modular;
- tareas formales;
- validador documental.

## F0.1 - Entorno e infraestructura

Estado: `COMPLETADO`.

- repositorio Git existente y acceso read-only verificados;
- VPS compartido con BARBEROX verificado;
- aislamiento obligatorio de los servicios SPORTEX;
- Supabase autoalojado adoptado como persistencia;
- Evolution API adoptada como integracion directa de WhatsApp;
- n8n retirado de la arquitectura activa;
- contratos de infraestructura, Git, Supabase y Evolution documentados;
- runtime legado del VPS inventariado como operativo no certificado.

## F0.2 - Separación de datos y protocolo de despliegue

Estado: `CONTRATO_COMPLETADO`.

- Supabase compartido con prefijos, roles, RLS y migraciones por entorno;
- legado `sportex_*`, STAGING `sportex_staging_*`, producción `sports_*`;
- protocolo STAGING y producción definido;
- reemplazo paralelo del legado y rollback definidos;
- rotación de secretos legado pendiente.

## F1 - Auditoría del SPORTEX anterior

Estado: `NO_INICIADO`.

- inventario funcional;
- lógica en frontend;
- tablas y relaciones;
- componentes reutilizables;
- deuda de seguridad y aislamiento;
- plan de extracción.

## F2 - Kernel del Core

Estado: `EN_PROGRESO`.

- empresa/tenant;
- identidad y permisos;
- comandos y eventos;
- idempotencia;
- auditoría;
- outbox y workers;
- observabilidad.

Primera vertical local completada: tenant, capacidades, idempotencia, auditoría, outbox, clientes y API base. Persistencia real y STAGING pendientes.

## F3 - WhatsApp en modo propuesta

Estado: `NO_INICIADO`.

- ingreso normalizado;
- vinculación cliente/conversación;
- interpretación IA;
- evidencia y confianza;
- aprobación humana;
- sin mutaciones críticas automáticas.

## F4 - Seña certificada y nuevo pedido

Estado: `EN_PROGRESO_LOCAL`.

- pagos;
- `nuevo_pedido`;
- costos estimados;
- proceso y trabajos;
- planilla proyectada;
- documentos pendientes;
- notificaciones.

Certificación manual de seña y creación inicial de pedido implementadas. Costos, proceso, trabajos, documentos y notificaciones quedan pendientes.

## F5 - Producción Delta

Estado: `NO_INICIADO`.

- diseño;
- impresión y compras;
- talleres;
- envío;
- fichas por etapa;
- cierre y postventa.

## F6 - Piloto STAGING Delta

Estado: `NO_INICIADO`.

- migración controlada;
- uso real supervisado;
- métricas y correcciones;
- rollback;
- certificación.

## F7 - Producto multitenant

Estado: `NO_INICIADO`.

- onboarding de marcas;
- configuración de procesos;
- roles y planes;
- aislamiento certificado;
- operación y soporte.
