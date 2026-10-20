# SPX-ERR-20261020-006 - Host de bocetos no disponia de unzip

- Fecha: 2026-10-20.
- Sintoma: El bundle valido no se extraia porque unzip no existe en el VPS.
- Causa raiz: Se asumio una herramienta remota no inventariada.
- Solucion: Confirmar python3 instalado y extraer con python3 -m zipfile; normalizar copia del helper sh a LF.
- Prevencion/guardia: Preflight command -v python3 y capacidad ZIP; ejecutar helper LF antes de activar, sin instalar paquetes en el host.
