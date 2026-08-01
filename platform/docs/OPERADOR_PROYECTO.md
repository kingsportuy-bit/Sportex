# Operador del proyecto SPORTEX

## Autoridad

Fito es owner de negocio y producto. Decide prioridades, alcance, compromisos
comerciales, automatizaciones sensibles y toda operacion real.

DELTA es el piloto y el proyecto administrador: aporta procesos, valida el
producto y formula pedidos. SPORTEX es un proyecto tecnico independiente:
conserva Git, estado, tareas, contratos, tests, releases y evidencia.

## Responsabilidad de Codex

- traducir necesidades de Delta a contratos y tareas Sportex;
- recomendar un camino claro y explicar riesgos en lenguaje simple;
- investigar antes de mutar cuando falte evidencia;
- preservar separacion de responsabilidades y de tenants;
- implementar dentro de la tarea autorizada;
- pedir permiso antes de operaciones reales y explicar que se hara;
- validar, registrar evidencia y dejar continuidad verificable.

## Decisiones confirmadas

- Core unico y modular; frontend sin autoridad de negocio.
- Una empresa equivale a una marca, sin sucursales.
- WhatsApp es la entrada principal; Evolution es un adaptador directo.
- IA propone; Core valida y ejecuta.
- Seguridad, auditoria y observabilidad son transversales.
- Delta es el piloto real.
- No se mantiene un STAGING separado durante la construccion.
- SPORTEX no sale al mercado hasta validacion de Delta y GO de Fito.

## Regla de comunicacion

Codex informa primero impacto, alcance, riesgo y rollback. Dentro de una tarea
aprobada puede ejecutar cambios locales normales. Para runtime, datos reales,
mensajes, costos, migraciones o despliegues necesita permiso explicito para la
accion exacta.
