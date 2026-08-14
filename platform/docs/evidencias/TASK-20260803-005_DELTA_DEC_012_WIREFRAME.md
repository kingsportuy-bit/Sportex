# Wireframe corregido por DELTA-DEC-012

- Tarea: `TASK-20260803-005`
- Campaña: `CAMP-20260803-001`
- Fecha: `2026-08-03`
- Entorno: `DOCUMENTACION`
- Estado: `WIREFRAME_PENDIENTE_APROBACION_DE_FITO`
- Producto actual: `VALIDACION_PRODUCTO_NO_APROBADA`
- Código modificado: `NO`

## Reconciliación

`DELTA-DEC-012` corrige una confusión de arquitectura: una bandeja de
conversaciones no reemplaza el CRM ni el tablero productivo.

- `Hoy` prioriza trabajo y abre el registro exacto.
- `Leads` abre siempre en un tablero CRM por etapas.
- `Pedidos` abre siempre en un tablero productivo por etapas.
- Una tarjeta de Lead abre conversación + ficha comercial.
- Una tarjeta de Pedido abre conversación vinculada + ficha del Pedido.
- `Clientes` conecta conversaciones, oportunidades y pedidos sin duplicarlos.

Se conservan Core, persistencia, reset, 18 leads y todo el trabajo local. La
interfaz implementada conserva su PASS técnico, pero la Etapa 0 sigue sin
aprobación de producto.

## Dirección de diseño

- Trabajo del tablero: orientarse y elegir qué mover o abrir.
- Trabajo del detalle: conversar y completar el registro seleccionado.
- Firma visual: cada tarjeta lleva una cinta inferior de `Próxima acción`; el
  color identifica urgencia o bloqueo, no reemplaza la etapa de la columna.
- Escritorio: tablero de ancho completo; detalle en dos paneles.
- Móvil: columnas desplazables; al abrir una tarjeta, pestañas
  `Conversación / Ficha / Relaciones`.

## Wireframe maestro único

```text
SHELL FIJO
┌──────────────────┬───────────────────────────────────────────────────────────┐
│ SPORTEX          │ Hoy | nombre de pantalla                    Buscar        │
│ OPERACIÓN        ├───────────────────────────────────────────────────────────┤
│ Hoy              │ El área central cambia entre los cinco estados de abajo. │
│ Leads            │ El menú y la ruta conservan siempre la orientación.      │
│ Pedidos          │                                                           │
│ Clientes         │                                                           │
│ MARKETING        │                                                           │
│ Anuncios         │                                                           │
│ Creativos        │                                                           │
│ Resultados       │                                                           │
│ ADMINISTRACIÓN   │                                                           │
└──────────────────┴───────────────────────────────────────────────────────────┘

A. LEADS / TABLERO CRM (entrada predeterminada)
┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ NUEVOS       │ CALIFICACIÓN │ COTIZADOS    │ SEGUIMIENTO  │ CONVERTIDOS  │
│ [tarjeta]    │ [tarjeta]    │ [tarjeta]    │ [tarjeta]    │ [tarjeta]    │
│ Equipo       │ Equipo       │ Equipo       │ Equipo       │ Equipo       │
│ Producto · Q │ Producto · Q │ Producto · Q │ Producto · Q │ Producto · Q │
│ Falta: ...   │ Falta: ...   │ Falta: ...   │ Falta: ...   │ Falta: ...   │
│ Sin resp.:2h │ Sin resp.:1d │ Sin resp.:3h │ Sin resp.:2d │ Sin resp.:—  │
│ Origen: Meta │ Origen: desc.│ Origen: Meta │ Origen: Meta │ Origen: desc.│
│──────────────│──────────────│──────────────│──────────────│──────────────│
│ Próxima: ... │ Próxima: ... │ Próxima: ... │ Próxima: ... │ Ver pedido   │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
Filtros: buscar | producto | origen | responsable | vencimiento
Etapas adicionales: SEÑA PENDIENTE | SIN RESPUESTA | PERDIDOS

B. LEAD / DETALLE (se abre desde una tarjeta)
┌────────────────────────────────┬──────────────────────────────────────────┐
│ ← Volver al tablero            │ LEAD · Los Ombúes FC · EN CALIFICACIÓN │
├────────────────────────────────┼──────────────────────────────────────────┤
│ CONVERSACIÓN                   │ FICHA COMERCIAL                          │
│ mensajes ordenados             │ Resumen                                 │
│ anuncio de origen secundario   │ Confirmado / Falta                      │
│                                │ Producto · cantidad · talles · fecha    │
│                                │ Etapa · próxima acción · responsable    │
│                                │ Origen histórico                        │
│ [preparar borrador]            │ [guardar cambios autorizados]           │
├────────────────────────────────┴──────────────────────────────────────────┤
│ RELACIONES: Oportunidad OP-02 → Cliente CL-02 → Pedido PED-006            │
└───────────────────────────────────────────────────────────────────────────┘

C. PEDIDOS / TABLERO PRODUCTIVO (entrada predeterminada)
┌────────────┬────────────┬────────────┬────────────┬────────────┬──────────┐
│ INGRESO    │ DISEÑO     │ IMP./COMP. │ TALLER     │ ENVÍO      │ ENTREGADO│
│ [tarjeta]  │ [tarjeta]  │ [tarjeta]  │ [tarjeta]  │ [tarjeta]  │[tarjeta] │
│ Cliente    │ Cliente    │ Cliente    │ Cliente    │ Cliente    │ Cliente  │
│ Producto·Q │ Producto·Q │ Producto·Q │ Producto·Q │ Producto·Q │Producto·Q│
│ Fecha obj. │ Fecha obj. │ Fecha obj. │ Fecha obj. │ Fecha obj. │ Entrega  │
│ Resp.: ... │ Resp.: ... │ Resp.: ... │ Resp.: ... │ Resp.: ... │ Cerrado  │
│ Bloqueo: — │ Bloqueo: — │ Cambio v2  │ BLOQUEADO  │ Bloqueo: — │Bloqueo:—│
│────────────│────────────│────────────│────────────│────────────│──────────│
│ Próxima... │ Próxima... │ Próxima... │ Resolver...│ Coordinar..│ Postventa│
└────────────┴────────────┴────────────┴────────────┴────────────┴──────────┘

D. PEDIDO / DETALLE (se abre desde una tarjeta)
┌────────────────────────────────┬──────────────────────────────────────────┐
│ ← Volver a Pedidos             │ PED-003 · Circuito Sur · TALLER        │
├────────────────────────────────┼──────────────────────────────────────────┤
│ CONVERSACIÓN VINCULADA         │ FICHA COMPLETA DEL PEDIDO               │
│ misma línea del cliente        │ Producto · cantidad · talles · fecha    │
│ mensajes relacionados          │ Responsable · etapa · próxima acción    │
│ al pedido y sus cambios        │ Bloqueo y condición para resolverlo     │
│                                │ Versión comercial · cambio posterior    │
│                                │ Diseño · trabajos · entrega · faltantes │
├────────────────────────────────┴──────────────────────────────────────────┤
│ RELACIONES: Cliente CL-03 ← Oportunidad OP-11 ← Lead LEAD-11              │
└───────────────────────────────────────────────────────────────────────────┘

E. CLIENTE / FICHA RELACIONADA
┌───────────────────────────────────────────────────────────────────────────┐
│ CLIENTE · Los Ombúes FC / Lucía A.                         [Editar ficha] │
│ Datos confirmados · equipo · preferencias · última actividad              │
├──────────────────────┬──────────────────────┬─────────────────────────────┤
│ CONVERSACIONES       │ OPORTUNIDADES        │ PEDIDOS                     │
│ WhatsApp principal → │ OP-02 Camisetas →    │ PED-001 Entregado →         │
│ Hilo recompra →      │ OP-15 Equipo corto → │ PED-008 Diseño →            │
├──────────────────────┴──────────────────────┴─────────────────────────────┤
│ LÍNEA DE TIEMPO: origen → lead → seña validada → pedido → entrega/recompra│
└───────────────────────────────────────────────────────────────────────────┘

MÓVIL
┌──────────────────────────────┐
│ ☰ Leads              Filtros │
│ [Nuevos][Calif.][Cotizados]→ │  columnas horizontales
│ ┌ tarjeta completa ┐         │
│ └──────────────────┘         │
└──────────────────────────────┘
Al abrir: [Conversación] [Ficha] [Relaciones], con «Volver al tablero» fijo.
```

## Mock relacionado requerido después de la aprobación

Se preservan los 18 leads. Se agregan exactamente 6 clientes y 8 pedidos:

| Cliente | Lead/origen | Pedidos relacionados | Caso visible |
| --- | --- | --- | --- |
| Los Ombúes FC / Lucía | camisetas, Meta exacto | `PED-001` entregado; `PED-008` en diseño | recompra y dos pedidos |
| Deportivo Horizonte / Marcos | equipo completo, Meta exacto | `PED-002` en ingreso; `PED-004` en impresión/compras | segundo pedido |
| Circuito Sur / Lucas | seña validada, desconocido | `PED-003` en taller | pedido bloqueado |
| Rayo Costero / Valentina | camisetas, Meta exacto | `PED-005` en impresión/compras | cambio posterior a la seña, versión 2 |
| Marea Roja / Diego | equipo completo, desconocido | `PED-006` en envío | coordinación de entrega |
| Horizonte Once / Romina | seña validada, Meta exacto | `PED-007` en ingreso | conversión reciente |

Reglas del mock:

- todos los IDs y vínculos son ficticios y estables;
- una conversación se enlaza, no se copia en Cliente y Pedido;
- el anuncio de primer origen no cambia aunque cambie el producto;
- `SEÑA_VALIDADA` vincula el Cliente y exactamente un Pedido por oportunidad;
- un cambio posterior crea versión e historial, no sobrescribe la venta inicial;
- la restauración repone conjuntamente los 18 leads, 6 clientes y 8 pedidos.

## Gate de aprobación

La Etapa 0 sigue pendiente hasta que Fito apruebe explícitamente:

1. `Leads` y `Pedidos` como tableros principales;
2. los dos detalles lado a lado;
3. la ficha relacionada de Cliente;
4. la navegación entre Lead, conversación, Cliente y Pedido;
5. el mock mínimo relacionado y su patrón móvil.

Esta aprobación no autoriza código, commit, push ni una etapa posterior.
