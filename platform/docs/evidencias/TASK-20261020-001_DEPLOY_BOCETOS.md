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
