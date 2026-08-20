# Gobernanza de releases SPORTEX

## Fuentes de verdad

| Responsabilidad | Fuente |
| --- | --- |
| codigo y contratos | Git |
| cambio entregable | task + commit remoto + scope |
| artefacto | digest o hash inmutable |
| permiso | GO explicito de Fito para accion y entorno |
| runtime | observacion de infraestructura |
| validacion | evidencia ligada al deployment |
| rollback | version anterior y procedimiento ensayado |

## Gates bloqueantes

1. tarea activa o de release con alcance exacto;
2. worktree sin cambios ajenos dentro del scope;
3. commit remoto identificable;
4. validaciones aplicables en PASS;
5. secretos fuera de Git;
6. backup/rollback proporcional al cambio;
7. permiso explicito despues de explicar la accion;
8. artefacto construido desde el commit, no desde archivos locales;
9. observacion posterior y criterio de detencion;
10. evidencia y estado documental actualizados.

## PILOTO_DELTA

Permite releases reales para uso de Delta, pero cada deploy, migracion, envio o
activacion requiere GO. El piloto no autoriza operar empresas externas.

Ante un incidente, el hotfix parte del commit/digest observado. La recuperacion
queda `RECOVERED_RECONCILIATION_PENDING` hasta contener el fix en Git canonico,
revalidar localmente y actualizar la rama/candidato pausados. Mientras el modelo
sea `PILOT_ONLY`, esto no exige un STAGING inexistente.

Despues de una task explicita que cambie el modelo a
`SEPARATED_STAGING_PRODUCTION`, toda promocion y cierre de incidente requiere
el gate `ENVIRONMENT_RECONCILIATION` con STAGING certificado.

## PRODUCCION_COMERCIAL

Requiere un gate comercial adicional. No puede inferirse de una certificacion
piloto, una tarjeta prepaga, un test o una tarea cerrada.

## Estado honesto

Una build local, un contenedor sano o un endpoint `/health` no prueban el flujo
de negocio. El deployment debe identificarse y la evidencia debe corresponder a
esa misma version.

## Herramientas

- `scripts/release-governance-guard.ps1`: commit, scope, remoto y limpieza.
- `scripts/new-release-bundle.ps1`: bundle inmutable desde `git archive`.

Estas herramientas preparan y verifican un release; no ejecutan el deploy.
