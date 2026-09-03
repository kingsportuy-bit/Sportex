# Evidencia TASK-20260903-001

Estado: RESTAURADO_DESPLEGADO_VERIFICADO_ACEPTACION_VISUAL_FITO_PENDIENTE
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

## Release exacto y rollback

- Commit: d9c4f443ad07b2e1df932d7eb4273d4b2e60307b, publicado en origin.
- Bundle SHA-256: ee46b774fae7758ee8e21200dd15b45ed62d99d4fcdcc40af626b29e9646b7cf.
- Imagen: sportex-staging:d9c4f443ad07b2e1.
- Image ID: sha256:0043ca07b7cfa7a3c0e50eb660f3fa5c0629be755b1041ee093639caa04029ae.
- Checkpoint privado: /var/backups/sportex/TASK-20260903-001-d9c4f44.
- Se cambió exclusivamente imagen y SPORTEX_RELEASE del servicio. No hubo
  migración, mutación DB, cambio de flags, membresías, secretos ni Evolution.
- Rollback disponible a sportex-staging:51c2dfea8abcc05b con spec previo.

## Resultado observado

- Servicio sportex_staging_core 1/1, health con release exacto y ready 200.
- app.js y styles.css públicos idénticos byte por byte al bundle.
- Outbound antes y después: 18; errores críticos: 0.
- QA autenticada en 1280x800: Todas y En conversación restauran contorno,
  unión al panel y halo. Clientes reutiliza esas piezas; Mi empresa y
  Pedidos tablero/planilla siguen disponibles. Consola: cero errores.
- No se abrieron conversaciones ni se enviaron mensajes, pedidos o pagos.
- Prueba estructural de igualdad con 8823a773 y revisión visual realizadas;
  no se afirma comparación automatizada píxel por píxel ni aceptación de Fito.
- El fix está en Git canónico, no existe una línea pausada pendiente de
  reconciliación. La aceptación visual humana queda explícitamente pendiente.
- Cierre posterior: SPORTEX_CLOSE=PASS, perfil pilot-release, 30/30 regresiones,
  59/59 Core/API, SQL/docs/TS/build PASS y ACTIVE_TASK=none.
