# Arranque del lienzo

20/10/2026 America/Montevideo. Task TASK-20261020-008, PILOTO_DELTA,
CAMP-20260803-001. Worktree SPORTEX/platform, rama codex/desplegar-bocetos-20261020.

Fito confirma guardado/publicacion correctos y pide arreglar la carga inicial del
editor desplegado, manteniendo autorizacion del turno anterior. Alcance frontend,
sin datos de negocio ni APIs pagas. Rollback deee450 con backup previo.

## Diagnostico

applyMockupAvailability busca trim-shirt-side-group, trim-short-side-group y
trim-short-hem-group. Esos tres div.trim-group carecen de id en index.html.
La excepcion ocurre antes de updateFrame/updateViewButtons en restoreSketch.
init ya dibujo colores y elementos de HTML antes de aplicar la configuracion,
por eso quedan visibles hasta otro evento. El catch general informa moldes.

Navegador interno no disponible: getState devuelve disabled. No se accede por
otro controlador. Tests ejecutaran codigo real con DOM de fixtures del HTML.

## Reproduccion

Imagen desplegada deee450 healthy confirmada. Prueba ejecuta init, captureSketch,
restoreSketch y applyMockupAvailability reales con ids derivados de index.html.
No es un navegador ni prueba de raster. Con codigo/HTML desplegado, el arranque
de empresa y preview fallan por null.toggleAttribute antes de updateFrame.

GREEN con tres ids añadidos y primer render diferido hasta restore: empresa,
opciones de vivos, configurador y preview pasan sin interaccion. Se comprueba
tambien preservacion de documento cacheado y aviso ante imagen ausente.
Sin modificar SQLite real, sin IA ni cache del usuario.

## Release y preservacion

Commit remoto0fc5169a7ab3351ddb58c3e9c6f2a5301a54b6b8; bundle git archive
a9c8fe20b6d3c2332468e7771653b91955375c17e0c3ab64b10cc4843b6a3ba7.
Digest sha256:4d81c1408d94530fedca5dafe1a302aa7f0db70982977d51f07c4fa772941b2e.
56 tests de candidato PASS, cinco de arranque/cache/error de imagen. Sintaxis y
ausencia de env/prototipos PASS. Candidato sin red ni volumen real.

Activado2026-10-21T01:21:27Z (20/10 America/Montevideo): healthy1/1. Snapshot
pre-0fc5169a7ab3351ddb58c3e9c6f2a5301a54b6b8.sqlite verificado y restaurado
en copia privada:2 empresas,3 usuarios,0 assets,5 operaciones,1 mockup,
borrador version6/publicacion revision2. Comparacion de snapshots conserva
companies/users/assets/idempotency/mockups. No se guardo ni publico una base de QA.

HTTPS de ambos dominios identifica release exacto. Diez assets y HTML admin por
SHA256 PASS; cinco grupos presentes y Cache-Control:no-store. No era necesario
borrar cache. Catalogo/editor autenticados y aislamiento por dominio PASS.
Sesion temporal de comprobacion cerrada. CRM d9c4f443ad07b2e1 intacto.
Rollback deee450 disponible; no llamadas IA, cuentas QA ni cambios de negocio.

## Limites y continuidad

Sin QA visual por bloqueo del navegador interno. Pruebas de arranque ejecutan
funciones reales y comprueban primer render solicitado; no certifican pixeles.
Fito debe recargar la pestaña para obtener el HTML/JS publicado; cache, bocetos,
posiciones y configuracion guardada permanecen. Cuellos siguen excluidos.

Logs privados en .codex/artifacts/sportex-bocetos-20261020-008/ bajo perfil de
Fito: red,green,candidate-tests,build,activate,public-smoke,restore,close-pre.
No se incluyen SQLite ni secretos en Git.

Cierre final SPORTEX_CLOSE=PASS, perfil pilot-release: validacion general,
contratos, tests Core, SQL, build y worktrees PASS. Tarea cerrada.
