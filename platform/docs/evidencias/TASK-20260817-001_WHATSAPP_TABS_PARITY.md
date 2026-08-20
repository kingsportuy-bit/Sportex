# Evidencia — paridad visual de pestañas WhatsApp

task: `TASK-20260817-001`
fecha: `2026-08-20`
estado: `HUMAN_ACCEPTED_LOCAL_INTEGRATED`
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

- `SPORTEX_CONTEXT=PASS` en el worktree aislado.
- Referencia, plan `V5`, fixture, comparador, E2E y máscaras sellados antes de modificar la UI.
- La cadena raíz verifica plan `V5`, fixture, comparador, E2E, manifiesto preparado, referencia y tres máscaras por ruta y SHA-256 antes de capturar o comparar.
- Las siete etapas exigen el mismo path trasladado, los mismos tokens SVG, unión sin trazo inferior, tres capas activas y teclado completo también en responsive.
- Autoprueba: 34 vectores CIEDE2000 con error máximo `4.95e-05`; SSIM, máscara AA, conectividad 8 y perfil de halo en `PASS`.
- Control negativo del baseline: `FAIL_CLOSED` por altura real `51px` frente a `67±0.25px`; demuestra que el arnés detecta la brecha existente.
- Candidato `d9c32b7` aceptado visualmente por Fito e integrado localmente.
- El E2E estructural y de acceso pasó; la comparación raster estricta quedó
  `FAIL_CLOSED` y no se presenta como paridad píxel perfecta.

## Rollback

- Local: descartar exclusivamente esta rama y worktree.
- Remoto: revalidar `sportex-staging:9ff30856c69fddae` antes de desplegar y volver image-first si falla cualquier gate.

## Pendientes

- Un nuevo release, observación de runtime o push requiere autorización aparte.
