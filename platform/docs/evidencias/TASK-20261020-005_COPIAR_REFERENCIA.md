# Evidencia: copiar referencia con Logo2

Entorno DESARROLLO_LOCAL. Rama codex/desplegar-bocetos-20261020.

## Causa y reproduccion

fixedLayerKeys incluye brand2; cuando tiene imagen visible, el constructor
buildReferenceDetailContext lo agrega a elements. validateDetailContext mantenia
la lista anterior sin brand2 y devolvia400 antes de llegar a OpenAI. El mismo
fallo bloqueaba el boton y el ajuste automatico posterior a generar.

reference-context.test.mjs ejecuta el constructor real del editor en VM y envia
su paquete al servidor HTTP con sesion/empresa ficticia del Core. Antes del fix:
400 !=200, con el mensaje exacto informado por Fito. Despues de agregar brand2
a los IDs validos: PASS. El resultado es aceptado por validateReferenceExtras.
Conserva rechazo400 para ID desconocido y no llama al proveedor en ese caso.

## Imagen origen y proceso

copyReferenceColors captura state.referenceData y la manda en reference.
createColorAnalyzer pone esa imagen primero en input_image de Responses;
mock se etiqueta CURRENT MOCK y las texturas como SOURCE TEXTURE. El esquema
exige diez colores HEX/null; el cliente valida y aplica sin pisar ediciones
concurrentes. Inferencias se marcan y el historial permite deshacer.
La prueba usa imagenes distintas para referencia/mock y verifica orden real
en el request; devuelve colores conocidos y contorno inferido para Logo2.
Una llamada ficticia registrada,15 tokens ficticios,0 creditos de generacion.
No cambia modelo, prompt, generacion, reglas de consumo ni persistencia.

## Validacion

16 pruebas focales PASS; npm run check:bocetos:199 PASS,0 fallos.
Log privado: C:/Users/Fito/.codex/artifacts/sportex-bocetos-20261020-005-tests.log.
workflow:close -- TASK-20261020-005 --profile=auto: SPORTEX_CLOSE=PASS local;
31 workflow,59 Core, SQL/RLS y build PASS. Log privado con sufijo005-close.log.

## Limites y rollback

No se usa ninguna API real, cuenta real ni servidor remoto. La prueba confirma
el contrato y el flujo; la calidad visual de cada deteccion depende de la IA.
Runtime publicado a65249d permanece igual hasta GO especifico. Revertir commit
de esta task revierte el cambio. Publicacion posterior requiere backup y rollback.

## GO y preflight de publicacion

Fito confirma Go tras verificar sponsors/textos. Codigo aprobadoa2e2deb; el
release agrega solo documentos operativos. Rollback a65249d, mismo volumen.
14:10 UTC: imagen anterior healthy1/1,38GB libres y6.9GB RAM disponibles;
ambos /ready200 con a65249d. CRMd9c4f44. La DB activa tiene lock exclusivo:
lectura externa denegada, sin eludirlo. Snapshot consistente anterior valido;
el gate verifica operaciones en curso sobre backup definitivo con servicio
detenido antes de activar candidato. Sin cuentas de QA ni API paga.
SPORTEX_CLOSE=PASS pilot-release previo al bundle.
