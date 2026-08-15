# Evidencia — identidad visual SPORTEX

Fecha: 2026-08-14
Task: `TASK-20260814-001`
Entorno validado inicialmente: desarrollo local

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

## Pendiente

Ejecutar validacion completa, formar commit exacto y promoverlo al piloto
productivo bajo la regla temporal production-first de SPORTEX.
