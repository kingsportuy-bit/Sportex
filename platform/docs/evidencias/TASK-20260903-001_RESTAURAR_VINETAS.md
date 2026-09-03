# Evidencia TASK-20260903-001

Estado: EN_CURSO
Entorno: PILOTO_DELTA
Fecha: 2026-09-03

## Causa y alcance

La comparación directa entre los artefactos 8823a773 y 51c2dfe demostró pérdida
de geometría SVG, máscaras de halo, gradientes del contorno, tamaño de iconos,
peso tipográfico y posición del contador de las viñetas. La base Git local no
incluía esos ajustes ya publicados. Fito autorizó recuperar las piezas exactas
manteniendo el CRM y Mi empresa.

No hay tarea pausada: TASK-20260902-002 ya estaba cerrada y el worktree limpio.
Rollback operativo: sportex-staging:51c2dfea8abcc05b. Sin DB ni mensajes.

## Restauración y validación local

- svgPath y drawWhatsAppTabbedPanelFrame recuperados literalmente de 8823a773.
- CSS anterior a Mi empresa igual a la referencia del artefacto previo;
  estilos de empresa conservados íntegros y sin cambiar Core/HTML.
- Fixture congelado: scripts/tests/fixtures/whatsapp-approved-8823a773.json.
- Cuatro regresiones PASS, incluyendo rechazo explícito del renderer 51c2dfe.
- Suite completa PASS: 30/30 workflow y frontend, 59/59 Core/API, 25 tablas
  SQL con RLS forzado, documentación, TypeScript y build.
- Navegador local con 18 conversaciones ficticias: Todas y En conversación
  revisadas visualmente, unión continua del contorno y halo exterior restaurado;
  Clientes conserva el panel y no registra errores de consola.
- Preflight remoto: imagen 51c2dfe, servicio 1/1, health/ready PASS. El rollback
  existe como imagen sha256:d40ef5d4532afc18ea005b93b6fba5fcd8f9cc894b077351d27caa2359a64c3c.
