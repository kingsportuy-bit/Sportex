import type {
  CommercialAttribution,
  CommercialCreative,
  CommercialFollowUp,
  CommercialOpportunity,
  CommercialProductType,
  CommercialSizeBreakdown,
  CommercialStage,
  CommercialWorkspaceItem,
  NormalizedConversationMessage,
} from "../domain/commercial-models.js";
import { allowedCommercialStageTransitions } from "../domain/commercial-models.js";

interface DemoAd {
  id: string;
  name: string;
  campaignId: string;
  campaignName: string;
  creative: CommercialCreative;
}

interface DemoSpec {
  contactName: string;
  teamName: string;
  productType: CommercialProductType;
  quantity: number;
  sizes: CommercialSizeBreakdown[];
  colors: string[];
  personalization: string[];
  requestedDeliveryAt: string | null;
  missingInfo: string[];
  stage: CommercialStage;
  nextAction: string;
  nextActionDueAt: string | null;
  ad: keyof typeof ads | null;
  detail: string;
  lossReason?: string;
}

const ads = {
  identidad: {
    id: "ad-ficticio-camisetas-identidad",
    name: "Tu camiseta, tu identidad",
    campaignId: "campaign-ficticia-identidad-2026",
    campaignName: "Identidad de club · Demo ficticia",
    creative: {
      id: "creative-ficticio-identidad-imagen",
      name: "Camiseta azul sobre mesa de corte",
      format: "IMAGEN",
      title: "Tu camiseta, tu identidad",
      body: "Diseño de camiseta personalizado para clubes. Pieza completamente ficticia.",
      visualLabel: "CAMISETA / ESCUDO / NÚMERO",
      accent: "#2767ff",
    },
  },
  completo: {
    id: "ad-ficticio-equipo-completo",
    name: "Vestí al equipo completo",
    campaignId: "campaign-ficticia-equipo-2026",
    campaignName: "Equipo completo · Demo ficticia",
    creative: {
      id: "creative-ficticio-completo-carrusel",
      name: "Camiseta, short y medias por capas",
      format: "CARRUSEL",
      title: "Vestí al equipo completo",
      body: "Camiseta, short y medias en un único conjunto. Pieza completamente ficticia.",
      visualLabel: "3 PIEZAS / 1 EQUIPO",
      accent: "#dcff52",
    },
  },
  campeonato: {
    id: "ad-ficticio-camisetas-campeonato",
    name: "Arrancá el campeonato con camiseta nueva",
    campaignId: "campaign-ficticia-campeonato-2026",
    campaignName: "Inicio de campeonato · Demo ficticia",
    creative: {
      id: "creative-ficticio-campeonato-reel",
      name: "Entrada a cancha con dorsales",
      format: "REEL",
      title: "La primera fecha empieza antes",
      body: "Camisetas personalizadas para el comienzo del torneo. Pieza completamente ficticia.",
      visualLabel: "PRIMERA FECHA / NUEVA PIEL",
      accent: "#ff6b35",
    },
  },
  pack: {
    id: "ad-ficticio-pack-club",
    name: "Camiseta + short + medias",
    campaignId: "campaign-ficticia-pack-2026",
    campaignName: "Pack club · Demo ficticia",
    creative: {
      id: "creative-ficticio-pack-historia",
      name: "Pack apilado con ficha de talles",
      format: "HISTORIA",
      title: "El equipo sale completo",
      body: "Pack de tres prendas para planteles. Pieza completamente ficticia.",
      visualLabel: "PACK CLUB / 3 PRENDAS",
      accent: "#f2a93b",
    },
  },
} as const satisfies Record<string, DemoAd>;

const adultSizes = (s: number, m: number, l: number, xl: number): CommercialSizeBreakdown[] => [
  { size: "S", quantity: s },
  { size: "M", quantity: m },
  { size: "L", quantity: l },
  { size: "XL", quantity: xl },
];

const youthSizes = (a: number, b: number, c: number, d: number): CommercialSizeBreakdown[] => [
  { size: "8", quantity: a },
  { size: "10", quantity: b },
  { size: "12", quantity: c },
  { size: "14", quantity: d },
];

const specs: DemoSpec[] = [
  { contactName: "Lucía A.", teamName: "Los Ombúes FC", productType: "CAMISETAS", quantity: 18, sizes: adultSizes(4, 6, 5, 3), colors: ["azul noche", "blanco"], personalization: ["escudo", "número"], requestedDeliveryAt: null, missingInfo: ["Fecha límite confirmada", "Lista de dorsales"], stage: "NUEVO", nextAction: "Confirmar fecha límite y lista de dorsales", nextActionDueAt: "2026-08-04", ad: "identidad", detail: "Quieren una camiseta sobria para un campeonato barrial." },
  { contactName: "Marcos B.", teamName: "Deportivo Horizonte", productType: "EQUIPO_COMPLETO", quantity: 22, sizes: adultSizes(5, 7, 6, 4), colors: ["verde", "negro"], personalization: ["escudo", "número", "apellido"], requestedDeliveryAt: "2026-09-12", missingInfo: ["Archivo vectorial del escudo"], stage: "NUEVO", nextAction: "Pedir archivo del escudo y confirmar tipo de cuello", nextActionDueAt: "2026-08-04", ad: null, detail: "Llegaron por recomendación y necesitan camiseta, short y medias." },
  { contactName: "Valentina C.", teamName: "Rayo Costero", productType: "CAMISETAS", quantity: 15, sizes: youthSizes(3, 4, 5, 3), colors: ["celeste", "amarillo"], personalization: ["escudo", "número"], requestedDeliveryAt: "2026-08-28", missingInfo: ["Nombres de los jugadores"], stage: "NUEVO", nextAction: "Confirmar si agregan nombres además de dorsales", nextActionDueAt: "2026-08-05", ad: "campeonato", detail: "Es un plantel infantil y ya tienen la distribución de talles." },
  { contactName: "Nicolás D.", teamName: "Club Nexo", productType: "EQUIPO_COMPLETO", quantity: 28, sizes: adultSizes(6, 8, 8, 6), colors: ["bordó", "gris"], personalization: ["escudo", "número", "sponsor"], requestedDeliveryAt: null, missingInfo: ["Fecha del debut", "Medida del sponsor"], stage: "NUEVO", nextAction: "Confirmar debut y medida del sponsor principal", nextActionDueAt: "2026-08-05", ad: "completo", detail: "Buscan renovar todo el plantel antes de la primera fecha." },
  { contactName: "Paula E.", teamName: "Unión Mirador", productType: "CAMISETAS", quantity: 20, sizes: adultSizes(4, 6, 6, 4), colors: ["rojo", "blanco"], personalization: ["escudo", "número"], requestedDeliveryAt: "2026-09-05", missingInfo: ["Modelo final de cuello"], stage: "EN_CALIFICACION", nextAction: "Enviar opciones ficticias de cuello para elegir", nextActionDueAt: "2026-08-06", ad: null, detail: "Tienen diseño de referencia y dudan entre cuello redondo o en V." },
  { contactName: "Andrés F.", teamName: "Barrio Faro", productType: "EQUIPO_COMPLETO", quantity: 16, sizes: adultSizes(4, 4, 4, 4), colors: ["naranja", "negro"], personalization: ["escudo", "número"], requestedDeliveryAt: "2026-08-30", missingInfo: ["Color de las medias"], stage: "EN_CALIFICACION", nextAction: "Definir color de medias y cerrar ficha de calificación", nextActionDueAt: "2026-08-06", ad: "pack", detail: "El short será negro; falta resolver el contraste de las medias." },
  { contactName: "Sofía G.", teamName: "Arenas 12", productType: "CAMISETAS", quantity: 12, sizes: youthSizes(3, 3, 4, 2), colors: ["violeta", "blanco"], personalization: ["escudo", "número", "nombre"], requestedDeliveryAt: "2026-09-18", missingInfo: ["Ortografía final de nombres"], stage: "EN_CALIFICACION", nextAction: "Recibir planilla revisada de nombres", nextActionDueAt: "2026-08-07", ad: "identidad", detail: "Las familias ya eligieron colores y están revisando nombres." },
  { contactName: "Bruno H.", teamName: "Atlético Cobre", productType: "EQUIPO_COMPLETO", quantity: 30, sizes: adultSizes(6, 8, 9, 7), colors: ["cobre", "azul marino"], personalization: ["escudo", "número", "dos sponsors"], requestedDeliveryAt: "2026-09-20", missingInfo: ["Logo vectorial del sponsor secundario"], stage: "EN_CALIFICACION", nextAction: "Solicitar logo vectorial pendiente", nextActionDueAt: "2026-08-07", ad: "completo", detail: "El sponsor principal está listo; falta material del segundo." },
  { contactName: "Camila I.", teamName: "La Ribera 7", productType: "CAMISETAS", quantity: 24, sizes: adultSizes(5, 7, 7, 5), colors: ["turquesa", "negro"], personalization: ["escudo", "número"], requestedDeliveryAt: "2026-09-02", missingInfo: [], stage: "COTIZADO", nextAction: "Confirmar recepción de la cotización ficticia v2", nextActionDueAt: "2026-08-08", ad: "campeonato", detail: "La ficha está completa y se ajustó una segunda versión de cantidades." },
  { contactName: "Mateo J.", teamName: "Viento Sur", productType: "EQUIPO_COMPLETO", quantity: 18, sizes: adultSizes(4, 5, 5, 4), colors: ["blanco", "azul"], personalization: ["escudo", "número"], requestedDeliveryAt: "2026-09-10", missingInfo: ["Confirmación del color del short"], stage: "COTIZADO", nextAction: "Resolver color del short antes de aceptar cotización", nextActionDueAt: "2026-08-08", ad: null, detail: "Recibieron una cotización ficticia, pero comparan dos variantes." },
  { contactName: "Florencia K.", teamName: "Los Pinos Social", productType: "CAMISETAS", quantity: 10, sizes: adultSizes(2, 3, 3, 2), colors: ["verde bosque", "crema"], personalization: ["escudo", "número"], requestedDeliveryAt: "2026-08-26", missingInfo: [], stage: "COTIZADO", nextAction: "Consultar decisión del grupo sobre la cotización ficticia", nextActionDueAt: "2026-08-09", ad: "identidad", detail: "Plantel corto con todos los datos técnicos confirmados." },
  { contactName: "Martín L.", teamName: "Juventud Prisma", productType: "EQUIPO_COMPLETO", quantity: 26, sizes: adultSizes(5, 7, 8, 6), colors: ["fucsia", "negro"], personalization: ["escudo", "número", "apellido"], requestedDeliveryAt: "2026-09-22", missingInfo: [], stage: "EN_SEGUIMIENTO", nextAction: "Retomar el viernes luego de la reunión del club", nextActionDueAt: "2026-08-07", ad: "pack", detail: "La comisión recibió la propuesta y pidió unos días para votar." },
  { contactName: "Agustina M.", teamName: "Cancha 9", productType: "CAMISETAS", quantity: 14, sizes: youthSizes(3, 4, 4, 3), colors: ["rojo coral", "azul"], personalization: ["escudo", "número"], requestedDeliveryAt: "2026-09-08", missingInfo: ["Dos talles por reconfirmar"], stage: "EN_SEGUIMIENTO", nextAction: "Reconfirmar dos talles y consultar avance", nextActionDueAt: "2026-08-09", ad: "campeonato", detail: "La cotización gusta, pero dos jugadores todavía no midieron talle." },
  { contactName: "Diego N.", teamName: "Marea Roja", productType: "EQUIPO_COMPLETO", quantity: 32, sizes: adultSizes(7, 9, 9, 7), colors: ["rojo", "azul oscuro"], personalization: ["escudo", "número", "sponsor"], requestedDeliveryAt: "2026-09-25", missingInfo: [], stage: "EN_SEGUIMIENTO", nextAction: "Llamada interna de seguimiento; no enviar mensaje automático", nextActionDueAt: "2026-08-10", ad: "completo", detail: "El delegado está comparando la propuesta con el presupuesto anual." },
  { contactName: "Julieta O.", teamName: "Villa Arena", productType: "CAMISETAS", quantity: 11, sizes: adultSizes(2, 3, 4, 2), colors: ["amarillo", "negro"], personalization: ["escudo", "número"], requestedDeliveryAt: "2026-08-20", missingInfo: [], stage: "PERDIDO", nextAction: "Sin próxima acción · cierre ficticio registrado", nextActionDueAt: null, ad: null, detail: "La fecha requerida quedó fuera del margen planteado.", lossReason: "Plazo ficticio incompatible" },
  { contactName: "Santiago P.", teamName: "Estación Norte", productType: "EQUIPO_COMPLETO", quantity: 20, sizes: adultSizes(4, 6, 6, 4), colors: ["gris", "verde lima"], personalization: ["escudo", "número"], requestedDeliveryAt: "2026-10-01", missingInfo: [], stage: "PERDIDO", nextAction: "Sin próxima acción · cierre ficticio registrado", nextActionDueAt: null, ad: "pack", detail: "El club decidió postergar la compra hasta otra temporada.", lossReason: "Proyecto ficticio postergado" },
  { contactName: "Romina Q.", teamName: "Horizonte Once", productType: "CAMISETAS", quantity: 18, sizes: adultSizes(4, 6, 5, 3), colors: ["azul", "dorado"], personalization: ["escudo", "número", "apellido"], requestedDeliveryAt: "2026-09-14", missingInfo: [], stage: "SENA_VALIDADA", nextAction: "Revisar expediente; pedido y producción están fuera de alcance", nextActionDueAt: "2026-08-11", ad: "identidad", detail: "La demo registra una seña validada manualmente y de forma ficticia." },
  { contactName: "Lucas R.", teamName: "Circuito Sur", productType: "EQUIPO_COMPLETO", quantity: 36, sizes: adultSizes(8, 10, 10, 8), colors: ["negro", "celeste"], personalization: ["escudo", "número", "dos sponsors"], requestedDeliveryAt: "2026-09-30", missingInfo: [], stage: "SENA_VALIDADA", nextAction: "Confirmar checklist comercial; pedido sigue fuera de alcance", nextActionDueAt: "2026-08-12", ad: "completo", detail: "La seña ficticia fue revisada por una persona dentro de la demo." },
];

function stageResponse(spec: DemoSpec): string {
  switch (spec.stage) {
    case "NUEVO": return "Perfecto, dejo la consulta abierta y te pido lo que falta antes de avanzar.";
    case "EN_CALIFICACION": return "Anoté esos datos. Estamos completando la ficha antes de cotizar.";
    case "COTIZADO": return "Quedó cargada una cotización ficticia para revisar; no genera ningún compromiso real.";
    case "EN_SEGUIMIENTO": return "Dejo el seguimiento interno agendado; esta demo no envía mensajes.";
    case "PERDIDO": return "Gracias por avisar. Registro el cierre ficticio para que el historial quede claro.";
    case "SENA_VALIDADA": return "La seña aparece validada solo como fixture manual; no existe un pago real ni un pedido.";
  }
}

function messages(spec: DemoSpec, index: number, baseAt: Date): NormalizedConversationMessage[] {
  const product = spec.productType === "CAMISETAS" ? "camisetas" : "equipos completos";
  const origin = spec.ad ? "Vi el anuncio y " : "Me pasaron el contacto y ";
  const entries: Array<["CLIENTE" | "DELTA", string]> = [
    ["CLIENTE", `Hola, soy ${spec.contactName}. ${origin}quería consultar por ${spec.quantity} ${product} para ${spec.teamName}.`],
    ["DELTA", `¡Hola, ${spec.contactName.split(" ")[0]}! Para ordenar la consulta, ¿ya tienen talles, colores y fecha objetivo?`],
    ["CLIENTE", `${spec.detail} Los colores serían ${spec.colors.join(" y ")}; los talles ya están distribuidos en la ficha.`],
    ["DELTA", stageResponse(spec)],
  ];
  return entries.map(([direction, text], messageIndex) => {
    const occurredAt = new Date(baseAt.getTime() + messageIndex * 9 * 60_000).toISOString();
    const suffix = `${String(index + 1).padStart(2, "0")}-${String(messageIndex + 1).padStart(2, "0")}`;
    return {
      id: `message-ficticio-seed-${suffix}`,
      provider: "EVOLUTION",
      providerMessageId: `msg-ficticio-seed-${suffix}`,
      direction,
      occurredAt,
      receivedAt: occurredAt,
      contentType: "TEXT",
      text,
      evidenceRef: `fixture:commercial-demo-v1:${suffix}`,
      fixtureOnly: true,
    };
  });
}

function attribution(spec: DemoSpec, evidenceMessageId: string, index: number): CommercialAttribution {
  if (!spec.ad) {
    return {
      classification: "DESCONOCIDO",
      adId: null,
      adName: null,
      campaignId: null,
      campaignName: null,
      sourceUrl: null,
      ctwaClid: null,
      ref: null,
      creative: null,
      evidenceMessageId,
    };
  }
  const ad = ads[spec.ad];
  return {
    classification: "META_EXACTO",
    adId: ad.id,
    adName: ad.name,
    campaignId: ad.campaignId,
    campaignName: ad.campaignName,
    sourceUrl: `https://example.invalid/anuncios/${ad.id}`,
    ctwaClid: `ctwa-ficticio-seed-${String(index + 1).padStart(2, "0")}`,
    ref: `ref-ficticia-${spec.ad}`,
    creative: { ...ad.creative },
    evidenceMessageId,
  };
}

function seededFollowUps(spec: DemoSpec, index: number, occurredAt: string): CommercialFollowUp[] {
  if (spec.stage === "NUEVO") return [];
  const outcome = spec.stage === "PERDIDO" ? "NO_CONTINUA" : spec.stage === "EN_SEGUIMIENTO" ? "SIN_RESPUESTA" : "AVANZO";
  return [{
    id: `followup-ficticio-seed-${String(index + 1).padStart(2, "0")}`,
    note: spec.stage === "PERDIDO"
      ? `Cierre ficticio documentado: ${spec.lossReason ?? "sin continuidad"}.`
      : "Nota interna ficticia: expediente revisado y próxima acción confirmada.",
    outcome,
    actorId: "actor-ficticio-seed",
    correlationId: `correlation-ficticia-seed-${String(index + 1).padStart(2, "0")}`,
    occurredAt,
  }];
}

function opportunity(spec: DemoSpec, tenantId: string, index: number, createdAt: string, updatedAt: string): CommercialOpportunity {
  const quoted = ["COTIZADO", "EN_SEGUIMIENTO", "SENA_VALIDADA"].includes(spec.stage);
  const followUps = seededFollowUps(spec, index, updatedAt);
  return {
    id: `opportunity-ficticia-${String(index + 1).padStart(2, "0")}`,
    tenantId,
    leadId: `lead-ficticio-${String(index + 1).padStart(2, "0")}`,
    conversationId: `conversation-ficticia-${String(index + 1).padStart(2, "0")}`,
    stage: spec.stage,
    allowedStageTransitions: allowedCommercialStageTransitions(spec.stage),
    nextAction: spec.nextAction,
    nextActionDueAt: spec.nextActionDueAt,
    nextActionStatus: spec.stage === "PERDIDO" ? "SIN_ACCION" : "PENDIENTE",
    quote: quoted ? {
      version: spec.stage === "COTIZADO" ? 2 : 1,
      totalCents: spec.quantity * (spec.productType === "CAMISETAS" ? 187_500 : 312_000),
      currency: "UYU",
      sentAt: updatedAt,
      fixtureOnly: true,
    } : null,
    lossReason: spec.stage === "PERDIDO" ? spec.lossReason ?? "Motivo ficticio no especificado" : null,
    depositValidation: spec.stage === "SENA_VALIDADA" ? {
      kind: "FIXTURE_MANUAL",
      note: "Validación manual ficticia; no certifica un pago ni crea un pedido.",
      validatedAt: updatedAt,
      validatedBy: "actor-ficticio-seed",
      fixtureOnly: true,
    } : null,
    stageHistory: [{
      id: `stage-history-ficticio-${String(index + 1).padStart(2, "0")}`,
      from: null,
      to: spec.stage,
      reason: "Estado inicial de la semilla ficticia commercial-demo-v1",
      actorId: "actor-ficticio-seed",
      occurredAt: createdAt,
    }],
    followUps,
    evidenceMessageId: `message-ficticio-seed-${String(index + 1).padStart(2, "0")}-01`,
    version: 1,
    createdAt,
    updatedAt,
  };
}

export const COMMERCIAL_DEMO_FIXTURE_VERSION = "commercial-demo-v1" as const;
export const COMMERCIAL_DEMO_FIXTURE_COUNT = specs.length;

export function createCommercialDemoSeed(tenantId: string): CommercialWorkspaceItem[] {
  return specs.map((spec, index) => {
    const day = 10 + index;
    const baseAt = new Date(Date.UTC(2026, 6, day, 13, (index % 4) * 7));
    const conversationMessages = messages(spec, index, baseAt);
    const first = conversationMessages[0];
    const last = conversationMessages.at(-1);
    if (!first || !last) throw new Error("commercial_demo_seed_invalid");
    const suffix = String(index + 1).padStart(2, "0");
    const confirmedInfo = [
      { label: "Equipo", value: spec.teamName },
      { label: "Producto", value: spec.productType === "CAMISETAS" ? "Camisetas" : "Equipo completo" },
      { label: "Cantidad", value: String(spec.quantity) },
      { label: "Colores", value: spec.colors.join(" + ") },
      { label: "Talles", value: spec.sizes.map((size) => `${size.size} × ${size.quantity}`).join(" · ") },
      ...(spec.requestedDeliveryAt ? [{ label: "Fecha solicitada", value: spec.requestedDeliveryAt }] : []),
    ];
    const itemOpportunity = opportunity(spec, tenantId, index, first.receivedAt, last.receivedAt);
    return {
      id: `workspace-ficticio-${suffix}`,
      tenantId,
      conversation: {
        id: `conversation-ficticia-${suffix}`,
        tenantId,
        channel: "WHATSAPP",
        provider: "EVOLUTION",
        providerInstance: "LOCAL_FIXTURE",
        providerConversationRef: `contacto-ficticio-seed-${suffix}`,
        contactName: spec.contactName,
        messages: conversationMessages,
        firstContactAt: first.occurredAt,
        lastActivityAt: last.occurredAt,
        fixtureOnly: true,
      },
      attribution: attribution(spec, first.id, index),
      lead: {
        id: `lead-ficticio-${suffix}`,
        tenantId,
        conversationId: `conversation-ficticia-${suffix}`,
        contactName: spec.contactName,
        teamName: spec.teamName,
        productType: spec.productType,
        quantity: spec.quantity,
        sizeBreakdown: spec.sizes.map((size) => ({ ...size })),
        colors: [...spec.colors],
        personalization: [...spec.personalization],
        requestedDeliveryAt: spec.requestedDeliveryAt,
        confirmedInfo,
        missingInfo: [...spec.missingInfo],
        status: spec.stage === "PERDIDO" ? "PERDIDO" : "ACTIVO",
        createdAt: first.receivedAt,
      },
      opportunity: itemOpportunity,
      activity: [
        {
          type: "MESSAGE_RECEIVED",
          occurredAt: first.receivedAt,
          actorId: "actor-ficticio-seed",
          correlationId: `correlation-ficticia-seed-${suffix}`,
          evidenceMessageId: first.id,
          detail: "Conversación histórica ficticia incorporada a la demo local.",
        },
        {
          type: "OPPORTUNITY_CREATED",
          occurredAt: first.receivedAt,
          actorId: "actor-ficticio-seed",
          correlationId: `correlation-ficticia-seed-${suffix}`,
          evidenceMessageId: first.id,
          detail: "Lead y oportunidad ficticios creados por la semilla local.",
        },
        ...itemOpportunity.followUps.map((followUp) => ({
          type: "FOLLOW_UP_RECORDED" as const,
          occurredAt: followUp.occurredAt,
          actorId: followUp.actorId,
          correlationId: followUp.correlationId,
          evidenceMessageId: null,
          detail: followUp.note,
        })),
      ],
      fixtureVersion: COMMERCIAL_DEMO_FIXTURE_VERSION,
    };
  });
}
