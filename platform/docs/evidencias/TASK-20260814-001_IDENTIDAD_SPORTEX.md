# Evidencia — identidad visual SPORTEX

Fecha: 2026-08-14
Task: `TASK-20260814-001`
Entornos validados: desarrollo local y `PILOTO_DELTA` productivo

## Decision aplicada

SPORTEX es la unica marca visual de la aplicacion. `Delta Sport` puede aparecer
como nombre del negocio o tenant, pero su logo no forma parte del sistema.

## Implementacion

- Fuente entregada por Fito: `logo-sportex.png`.
- Fuente original preservada: `logo-sportex.png`, SHA256
  `9b413b59d4c47d3d170cd1e119cbe6ba12f8a46de51b188d143aa7323bcf10b8`.
- Asset transparente del frontend: `frontend/assets/sportex-logo.png`, SHA256
  `d726c53c6537f34911e6c8be46a5a9e8d551eba4247d818c7091a2151b82b628`.
- Login y sidebar usan el wordmark horizontal con encuadres proporcionales.
- `frontend/assets/delta-logo.png` fue retirado.
- No quedan referencias al asset o clases de logo Delta en el frontend.
- El archivo fuente que Fito dejo en la raiz no fue modificado ni incluido por
  accidente dentro del commit de plataforma.

## Validacion visual

- Browser local en modo oscuro: logo SPORTEX legible y sin rectangulo negro.
- El tenant `Delta Sport` queda debajo del wordmark como contexto secundario.
- La barra lateral conserva ancho, navegacion y jerarquia existentes.
- El logo tiene texto alternativo `SPORTEX` y no duplica una marca escrita al
  lado de la imagen.

## Transparencia real

- Se extrajo el fondo del raster conservando el wordmark original; la fuente
  entregada por Fito no fue sobrescrita.
- El asset final es PNG `1916x821`, `Format32bppArgb`.
- Las esquinas tienen alpha `0` y el centro del wordmark alpha `255`.
- El frontend retiro `mix-blend-mode: screen`; ya no depende del color del
  fondo para esconder un rectangulo negro.
- Browser local oscuro PASS: logo visible, bordes limpios y encuadre de sidebar
  sin cambios.

## Transparencia desplegada

- Commit exacto: `c375e58cfc19f894623a9a4cf8caa9a43723b395`.
- Bundle SHA256:
  `99d0f962f9d094c08317c061c6df789e120224c98ea233183c60560ac4cf242e`.
- Imagen: `sportex-staging:c375e58cfc19f894`.
- Image ID:
  `sha256:6dcd081e23201d89c9a25d0637cdb2b0a7637e59c73bd694e8152e93493161ec`.
- Swarm 1/1, `/health`, `/ready`, PostgreSQL y Supabase PASS.
- Asset productivo coincide con SHA256 `d726c53c...`; esquina alpha `0` y
  centro alpha `255`.
- Browser productivo PASS: logo SPORTEX visible sin fondo ni caja negra.
- Evolution conserva ingreso y outbound manual activos. No hubo mensajes,
  migraciones ni cambios de datos.
- Logs iniciales: cero coincidencias `error|fatal|unhandled`.
- Rollback: `sportex-staging:a7ceb9b73d53777b`.

## Validacion productiva

- Commit exacto: `a7ceb9b73d53777b7c3a5a5beda9d84f794fe8f9`.
- Imagen: `sportex-staging:a7ceb9b73d53777b`.
- Image ID: `sha256:0a83a6d730afb1e126e78e68fb1928d9c97e64f2ec3e16dbcbdd55785246fe13`.
- URL: `https://sportex.codexa.uy`.
- Swarm convergio 1/1; `/health` y `/ready` PASS con release exacto.
- HTML productivo referencia `sportex-logo.png` y no referencia `delta-logo`.
- El asset SPORTEX responde `image/png`; la ruta historica Delta devuelve el
  fallback HTML y no una imagen.
- Browser productivo PASS: wordmark SPORTEX visible, sin logo Delta y sin
  desplazamiento del login.
- Evolution conserva ingreso y outbound manual activos. No hubo mensajes,
  migraciones ni cambios de datos durante este corte visual.
- Logs iniciales: cero coincidencias `error|fatal|unhandled`.

## Rollback

Artefacto anterior: `sportex-staging:1cc2c96fe8f8e0f`. La especificacion previa
del servicio quedo respaldada en el VPS antes del despliegue.

## Favicon SPORTEX preparado

- Se extrajo la forma exacta de la `S` del wordmark aprobado, sin redibujarla.
- La forma usa el verde oficial `#DCFF52` y transparencia real; no contiene
  fondo, texto adicional ni referencias visuales a Delta.
- PNG: `frontend/assets/sportex-favicon.png`, `512x512`, RGBA, SHA256
  `2f90d3ba529f12feb9498c54bdbd5c1ea1963b0ba3317bdb83a81bfc2cf4e29`.
- ICO multiresolucion: `frontend/favicon.ico`, con tamanos `16`, `32`, `48`,
  `64`, `128` y `256`, SHA256
  `47bda411f20c4b453fb3cc042f25d8dc02ac09a903f5a93191000d9136f18af6`.
- El HTML declara ICO, PNG y `apple-touch-icon`; browser local resolvio las tres
  referencias y la `S` se verifico visualmente entre `16x16` y `64x64`.
- Core `44/44`, build y `git diff --check` PASS. El script raiz no expone un
  comando `typecheck`; el build de TypeScript cumplio esa validacion.
- Candidato local exacto:
  `3c8c9da25ba1fae38f4d60d4ef37253ddf69edcf`.
- Este checkpoint no desplego, no migro datos y no envio mensajes. El runtime
  productivo permanece en `c375e58cfc19f894623a9a4cf8caa9a43723b395`.

## Favicon desplegado en PILOTO_DELTA

- GO exacto recibido:
  `GO SPORTEX TASK-20260814-001 3c8c9da25ba1fae38f4d60d4ef37253ddf69edcf PILOTO_DELTA`.
- Guard de release PASS contra el commit publicado en origin.
- Bundle inmutable SHA256:
  `74ce9116042f0c6d75416ad4600844cdfd6a1460918946e4aebdb5b57ce50632`.
- Imagen: `sportex-staging:3c8c9da25ba1fae3`.
- Image ID:
  `sha256:c4490a80809ea55df5c4a4814d4102d0a3381b7fb94e4f6f7a793f4bc7e356da`.
- La especificacion previa del servicio se respaldo en el VPS con SHA256
  `49b772870cfc19523c3cbd59119d86769e6fedec44470a3fe4d596ff8e4f7da9`.
- Swarm convergio `1/1`; `/health` reporta el commit exacto y `/ready`
  confirma PostgreSQL y Supabase.
- PNG e ICO productivos coinciden con los hashes locales, responden con tipo de
  imagen y el PNG conserva `512x512`, RGBA, alpha y un unico RGB `#DCFF52`.
- El HTML productivo declara ICO, PNG y Apple touch icon. Browser productivo
  PASS: titulo SPORTEX, wordmark visible y las tres referencias presentes.
- Evolution conserva ingreso y outbound manual activos. No hubo migraciones,
  cambios de datos ni mensajes durante este corte; logs iniciales con cero
  coincidencias `error|fatal|unhandled`.
- Rollback inmediato: `sportex-staging:c375e58cfc19f894`.
