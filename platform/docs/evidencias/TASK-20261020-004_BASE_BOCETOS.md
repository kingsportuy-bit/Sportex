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

Sin cambios remotos, IA, limpieza de bocetos ni nuevas dependencias.
Fito autoriza con «go» publicar9a21e31. Rollback: release14de41c; cache y
documentos existentes quedan conservados.
