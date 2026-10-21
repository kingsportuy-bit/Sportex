# Configuracion exacta de mockups

20/10/2026 America/Montevideo. Task TASK-20261020-007. Entorno PILOTO_DELTA,
worktree SPORTEX/platform y rama codex/desplegar-bocetos-20261020.
Fito autoriza corregir y desplegar directamente el configurador publicado.
Se valida en candidato remoto sin pasar por un servidor local de la interfaz.

## Diagnostico inicial

Runtime f4386fb healthy; app.js,element-layout,mockup-config/editor coinciden
por hash con ese release. Consulta admin de lectura muestra version4 del
borrador football-basic con size/scaleX/scaleY, posiciones y fuentes presentes;
la publicacion sigue revision1. No se divulgan archivos ni credenciales.
Placeholder de180x100 se crea para todos los logos, pese a las proporciones
usadas al configurar. El modelo no conserva aspecto de la imagen de referencia.
El tamaño visible depende de ese aspecto: size representa la dimension mayor.

Navegador interno devuelve deshabilitado. No se evade esa limitación. Snapshot,
rollback f4386fb, pruebas de candidato y verificacion HTTPS antes de completar.

## Reproduccion y correccion

Tres regresiones nuevas fallan sobre la imagen desplegada f4386fb (RED). Prueba
HTTP real de guardar/reiniciar SQLite/publicar reproduce tambien la sustitucion
de fuentes por defaults de empresa. Sin llamadas de IA, sin volumen real.

Se conserva imageAspect numerico por capa: las muestras del lienzo respetan el
aspecto registrado y las escalas independientes. Una nueva imagen conserva la
altura configurada y su proporcion natural. Las revisiones publicadas explicitas
conservan fuentes seleccionadas; la base heredada revision1 conserva compatibilidad.

Nueve pruebas remotas pasan con los cambios (GREEN), incluyendo geometria,
versiones, permisos, aislamiento de empresa, SQLite y exclusión de imagenes.
Se corrige reloj de fixture tras reinicio: usaba hora real junto a una sesion
fijada a las12UTC; vencio durante esta prueba. No cambia la autenticacion real.
La comprobacion de medidas ejecuta layerBounds del lienzo, no una copia del calculo.
La primera carga en una base sin archivos tambien conserva la altura de referencia.

Pendiente: candidato inmutable, pruebas finales, backup/restore y activacion.
