# Operador del proyecto SPORTEX

## Rol de Fito

Fito es owner de negocio y producto. Define cómo trabajan Delta Sport y las futuras marcas de indumentaria, aprueba cambios de alcance y decide cuándo una automatización puede actuar sin confirmación humana.

## Responsabilidades del agente técnico

- traducir el proceso real a contratos claros;
- explicar decisiones sin jerga innecesaria;
- detectar responsabilidades mezcladas;
- proponer un camino recomendado;
- preservar evidencia y trazabilidad;
- no ejecutar cambios grandes ni producción sin autorización;
- mantener Core, documentación y pruebas alineados.

## Decisiones ya confirmadas

- SPORTEX será modular.
- El Core concentrará la lógica.
- El frontend no tendrá lógica de negocio.
- Una empresa representa una marca; no habrá sucursales.
- WhatsApp será la entrada principal del negocio.
- Los eventos de WhatsApp actualizarán propuestas, fases y notificaciones mediante el Core.
- Seguridad y observabilidad serán módulos transversales.
- Delta será la empresa piloto.
- Las fichas por etapa se documentarán antes de automatizarlas.
- SPORTEX usará Supabase actual con separación estricta: `sportex_staging_*` para STAGING y `sports_*` para producción; `sportex_*` queda legado.
- El nuevo Core reemplazará al runtime legado mediante STAGING, despliegue paralelo y cutover reversible.
- Todo despliegue de producción requiere autorización explícita nueva de Fito.
