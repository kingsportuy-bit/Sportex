# Etapa 0 — wireframe maestro de la V1 Operativa

- Tarea: `TASK-20260803-005`
- Campaña: `CAMP-20260803-001`
- Fecha: `2026-08-03`
- Entorno: `DOCUMENTACION`
- Estado: `WIREFRAME_APROBADO_POR_FITO`
- Código modificado en este checkpoint: `NO`

## Fuentes reconciliadas

1. `plan-entrega-sportex-delta-v1-operativa.md`;
2. `campana-sportex-sistema-comercial-asistido.md`;
3. `handoff-sportex-inteligencia-conversacional.md`;
4. `DELTA-DEC-007`, `DELTA-DEC-010` y `DELTA-DEC-011`.

No se abre otra campaña ni otra tarea. Esta evidencia amplía el wireframe
anterior de `TASK-20260803-005` y no lo trata como una implementación.

## Qué se conserva y qué cambia

Se conserva del wireframe anterior:

- `Hoy` entra por prioridad, no por estructura interna;
- cola `Responder ahora / Vencido / Esperando cliente`;
- lista a la izquierda, conversación al centro y trabajo a la derecha;
- próxima acción visible en cada conversación;
- atribución y métricas fuera de la operación diaria;
- ficha completa por detalle progresivo.

Se amplía para la V1:

- navegación completa de Operación, Marketing y Administración;
- respuestas rápidas y envío controlado de tabla de talles dentro de `Leads`;
- interés actual separado del anuncio que originó el contacto;
- transición visible `SEÑA_VALIDADA -> Cliente + un Pedido`;
- tablero productivo de `Pedidos`;
- ficha de Cliente y ficha completa sin sobrecargar el trabajo diario;
- patrón móvil con navegación, conversación y acción contextual.

## Dirección visual recomendada

- Sujeto: mesa diaria de Fito para convertir conversaciones en próximos pasos y
  pedidos controlados.
- Trabajo principal: decidir qué atender y completar la acción sin reconstruir
  el historial.
- Paleta: `Lona #F4F6F2`, `Tinta #18221C`, `Delta #2457D6`,
  `Vencido #BF4335`, `Avance #2F7A57`, `Línea #D6DBD3`.
- Tipografía: `Bahnschrift SemiCondensed` solo para títulos cortos;
  `Segoe UI` para lectura y controles; `Cascadia Mono` para fechas y referencias.
- Firma: una cinta de próxima acción, con urgencia temporal y verbo concreto,
  acompaña cada lead y pedido. El color indica tiempo, nunca etapa comercial.
- Revisión crítica: se elimina el aspecto de expediente industrial como vista
  principal. La identidad queda en la precisión, no en títulos gigantes,
  numeración decorativa o paneles densos.

## Wireframe maestro único

```text
ESCRITORIO · SHELL ÚNICO
┌───────────────────┬──────────────────────────────────────────────────────────────────────────────┐
│ DELTA / SPORTEX   │ HOY · Lun 3 de agosto                                      Buscar   Fito ▾ │
│                   ├──────────────────────────────────────────────────────────────────────────────┤
│ OPERACIÓN         │  HOY: cada fila explica por qué aparece y abre el lugar exacto para actuar   │
│ ● Hoy             │ ┌───────────────┬───────────────┬───────────────┬──────────────────────────┐ │
│   Leads           │ │ 3 responder   │ 2 vencidos    │ 5 esperando   │ 1 pedido bloqueado       │ │
│   Pedidos         │ │ ahora         │               │ cliente       │                          │ │
│   Clientes        │ └───────────────┴───────────────┴───────────────┴──────────────────────────┘ │
│                   │ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ MARKETING         │ │ AHORA · Lucía / Los Ombúes · escribió hace 8 min                       │ │
│   Anuncios        │ │ Falta: fecha y dorsales · Próxima: responder y pedir esos datos  [Abrir]│ │
│   Creativos       │ ├──────────────────────────────────────────────────────────────────────────┤ │
│   Resultados      │ │ VENCIDO · Diego / Marea Roja · venció ayer                             │ │
│                   │ │ Próxima: llamar y confirmar decisión                           [Abrir]│ │
│ ADMINISTRACIÓN    │ ├──────────────────────────────────────────────────────────────────────────┤ │
│   Productos,      │ │ ESPERANDO CLIENTE · Sofía / Arenas 12 · desde hace 2 días               │ │
│   precios y talles│ │ Próxima: revisar el viernes                                     [Abrir]│ │
│   Procesos y      │ ├──────────────────────────────────────────────────────────────────────────┤ │
│   respuestas      │ │ PEDIDO BLOQUEADO · #0001 Circuito Sur                                   │ │
│   rápidas         │ │ Falta: lista final de nombres · Próxima: pedir corrección        [Abrir]│ │
│   Proveedores     │ └──────────────────────────────────────────────────────────────────────────┘ │
│   Configuración   │                                                                              │
└───────────────────┴──────────────────────────────────────────────────────────────────────────────┘

LEADS · MISMO SHELL, TRES ZONAS DE TRABAJO
┌───────────────────┬──────────────────────┬────────────────────────────────┬─────────────────────────┐
│ navegación        │ PRIORIDAD            │ CONVERSACIÓN                   │ TRABAJO                 │
│                   │ [Buscar] [Todos ▾]   │ Lucía · Los Ombúes             │ Etapa                   │
│                   │                      │ Interés: equipo completo       │ [En calificación ▾]     │
│                   │ ● Lucía · ahora      │                                │                         │
│                   │ Próxima: pedir fecha │ Cliente 09:12                  │ Resumen                 │
│                   │ y dorsales           │ “Vi camisetas, pero queremos   │ 18 equipos completos    │
│                   │                      │  también short y medias.”      │ para torneo infantil    │
│                   │ ! Diego · vencido    │                                │                         │
│                   │ Próxima: llamar      │ Delta 09:18                    │ Confirmado              │
│                   │                      │ “¿Ya tienen los talles?”       │ ✓ equipo · ✓ cantidad   │
│                   │ ◷ Sofía · esperando │                                │ ✓ infantil · ✓ colores │
│                   │ Próxima: viernes     │ Cliente 09:24                  │                         │
│                   │                      │ “¿Me pasás la tabla?”          │ Falta                   │
│                   │                      │                                │ • fecha · • dorsales    │
│                   │                      │ ┌────────────────────────────┐ │                         │
│                   │                      │ │ Escribir respuesta…        │ │ Próxima acción         │
│                   │                      │ │                            │ │ [Pedir fecha y lista ] │
│                   │                      │ └────────────────────────────┘ │ [Mañana             ]  │
│                   │                      │ [Respuesta rápida ▾]          │ [Guardar siguiente paso]│
│                   │                      │ [Tabla de talles] [Adjuntar]  │                         │
│                   │                      │              [Revisar y enviar]│ Sugerencia              │
│                   │                      │ Requiere aprobación humana    │ Pedir fecha y dorsales  │
│                   │                      │                                │ antes de cotizar.       │
│                   │                      │                                │                         │
│                   │                      │                                │ Origen histórico        │
│                   │                      │                                │ Anuncio: Camisetas 11   │
│                   │                      │                                │ Interés actual: Equipo  │
│                   │                      │                                │ [Ver recorrido]         │
│                   │                      │                                │ [Ver ficha completa]    │
└───────────────────┴──────────────────────┴────────────────────────────────┴─────────────────────────┘

TABLA DE TALLES · ACCIÓN CONTEXTUAL DENTRO DE LEADS
┌──────────────────────────────────────────────────────────────────────────┐
│ Enviar tabla de talles                                                   │
│ El cliente pidió talles. Elegí el recurso y revisá antes de adjuntarlo. │
│ [Niños 06–16 ●] [Adultos S–XXL ○]                                       │
│ Vista previa: tabla Delta vigente · versión 2026-08-03                   │
│ Mensaje preparado: “Te paso la tabla para que puedan medirse…”          │
│                                  [Cancelar] [Adjuntar para revisión]     │
└──────────────────────────────────────────────────────────────────────────┘

SEÑA Y CONVERSIÓN · OBJETIVO V1, TODAVÍA NO IMPLEMENTADO POR ESTA ETAPA
┌──────────────────────────────────────────────────────────────────────────┐
│ SEÑA DETECTADA                                                          │
│ Evidencia ficticia · Cotización v2 · Importe y cliente coinciden        │
│ Al validar, el Core hará exactamente esto:                              │
│ 1. crear o vincular Cliente “Lucía / Los Ombúes”;                       │
│ 2. crear un único Pedido #0001 ligado a esta oportunidad y seña;        │
│ 3. congelar el resumen/cotización y abrir requisitos productivos;       │
│ 4. conservar anuncio -> conversación -> oportunidad -> cliente/pedido.  │
│ Reprocesar la misma seña devolverá el mismo Cliente y Pedido.           │
│                                         [Cancelar] [Validar seña]       │
└──────────────────────────────────────────────────────────────────────────┘

PEDIDOS · TABLERO PRODUCTIVO
┌────────────────┬────────────────┬────────────────┬────────────────┬────────────────┐
│ INGRESO        │ DISEÑO         │ IMPRESIÓN /    │ TALLER         │ ENVÍO          │
│                │                │ COMPRAS        │                │                │
│ #0001          │ #0002          │ #0003          │ #0004          │ #0005          │
│ Los Ombúes     │ Circuito Sur   │ Marea Roja     │ Horizonte 11   │ Villa Arena    │
│ Falta: fecha   │ Bloqueo: logo  │ Próx: telas    │ Próx: control  │ Próx: coordinar│
│ Próx: completar│ Próx: pedir    │ Responsable: F │ Responsable: T │ Responsable: F │
│ [Abrir]        │ [Abrir]        │ [Abrir]        │ [Abrir]        │ [Abrir]        │
└────────────────┴────────────────┴────────────────┴────────────────┴────────────────┘

CLIENTE Y FICHA COMPLETA · NIVEL SECUNDARIO
┌──────────────────────────────────────────────────────────────────────────┐
│ Lucía / Los Ombúes · Cliente desde 03/08                                │
│ Resumen: contacto, equipo, preferencias y última acción                 │
│ [Conversaciones 2] [Oportunidades 2] [Pedidos 1]                        │
│ Pedido activo #0001 · Ingreso · Falta fecha final                       │
│                                                    [Abrir ficha completa]│
├──────────────────────────────────────────────────────────────────────────┤
│ Ficha completa abre como panel/página secundaria: identidad, timeline,  │
│ anuncios, conversaciones, cotizaciones, talles, pedidos e historial.    │
└──────────────────────────────────────────────────────────────────────────┘

DESTINOS NO OPERATIVOS · MISMO SHELL
┌───────────────────────────────┬──────────────────────────────────────────┐
│ MARKETING                     │ ADMINISTRACIÓN                           │
│ Anuncios: origen y vigencia   │ Productos/precios/talles: biblioteca    │
│ Creativos: pieza y versiones  │ Procesos/respuestas: reglas y recursos  │
│ Resultados: embudo y tiempos  │ Proveedores: registro y requisitos      │
│ (solo lectura en V1)          │ Configuración: permisos y controles     │
└───────────────────────────────┴──────────────────────────────────────────┘

MÓVIL · MISMO MODELO, CONTEXTO POR CAPAS
┌──────────────────────────────┐
│ ☰  Hoy                 Fito  │  Menú lateral agrupado al abrir ☰
├──────────────────────────────┤
│ 3 ahora · 2 vencidos         │
│ 5 esperando · 1 bloqueado    │
├──────────────────────────────┤
│ AHORA · Lucía / Los Ombúes   │
│ Falta fecha y dorsales       │
│ Próxima: responder           │
│                       [Abrir]│
└──────────────────────────────┘

Al abrir un Lead:
┌──────────────────────────────┐
│ ‹ Hoy   Lucía / Los Ombúes   │
│ [Chat] [Trabajo] [Ficha]     │
├──────────────────────────────┤
│ conversación o panel elegido │
│                              │
│                              │
├──────────────────────────────┤
│ [Tabla talles] [Resp. rápida]│
│ [Guardar siguiente paso]     │  Acción primaria fija abajo
└──────────────────────────────┘
```

## Recorrido completo de ejemplo

1. `Hoy` muestra a Lucía en `Responder ahora` porque escribió hace 8 minutos y
   explica que faltan fecha y dorsales.
2. `Abrir` lleva a `Leads` con Lucía seleccionada. El hilo queda al centro y el
   trabajo comercial a la derecha.
3. El anuncio histórico sigue siendo `Camisetas 11`; el interés actual cambia a
   `Equipo completo`. No se reescribe la atribución ni se pierde el primer
   interés.
4. SPORTEX marca como confirmados equipo, cantidad, categoría infantil y
   colores; muestra fecha y dorsales como faltantes.
5. Ante “¿me pasás la tabla?”, aparece `Tabla de talles`. Fito elige `Niños
   06–16`, revisa recurso y texto y lo adjunta para aprobación. Nada se envía en
   esta etapa.
6. Fito guarda `Pedir fecha y lista de dorsales mañana` como próxima acción. El
   lead pasa a `Esperando cliente` sin perder la conversación.
7. Más adelante aparece `SEÑA_DETECTADA`. La pantalla explica el efecto exacto
   antes de validar: crear/vincular Cliente y crear un solo Pedido.
8. Al objetivo futuro `SEÑA_VALIDADA`, el Core devuelve Cliente Lucía y Pedido
   #0001. Reprocesar la misma evidencia no crea duplicados.
9. `Pedidos` muestra #0001 en `Ingreso`, con faltantes y próxima acción. Abrirlo
   permite avanzar por Diseño, Impresión/Compras, Taller y Envío.
10. `Clientes` reúne conversaciones, oportunidades y pedidos. La ficha completa
    queda disponible desde `Ver ficha completa`, no en la pantalla diaria.

## Estado honesto de capacidades

Ya validado localmente:

- 18 leads ficticios, conversación, origen exacto/desconocido;
- etapa, próxima acción, seguimiento, reset y persistencia JSON local.

Representado como objetivo de V1, no implementado por esta Etapa 0:

- preparación/aprobación de respuestas y tabla de talles;
- cambio de interés con múltiples oportunidades;
- `SEÑA_DETECTADA` y conversión idempotente a Cliente/Pedido;
- tablero productivo, ficha completa y módulos administrativos/marketing.

## Criterio exacto de aprobación

La Etapa 0 se considera aprobada solamente cuando:

1. Fito confirma que entiende `Hoy` y el recorrido sin explicación adicional;
2. aprueba esta única arquitectura de navegación y el patrón de `Leads`;
3. confirma que tabla de talles, respuestas rápidas y aprobación humana aparecen
   en el lugar correcto;
4. confirma la separación entre anuncio histórico e interés actual;
5. confirma el efecto visible `SEÑA_VALIDADA -> Cliente + exactamente un Pedido`;
6. confirma el tablero productivo y el acceso secundario a ficha completa;
7. aprueba los patrones de escritorio y móvil;
8. el checkpoint documental termina con `SPORTEX_CLOSE=PASS`;
9. antes de implementar, autoriza por separado cómo versionar el trabajo local
   pendiente. Sin esa autorización no hay commit, push ni ampliación de código.

## Límites y próxima acción

- Core, frontend ejecutable, persistencia y 18 leads: preservados;
- servicios reales, mensajes, datos reales, deploy y `PILOTO_DELTA`: no usados;
- commit y push: no realizados;
- aprobación registrada: Fito indicó `continua` después de revisar el wireframe
  y el recorrido completo;
- alcance de la aprobación: arquitectura visual de Etapa 0, no interfaz
  implementada ni V1 operativa;
- próxima acción: informar el contenido exacto del commit de resguardo y pedir
  autorización antes de crearlo; no modificar código todavía.
