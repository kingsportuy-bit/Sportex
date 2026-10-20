# SPX-ERR-20261020-005 - Sustitucion SSH se evaluaba en PowerShell local

- Fecha: 2026-10-20.
- Sintoma: La preparacion intentaba ejecutar sha256sum en Windows; no se activo ninguna imagen.
- Causa raiz: Comando SSH compuesto dentro de cadena con expansion de PowerShell y escape incorrecto.
- Solucion: Escribir helper POSIX UTF8 con LF en archivo privado, subir por scp y ejecutar con argumento fijo.
- Prevencion/guardia: No interpolar sustituciones shell en cadenas PowerShell; usar archivo LF y validar hash antes de build.
