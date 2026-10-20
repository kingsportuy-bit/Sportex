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
SPORTEX_CLOSE=PASS, perfil local. La tarea sigue activa esperando GO operativo.

## Limites y publicacion

Sin IA, mutaciones remotas ni borrados de Delta Sport. Respaldos anteriores y
bocetos locales se conservan. Borrado activo, sin promesa de borrado forense.
No publicado; necesita GO concreto segun AGENTS.md. Rollback de codigo al release
69739bb; restaurar datos borrados requiere respaldo, no rollback de la imagen.
Al autorizar: publicar solo sportex_bocetos_app, tomar snapshot consistente,
comprobar readiness del commit y ambos dominios; rollback a 69739bb. Conservar
cuentas actuales y no ejecutar eliminaciones reales como parte del despliegue.
