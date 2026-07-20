# L3 - Aplicación

## Responsabilidad

Recibir comandos, resolver actor y tenant, autorizar, coordinar módulos, manejar idempotencia y abrir transacciones.

## Permitido

- validar precondiciones;
- ejecutar un caso de uso;
- coordinar varios módulos por contratos;
- guardar auditoría y outbox en la misma transacción.

## Prohibido

- contener SQL específico de interfaz;
- saltar permisos;
- permitir writers genéricos;
- confiar en tenant enviado libremente por frontend.

## Tests documentales

- comando repetido devuelve mismo resultado;
- actor sin permiso falla cerrado;
- fallo intermedio no deja estado parcial;
- correlación llega a eventos y jobs.
