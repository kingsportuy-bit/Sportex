# Biblia de producto SPORTEX

## Qué es SPORTEX

SPORTEX es un sistema operativo modular para empresas de indumentaria deportiva que venden, diseñan, compran insumos, imprimen, confeccionan y entregan pedidos personalizados.

## Problema que resuelve

Gran parte del negocio sucede en WhatsApp. La información queda repartida entre conversaciones, comprobantes, bocetos, listas, proveedores y talleres. SPORTEX convierte esas señales en pedidos estructurados, trabajos, documentos, costos, alertas y decisiones auditables.

## Visión

Una marca debe poder gestionar desde el primer mensaje hasta la recompra sin depender de planillas desconectadas ni recordar manualmente qué necesita cada etapa.

## Principios de producto

1. WhatsApp es el canal principal, no la base de datos.
2. El Core es la fuente de verdad.
3. La IA propone; el Core valida; las acciones sensibles requieren evidencia o aprobación.
4. Cada empresa está completamente aislada.
5. Cada módulo tiene una responsabilidad.
6. Los procesos son editables por empresa y producto.
7. El frontend refleja el Core y no inventa reglas.
8. Todo pedido conserva historial, versiones y costos.
9. Cada transferencia de etapa entrega información útil al siguiente responsable.
10. Observabilidad y seguridad existen desde el diseño, no como agregados posteriores.

## Empresa piloto

Delta Sport permitirá modelar el proceso real:

```text
VENTA -> DISEÑO -> LIBERACIÓN TÉCNICA -> IMPRESIÓN Y COMPRAS -> TALLER -> ENVÍO -> POSTVENTA
```

## Producto vendible

SPORTEX debe poder ofrecerse después a otras marcas. La plantilla Delta será inicial, pero productos, etapas, responsables, talleres, proveedores, campos y automatizaciones serán configurables por empresa.

## Definición de profesional

SPORTEX se considera profesional cuando ofrece:

- aislamiento multitenant verificable;
- seguridad por permisos y acciones;
- auditoría reconstruible;
- observabilidad de eventos, trabajos y fallos;
- estados y transiciones controlados;
- integraciones idempotentes;
- documentos versionados;
- recuperación y reintentos seguros;
- pruebas automáticas;
- despliegues y rollback documentados.
