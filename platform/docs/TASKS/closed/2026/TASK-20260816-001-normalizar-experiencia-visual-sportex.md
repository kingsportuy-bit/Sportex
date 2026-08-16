# Normalizar experiencia visual de SPORTEX

id: TASK-20260816-001
owner: Codex
requester: Fito
estado: done
lifecycle: closed
work_type: fix
campaign: CAMP-20260803-001
context_focus: product
development_guide_impact: none
updated_at: 2026-08-16

## objetivo

Usar la pestaña WhatsApp como patrón visual común de SPORTEX y eliminar en
modo claro y noche los fondos, hover, seleccionados y textos que pierden
contraste o parecen pertenecer a productos distintos.

## alcance_permitido

- Crear tokens semánticos compartidos para superficies, campos, hover,
  selección, foco, bordes y texto.
- Aplicarlos a todas las pestañas, formularios y diálogos.
- Mantener identidad SPORTEX, navegación y funcionalidad.
- QA visual local desktop/mobile en modo claro y noche.

## alcance_prohibido

- Desplegar, publicar, migrar, enviar mensajes o modificar datos reales.
- Cambiar reglas de negocio, integraciones o introducir IA.
- Modificar `logo-sportex.png` ajeno en la raíz.

## entradas

- Aprobación explícita de Fito del 2026-08-16.
- Auditoría visual autenticada y patrón vigente de WhatsApp.

## salidas

- Tokens semánticos claro/noche y estados interactivos consistentes.
- Evidencia visual desktop/mobile de las 12 pestañas.

## validacion

- Sin fondos blancos ilegibles en modo noche.
- Hover, seleccionado, foco y deshabilitado distinguibles.
- Sin overflow horizontal ni errores de consola.
- `npm run validate`, `git diff --check` y `SPORTEX_CLOSE=PASS`.

## evidencia

- `docs/evidencias/TASK-20260816-001_NORMALIZACION_VISUAL.md`.

## rollback

- Revertir exclusivamente tokens y reglas CSS de esta tarea.

## deuda_restante

- Imágenes y no leídos se implementan en la task siguiente.
- La promoción a PILOTO_DELTA requiere GO separado.

## registro_de_avances

### 2026-08-16 - cierre local

- Las 12 pestañas pasaron claro/noche y desktop/mobile.
- Fondos blancos visibles en noche: cero; overflow móvil: cero.
- Leads seleccionado, encabezados fuertes y burbujas salientes son legibles.
- Consola sin warnings ni errores; Core 52/52 PASS.

### 2026-08-16 - tarea abierta

- Fito aprobó normalizar toda la web con WhatsApp como patrón visual.
- Se preservó producción y el archivo ajeno `logo-sportex.png`.

## decisiones

- WhatsApp es la referencia visual; los tokens semánticos son la fuente común.
- El modo noche no usa blancos fijos para superficies interactivas.
