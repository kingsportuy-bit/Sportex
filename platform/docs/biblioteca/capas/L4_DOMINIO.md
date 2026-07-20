# L4 - Dominio

## Responsabilidad

Aplicar invariantes y reglas de empresas, clientes, pedidos, costos, procesos, documentos, talleres y envíos.

## Permitido

- evaluar transiciones;
- calcular estados y resultados;
- producir eventos de dominio;
- exigir datos o aprobaciones.

## Prohibido

- llamar WhatsApp o proveedores;
- leer variables de infraestructura;
- depender del frontend;
- acceder a otro tenant.

## Tests documentales

- reglas puras con casos felices, bordes y rechazos;
- costos estimados separados de reales;
- cambio posterior a impresión no se oculta;
- plantilla nueva no muta pedidos existentes.
