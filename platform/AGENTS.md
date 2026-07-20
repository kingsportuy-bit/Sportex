# Reglas de trabajo SPORTEX

Antes de analizar o modificar el proyecto:

1. leer `docs/INICIAL.md`;
2. leer `docs/SESSION_STATE.md`;
3. leer `docs/TASKS/README.md` y la tarea activa;
4. entrar por `docs/biblioteca/README.md` al módulo, capa o superficie afectada;
5. ejecutar `npm run validate-docs` después de modificar documentación rectora.

## Reglas bloqueantes

- Una empresa es una marca. SPORTEX no modela sucursales.
- Toda información operativa pertenece a un `tenant_id` o `empresa_id`.
- El Core es la única autoridad de reglas, estados, permisos y transiciones.
- El frontend no contiene lógica de negocio ni escribe directamente en la base.
- WhatsApp genera eventos y propuestas; no es la fuente de verdad.
- Evolution API se integra directamente con Core/workers; no usar n8n.
- Una interpretación de IA no certifica pagos ni ejecuta acciones sensibles.
- Seguridad, auditoría y observabilidad son módulos transversales obligatorios.
- No se programa una responsabilidad sin contrato documental y tarea aprobada.
- No se declara un módulo listo sin evidencia y estado honesto.
- Producción queda fuera de alcance hasta autorización explícita de Fito.
