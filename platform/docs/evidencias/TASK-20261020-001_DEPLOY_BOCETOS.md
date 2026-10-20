# Despliegue de bocetos

TASK-20261020-001. Preparacion local y observacion read-only del VPS compartido.
Rama sportex-governance-20260801, checkout raiz. Fito autoriza despliegue y DNS.
Inventario 20/10: SSH disponible, Traefik 1/1, CRM d9c4f44 1/1, 39 GB libres.
Pendientes: candidato, HTTPS, persistencia, recuperacion y publicacion. Sin deploy
ni DNS modificados aun. Rollback: retirar solo nuevo servicio, preservar datos.

## Preparacion verificada

Rama codex/desplegar-bocetos-20261020. 182 tests del laboratorio PASS; prueba de
backup/restauracion SQLite, lock de segunda instancia y HTTPS/cookies/hosts.
GoDaddy confirma A de sportex-bocetos y panel-sportex-bocetos a 31.97.28.4,
TTL observado 600s. No se alteraron otros registros. Captura privada guardada.
Docker base Node24 fijada por digest 44fce696f38b; origen Docker Hub oficial.
/models confirma modelo ya utilizado sin generar imagen ni gastar tokens.
Bootstrap sera privado, sin fixtures ni /setup publico. Una replica, volumen
propio y limite 768MB; no se reutiliza DB del CRM ni se cambia Evolution.

## Resultado observado

20/10/2026 01:44:17 UTC. PILOTO_DELTA: laboratorio independiente, acceso Fito.
Release remoto b8e1fc827c0a6e668b79ee27d90af5ad91ae636d; commit funcional previo 26081c4.
Archivo Git d4839d7089ccaaf3b054652596e20c0e904161921b0fafa7204a73832a6fa70e.
Imagen sportex-bocetos:b8e1fc827c0a6e668b79ee27d90af5ad91ae636d, digest
sha256:96e59a6299d1ec500dae82d4d7c45fed988061914808d18ac6f11dd09ba513d3.
Scope: bocetos, core/bocetos, deploy, scripts y documentos; secretos excluidos.
Guard de release PASS con pedido operativo registrado como plan autorizado.
Se corrigio normalizacion de dotfiles (SPX-ERR-20261019-006), con prueba ejecutable.
El helper Bash exportado con CRLF fallo antes de construir; se ejecuto normalizado
por tr, preservando ZIP/hash. No se considero build como deploy.

Servicio sportex_bocetos_app, una replica, codexanet, volumen privado
/opt/sportex-bocetos/data. No se publican puertos directos. Administrador nuevo
bootstrap privado, secreto OpenAI Swarm; se retiro el archivo bootstrap remoto.
Nada de claves o contraseñas en imagen, Git, CLI args o evidencia. Clave principal
validada por /models, sin imagen paga. Falta proporcionar respaldo y admin key.

URLs https://sportex-bocetos.kodebix.com y
https://panel-sportex-bocetos.kodebix.com: TLS valido y /ready 200 con release exacto.
Admin inicia sesion en navegador interno, lista vacia sin fixtures; laboratorio
muestra login propio. Setup publico 404, admin desde dominio laboratorio 404,
APIs privadas anonimas 401. app.js, parametros iniciales y logo coinciden byte
por byte con el bundle; PDF runtime 200. Sin errores de consola administrativa.

Pruebas de runtime dentro de la imagen Linux PASS (SQLite, backup, lock, HTTPS).
Servicio reiniciado con --force y converge estable; nueva tarea healthy conserva
cuenta y cookie recordada. Snapshot real copiado a ubicacion local privada y
restaurado en copia aislada; login del administrador y ausencia de fixtures PASS.
Snapshot al arranque/diario/cierre; no se habilito cron global ni otra integracion.
Captura y accesos privados en C:/Users/Fito/.codex/artifacts/sportex-bocetos-20261020/. Acceso inicial entregable en
archivo local privado ignorado; nunca se copia en documentacion.

CRM sportex_staging_core sigue 1/1, imagen d9c4f443ad07b2e1. Sin cambios de DB,
Evolution, otros stacks, mensajes o generaciones reales. Primera empresa: alta
manual de Fito. No se certifica operacion comercial general del CRM.

Rollback: docker stack rm sportex_bocetos retira solo servicio/routers nuevos;
conservar /opt/sportex-bocetos/data, snapshots, secreto y release para reponer.
No ejecutar down ni restaurar sobre la base viva. Reposicion siempre stop-first,
una replica por lock exclusivo. Respaldo inicial local verificado.

Bundle, backup, captura y accesos se preservan fuera del repositorio. El scan
anti-NUL inspeccionaba binarios exportados dentro de deploy/private; se movieron
los artefactos generados al directorio privado externo sin cambiar el scanner.
