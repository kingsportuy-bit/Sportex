# Validación de producto y wireframe de Hoy

- Tarea: `TASK-20260803-005`
- Fecha: `2026-08-03`
- Entorno: `DOCUMENTACION`
- Resultado de producto: `NO_APROBADO`
- Resultado técnico heredado: `PASS`
- Campaña: `CAMP-20260803-001`

## Devolución registrada

Fito confirmó que la demo pasó las pruebas técnicas, pero la experiencia no se
entiende con facilidad. Este resultado no es un fallo del Core ni invalida la
persistencia, los comandos, las pruebas o los 18 leads ficticios.

## Diagnóstico de producto

La pantalla actual presenta primero la estructura del sistema y distribuye la
acción principal entre demasiados bloques. El usuario comercial necesita entrar
por prioridad, leer la conversación y dejar el siguiente paso sin recorrer un
expediente extenso.

## Dirección propuesta

- entrada principal: `Hoy`;
- menú: solamente `Hoy`, `Conversaciones` y `Resultados`;
- columna izquierda: conversaciones priorizadas con motivo y vencimiento;
- centro: conversación seleccionada y contexto inmediato;
- derecha: etapa, confirmados, faltantes, próxima acción, sugerencia comercial
  y origen secundario;
- `Resultados`: métricas, atribución y embudo fuera de la operación diaria.

## Respuestas que Hoy debe dar

1. quién necesita respuesta ahora;
2. qué seguimientos están vencidos;
3. qué clientes estamos esperando;
4. cuál es la próxima acción de cada conversación.

## Wireframe recomendado

```text
┌──────────┬────────────────────────┬──────────────────────────────┬─────────────────────────┐
│ DELTA    │ HOY                    │ Lucía · Los Ombúes FC        │ TRABAJO                 │
│          │                        │ Camisetas · 18               │                         │
│ ● Hoy    │ 3 responder ahora      ├──────────────────────────────┤ Etapa                   │
│          │ 2 seguimientos vencidos│                              │ [En calificación  ▾]    │
│ Convers. │ 5 esperando cliente    │ Cliente  09:12               │                         │
│          ├────────────────────────┤ “Quería consultar por...”    │ Confirmado              │
│ Result.  │ ● RESPONDER AHORA      │                              │ Equipo · Cantidad       │
│          │ Lucía · Los Ombúes     │ Delta    09:18               │ Producto · Talles       │
│          │ Hace 8 min             │ “¿Para qué fecha...?”        │                         │
│          │ Próxima: confirmar     │                              │ Falta                   │
│          │ fecha y dorsales       │ Cliente  09:24               │ Fecha · Dorsales        │
│          ├────────────────────────┤ “Lo necesito para...”        │                         │
│          │ ! VENCIDO              │                              │ Próxima acción          │
│          │ Diego · Marea Roja     │                              │ [Confirmar lista      ] │
│          │ Venció ayer            │                              │ [Mañana             ]  │
│          │ Próxima: llamar        │                              │ [Guardar siguiente paso]│
│          ├────────────────────────┤                              │                         │
│          │ ◷ ESPERANDO CLIENTE    │                              │ Sugerencia comercial    │
│          │ Sofía · Arenas 12      │                              │ Pedir fecha y dorsales  │
│          │ Desde hace 2 días      │                              │ antes de cotizar.       │
│          │ Próxima: revisar viernes│                             │                         │
│          │                        │                              │ Origen                  │
│          │                        │                              │ Anuncio “Tu identidad”  │
└──────────┴────────────────────────┴──────────────────────────────┴─────────────────────────┘
```

La firma visual es la cola ordenada por motivo de atención, no por etapa del
sistema. Rojo se reserva para vencimientos, azul para la selección y el resto
usa superficies claras y tipografía de alta lectura. La acción principal queda
siempre visible en el panel derecho.

## Ejemplo de atención

1. Lucía aparece primera en `Responder ahora` porque su último mensaje necesita
   respuesta. La fila ya muestra `Confirmar fecha y dorsales`.
2. El vendedor la selecciona y lee la conversación completa en el centro.
3. A la derecha ve que equipo, producto, cantidad y talles están confirmados;
   faltan fecha y dorsales. La sugerencia propone pedir esos dos datos.
4. Cambia la etapa a `En calificación`, registra el seguimiento interno y deja
   `Revisar fecha y dorsales mañana` como próxima acción.
5. Al guardar, la conversación sale de `Responder ahora` y queda en
   `Esperando cliente`, con el siguiente paso y la fecha visibles en su fila.

La demo no envía el mensaje: solo organiza la decisión comercial y deja el
siguiente paso programado.

## Gate

El wireframe se presenta a Fito antes de modificar HTML, CSS o JavaScript. La
implementación permanece detenida hasta su aprobación explícita.

## Preservación confirmada

- funcionalidad Core: sin cambios;
- persistencia JSON local: preservada;
- semilla: 18 leads ficticios preservados;
- integraciones, mensajes, datos reales y deploy: 0.

## Próxima acción

Esperar la aprobación o devolución de Fito sobre el wireframe único recomendado.
