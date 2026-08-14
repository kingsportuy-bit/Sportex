# Integrar WhatsApp real de Delta con SPORTEX

id: TASK-20260814-001
owner: Codex
requester: Fito
estado: in_progress
lifecycle: active
work_type: feature
campaign: CAMP-20260803-001
context_focus: architecture
development_guide_impact: none
updated_at: 2026-08-14

## objetivo

Convertir la interfaz WhatsApp-first aprobada en el puesto operativo real de
Delta, reutilizando la base existente de SPORTEX y completando solamente las
brechas necesarias para operar conversación, contacto, oportunidad, seña,
cliente, pedido y producción mínima con trazabilidad.

## resultado_final

Un único inbox real de Delta aparece continuamente en SPORTEX y permite:

`ver conversación -> responder manualmente -> clasificar -> definir próximo paso -> validar seña -> crear/vincular cliente y pedido -> entregar a producción mínima -> medir origen y resultado`

La captura funciona con la UI cerrada. Los fallos son visibles y recuperables.
Evolution y Meta aportan evidencia; SPORTEX conserva la historia operativa;
DELTA define reglas y valida negocio.

## entradas

- interfaz y evidencia cerradas por `TASK-20260803-005`;
- `HANDOFF-20260814-003` aprobado por Fito;
- Core, contratos, migraciones, tests y fixtures vigentes;
- fuentes comerciales DELTA en modo lectura;
- inventario de la Mesa `reutilizar | adaptar | falta`.

## salidas

- modelo comercial normalizado e integrado con la vertical transaccional;
- persistencia y migraciones ensayadas localmente;
- adaptador Evolution y workers probados primero con transporte falso;
- interfaz conectada a proyecciones reales del Core;
- paquete exacto de preflight/rollback para captura pasiva;
- evidencia por gate hasta el piloto operativo autorizado.

## decisiones_confirmadas

- No reconstruir módulos que ya cumplen contrato.
- Auditar cada capacidad como `reutilizar | adaptar | falta`.
- Mantener Contacto, Conversación, Oportunidad, Cliente y Pedido relacionados
  pero separados.
- Un Contacto puede tener varias conversaciones, oportunidades y pedidos.
- `SEÑA_DETECTADA` no crea Pedido.
- `SEÑA_VALIDADA` permite vincular o crear Cliente y exactamente un Pedido.
- La interfaz actual se conserva y consume proyecciones del Core.
- Evolution es adaptador; Meta es lectura; frontend no decide negocio.
- El primer outbound es manual, individual, confirmado y reversible mediante
  kill switch.
- La task ADS activa de DELTA permanece sin cambios.

## secuencia

1. **Modelo/persistencia local:** entidades separadas, varias oportunidades,
   seña, Cliente/Pedido único, RLS, auditoría y rollback ensayado.
2. **Evolution simulado:** ambos sentidos, receipts, duplicados, ordering,
   backfill, cuarentena, worker falso y captura con UI cerrada.
3. **Mesa local:** API/proyecciones, acciones internas, aprobación registrada,
   producción mínima y trazabilidad ficticia de punta a punta.
4. **Preparación remota:** seguridad, dependencias, inventario, Auth, DB,
   backup, migración, rollback, observabilidad y kill switches.
5. **Captura pasiva:** un canal, backfill pequeño, Meta en lectura y outbound
   `DENY_ALL`, sin pérdidas ni atribución inventada.
6. **Envío manual:** preview, confirmación individual, outbox, worker, receipts,
   reintentos, reconciliación, takeover y kill switch.
7. **Operación inicial:** seña, Cliente/Pedido, producción mínima y lote real de
   7–14 días sin registro paralelo.

## alcance_permitido

- documentación, arquitectura, código, migraciones no ejecutadas y pruebas en
  `DESARROLLO_LOCAL`;
- refactor focal necesario para separar las entidades comerciales;
- fixtures, adaptadores y transportes falsos;
- UI y API de las funciones enumeradas;
- preparación de seguridad, migración, rollback y manifiesto remoto;
- lectura focal de las fuentes comerciales DELTA.

## alcance_prohibido

- cambiar campañas, anuncios, presupuesto o estado ADS;
- modificar Evolution, webhook, Chatwoot, Meta, VPS o base remota;
- acceder/copiar datos reales o secretos;
- desplegar o ejecutar migraciones remotas;
- enviar WhatsApp real;
- bots, follow-ups automáticos, mensajes masivos o empresas externas.

## bloqueos_reales

- no poder reconciliar/versionar el baseline vigente;
- modelo o migración incapaz de aislar tenant;
- idempotencia/replay no determinista;
- necesidad de sobrescribir o borrar fuente real;
- interferencia con la tarea ADS activa;
- operación remota sin recurso exacto, backup, rollback o permiso.

## validacion

- tests unitarios, integración, permisos y cross-tenant;
- duplicados, ordering, restart, backfill solapado y receipts;
- migración/rollback ensayados localmente;
- E2E completo por gate;
- frontend responsive y estados de fallo;
- diff focal, documentación y `SPORTEX_CLOSE=PASS` por checkpoint;
- aceptación humana antes de ampliar cada gate real.

## evidencia

- `docs/evidencias/TASK-20260814-001_INVENTARIO_Y_PLAN.md`;
- evidencia focal nueva por cada gate;
- manifiesto, migración, rollback y observación cuando corresponda.

## rollback

- commits y artefactos por gate;
- cambios de esquema aditivos y proyecciones reconstruibles;
- kill switches separados para ingesta, proyección, acciones internas y outbound;
- nunca borrar fuente real como forma de rollback;
- volver al canal actual ante incidente de envío.

## deuda_postergada

- bots y respuestas autónomas;
- importación histórica completa;
- múltiples canales/inboxes;
- scoring, dashboards avanzados y atribución multicanal;
- producción detallada, inventario, contabilidad y facturación;
- personalización total del pipeline;
- salida comercial para terceros.

## deuda_restante

- Cada gate no iniciado permanece deuda explícita de esta misma task/campaña.
- Los gates remotos quedan bloqueados hasta inventario vivo, rollback y GO exacto.
- Las capacidades postergadas no bloquean el primer recorrido operativo.

## decisiones

- `SPORTEX-DEC-010` gobierna la integración progresiva.
- Se conserva toda implementación existente que pase contrato y pruebas.
- Un fallo focal no autoriza un refactor general ni cambio silencioso de estados.
- La captura pasiva precede acciones internas reales y outbound.
- El envío manual real es el último gate y requiere confirmación humana.

## registro_de_avances

### 2026-08-14 — inicio autorizado

- Fito autorizó el resultado final y pidió ejecutar sin consultas por decisiones
  menores.
- La Mesa produjo el inventario `reutilizar | adaptar | falta` y confirmó que
  las dos verticales existentes deben integrarse, no reemplazarse.
- `HANDOFF-20260814-003` define autoridad, gates, aceptación y límites.
- La ejecución comienza en Gate 1 después de cerrar/versionar el corte UI.

### 2026-08-14 — checkpoint Gate 1A

- Una seña validada ahora crea y vincula Cliente, Pago certificado y un único
  Pedido con claves idempotentes por oportunidad.
- La ficha conserva IDs, pedido, importes, actor, momento y `ORDER_CREATED`.
- La acción vive en Detalles de WhatsApp sin ocultar el chat.
- Pasaron reintento sin duplicación, rechazo sin seña, conflicto y API completa.
- Browser local: Lucas R. pasó de seña ficticia a `SPX-2026-00001`; los contadores
  visibles cambiaron a 1 Cliente y 1 Pedido y la próxima acción quedó en preparar
  producción. No hubo red, datos reales ni outbound.
- Gate 1 continúa: falta normalizar Contacto como entidad reutilizable, persistencia
  objetivo/migración y prueba de varias conversaciones/oportunidades por contacto.
