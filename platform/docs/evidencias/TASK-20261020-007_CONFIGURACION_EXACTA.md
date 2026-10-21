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

## Release observado

Fuente Git remota deee4501a6635f3937bdb0c5a75e920f34600e30. Bundle git archive
40cc7f03838d7e4904d780cf6c13faa8cb4f8093794d62ca988ebd5b37aa1bda, sin prototipos.
Imagen sportex-bocetos:deee4501a6635f3937bdb0c5a75e920f34600e30,
digest sha256:1812e587b59606b534abca3701c3ab192114de58a72cfed913ea78877acac047.
51 pruebas del candidato remoto PASS, sin red ni volumen de negocio; sintaxis
app/element-layout/mockup-config/Core y ausencia de env/prototipos PASS.

Activacion2026-10-21T00:15:26Z (20/10 America/Montevideo), servicio healthy1/1.
Backup consistente pre-deee4501a6635f3937bdb0c5a75e920f34600e30.sqlite.
Comparacion de snapshots conserva companies/users/assets/idempotency/mockups.
Restauracion privada con SqliteLabStore y quick_check PASS:2 empresas,3 usuarios,
0 assets,10 operaciones,1 mockup; borrador version4 y publicacion revision1.
No se escribio ni publico una configuracion real para hacer QA.

Ambos dominios /ready identifican release exacto. Diez assets por SHA256 PASS;
catalogo/editor autenticados PASS y rutas anonimas/host ajeno protegidas PASS.
Sesión administrativa temporal cerrada. Sin IA paga ni cuentas de QA.
CRM sportex-staging:d9c4f443ad07b2e1 intacto. Rollback f4386fb disponible.

## Limite y uso

Navegador interno deshabilitado: no se declara QA visual. Tras recargar el
configurador, volver a guardar captura imageAspect; los registros anteriores no
incluyen el aspecto de las imagenes privadas que ya fueron descartadas. Las
medidas numericas y fuentes del borrador existente no se migraron ni reemplazaron.
Guardar conserva borrador; publicar desde Mockups aplica a nuevos bocetos.

Logs privados: .codex/artifacts/sportex-bocetos-20261020-007/ bajo el perfil de
Fito (red-deployed,green-fixtures,candidate-tests,activate,public-smoke,restore).
Datos SQLite y acceso administrativo quedan fuera de Git.

Cierre final SPORTEX_CLOSE=PASS con perfil pilot-release: validacion general,
contratos, tests Core, SQL y build PASS. Tarea cerrada, sin tarea activa siguiente.
