# Registro de errores y fricciones SPORTEX

Registrar problemas que obliguen a cambiar el método de trabajo.

## Plantilla

```text
ID:
Fecha:
Síntoma:
Causa:
Solución:
Prevención:
Archivos o módulos afectados:
```

## Entradas

### SPX-ERR-20260719-001 — gate de capacidad VPS

- Fecha: 2026-07-19.
- Síntoma: carga aproximada 8 sobre 4 vCPU, Docker sobre 160 % de CPU y swap 2/2 GiB.
- Causa observada: `supabase_vector` y `supabase_staging_vector` alternan continuamente entre dejar y volver a observar logs con registros dañados; Docker también registra errores de decodificación con NUL.
- Solución propuesta: reiniciar solamente ambos collectors, medir nuevamente y escalar a una corrección de configuración si el bucle regresa.
- Prevención: gate de capacidad obligatorio antes de cada despliegue y alertas sobre CPU de Docker/Vector.
- Alcance: infraestructura compartida; reinicio pendiente de autorización explícita porque excede SPORTEX.
