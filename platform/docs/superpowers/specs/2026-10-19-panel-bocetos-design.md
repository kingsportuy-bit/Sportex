# Panel y acceso por empresa del laboratorio de bocetos

Fecha: 2026-10-19. Owner: Core SPORTEX, módulos identidad y diseño.
Tarea de definición: TASK-20261018-001. Estado: APROBADA_POR_FITO.
Implementación inicial local: TASK-20261019-001. Fito pide alcance reducido;
identidad de pruebas y JSON privado sustituyen adaptadores remotos solo en local.
Auth/DB reales y salida comercial permanecen pendientes antes de publicar.

## Objetivo y decisiones de Fito

Dar de alta empresas manualmente y habilitar el laboratorio cuando paguen.
Una URL común, `sportex-bocetos.kodebix.com`, con usuario y contraseña por
empresa; sesión recordada. Fito administra desde
`panel-sportex-bocetos.kodebix.com` con una cuenta de plataforma separada.
Al vencer se bloquea el acceso aunque la sesión siga recordada. La renovación
es manual. OpenAI es el proveedor y el gasto muestra importes reportados por él.

El panel incluye empresa, usuario, estado, días restantes, acceso, generaciones,
tokens y gasto; configuración de logos, fondo, fuentes y parámetros iniciales.
Moldes aparece como «Próximamente», sin importación ni edición en esta versión.

## Alternativas y elección propuesta

1. Integrar el panel y las reglas en el Core existente: reutiliza identidad,
   membresías, permisos, auditoría y aislamiento. Es la opción recomendada.
2. Crear otro servidor con cuentas y base independientes: simplifica el primer
   prototipo, pero duplica identidad, reglas de acceso y operación.
3. Administrar solo con archivos y contadores del navegador: útil para pruebas
   individuales, insuficiente para controlar acceso y consumo de empresas.

Se propone la primera alternativa. El editor conserva su interfaz y render;
su servidor queda como adaptador web y deja de decidir cuota o llamar al
proveedor sin autorización del Core. La primera implementación se prueba local
con dos empresas ficticias, persistencia de pruebas y proveedor simulado.

## Pantallas y acciones

Panel oscuro con el verde actual de SPORTEX, tabla compacta y búsqueda por
empresa/usuario. Estados: Activa, Vencida, Suspendida y Configuración pendiente.
Acción principal «Nueva empresa»; por fila «Configurar», «Renovar»,
«Suspender/Reactivar» y «Copiar acceso». Copiar acceso entrega la URL común y
el usuario; la contraseña inicial se entrega separadamente al crearla.

Alta: nombre, usuario único, contraseña inicial, fecha de vencimiento y cuota
de generaciones. No hay registro público. El alta conserva el formulario si
falla y evita duplicados por reintento. El acceso queda pendiente hasta que
identidad, configuración y credencial de proveedor estén completos.

Configurar abre secciones: Acceso, Laboratorio, Logos, Fondo, Fuentes y Consumo.
Laboratorio guarda opciones iniciales, posiciones, tamaños, colores y fuentes.
Logos admite marca y Logo2. Fondo admite imagen. Fuentes admite TTF/OTF con
nombre y vista previa; selector predeterminado para nombre y números.
Los recursos se conservan en servidor por empresa y se cachean al utilizarlos.

El login muestra usuario, contraseña y «Recordarme». Contraseña incorrecta usa
un error genérico. Cuenta vencida muestra un aviso propio para contactar a
administración. Renovar vuelve a permitir entrar sin perder los diseños.
Reinicio de contraseña y cambios de estado usan diálogos propios, no alertas
del navegador. No hay borrado definitivo de empresas en esta primera versión.

## Reglas propuestas para concretar la primera versión

Estas precisiones son propuestas técnicas, pendientes de revisión del documento:

- Un usuario de laboratorio por empresa; roles internos adicionales quedan
  para después. Usuario global único, normalizado, sin distinguir mayúsculas.
- Fecha visible en America/Montevideo; el día seleccionado es inclusivo. El
  Core almacena el instante UTC del comienzo del día siguiente como expiresAt.
  En el instante expiresAt se bloquea; días restantes nunca es negativo.
- Renovar permite fijar fecha y agregar generaciones explícitamente. Cambiar
  fecha no reinicia consumo ni agrega créditos implícitos. Todo cambio conserva
  actor, motivo, fecha y valores anteriores/nuevos.
- Cuota agotada bloquea nuevas generaciones, pero permite editar y descargar
  mientras la empresa esté vigente. Vencida o suspendida bloquea el laboratorio.
- «Recordarme» conserva la sesión mediante el proveedor de identidad; nunca
  almacena la contraseña. La duración se limita a la política del proveedor.
- Nueva empresa recibe la base actual del editor. Su configuración empresarial
  reemplaza esa base; sus preferencias posteriores se conservan por separado.
- Los bocetos siguen guardándose localmente en esta versión, ahora por empresa.
  Logos, fondo, fuentes y base empresarial sí tienen persistencia en servidor.
  No se promete sincronización de bocetos entre equipos.

## Owners, identidad y fronteras

Identidad y empresas del Core resuelve actor, membresía y tenant confiable.
Reutilizar Supabase Auth detrás de un adaptador de usuario/contraseña; el alias
visible se resuelve en servidor y no modifica los logins existentes del CRM.
La cuenta de Fito tiene capacidades de plataforma, sin tenant ficticio.
Restablecer contraseña revoca sesiones previas. Suspender se evalúa en cada
acceso protegido, aunque el token todavía no haya expirado.
Cada lectura administrativa entre empresas exige ese rol; cada mutación
administrativa incluye empresa objetivo, autorización y auditoría.

Diseño del Core posee suscripción, configuración del laboratorio, créditos,
solicitudes de generación y consumo. El adaptador OpenAI ejecuta solamente
solicitudes autorizadas y devuelve resultado/usage al Core. El adaptador de
costos sincroniza cargos; no decide créditos. La interfaz solo solicita comandos.
La capacidad del laboratorio no concede permisos de CRM, pagos o WhatsApp.

El Core verifica membresía, estado y vencimiento en cada acceso protegido y de
nuevo antes de llamar a OpenAI. No depende de un cron para vencer cuentas.
Una vista abierta consulta estado al recuperar foco y antes de operar; un
rechazo por vencimiento muestra el bloqueo y conserva el borrador local.
Un trabajo ya enviado puede completar y registrar gasto; un trabajo aún en
cola se cancela si dejó de estar autorizado. No se borran diseños por vencer.

## Persistencia y comandos

Entidades nuevas, bajo puertos del Core y siempre aisladas por tenant:

- BocetosSubscription: estado manual, expiresAt, versión.
- BocetosConfiguration: base del editor y referencias versionadas a recursos.
- BocetosAsset: clase, MIME, tamaño, checksum, referencia privada y versión.
- BocetosCreditEntry: alta/ajuste/reserva/consumo/liberación con correlación.
- BocetosGeneration: actor, idempotencia, estados, modelo, request del
  proveedor, resultado y uso registrado; sin claves ni imágenes en logs.
- BocetosProviderCall: intento ligado a operación, tenant y actor del servidor;
  modelo, fecha, clave principal/respaldo, estado, request ID y usage numérico.
- BocetosCostBucket: intervalo UTC, clave/proyecto, concepto, moneda, importe
  decimal reportado, momento de sincronización y versión del reporte.

Comandos explícitos: crear empresa/acceso, renovar, suspender/reactivar,
restablecer contraseña, guardar configuración, subir/reemplazar recurso,
agregar créditos y solicitar generación. Creaciones y generaciones requieren
idempotencia; modificaciones usan versión esperada. Auditoría y cambios de
negocio confirman juntos; identidad externa usa una operación recuperable.
Una provisión parcial queda pendiente y no habilita el laboratorio.

La sesión decide el tenant para operaciones de empresa; un ID del cliente no
lo reemplaza. Assets privados requieren autorización en cada descarga.
IndexedDB, localStorage, cachés, locks, trabajos y recursos se particionan por
entorno y tenant. Nunca importar automáticamente el boceto local actual a
otra empresa. Cambiar sesión descarga de memoria los recursos de la anterior.

## Generaciones y gasto

La reserva de un crédito es atómica antes del trabajo. Solicitudes duplicadas
con la misma idempotencia devuelven la operación existente. Una generación
utilizable consume una unidad; un fallo confirmado libera su reserva. Un timeout
ambiguo conserva estado «Por verificar» y evita reenviar ciegamente una llamada
potencialmente cobrada. Si OpenAI cobró una operación fallida, su cargo permanece
en el gasto aunque se libere el crédito comercial.

Registrar cada llamada antes de enviarla y guardar su usage al responder, incluso
si el resultado no sirve. El tenant proviene de la sesión. Ausente es desconocido.
Caché no genera llamadas; reenvío idempotente no duplica consumo. El análisis
no descuenta generaciones y tiene límite por empresa.

Fito corrige: una OPENAI_API_KEY compartida y OPENAI_API_KEY_FALLBACK de respaldo.
Secretos solo en servidor; ninguna configuración de clave por empresa. Un rechazo
401/429 permite un solo intento con respaldo distinto. Cortes o 5xx ambiguos no
se reenvían. Ambos intentos se registran bajo la misma operación y empresa; una
generación exitosa descuenta una unidad. Reinicio conserva llamadas inciertas.
La clave administrativa de costos permanece separada y privada.

Costs API permite importes agrupados por día y por api_key_id/project_id.
Sincronización propuesta cada hora con paginación y relectura de los últimos
siete días. Actualizar un bucket reemplaza su proyección; nunca suma otra vez el
mismo reporte. Una consulta manual «Actualizar gasto» usa el mismo proceso y
límites. Conservar importes decimales sin redondear a centavos al acumular.

El panel muestra llamadas y tokens por empresa, con detalle de las últimas 100
llamadas. El importe oficial es global, sin atribuirlo artificialmente a tenants.
IDs opcionales de las dos claves filtran el reporte; sin ellos se identifica
como total de la organización. Ausencia no es cero ni una estimación monetaria.
Períodos de costos corresponden a intervalos UTC del proveedor.

Referencia oficial, verificada el 19/10/2026:
[Costs API](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/usage/methods/costs).
El reporte agregado no representa un cargo final instantáneo por solicitud.

## Archivos y fluidez del editor

Preservar carga de texturas imagen/PDF y conversión local acotada existente.
TTF/OTF se valida por firma y tamaño (máximo 10 MB por archivo), con nombres
seguros y sin ejecutar contenido. Logos/fondo reutilizan validación de imágenes,
con máximo 15 MB y resolución de trabajo acotada. FontFace carga la fuente una
vez y el render reutiliza caché; recursos versionados evitan conversiones al
mover, rotar o cambiar de tamaño. La empresa debe tener derecho a usar su fuente.

## Evidencia requerida para aceptar la implementación

1. Alta, login recordado, logout y cambio de contraseña con proveedor simulado.
2. Dos empresas ficticias: cero cruce de configuración, archivos, cachés,
   trabajos, créditos y cargos; usuario de empresa no administra otra.
3. Expiración exacta, sesión recordada, pestaña abierta y reloj del cliente
   manipulado; bloqueo decidido por servidor, renovación manual recupera acceso.
4. Dos solicitudes concurrentes con un crédito: solo una se acepta; idempotencia,
   reinicio, fallo y resultado ambiguo no duplican consumo ni llamadas.
5. Sincronización paginada/repetida, rotación de claves, ajuste posterior de
   cargos, moneda, importes pequeños y reporte indisponible.
6. Persistencia local y reinicio conservan empresas/recursos; límites de archivos,
   fuente inválida y acceso directo sin permiso se rechazan.
7. Navegador interno: alta, configuración, login, bloqueo, renovación y render;
   errores propios, teclado, foco y tabla usable en pantalla pequeña.
8. Regresiones del laboratorio: PDF proporcional, máscaras, vivos, fuentes,
   Logo2, edición fluida y exportación permanecen verificadas.

Las pruebas locales usan proveedores falsos y datos ficticios. Conectar Auth,
DB o Costs API reales y desplegar requieren una tarea operativa y autorización
exacta; estas pruebas no producen certificación comercial.

## Entrega y recuperación

La definición actual amplía solo la documentación de la tarea local vigente;
no modifica Core, DB, credenciales o runtime. Tras revisar esta especificación,
preparar plan y tarea de implementación con alcance y rollback propios.
Los dos dominios son destinos solicitados, todavía sin DNS, proxy o despliegue.
El lanzamiento comercial conserva el GO específico del contrato de entornos.
Rollback local: retirar rutas/adaptadores nuevos y conservar la base del editor,
bocetos del navegador y recursos privados. Restauración remota se define y
ensaya antes de cualquier migración o alta real.
