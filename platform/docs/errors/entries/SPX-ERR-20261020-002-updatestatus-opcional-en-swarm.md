# SPX-ERR-20261020-002 - UpdateStatus opcional en Swarm

- Fecha: 2026-10-20.
- Sintoma: Imagen candidata healthy y ambos /ready correctos, pero la plantilla .UpdateStatus.State fallo y activo rollback preventivo.
- Causa raiz: Tras escalar a cero y crear la replica con otra imagen, el objeto observado no incluia UpdateStatus. La comprobacion asumia su presencia obligatoria.
- Solucion: Leer el campo con index/with y manejar ausencia; comprobar siempre imagen exacta, replica healthy y ambos /ready del commit. Reintento desde replica activa completo con State=completed.
- Prevencion/guardia: Probar el lector con campo ausente antes de activar. No aceptar imagen vieja por health ni omitir rollback ante fallas reales.
