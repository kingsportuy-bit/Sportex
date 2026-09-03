# Restaurar viñetas aprobadas de WhatsApp

id: TASK-20260903-001
owner: Codex
requester: Fito
estado: done
lifecycle: closed
work_type: operacion
campaign: CAMP-20260803-001
context_focus: frontend deploy
development_guide_impact: none
updated_at: 2026-09-03
plan_authorization: PLAN_APPROVED_AUTHORIZED

## objetivo

Restaurar exactamente la geometría SVG y CSS de las viñetas del release
8823a773 sobre las funcionalidades de 51c2dfe, validar paridad y desplegar el
fix autorizado por Fito el 2026-09-03 en PILOTO_DELTA.

## alcance_permitido

- Recuperar del artefacto anterior únicamente código público frontend.
- Restaurar renderer y estilos de las viñetas sin alterar Leads, Clientes,
  Pedidos, Mi empresa ni el comportamiento de mensajes.
- Agregar regresión de paridad contra la referencia recuperada.
- Publicar commit, bundle e imagen exactos; desplegar y verificar visualmente.

## alcance_prohibido

- Cambiar Core, DB, migraciones, membresías, secretos, Evolution o Ads.
- Enviar mensajes, crear pedidos, registrar pagos o modificar conversaciones.
- Volver todo el sistema a 8823a773 y perder las funcionalidades nuevas.
- Rediseñar las viñetas en lugar de recuperar la implementación aprobada.

## entradas

- GO de Fito: "bien procede", después del diagnóstico y propuesta de recuperar
  las piezas originales manteniendo las funciones nuevas.
- Git HEAD 37246e4; runtime 51c2dfe; referencia visual 8823a773 conservada en VPS.
- No hay tarea activa que pausar ni cambios heredados sin guardar.

## salidas

- Renderer/CSS reconciliados en Git, guardia de regresión y release verificado.
- docs/evidencias/TASK-20260903-001_RESTAURAR_VINETAS.md

## validacion

- Reproducir discrepancia anterior y demostrar igualdad de las piezas
  protegidas frente al release 8823a773.
- Comparación visual local con datos ficticios en más de una pestaña activa.
- Suite completa, release guard y frontend público exacto.
- Servicio 1/1, health/ready 200; navegación autenticada sin efectos comerciales.

## evidencia

docs/evidencias/TASK-20260903-001_RESTAURAR_VINETAS.md

## rollback

Conservar sportex-staging:51c2dfea8abcc05b y el spec previo. Si el candidato no
converge o rompe navegación, volver a esa imagen; no hay cambios de DB.

## deuda_restante

- La aceptación visual final corresponde a Fito.
- Las pruebas de mensajes, pedidos y pagos reales no pertenecen a este fix.

## registro_de_avances

### 2026-09-03 - diagnóstico confirmado y autorización

El release publicado 8823a773 tenía correcciones SVG/CSS ausentes de la base
local usada para 51c2dfe. La comparación previa se hizo contra Git local, no
contra el artefacto ejecutado, y la QA no certificó esa paridad. Se conserva la
referencia original y se limita el fix a reconciliar esas piezas visuales.

### 2026-09-03 - candidato local

Restauración literal y cuatro regresiones de paridad PASS. Suite completa:
30/30 workflow/frontend, 59/59 Core/API, SQL 25 tablas, TS/docs/build PASS.
Viñetas Todas/En conversación y módulo Clientes revisados en la demo ficticia;
sin errores de consola. Sin mutaciones remotas antes del release guard.

### 2026-09-03 - publicación y comprobación

Release d9c4f443ad07b2e1df932d7eb4273d4b2e60307b desplegado desde bundle
inmutable; imagen sportex-staging:d9c4f443ad07b2e1, servicio 1/1,
health/ready PASS y frontend público idéntico al candidato. Outbound 18 -> 18.
Revisión autenticada de Todas y En conversación en 1280x800, Clientes,
Mi empresa y Pedidos PASS; cero errores de consola. No se abrieron chats ni
se modificaron datos. Código recuperado reconciliado en la rama canónica.

## decisiones

- Recuperación exacta, no reinterpretación visual.
- No modificar la lógica nueva ni retroceder el Core/base de datos.
- Verificar paridad ejecutable y visual antes del despliegue.
