# Evidencia — identidad visual SPORTEX

Fecha: 2026-08-14
Task: `TASK-20260814-001`
Entornos validados: desarrollo local y `PILOTO_DELTA` productivo

## Decision aplicada

SPORTEX es la unica marca visual de la aplicacion. `Delta Sport` puede aparecer
como nombre del negocio o tenant, pero su logo no forma parte del sistema.

## Implementacion

- Fuente entregada por Fito: `logo-sportex.png`.
- Copia frontend: `frontend/assets/sportex-logo.png`.
- SHA256 coincidente:
  `9b413b59d4c47d3d170cd1e119cbe6ba12f8a46de51b188d143aa7323bcf10b8`.
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
