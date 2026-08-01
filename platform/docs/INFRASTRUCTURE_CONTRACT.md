# Contrato de infraestructura SPORTEX

## Objetivo

Mantener SPORTEX aislado, observable, recuperable y atribuible a una version.

## Fronteras

- `DESARROLLO_LOCAL` no usa servicios reales.
- `PILOTO_DELTA` tiene recursos, secretos y datos explicitamente inventariados.
- `PRODUCCION_COMERCIAL` no comparte identidad operativa con el piloto sin una
  decision de cutover.
- Tenant y entorno son dimensiones distintas.
- SPORTEX no depende de n8n.

## Componentes objetivo

- Core API y workers con responsabilidades separadas;
- frontend delgado;
- PostgreSQL/Supabase con aislamiento multitenant;
- almacenamiento versionado para documentos;
- Evolution como adaptador de WhatsApp;
- observabilidad, backups y registro de deployments.

## Estado heredado

Los stacks, redes y dominios con sufijo `staging` creados en julio de 2026 son
artefactos transitorios. No se consideran destino del piloto hasta que una
tarea revalide capacidad, seguridad, ownership y conveniencia de migrarlos.

El VPS y servicios compartidos se inspeccionan de forma acotada. Reiniciar o
modificar un componente compartido requiere permiso explicito y analisis de
impacto sobre los otros proyectos.

## Reglas bloqueantes

- secretos fuera de imagen, Git, logs y documentos;
- healthchecks no reemplazan pruebas de negocio;
- procesos sin privilegios innecesarios;
- redes y credenciales de minimo acceso;
- backups con restauracion verificable;
- artefactos ligados a commit/digest;
- limites de CPU, memoria, disco y concurrencia;
- logs con correlacion, tenant y version sin datos sensibles;
- cambios de DNS, Traefik, DB o Evolution solo dentro de una operacion aprobada.

## Evidencia

La infraestructura actual se afirma solo desde observacion fechada. Los
snapshots se vuelven historicos y deben revalidarse antes de decidir o actuar.
