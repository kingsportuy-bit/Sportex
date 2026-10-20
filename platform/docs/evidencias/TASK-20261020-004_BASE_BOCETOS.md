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

## Limites

Sin cambios remotos, IA, limpieza de bocetos ni nuevas dependencias.
Publicacion requiere GO exacto. Rollback: release14de41c actual; cache y
documentos existentes quedan conservados.
