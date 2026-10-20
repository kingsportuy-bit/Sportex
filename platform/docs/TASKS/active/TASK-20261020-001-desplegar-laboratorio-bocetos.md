# Desplegar laboratorio y panel de bocetos

id: TASK-20261020-001
owner: Codex
requester: Fito
estado: in_progress
lifecycle: active
work_type: operacion
campaign: CAMP-20260803-001
context_focus: infrastructure
development_guide_impact: none
plan_authorization: PLAN_APPROVED_AUTHORIZED
updated_at: 2026-10-20

## objetivo

Publicar el laboratorio y panel independientes en los dos dominios acordados.

## alcance_permitido

Runtime del laboratorio, HTTPS, persistencia y recuperacion, pruebas, version,
servicio nuevo aislado en VPS 31.97.28.4, secretos privados y DNS de
sportex-bocetos.kodebix.com / panel-sportex-bocetos.kodebix.com.

## alcance_prohibido

No modificar CRM, legado, otros proyectos, WhatsApp ni bases compartidas.
No importar fixtures, secretos o bocetos privados al release.

## entradas

Fito: «bien vamos a desplegar entonces»; GoDaddy abierto para los DNS.
Panel local TASK-20261019-001 con 180 pruebas PASS. Esta operacion publica
acceso controlado por Fito; no certifica venta a terceros del CRM.

## salidas

URLs HTTPS verificadas, administrador privado, release reproducible y rollback.

## validacion

Aislamiento, sesiones HTTPS, bootstrap cerrado, persistencia/reinicio/restauracion,
login y bloqueo de empresa, consumo simulado; sin generaciones pagas de QA.

## evidencia

docs/evidencias/TASK-20261020-001_DEPLOY_BOCETOS.md

## rollback

Retirar solo routers/servicio nuevos; conservar volumen, respaldo y release.
No modificar el CRM existente. Detener si falla seguridad, salud o aislamiento.

## deuda_restante

Inventariar runtime y preparar candidato exacto antes de publicar.

## registro_de_avances

20/10: contexto operativo PASS, preflight CRLF leido. SSH read-only confirma VPS,
CRM d9c4f44 1/1, Traefik y 39 GB libres. Zona GoDaddy accesible; sin mutacion DNS.

## decisiones

Usar servicio y recursos nuevos; alta manual, claves compartidas y fallback.

20/10: dos A creados en GoDaddy a 31.97.28.4, TTL observado 600s. Candidato
agrega HTTPS/cookies separadas, SQLite FULL exclusivo y backup restaurado en test.
Modelo OpenAI existente disponible, verificado por /models sin generar imagen.

Autorizacion operativa: pedido directo de Fito en este hilo de desplegar los dos
dominios; alcance explicado y DNS ofrecido expresamente. Sin cambio del CRM.
