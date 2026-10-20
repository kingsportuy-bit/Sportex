# SPX-ERR-20261020-004 - Copia de referencia rechaza Logo2

- Fecha: 2026-10-20.
- Sintoma: Boton y ajuste automatico devuelven elementos o texturas invalidos.
- Causa raiz: El constructor UI envia brand2 visible, pero el validador del servidor no lo incluia entre los IDs conocidos.
- Solucion: Aceptar brand2 conservando la validacion estricta de elementos y texturas.
- Prevencion/guardia: reference-context.test ejecuta el constructor real y HTTP autenticado, verifica referencia como primera imagen y rechaza IDs desconocidos sin llamar al proveedor.
