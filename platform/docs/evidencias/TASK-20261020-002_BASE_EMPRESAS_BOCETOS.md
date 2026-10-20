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

Sin llamadas OpenAI, cambios de cuentas reales, DB remota ni despliegue.
Historial conserva temporalmente fuentes para deshacer; no se promete memoria
constante para documentos grandes. Revertir codigo; no borrar caches ni cuentas.
Publicacion pendiente de GO de Fito sobre el candidato validado.
