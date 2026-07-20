# Superficie n8n — histórica

Archivada: 2026-07-19.

Motivo: Fito decidió que SPORTEX se conectará directamente desde Core y workers a Supabase y Evolution API. n8n no forma parte de la arquitectura objetivo.

Reemplazo vigente: `../../../biblioteca/superficies/evolution/README.md`, `../../../biblioteca/superficies/workers/README.md` y `../../../EVOLUTION_CONTRACT.md`.

## Responsabilidad

Transportar o integrar servicios durante la transición sin ser fuente de verdad.

## Permitido

- recibir webhooks;
- transformar formatos;
- invocar API del Core;
- ejecutar integraciones externas controladas;
- informar resultados.

## Prohibido

- escribir tablas de dominio;
- guardar la fase canónica;
- decidir permisos o transiciones;
- duplicar reglas del Core.

## Retiro futuro

Cada flujo debe poder reemplazarse por un adaptador o worker sin migrar reglas de negocio.

## Estado

NO_INICIADO.
