# SPX-ERR-20260819-003 - Deploy remoto se detenia por saltos de linea Windows

- Fecha: 2026-08-19.
- Sintoma: El build remoto finalizaba, pero el comando de despliegue no llegaba a ejecutarse y la replica seguia en la imagen anterior.
- Causa raiz: El script Bash enviado desde PowerShell conservaba CRLF; Bash interpretaba los cierres de bloque con retorno de carro y terminaba antes del deploy.
- Solucion: Normalizar el script remoto a LF antes de enviarlo y verificar la version efectiva de la replica, no solo la imagen construida.
- Prevencion/guardia: Todo deploy remoto enviado desde Windows debe normalizar CRLF a LF y cerrar con replica, SPORTEX_RELEASE, health, ready y asset público exactos.
