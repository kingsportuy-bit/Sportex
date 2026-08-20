# Evidencia — paridad visual de pestañas WhatsApp

task: `TASK-20260817-001`
fecha: `2026-08-20`
estado: `PILOTO_DELTA_TECHNICAL_AND_MESA_PASS_HUMAN_ACCEPTANCE_PENDING`
entornos: `DESARROLLO_LOCAL`, `PILOTO_DELTA`
rama: `codex/task-20260817-001-whatsapp-tabs-parity`
worktree: `C:\Users\Fito\Documents\CODEX\SPORTEX-WORKTREES\TASK-20260817-001-whatsapp-tabs-parity`

## Alcance

- Igualar la forma de las siete pestañas, la fusión de la activa con el panel y el brillo verde de la referencia suministrada por Fito.
- Certificar raster estrictamente sólo `Todas` activa en desktop canónico; verificar los otros estados por invariantes y responsive por estructura y acceso.
- Desplegar el candidato exacto en `PILOTO_DELTA` sin migraciones, cambios de datos, Evolution ni mensajes.

## Referencia sellada

- Original externo no versionado: `1672x941`, SHA-256 `5167043b9f9db3cbec5da61bef653d82e8fbf118873aa75d39173b1976285438`.
- Interpretación: `untagged_assumed_sRGB`; no se atribuye retrospectivamente navegador, SO, DPR o fuentes.
- Recorte sanitario sin resampling: `x=247`, `y=94`, `w=1320`, `h=96`; incluye las siete pestañas y la costura superior relevante.
- Recorte versionable: `reference/sealed/reference-tabs.png`, SHA-256 `cebee25314c0598dd7aa22c56c96ada6be89f9e9ccc6150ffc43427670ceeb23`.
- El original contiene información privada fuera del recorte y nunca entra en Git.
- Se conserva exactamente el dominio estadístico `V5` aprobado; no se amplió el recorte ni cambió el digest autorizado.

## Procedimiento

1. Crear worktree desde la base aprobada y actualizar sólo la ruta/rama del estado propietario.
2. Sellar plan, referencia, fixture, comparador, máscaras y manifest antes de editar UI.
3. Corregir geometría sin glow; luego superficies; al final halo y trazo nítido.
4. Ejecutar tres capturas frías, comparación canónica, siete estados, responsive, accesibilidad y regresión.
5. Someter el candidato a revisión independiente.
6. Publicar commit exacto, crear bundle e imagen inmutables, revalidar rollback y desplegar en `PILOTO_DELTA`.
7. Verificar réplicas, health, ready, assets, logs y cero outbound; registrar aceptación visual humana por separado.

## Resultado actual

- Candidato desplegado:
  `8823a77365f78f25db9fbf7afb5decd21e59f547`; guard de release y rama remota
  PASS para los dos archivos frontend autorizados.
- `npm run check`, 57/57 tests, SQL/RLS, build y `git diff --check` PASS. Los
  wrappers de workflow que lanzan procesos hijos quedaron bloqueados por
  `spawn EPERM` del sandbox; no se declara `SPORTEX_CLOSE=PASS`.
- Las siete pestañas reutilizan la misma geometría y cambian únicamente la
  posición activa. `ALL`, central y última dieron `180×67`, superficie activa
  `186×68`, unión `0px`, activa en capa `2` e inactivas en `1`.
- Activa y panel comparten `rgb(20,25,22)`. El contorno y doble halo usan el
  mismo gradiente dinámico: máximo lima sobre la activa y caída hacia ambos
  laterales, sin trazo horizontal bajo la pestaña.
- El comparador raster sellado de `Todas` permanece sin rebase y no se alteró
  para forzar un PASS. La aclaración posterior de Fito exige una sola silueta
  para todos los estados, incompatible con variaciones históricas de esa toma;
  la aceptación vigente usa invariantes estructurales y Mesa visual autenticada.
- Responsive PASS en 1280×720, 1024×768, 768×1024 y 390×844. Foco y activación
  por Arrow/Home/End/Enter/Space PASS.
- Imagen `sportex-staging:8823a77365f78f25`, runtime `1/1`, health/ready
  `200`, CSS/JS públicos exactos y outbound total `16→16`, pendientes/outbox
  `0→0`.
- Mesa visual independiente y frontend/QA: PASS sin brechas bloqueantes.
  Aceptación visual humana de Fito: pendiente.

## Rollback

- Local: descartar exclusivamente esta rama y worktree.
- Remoto: volver image-first a `sportex-staging:4898d557cf0fa678` si falla
  cualquier gate posterior.

## Pendientes

- Registrar la aceptación visual humana de Fito o iterar desde el rollback si
  detecta una brecha nueva. La task operativa mayor continúa activa.
