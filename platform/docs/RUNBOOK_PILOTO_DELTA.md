# Runbook de promoción PILOTO_DELTA

## Propósito

Procedimiento reutilizable para promover un candidato de SPORTEX al piloto de
Delta sin depender de memoria de chat. No guarda secretos ni autoriza una
promoción por sí mismo.

## Ruta y servicio verificados

- VPS: checkout operativo bajo `/opt/sportex-staging/platform`.
- Stack Swarm: `sportex_staging`.
- Servicio: `sportex_staging_core`.
- Red: `sportex_staging_net`.
- URL pública: `https://sportex.codexa.uy`.
- Script remoto de referencia: `DELTA/tmp/sportex_staging_deploy.sh`.

## Secuencia

1. Ejecutar `release-governance-guard.ps1` y crear el bundle con
   `new-release-bundle.ps1` desde el commit publicado.
2. En el VPS, registrar la especificación actual de `sportex_staging_core` y
   crear un backup verificable de las tablas `sportex_staging_*`.
3. Ensayar la restauración en una base aislada. Si falla, detenerse.
4. Copiar el bundle al checkout operativo, construir la imagen
   `sportex-staging:<commit-corto>` y conservar el digest.
5. Aplicar primero las migraciones aditivas necesarias con el rol de
   aplicación; verificar tabla, RLS y aislamiento antes de actualizar Swarm.
6. Exportar en el entorno remoto `SPORTEX_IMAGE`, `SPORTEX_RELEASE` y los
   nombres existentes de secretos; nunca imprimir sus valores. Ejecutar
   `docker stack deploy --compose-file deploy/docker-stack.staging.yml
   --resolve-image never sportex_staging`.
7. Esperar `sportex_staging_core=1/1`; si no converge, consultar `service ps`
   y logs, y volver a la imagen previa.
8. Verificar `/health`, `/ready`, configuración pública, login y lectura
   autenticada. La QA no debe crear pedidos, certificar pagos ni enviar
   mensajes sin una prueba específicamente autorizada.
9. Observar el servicio y logs. Registrar commit, digest, backup, migración,
   smoke, rollback y resultado en la evidencia de la tarea.

## Rollback

Volver primero a la imagen anterior mediante el mismo stack y verificar 1/1,
health y readiness. Las tablas aditivas se conservan; un `down` o restore de
datos es una operación separada y destructiva.

## Reglas de seguridad

- La conexión SSH y valores de secretos permanecen fuera de Git.
- No usar comandos SQL complejos inline desde PowerShell: crear un script
  remoto temporal, copiarlo y ejecutarlo en el VPS.
- No habilitar ni probar outbound WhatsApp como parte de un despliegue.
