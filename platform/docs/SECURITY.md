# Seguridad SPORTEX

## Objetivo

Proteger empresas, conversaciones, pagos, documentos, archivos y acciones productivas sin depender de controles visuales del frontend.

## Principios

- mínimo privilegio;
- denegar por defecto;
- separación por tenant y entorno;
- confirmación para acciones sensibles;
- secretos fuera del repositorio;
- auditoría reconstruible;
- datos personales minimizados;
- errores sin información sensible.

## Identidad y permisos

Roles iniciales por empresa:

- `owner`;
- `administrador`;
- `ventas`;
- `diseño`;
- `produccion`;
- `taller`;
- `logistica`;
- `solo_lectura`.

Los permisos se expresan como capacidades, por ejemplo:

- `orders.create`;
- `payments.certify`;
- `design.approve`;
- `production.release`;
- `costs.view`;
- `workshop.update`;
- `notifications.send`.

El rol no reemplaza la validación del contexto del pedido.

## Acciones sensibles

Requieren permiso, evidencia, confirmación y auditoría:

- certificar seña o saldo;
- liberar impresión;
- aprobar cambio posterior a impresión;
- autorizar compra o gasto;
- enviar mensajes masivos;
- cambiar de etapa ignorando bloqueos;
- acceder a otra empresa como soporte;
- borrar, exportar o restaurar datos.

## WhatsApp

- validar firma, secreto o identidad del adaptador;
- deduplicar eventos;
- cuarentena para origen desconocido;
- outbound mediante outbox;
- destinos y outbound explicitamente autorizados en `PILOTO_DELTA`;
- sanitizar contenido antes de logs;
- impedir que texto del cliente ejecute instrucciones del sistema.

## Pagos

La IA puede detectar una posible seña, pero no certificarla. La certificación requiere operador autorizado o integración confiable con referencia única.

## Archivos

- acceso privado y temporal;
- tenant y pedido obligatorios;
- tipo, tamaño y extensión permitidos;
- análisis de archivos cuando se implemente;
- checksum y versión;
- no ejecutar contenido subido.
- imagenes WhatsApp: JPEG/PNG/WebP, firma real, maximo 5 MB, checksum, bytes
  privados con RLS y descarga autenticada; nunca URL publica permanente.

## Secretos

No guardar contraseñas, tokens, claves de proveedores ni datos bancarios en Markdown, logs, prompts o frontend.

## Baseline legado no certificado

La inspección del 2026-07-19 encontró secretos incorporados al build legado, un `.env` dentro del contenedor, compatibilidad con contraseñas en texto plano, un webhook sin validación efectiva y RLS deshabilitado en la mayoría de las tablas SPORTEX.

No registrar sus valores. La remediación exige una tarea de incidente controlada para rotar credenciales, reconstruir la imagen, retirar material sensible, cerrar endpoints inseguros y validar acceso antes de reutilizar producción.

## Despliegues

- catálogos, roles, grants, RLS, migraciones y buckets separados por entorno dentro de Supabase compartido;
- service role global prohibida en frontend y operaciones normales;
- secretos fuera de imagen, Git y manifiestos;
- `PILOTO_DELTA` requiere autorizacion explicita para cada operacion real;
- migraciones verifican RLS y aislamiento antes de tocar datos reales;
- no conectar Evolution real hasta que el Core y rollback esten listos;
- no retirar el legado hasta cerrar observación y restauración.

## Auditoría

Registrar actor, tenant, acción, recurso, resultado, motivo, correlación, fecha y cambios relevantes. No guardar secretos ni archivos completos dentro del evento.

## Incidentes

Todo incidente debe permitir:

- bloquear integración o usuario;
- detener workers;
- preservar evidencia;
- identificar tenants afectados;
- rotar secretos;
- recuperar servicio;
- informar causa y prevención.
