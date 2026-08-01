# Skills relacionadas con SPORTEX

## Regla

Una skill prepara artefactos o interpretaciones. El Core conserva permisos,
estado, versiones, aprobaciones y efectos. Ninguna skill autoriza runtime.

## Skill externa del piloto Delta

`crear-ficha-taller-delta` genera fichas tecnicas para talleres y hoy pertenece
al proyecto DELTA. SPORTEX puede consumir el PDF/PNG y sus datos mediante el
contrato del modulo `documentos`, pero no depende de una ruta relativa ni copia
la skill dentro del repositorio.

Una futura integracion debe definir:

- contrato de entrada/salida versionado;
- owner del documento;
- asociacion con tenant, pedido y revision;
- permisos y aprobacion humana;
- almacenamiento, auditoria y rollback.

## Skills candidatas

- ficha de venta a diseno;
- ficha de diseno a impresion y compras;
- ficha de taller a envio;
- cierre y postventa;
- calculo y explicacion de costos;
- extraccion estructurada desde WhatsApp.

Crear una skill nueva requiere una tarea y un caso repetible; una lista de
ideas no equivale a implementacion.
