# SPX-ERR-20260719-001 - Gate de capacidad VPS

- Fecha: 2026-07-19.
- Sintoma: carga aproximada 8 sobre 4 vCPU, Docker sobre 160 por ciento de CPU y swap 2/2 GiB.
- Causa raiz observada: `supabase_vector` y `supabase_staging_vector` alternaban entre dejar y volver a observar logs con registros danados; Docker tambien informaba errores de decodificacion con NUL.
- Solucion propuesta: reiniciar solamente ambos collectors con autorizacion, medir de nuevo y corregir configuracion si el bucle regresa.
- Prevencion/guardia: gate de capacidad obligatorio antes de cada despliegue y alertas sobre CPU de Docker/Vector.
- Alcance: infraestructura compartida; toda mutacion requiere revalidacion y permiso explicito.
