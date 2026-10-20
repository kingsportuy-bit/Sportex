# Base inicial, reemplazos y acceso del laboratorio

TASK-20261020-002. DESARROLLO_LOCAL, rama codex/desplegar-bocetos-20261020.
Pedido de Fito: conservar la base actual al dar de alta empresas sin archivos
de identidad; reemplazar logos/fondos/escudos; acceso minimalista.

## Diagnostico

Panel real observado sin mutaciones: Delta Sport usa la base del laboratorio,
sin JSON propio ni recursos administrativos. La plantilla contenia nombres/IDs
de logos Delta y escudo; el editor descargaba el fondo Delta aun sin usarlo.
Subir un logo agregaba otro a su lista; el mapa de fuentes del historial no
liberaba entradas al salir del historial limitado a35 acciones.

## Cambio

Plantilla sin nombres/IDs de archivos. Geometria, colores, fuentes, vivos,
textos y activaciones conservados. La carga inicial no descarga fondo Delta;
se recupera solo cuando un boceto anterior ya lo utilizaba.
Logo, Logo2 y escudo tienen un solo archivo por espacio. Reemplazo conserva alto,
centro y transformaciones, sin deformar proporcion. Cache/base reutilizan el
ultimo archivo; otros bocetos e historial conservan los propios. Fondo reemplaza
su fuente. Cargas fallidas/tardias no pisan otra pieza ni otro boceto.
Mapa del historial libera fuentes sin referencias, manteniendo las de deshacer.

Acceso del laboratorio sin tarjeta, titulo ni descripcion: logo SPORTEX,
Laboratorio de bocetos, usuario, contrasena, mostrar, recordar y Entrar centrado.
CSS limitado a esa ruta; autenticacion y administracion conservadas.

## Pruebas observadas

- npm run check:bocetos: PASS, 187 tests, cinco regresiones nuevas; API simulada.
- Alta HTTP de segunda empresa ficticia: cero archivos, llamadas y generaciones.
- Navegador interno: marca/Logo2/escudo reemplazados dos veces; cada selector
  contiene Sin archivo y solo el ultimo. Fondo reemplazado y recarga conserva todo.
- Otra empresa del mismo navegador abre con Sin logo / Sin escudo y fondo none.
- Fuentes SC Internacional 2023 y Real Madrid 2024-2025 conservadas.
- Acceso observado en1280x720 y390x844: sin tarjeta, formulario sin overflow,
  boton justify-content:center. Override de viewport restablecido.
- Detector Impeccable: advertencia sobre el borde superior del login antiguo
  de administracion, conservado fuera del alcance. Laboratorio tiene borde0.
- npm run validate ejecutado por workflow:close: PASS (workflow, documentos,
  tipos, Core/API, SQL y build). SPORTEX_CLOSE=PASS, perfil local.

Capturas y fixture sin secretos reales:
C:/Users/Fito/.codex/artifacts/sportex-bocetos-20261020-002/
base-inicial.png, login-desktop.png, login-mobile.png.

## Limites y rollback

El checkpoint local no realizo llamadas OpenAI ni cambios remotos.
Historial conserva temporalmente fuentes para deshacer; no se promete memoria
constante para documentos grandes. Revertir codigo; no borrar caches ni cuentas.
El GO y la publicacion posteriores se registran debajo.

## Publicacion autorizada y observada

Fito responde «si autorizo» a publicar6b6f5f2. Se registra GO en69739bb,
un descendiente que cambia solo documentos; app aprobada identica byte a byte.
Rama publicada. Guard de release PASS; archivo Git SHA256
1bbdd0a95dcfe2db9685929edc0009034aa808375cbad3bb58e0ae3d3c16cb90.
Release69739bbf8f4cd2b044b2ff90edaff28378c74b23, imagen Docker
sha256:ac310ac7ec7709e19f43ea9f40be1370e8d6e5a37645c3a9cc8901bb1d721b76.

Preflight: VPS con6.6GB disponibles y38GB de disco, servicio anterior b8e1fc8.
Build usa digest Node24 fijado; capas dependencias en cache. Siete pruebas de
runtime/SQLite/reemplazos pasan dentro de la imagen Linux, sin red externa.
No habia unzip en host; extraccion por python3.zipfile antes del build.

Se detuvo solo sportex_bocetos_app para copiar SQLite de forma consistente;
quick_check PASS. Copia pre-release y restore-check privadas fuera del repositorio,
restauracion local con una empresa PASS. Comparacion antes/despues de companies,
users y assets identica; una empresa, cero assets administrados y cero operaciones.
Primer chequeo HTTPS404 tras healthy produjo rollback. Segundo intento con
wrapper no convergio al release esperado y tambien repuso b8e1fc8. No se atribuye
causa raiz del wrapper; nueva activacion explicita por imagen, filtro por imagen
de contenedor y espera acotada de /ready del commit completaron el despliegue.
SPX-ERR-20261020-001 registra la guardia de verificacion.

20/10/2026 03:06:40 UTC: Swarm update completed,1/1 healthy, release69739bb.
HTTPS /ready de ambos dominios200 con commit exacto; JS/CSS/base/element-layout
coinciden con el bundle. Setup404, admin desde laboratorio404 y APIs anonimas401.
Navegador interno confirma nuevo login y sesion admin conservada; Delta Sport
activa,5 disponibles,0 llamadas. Captura login-publicado.png en directorio privado.
Sin cuentas ficticias remotas, cambios DNS, migraciones, mensajes ni generaciones.
CRM sigue d9c4f443ad07b2e1 healthy1/1.

Rollback disponible: imagen sportex-bocetos:b8e1fc827c0a6e668b79ee27d90af5ad91ae636d,
mismo volumen /opt/sportex-bocetos/data. No restaurar datos sobre la base viva.
Backup /opt/sportex-bocetos/data/backups/pre-69739bbf8f4cd2b044b2ff90edaff28378c74b23.sqlite.
