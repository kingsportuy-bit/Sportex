# Contrato de documentos SPORTEX

## Objetivo

Cada transferencia de responsabilidad utiliza documentos versionados generados desde el estado vigente del pedido.

## Tipos iniciales

- ficha de venta a diseño;
- ficha de diseño a impresión;
- ficha técnica para taller;
- ficha de taller a envío;
- ficha de cierre y postventa.

## Reglas

- Un documento pertenece a tenant, pedido, etapa y versión.
- El documento referencia las fuentes utilizadas.
- Los datos críticos pendientes bloquean su liberación.
- Un archivo liberado es inmutable.
- Un cambio crea nueva versión y marca la anterior como reemplazada.
- La etapa receptora trabaja con una sola versión vigente.
- El historial de cambios no contamina la ficha operativa.

## Estados

- `slot_created`;
- `draft`;
- `pending_data`;
- `pending_review`;
- `released`;
- `superseded`;
- `cancelled`;
- `generation_failed`.

## Generación por IA

El módulo documentos selecciona una skill por tipo de ficha, entrega datos estructurados y conserva versión de skill, inputs, resultado y validación.

La skill de ficha de taller Delta es la primera referencia disponible.

## Validación

Cada tipo de documento define campos obligatorios, formato, control visual y responsable de aprobación.

## Acceso

Los archivos son privados, aislados por tenant y compartidos mediante acceso temporal o superficie autenticada.
