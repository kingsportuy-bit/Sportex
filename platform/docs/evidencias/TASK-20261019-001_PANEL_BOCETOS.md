# Panel sencillo de bocetos — evidencia local

TASK-20261019-001. DESARROLLO_LOCAL. Spec aprobada por Fito el 19/10.
Implementacion local verificada; no certificada para comercial. Sin operaciones remotas.

## Implementacion

Modulo `core/bocetos/`: reglas, store transaccional JSON atomico y blobs privados,
hash scrypt, sesiones revocables, vencimiento inclusivo Montevideo, roles,
reserva atomica y solicitudes idempotentes. El frontend no decide cuota.
Panel `/admin`, login `/login`, alta manual, renovar/suspender, agregar creditos,
recursos marca/Logo2/fondo/TTF/OTF, fuentes por defecto y parametros JSON.
Datos privados en `bocetos/private/panel`; bocetos y preferencias separados por
empresa en IndexedDB/localStorage. Modo tradicional 4318 mantiene su store.
Primer checkpoint uso clave dedicada (sustituido por correccion inferior); reenvio de la
misma solicitud recupera resultado sin repetir proveedor. Incertidumbre conserva
reserva. Costos oficiales paginados, precisos a 12 decimales y reemplazo de
buckets, sin sumar dos veces; consulta manual y horaria al configurar admin key.
Sin reporte se muestra Pendiente; no se inventa costo por generacion.

## Pruebas y navegador

Nuevas pruebas de servicio/HTTP/generacion (10), mas regresiones existentes:
174 tests Node y assertions CJS PASS; sintaxis incluidas nuevas piezas PASS.
`npm run validate` PASS: 30 workflow/frontend, 59 Core/API, docs, tipos, SQL y build.
Preflight focal preserva sesiones frente a errores de datos. Dos harnesses VM
del editor se adaptaron al fetch gestionado sin cambiar sus assertions.

Navegador interno 4319: login administrativo con fixtures, alta de segunda
empresa desde formulario, busqueda sin resultados/limpiar, falta de admin key
explicada sin consultar OpenAI, subida de Logo2 PNG y fuente TTF y eleccion de
defaults. Login empresa: 50 creditos, Logo2 seleccionado y fuente propia en
numero; sin errores de consola. Vencer al 18/10 bloquea sesion recordada y
muestra aviso; renovar al 19/11 recupera misma sesion y creditos. Recarga mantiene
empresas y recursos. Revisados viewport estrecho y escritorio; tabla horizontal.
Captura privada `bocetos/private/panel-empresas-local.png`.

## Limites y rollback

Sin nuevas dependencias, generaciones pagas, credenciales reales nuevas, DB
remota, DNS o deploy. Se reutiliza checkout/servidor local por alcance reducido.
Panel en 4319; editor original en 4318. Identidad de fixtures y JSON no equivalen
a Auth/DB certificados. Fuente invalida no bloquea el editor. Moldes futuros.
Revision propia por el autor; no se usaron subagentes. Antes de publicar:
integracion Auth/DB reales, politicas de recursos/licencias, backup y GO comercial.
Rollback: no iniciar panel-start; modo original conserva IndexedDB y recursos.

## Correccion: claves compartidas y consumo por llamada

Fito aclara principal compartida + fallback y registro de cada llamada por empresa.
Servidor usa OPENAI_API_KEY / OPENAI_API_KEY_FALLBACK. Core persiste intento antes
del envio; tenant y actor se heredan de la operacion autenticada. Guarda fecha,
modelo, endpoint, slot principal/respaldo, status, request ID y usage numerico
(entrada/salida, detalles y total), sin secretos/prompts/imagenes en el ledger.
Usage ausente sigue null. Fallos de validacion posteriores conservan tokens.
Respaldo una vez ante 401/429, no ante red/5xx; dos intentos no son dos creditos.
Replay no reenvia, reinicio marca desconocidas las llamadas incompletas. Cache
de analisis aislada por empresa; servir cache no registra llamada externa.
Panel Ver consumo muestra ultimas 100 llamadas; todos los intentos se conservan.
Importe oficial global: filtros opcionales por IDs de claves; sin IDs se explica
alcance organizacion. No se presenta USD oficial por empresa con clave compartida.

180 tests Node y assertions CJS PASS. Seis casos adicionales: aislamiento con
clave compartida, fallback, corte ambiguo, rechazo sin fallback, cache/resultado
invalido y reinicio. API gestionada comprueba historial y permisos por HTTP.
Navegador interno: fixture en memoria sin red, dos empresas, 2 llamadas/1 credito,
desglose expandible, cambio a empresa sin llamadas, escritorio/pantalla estrecha
con tabla desplazable, sin errores de consola. Importes/tokens QA son simulados.
Captura privada `bocetos/private/panel-consumo-local.png`. Panel habitual 4319
reiniciado sin claves reales y pestaña actualizada, conservando datos existentes.
Detector UI: avisos sobre estilos anteriores (microtexto/login/acento); nuevos
controles conservan estilo vigente. Sin redisenar la interfaz en esta correccion.
