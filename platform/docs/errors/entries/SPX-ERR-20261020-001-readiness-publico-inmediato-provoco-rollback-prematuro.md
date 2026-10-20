# SPX-ERR-20261020-001 - Readiness publico inmediato provoco rollback prematuro

- Fecha: 2026-10-20.
- Sintoma: El contenedor nuevo quedo healthy pero /ready publico devolvio 404 durante la actualizacion, activando el rollback de seguridad.
- Causa raiz: La comprobacion asumio disponibilidad publica inmediata al ver healthy. Propagacion de Traefik pendiente de corroborar con reintento.
- Solucion: Esperar de forma acotada hasta que HTTPS /ready responda con el commit esperado; conservar rollback si no converge.
- Prevencion/guardia: Verificar salud interna y readiness publica del commit con reintentos limitados, sin aceptar solo healthy ni modificar TLS.
