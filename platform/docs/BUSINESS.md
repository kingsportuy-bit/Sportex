# Reglas de negocio SPORTEX

## Empresa

- Una empresa equivale a una marca.
- No existe dimensión de sucursal.
- Usuarios, clientes, conversaciones, pedidos, proveedores, talleres, precios y documentos pertenecen a una empresa.

## Canal comercial

- WhatsApp es el canal principal de venta y seguimiento.
- Un mensaje puede proponer un cambio, pero no modifica automáticamente datos críticos.
- Cliente, conversación y pedido deben estar vinculados de forma explícita.
- Si un cliente tiene varios pedidos activos, el sistema debe desambiguar antes de aplicar cambios.

## Venta confirmada

- `pago_detectado` no equivale a `pago_certificado`.
- Solamente una seña certificada puede activar `nuevo_pedido`.
- El alta debe ser idempotente: una evidencia no crea dos pedidos.

## Pedido

Un pedido conserva:

- cliente y equipo;
- cotización, precio, seña y saldo;
- productos, cantidades y variantes;
- talles y personalización;
- proceso instanciado;
- costos estimados y reales;
- trabajos y responsables;
- documentos y versiones;
- estado, bloqueos y fechas;
- entrega, satisfacción y recompra.

## Producción

Los procesos se generan desde plantillas editables por producto. Un pedido puede activar trabajos paralelos en USER, proveedores, talleres, medias y cadetes.

Los trabajos se modelan como registros con responsable, estado, dependencia, costo y fechas; no como columnas rígidas por taller.

## Documentos por etapa

- venta a diseño;
- diseño a impresión y compras;
- impresión y compras a taller;
- taller a envío;
- cierre y postventa.

Cada documento muestra solamente la información necesaria para quien recibe la responsabilidad.

## Fuente Delta

El conocimiento operativo inicial vive en:

- `../../delta.md`;
- `../../negocio/procesos/alta-pedido-por-sena.md`;
- `../../negocio/procesos/arquitectura-modular-whatsapp-core.md`;
- `../../negocio/dashboard/modelo-costos.md`;
- `../../negocio/utilidades/instrucciones-ia-ficha-tecnica-taller.md`.
