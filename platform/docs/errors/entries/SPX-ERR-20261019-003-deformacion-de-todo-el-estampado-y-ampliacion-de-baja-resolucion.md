# SPX-ERR-20261019-003 - Deformacion de todo el estampado y ampliacion de baja resolucion

- Fecha: 2026-10-19.
- Sintoma: Franjas centrales onduladas y aspecto dentado al montar o ampliar.
- Causa raiz: u remapeaba toda la fila entre extremos enteros de mascara; hombros y bajo pinzaban el dibujo. Ampliar reutilizaba el snapshot 1080x1920.
- Solucion: Centro protegido, deformacion suave en cuartos exteriores y contorno subpixel filtrado. Ampliar y exportar comparten render 2160x3840 con regreso al editor 1x.
- Prevencion/guardia: Tests de coordenadas centrales, escalones de mascara, hombro y bajo; preview 2x, restauracion y error. Captura real quality-fixed-browser.jpg; no llamadas IA.

Seguimiento: anular la deformacion en las filas extremas abria demasiado las
franjas (Fito). Se estabiliza el registro lateral de una fila vecina, con
transicion de pendiente continua, sin regresar a identidad. Regresion sintetica
reproduce el ensanchamiento; mascaras PSD validan estabilidad en las filas finales.

Logo de marca (19/10): el PNG original tiene 1826x1592; reducirlo a 48/96 px
con filtro Canvas low producia bordes dentados. drawGraphicImage configura
antialias/high y restaura el contexto. El contorno intermedio usa outputScale
para no ampliar un borde 1x en exportacion 2x. Pruebas de render y densidad,
comparacion real Chromium de alpha (38 contra 568 pixels suavizados a 96x84)
y vista ampliada del editor; fuente y geometria intactas, sin IA.
