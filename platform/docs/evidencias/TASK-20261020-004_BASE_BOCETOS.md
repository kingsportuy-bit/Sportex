# Base inicial de bocetos

Task TASK-20261020-004. DESARROLLO_LOCAL,20/10/2026.
Rama codex/desplegar-bocetos-20261020, worktree canonico SPORTEX/platform.

## Causa y cambio

La base publicada contenia cuatro vivos activos y texto text-1792439241236
con NOMBRE arriba, ademas del back-name debajo del numero. restoreWorkspace
preferia ese modelo cacheado aunque cambiara el archivo publicado.
Fito confirma que debe quedar solo el nombre normal arriba del numero.
Se apagan los cinco grupos, se retira el texto adicional de layers/texts/styles/
visibleLayers y se coloca back-name en la posicion superior ya configurada.
Se conserva tamano/escala/fuente, curvas de vivos y demas opciones.
La base lleva presetRevision. Solo la firma conocida del preset defectuoso
se actualiza al restaurar: archivos propios y bases personalizadas se conservan.
Nuevo boceto tampoco hereda visibilidad de textos ausentes en la base.
No se modifica ningun documento ya guardado; se aplica a altas/nuevos bocetos.

## Verificacion

TDD: dos regresiones nuevas fallaron por shoulder true; luego diez pruebas
focales PASS. Cache defectuosa, texto duplicado, nombre superior, documentos
anteriores, Logo2 y personalizacion independiente cubiertos con codigo real.
Navegador interno en origen efimero sin IA: cinco checkboxes apagados; unico
nombre arriba. Editar PRUEBA y activar hombros en Boceto1, Nuevo boceto limpio;
volver aBoceto1 conserva ambos cambios. Boceto2 persiste tras recargar.
Captura privada base-corregida.png en
C:/Users/Fito/.codex/artifacts/sportex-bocetos-20261020-004/.
Auditoria estatica premium strict:66 hallazgos previos en HTML no modificado,
65 botones JS no detectados y Date nativo sin manifest aunque DESIGN lo declara.
No certifica PASS premium global; comportamiento afectado probado en navegador.
Una prueba vieja exigia fecha19/10 y texto extra: se retiran esas aserciones
desactualizadas; las regresiones nuevas comprueban el comportamiento solicitado.
197 pruebas bocetos PASS; npm run validate PASS:31 workflow,59 Core, documentos,
SQL/RLS y build. git diff --check PASS. Sin cambios visuales fuera de la base.
Checkpoint workflow:close TASK-20261020-004: SPORTEX_CLOSE=PASS, perfil local.
Tarea activa esperando GO para publicar el candidato.

## Ajuste solicitado despues de revisar el candidato

Fito pide nombre un poco mas arriba, ambos centrados en camiseta y numero frontal
apagado. Cuerpo posterior real back-photoDesignShirtBody: x625,ancho344,eje797,
coincide con powerClipMask usado por la alineacion del lienzo. Nombre x797,
y377.1402248768759 (18px arriba); numero posterior x797,altura y escala intactas.
show-front-number y visibleLayers.front-number false. Revisionv3 actualiza las
bases previas defectuosas yv2. Prueba de migracionv2 fallo815!=797 antes del fix;
11 pruebas focales PASS despues, sin reescribir preferencias ya actualizadas.
198 pruebas bocetos PASS. QA interno: numero frontal apagado en control y
render, nombre mas arriba y alineado sobre numero posterior. Captura privada
base-alineada.png, misma carpeta anterior. Sin cambios en documentos existentes.
Validacion general y workflow:close del ajuste: SPORTEX_CLOSE=PASS, perfil local;
31 workflow,59 Core, SQL/RLS y build PASS.

## Limites

La etapa local no incluyo cambios remotos, IA, limpieza de bocetos ni nuevas dependencias.
Fito autoriza con «go» publicar9a21e31. Rollback: release14de41c; cache y
documentos existentes quedan conservados.

## Publicacion20/10

13:24 UTC:14de41c healthy;38GB disco libres y6.5GB RAM disponibles. CRMd9c4f44.
GO operativo de Fito publica codigo9a21e31. Releasea65249d00e1513591ec1b908a888414587bc394b
agrega solo documentacion. Git archive remoto, SHA256:
88128c8e80e71af7010e39e8797e37ef069766103c1f1c1854eaacf1992310b3.
Imagen sportex-bocetos:a65249d00e1513591ec1b908a888414587bc394b:
sha256:13fcbd6a687395d77284ab447812392958460b5659026ee19587ada9a8d548df.
18 pruebas focales en Node24/Linux PASS dentro de la imagen, sin red/secretos.
Snapshot consistente previo con servicio detenido; copia privada descargada y
restaurada: quick_check ok,0empresas/1admin/0assets/0operaciones. Metadatos de
companies/users/assets/idempotency identicos despues del reemplazo.
13:26:58 UTC:publicacion PASS al primer intento; campo UpdateStatus ausente
manejado con index/with, imagen exacta healthy1/1 y ambos /ready200 del commit.
13:27:35 UTC:misma imagen sana; CRMd9c4f44 conservado.
HTTPS/public smoke PASS; app.js,element-layout.js,initial-parameters.json y panel
bytes exactos del bundle. Cinco vivos off, un nombre, x797 en nombre/numero,
nombre y377.1402248768759 y numero frontal off verificados en base publicada.
Rutas privadas anonimas401 y admin en dominio lab404. Sin llamadas IA ni
eliminaciones. No se crea empresa real para QA; no habia empresas al corte.
El recorrido visual local anterior corresponde al mismo codigo publicado.
Backup remoto /opt/sportex-bocetos/data/backups/pre-a65249d00e1513591ec1b908a888414587bc394b.sqlite.
Rollback a14de41c en mismo volumen; documentos locales no se reescriben.
Validacion posterior: SPORTEX_CLOSE=PASS, perfil pilot-release, tarea cerrada,
ACTIVE_TASK=none;31 workflow,59 Core, SQL/RLS y build PASS.
