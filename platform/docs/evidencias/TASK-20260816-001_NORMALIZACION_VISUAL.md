# Evidencia — normalización visual SPORTEX

Fecha: 2026-08-16
Task: `TASK-20260816-001`
Entorno: `DESARROLLO_LOCAL` con fixtures persistentes
Efectos externos: ninguno

## Resultado

WhatsApp quedó como patrón visual transversal mediante tokens semánticos para
canvas, panel, superficie elevada, campo, hover, seleccionado, deshabilitado,
superficie fuerte, foco y burbuja saliente.

Se corrigieron específicamente:

- selección y hover de Leads en modo noche;
- encabezado fuerte de la lista de Leads;
- burbujas salientes ilegibles fuera de la pestaña WhatsApp;
- fondos blancos fijos en tarjetas, formularios, diálogos y módulos;
- foco visible y respeto por movimiento reducido.

## QA visual autenticada local

- Viewport desktop: `1440x900`.
- Viewport mobile: `390x844` (`clientWidth=375`).
- Temas: claro y noche.
- Pestañas: Hoy, WhatsApp, Leads, Pedidos, Clientes, Anuncios, Creativos,
  Resultados, Productos, Procesos, Proveedores y Configuración.
- Fondos blancos visibles encontrados en modo noche: `0` en las 12 vistas.
- Overflow horizontal móvil: `0` en las 12 vistas.
- Consola: `0` warnings y `0` errores.
- Capturas revisadas: Hoy noche y Leads noche con expediente seleccionado.

## Validación automática

- `npm run check`: PASS.
- `npm test`: 52/52 PASS.
- `npm run validate`: pendiente del cierre ejecutable.
- `git diff --check`: pendiente del cierre ejecutable.

## Límites

- No hubo deploy, push, migración, mensajes ni cambios de datos reales.
- `logo-sportex.png` ajeno en la raíz quedó intacto.
- Imágenes y no leídos pertenecen a la task siguiente.
