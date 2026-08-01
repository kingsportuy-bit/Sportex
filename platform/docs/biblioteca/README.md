# Biblioteca documental SPORTEX

## Propósito

Esta biblioteca es el índice operativo para encontrar el contrato correcto antes de modificar SPORTEX.

Todas las fichas heredan `MODULE_COMMON_CONTRACT.md`.

## Uso

1. Leer `../INICIAL.md`.
2. Leer estado y tarea activa.
3. Elegir capa, módulo o superficie afectada.
4. Leer su ficha y contratos vinculados.
5. Actualizar la ficha si cambia responsabilidad, entrada, salida, persistencia, permisos, efectos, pruebas o evidencia.

## Capas

- `capas/L1_ENTRADAS.md`;
- `capas/L2_INTERPRETACION.md`;
- `capas/L3_APLICACION.md`;
- `capas/L4_DOMINIO.md`;
- `capas/L5_PERSISTENCIA.md`;
- `capas/L6_SALIDAS.md`.

## Módulos

- `modulos/identidad_empresas/README.md`;
- `modulos/clientes_leads/README.md`;
- `modulos/whatsapp_conversaciones/README.md`;
- `modulos/pagos/README.md`;
- `modulos/nuevo_pedido/README.md`;
- `modulos/costos/README.md`;
- `modulos/procesos/README.md`;
- `modulos/documentos/README.md`;
- `modulos/diseno/README.md`;
- `modulos/impresion_compras/README.md`;
- `modulos/talleres/README.md`;
- `modulos/envios/README.md`;
- `modulos/notificaciones/README.md`;
- `modulos/observabilidad/README.md`;
- `modulos/seguridad/README.md`;
- `modulos/postventa/README.md`.

## Superficies

- `superficies/whatsapp/README.md`;
- `superficies/evolution/README.md`;
- `superficies/api/README.md`;
- `superficies/web/README.md`;
- `superficies/db/README.md`;
- `superficies/archivos/README.md`;
- `superficies/workers/README.md`;
- `superficies/vps/README.md`.

## Contratos transversales

- `../CURRENT_RUNTIME_BASELINE.md`;
- `../DOMAIN_MODEL_V1.md`;
- `../API_CONTRACT_V1.md`;
- `../ARCHITECTURE.md`;
- `../CORE_CONTRACT.md`;
- `../MULTITENANCY_CONTRACT.md`;
- `../SECURITY.md`;
- `../OBSERVABILITY.md`;
- `../WHATSAPP_EVENT_CONTRACT.md`;
- `../DOCUMENTS_CONTRACT.md`;
- `../NOTIFICATIONS_CONTRACT.md`;
- `../INFRASTRUCTURE_CONTRACT.md`;
- `../SUPABASE_CONTRACT.md`;
- `../EVOLUTION_CONTRACT.md`;
- `../GIT_RELEASE_CONTRACT.md`;
- `../DEPLOYMENT_PROTOCOL.md`;
- `../DEPLOYMENT_MANIFEST_TEMPLATE.md`.

## Regla de estado

Una ficha `NO_INICIADO` define responsabilidad objetivo, pero no prueba
implementacion. `CERTIFICADO_PILOTO` exige evidencia de `PILOTO_DELTA` ligada a
una version concreta. `OPERATIVO_COMERCIAL` agrega un gate independiente.
