# Eliminar empresa del laboratorio

Task: TASK-20261020-003. Entorno: DESARROLLO_LOCAL. Fecha: 2026-10-20.

## Alcance

Pedido de Fito: eliminar empresa con todos sus datos. Aclara conservar respaldos.
Comando Core admin con version y usuario escrito; dialogo propio con Cancelar
en foco inicial, Escape y bloqueo durante envio. El boton vive en cada fila.
Purga cuenta, sesiones, configuracion, assets, resultados, operaciones/usage,
idempotencia y auditoria tenant. Cache RAM y limites de login se retiran al borrar.
Evento admin sin identificador de empresa; reporte global OpenAI conservado.
SQLite confirma metadatos/blobs juntos. Escrituras atomicas impiden resucitar
archivos despues del borrado. Limpieza de huerfanos historicos sin tocar referencias
de otras empresas. JSON local informa fallo de limpieza y permite reintentar.

## Evidencia

18 pruebas focales PASS: ocho nuevas de eliminacion, ocho Core existentes y
dos de runtime. Memoria/JSON/SQLite: purga, aislamiento, sesiones, username
reutilizable con otro tenant, backups conservados/restaurables y reinicio.
SQLite con trigger que fuerza error: metadatos y blob se revierten juntos.
Solicitud/llamada processing bloquea; finalizaciones/subidas tardias no recrean
datos. HTTP: cookie admin, origen, confirmacion y reintento tras respuesta perdida.
QA interna con empresa ficticia: aviso, boton deshabilitado hasta usuario exacto,
Cancel/Escape y foco recuperado. Desktop480px y mobile346px de dialogo, sin
overflow interno. No se confirma ningun borrado en el navegador.
Capturas privadas en C:/Users/Fito/.codex/artifacts/sportex-bocetos-20261020-003/.
Detector visual: hallazgos preexistentes del login/panel (eyebrow, texto pequeno,
borde de tarjeta y foco global), fuera del nuevo dialogo; se preserva la interfaz.
Se corrige un mock antiguo sin pruneHistorySources en canvas-controls para poder
ejecutar su prueba existente de confirmacion. No cambia codigo del editor.

Validacion: npm run check:bocetos PASS, 195 pruebas. npm run validate PASS:
31 workflow, 59 Core, documentos, SQL/RLS y build. git diff --check PASS.
Pruebas focales de eliminacion repetidas tras endurecer entrada null: 8 PASS.
Checkpoint npm run workflow:close -- TASK-20261020-003 --profile=auto:
SPORTEX_CLOSE=PASS local; luego pilot-release PASS antes de publicar.

## Limites y publicacion

Sin IA, mutaciones remotas ni borrados de Delta Sport. Respaldos anteriores y
bocetos locales se conservan. Borrado activo, sin promesa de borrado forense.
GO de Fito: «go», publica el codigo01e6797 sin cambios funcionales. Rollback al release
69739bb; restaurar datos borrados requiere respaldo, no rollback de la imagen.
Al autorizar: publicar solo sportex_bocetos_app, tomar snapshot consistente,
comprobar readiness del commit y ambos dominios; rollback a 69739bb. Conservar
cuentas actuales y no ejecutar eliminaciones reales como parte del despliegue.

03:46 UTC: preflight remoto read-only, 69739bb healthy1/1, update completed.
Disco38GB libres, memoria7GB disponibles; CRMd9c4f44 conservado.

## Publicacion autorizada

Release14de41c2f3fcdc7b523354b4b2d7d01eec7f9d3e, codigo identico a01e6797;
solo documentacion operativa agregada. Bundle git archive desde commit remoto:
SHA2567562440276f88e71f6bc127ba56d0862a2f9398e39c13c41c6f9677bc3611f9c.
Imagen sportex-bocetos:14de41c2f3fcdc7b523354b4b2d7d01eec7f9d3e:
sha256:634f41f9819ba621d7b6e984e37a21433036a0f84b47d4cfdfd3eac739ba8b18.
Build y18 pruebas focales dentro de Node24/Linux PASS, sin red ni secretos.
Helper shell normalizado a LF fuera de la fuente tras detectar CRLF del archive.
Primer corte activa rollback por campo opcional UpdateStatus ausente: error002.
69739bb recuperado y sano; lector probado con campo inexistente. Reintento
desde replica activa sin tocar datos; update completed03:50:55 UTC.
03:51:14 UTC: imagen exacta healthy1/1; HTTPS /ready en ambos dominios200 con
commit esperado. panel.html/js/css, app.js y base bytes exactos del bundle.
Setup y admin en dominio laboratorio404; APIs privadas401 sin sesion. Nuevo
comando rechaza solicitud anonima401 antes de mutar.
Sesion admin recordada valida; Delta Sport activa,0usadas/5disponibles,0llamadas.
Se abre aviso Eliminar y se cancela: no se escribe confirmacion ni se elimina.
Captura eliminar-empresa-publicado.png, carpeta privada indicada arriba.
Estado companies/users/assets/idempotency identico al respaldo, una empresa.
Backup consistente pre-14de41c2f3fcdc7b523354b4b2d7d01eec7f9d3e.sqlite en
/opt/sportex-bocetos/data/backups; copia privada descargada y restaurada,
quick_check ok,1empresa/1admin/0assets/0operaciones. Respaldos previos intactos.
CRM d9c4f44 conservado; sin borrados reales, generaciones ni cargos IA.
Rollback disponible a69739bb, mismo volumen. Restaurar un borrado futuro exige
seleccionar respaldo; una restauracion completa tambien revierte datos posteriores.
Cierre posterior con tarea done/closed y currentTask null: SPORTEX_CLOSE=PASS,
perfil pilot-release; validacion general, SQL/RLS y build PASS.
