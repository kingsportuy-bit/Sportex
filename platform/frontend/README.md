# Frontend SPORTEX

Estado: `IMPLEMENTADO_NO_VALIDADO`.

El frontend muestra proyecciones del Core y permite ejecutar comandos autorizados.

La primera superficie incluye login Supabase, pedidos, clientes, seña certificada y alta idempotente de pedido. Está servida por el mismo artefacto liviano del Core, pero permanece separada en código y consume exclusivamente `/v1`.

En desarrollo local, `TASK-20260803-001` agrega una mesa comercial de fixtures:

- inicia sin secretos con identidad ficticia de desarrollo;
- permite cargar un caso con anuncio exacto y otro de origen desconocido;
- muestra conversación, atribución, lead, oportunidad, etapa y próxima acción;
- nunca ofrece enviar, publicar, conectar o persistir datos reales.

Queda prohibido:

- escribir directamente en la base;
- calcular costos o ganancias como fuente canónica;
- mover etapas sin validación del Core;
- decidir permisos;
- guardar secretos;
- duplicar reglas de módulos.

No se reutilizaron componentes ni acceso directo a Supabase del monolito anterior. La identidad visual usa la marca real de Delta Sport y el recorrido operativo de producción.
