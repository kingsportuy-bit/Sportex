const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const state = {
  config: null,
  localDemo: false,
  token: sessionStorage.getItem("sportex_access_token"),
  refreshToken: sessionStorage.getItem("sportex_refresh_token"),
  session: null,
  clients: [],
  orders: [],
  commercial: [],
  selectedCommercialId: null,
  mobileDetailOpen: false,
  orderAttempt: null,
  passwordForced: false,
};

class UiError extends Error {
  constructor(message, code = "ui_error") {
    super(message);
    this.code = code;
  }
}

const messages = {
  client_phone_conflict: "Ese WhatsApp ya está asociado a otro cliente.",
  payment_evidence_conflict: "Ese comprobante ya fue certificado.",
  payment_already_used: "La seña ya está vinculada a un pedido.",
  quoted_total_below_deposit: "El precio total no puede ser menor que la seña.",
  permission_denied: "Tu cuenta no tiene permiso para realizar esta acción.",
  tenant_membership_required: "Tu cuenta todavía no está vinculada a una empresa de SPORTEX.",
  authentication_unavailable: "El acceso está temporalmente fuera de servicio.",
  invalid_payload: "Revisá los datos ingresados.",
  fixture_only: "El modo local acepta solamente referencias ficticias.",
  commercial_version_conflict: "El lead cambió en otra acción. Recargamos su versión más reciente.",
  commercial_stage_transition_invalid: "Esa transición de etapa no está permitida por el Core.",
  commercial_demo_confirmation_required: "Confirmá la restauración de los datos ficticios.",
};

const localIdentity = {
  tenantId: "11111111-1111-4111-8111-111111111111",
  actorId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  capabilities: [
    "clients.create",
    "clients.read",
    "commercial.read",
    "commercial.replay",
    "commercial.manage",
    "payments.certify",
    "orders.create",
    "orders.read",
  ],
};

function friendlyError(error) {
  if (error instanceof UiError) return messages[error.code] ?? error.message;
  return "No se pudo completar la operación. Volvé a intentarlo.";
}

function money(cents, currency = "UYU") {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function shortDate(value) {
  const date = /^\d{4}-\d{2}-\d{2}$/u.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  return new Intl.DateTimeFormat("es-UY", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function shortDateTime(value) {
  return new Intl.DateTimeFormat("es-UY", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function initials(value) {
  return String(value || "SPORTEX")
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function toast(message, type = "ok") {
  const element = $("#toast");
  element.textContent = message;
  element.classList.toggle("is-error", type === "error");
  element.classList.add("is-visible");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => element.classList.remove("is-visible"), 3800);
}

function setButtonBusy(button, busy, busyLabel) {
  if (!button.dataset.label) button.dataset.label = button.textContent;
  button.disabled = busy;
  button.textContent = busy ? busyLabel : button.dataset.label;
}

async function jsonResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new UiError(payload.message || "La solicitud fue rechazada.", payload.error || "request_failed");
  }
  return payload;
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (state.localDemo) {
    headers.set("x-sportex-tenant-id", localIdentity.tenantId);
    headers.set("x-sportex-actor-id", localIdentity.actorId);
    headers.set("x-sportex-capabilities", localIdentity.capabilities.join(","));
  }
  if (state.token) headers.set("authorization", `Bearer ${state.token}`);
  if (options.body) headers.set("content-type", "application/json");
  const response = await fetch(path, { ...options, headers });
  if (response.status === 401) {
    clearSession();
    showLogin();
  }
  return jsonResponse(response);
}

async function auth(path, options = {}) {
  if (!state.config?.authUrl || !state.config?.authAnonKey) throw new UiError("El acceso no está configurado.");
  const headers = new Headers(options.headers || {});
  headers.set("apikey", state.config.authAnonKey);
  headers.set("content-type", "application/json");
  if (state.token) headers.set("authorization", `Bearer ${state.token}`);
  return jsonResponse(await fetch(`${state.config.authUrl}${path}`, { ...options, headers }));
}

function persistSession(payload) {
  state.token = payload.access_token;
  state.refreshToken = payload.refresh_token;
  sessionStorage.setItem("sportex_access_token", state.token);
  sessionStorage.setItem("sportex_refresh_token", state.refreshToken || "");
}

function clearSession() {
  state.token = null;
  state.refreshToken = null;
  state.session = null;
  state.clients = [];
  state.orders = [];
  state.commercial = [];
  state.selectedCommercialId = null;
  state.mobileDetailOpen = false;
  sessionStorage.removeItem("sportex_access_token");
  sessionStorage.removeItem("sportex_refresh_token");
}

function showLogin() {
  $("#app-view").hidden = true;
  $("#login-view").hidden = false;
  $("#login-password").value = "";
}

function showApp() {
  $("#login-view").hidden = true;
  $("#app-view").hidden = false;
}

async function loadSession() {
  const payload = await api("/v1/session");
  state.session = payload.data;
  $("#tenant-name").textContent = state.localDemo ? "Delta Sport · demo local" : state.session.tenantName;
  $("#account-email").textContent = state.localDemo ? "Operador ficticio" : state.session.email || "Cuenta";
  $("#account-initials").textContent = initials(state.session.email || state.session.tenantName);
  $("#account-button").hidden = state.localDemo;
  $("#logout-button").hidden = state.localDemo;
  if (state.session.passwordChangeRequired) openPasswordDialog(true);
}

async function loadData() {
  const requests = [api("/v1/clients"), api("/v1/orders")];
  if (state.localDemo) requests.push(api("/v1/commercial/workspace"));
  const [clients, orders, commercial] = await Promise.all(requests);
  state.clients = clients.data;
  state.orders = orders.data;
  state.commercial = commercial?.data ?? [];
  if (!state.commercial.some((item) => item.id === state.selectedCommercialId)) {
    state.selectedCommercialId = state.commercial[0]?.id ?? null;
  }
  renderClients();
  renderOrders();
  renderCommercial();
}

function cell(text, className = "") {
  const span = document.createElement("span");
  span.textContent = text;
  if (className) span.className = className;
  return span;
}

function renderOrders() {
  const list = $("#orders-list");
  list.replaceChildren();
  const clients = new Map(state.clients.map((client) => [client.id, client]));

  for (const order of [...state.orders].reverse()) {
    const client = clients.get(order.clientId);
    const row = document.createElement("article");
    row.className = "ledger-row";

    const orderCell = document.createElement("span");
    orderCell.className = "primary";
    orderCell.textContent = order.orderNumber;

    const teamCell = document.createElement("span");
    const team = document.createElement("b");
    team.textContent = order.teamName;
    const clientName = document.createElement("small");
    clientName.className = "secondary";
    clientName.textContent = client?.displayName || "Cliente";
    teamCell.append(team, clientName);

    const statusCell = document.createElement("span");
    const chip = document.createElement("i");
    chip.className = "status-chip";
    chip.textContent = "Ingreso pendiente";
    statusCell.append(chip);

    row.append(
      orderCell,
      teamCell,
      cell(money(order.quotedTotalCents, order.currency)),
      cell(money(order.depositCents, order.currency)),
      cell(money(order.balanceCents, order.currency), "primary"),
      statusCell,
      cell(shortDate(order.createdAt)),
    );
    list.append(row);
  }

  $("#orders-empty").hidden = state.orders.length > 0;
  $("#orders-count-nav").textContent = String(state.orders.length);
  $("#metric-orders").textContent = String(state.orders.length).padStart(2, "0");
  const quoted = state.orders.reduce((sum, order) => sum + order.quotedTotalCents, 0);
  const deposits = state.orders.reduce((sum, order) => sum + order.depositCents, 0);
  const balance = state.orders.reduce((sum, order) => sum + order.balanceCents, 0);
  $("#metric-quoted").textContent = money(quoted);
  $("#metric-deposits").textContent = money(deposits);
  $("#metric-balance").textContent = money(balance);
}

function renderClients() {
  const list = $("#clients-list");
  list.replaceChildren();

  for (const client of [...state.clients].reverse()) {
    const row = document.createElement("article");
    row.className = "ledger-row";
    row.append(
      cell(client.displayName, "primary"),
      cell(client.teamName || "—"),
      cell(client.primaryPhone || "—"),
      cell(shortDate(client.createdAt)),
    );
    list.append(row);
  }

  $("#clients-empty").hidden = state.clients.length > 0;
  $("#clients-count-nav").textContent = String(state.clients.length);
  fillClientSelect();
}

function element(tagName, className = "", text = "") {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

const commercialStages = [
  "NUEVO",
  "EN_CALIFICACION",
  "COTIZADO",
  "EN_SEGUIMIENTO",
  "PERDIDO",
  "SENA_VALIDADA",
];

const stageLabels = {
  NUEVO: "Nuevo",
  EN_CALIFICACION: "En calificación",
  COTIZADO: "Cotizado",
  EN_SEGUIMIENTO: "En seguimiento",
  PERDIDO: "Perdido",
  SENA_VALIDADA: "Seña validada",
};

function stageLabel(value) {
  return stageLabels[value] ?? value;
}

function productLabel(value) {
  if (value === "CAMISETAS") return "Camisetas";
  if (value === "EQUIPO_COMPLETO") return "Equipo completo";
  return "Producto por confirmar";
}

function normalizedSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function filteredCommercial() {
  const search = normalizedSearch($("#lead-search").value.trim());
  const stage = $("#stage-filter").value;
  const product = $("#product-filter").value;
  const attribution = $("#attribution-filter").value;
  return state.commercial.filter((item) => {
    const haystack = normalizedSearch([
      item.conversation.contactName,
      item.lead.teamName,
      item.opportunity.nextAction,
      item.attribution.adName,
    ].filter(Boolean).join(" "));
    return (!search || haystack.includes(search))
      && (!stage || item.opportunity.stage === stage)
      && (!product || item.lead.productType === product)
      && (!attribution || item.attribution.classification === attribution);
  });
}

function renderStageBoard() {
  const board = $("#stage-board");
  board.replaceChildren();
  const activeStage = $("#stage-filter").value;
  for (const [index, stage] of commercialStages.entries()) {
    const count = state.commercial.filter((item) => item.opportunity.stage === stage).length;
    const button = element("button", `stage-station${activeStage === stage ? " is-filtered" : ""}`);
    button.type = "button";
    button.dataset.stage = stage;
    button.setAttribute("aria-pressed", String(activeStage === stage));
    button.append(
      element("span", "stage-index", String(index + 1).padStart(2, "0")),
      element("strong", "", stageLabel(stage)),
      element("b", "", String(count).padStart(2, "0")),
    );
    button.addEventListener("click", () => {
      $("#stage-filter").value = $("#stage-filter").value === stage ? "" : stage;
      state.mobileDetailOpen = false;
      renderCommercial();
    });
    board.append(button);
  }
}

function leadResultEmpty(list) {
  const empty = element("div", "lead-list-empty");
  empty.append(
    element("span", "empty-number", "00"),
    element("strong", "", "No hay leads con estos filtros"),
    element("p", "", "Probá otra combinación o limpiá los filtros."),
  );
  const button = element("button", "button button--outline", "Limpiar filtros");
  button.type = "button";
  button.addEventListener("click", clearCommercialFilters);
  empty.append(button);
  list.append(empty);
}

function renderLeadList(items) {
  const list = $("#commercial-list");
  list.replaceChildren();
  $("#lead-result-count").textContent = `${items.length} ${items.length === 1 ? "resultado" : "resultados"}`;
  if (items.length === 0) {
    leadResultEmpty(list);
    return;
  }

  for (const item of items) {
    const selected = item.id === state.selectedCommercialId;
    const button = element("button", `lead-row${selected ? " is-selected" : ""}`);
    button.type = "button";
    button.dataset.stage = item.opportunity.stage;
    button.setAttribute("aria-pressed", String(selected));
    const top = element("span", "lead-row-top");
    const identity = element("span", "lead-row-identity");
    identity.append(
      element("strong", "", item.lead.teamName || "Equipo por confirmar"),
      element("small", "", item.conversation.contactName),
    );
    top.append(identity, element("span", "lead-stage", stageLabel(item.opportunity.stage)));
    const meta = element("span", "lead-row-meta");
    meta.append(
      element("span", "", `${productLabel(item.lead.productType)} · ${item.lead.quantity ?? "?"}`),
      element(
        "span",
        item.attribution.classification === "META_EXACTO" ? "origin-dot is-exact" : "origin-dot is-unknown",
        item.attribution.classification === "META_EXACTO" ? "Anuncio exacto" : "Desconocido",
      ),
    );
    const next = element("span", "lead-row-next");
    next.append(element("b", "", "PRÓXIMA"), element("span", "", item.opportunity.nextAction));
    button.append(top, meta, next);
    button.addEventListener("click", () => {
      state.selectedCommercialId = item.id;
      state.mobileDetailOpen = true;
      renderCommercial();
      $("#lead-detail").focus({ preventScroll: true });
    });
    list.append(button);
  }
}

function detailCard(code, title) {
  const card = element("section", "detail-card");
  const header = element("header", "detail-card-head");
  const text = element("div");
  text.append(element("span", "section-code", code), element("h3", "", title));
  header.append(text);
  card.append(header);
  return card;
}

function fact(label, value) {
  const node = element("div", "brief-fact");
  node.append(element("span", "", label), element("strong", "", value || "Por confirmar"));
  return node;
}

function renderBrief(item) {
  const card = detailCard("EXPEDIENTE / 01", "Información comercial");
  const grid = element("div", "brief-grid");
  grid.append(
    fact("Producto", productLabel(item.lead.productType)),
    fact("Cantidad", item.lead.quantity ? `${item.lead.quantity} prendas` : "Por confirmar"),
    fact("Talles", item.lead.sizeBreakdown.map((size) => `${size.size} × ${size.quantity}`).join(" · ") || "Por confirmar"),
    fact("Fecha solicitada", item.lead.requestedDeliveryAt ? shortDate(item.lead.requestedDeliveryAt) : "Por confirmar"),
    fact("Colores", item.lead.colors.join(" + ") || "Por confirmar"),
    fact("Personalización", item.lead.personalization.join(" · ") || "Por confirmar"),
  );
  if (item.opportunity.quote) {
    grid.append(fact("Cotización ficticia", `${money(item.opportunity.quote.totalCents)} · v${item.opportunity.quote.version}`));
  }
  if (item.opportunity.lossReason) grid.append(fact("Motivo de pérdida", item.opportunity.lossReason));
  card.append(grid);
  if (item.opportunity.depositValidation) {
    const warning = element("p", "safety-note");
    warning.append(element("strong", "", "SEÑA FICTICIA · "), document.createTextNode(item.opportunity.depositValidation.note));
    card.append(warning);
  }
  return card;
}

function renderQualification(item) {
  const card = detailCard("CALIFICACIÓN / 02", "Confirmado y faltante");
  const grid = element("div", "qualification-grid");
  const confirmed = element("div", "qualification-column is-confirmed");
  confirmed.append(element("h4", "", `Confirmado · ${item.lead.confirmedInfo.length}`));
  for (const entry of item.lead.confirmedInfo) {
    const row = element("div", "qualification-row");
    row.append(element("span", "", entry.label), element("strong", "", entry.value));
    confirmed.append(row);
  }
  const missing = element("div", "qualification-column is-missing");
  missing.append(element("h4", "", `Falta · ${item.lead.missingInfo.length}`));
  if (item.lead.missingInfo.length === 0) {
    missing.append(element("p", "qualification-complete", "Ficha comercial completa para esta etapa."));
  } else {
    const list = element("ul");
    for (const value of item.lead.missingInfo) list.append(element("li", "", value));
    missing.append(list);
  }
  grid.append(confirmed, missing);
  card.append(grid);
  return card;
}

function renderConversation(item) {
  const card = detailCard("CONVERSACIÓN / 03", "Hilo ordenado");
  const note = element("div", "read-only-banner", "Conversación ficticia · solo lectura · sin compositor de mensajes");
  const timeline = element("div", "conversation-timeline");
  for (const message of item.conversation.messages) {
    const row = element("article", `message-row ${message.direction === "DELTA" ? "is-delta" : "is-client"}`);
    row.append(
      element("span", "message-author", message.direction === "DELTA" ? "Delta · fixture" : `${item.conversation.contactName} · fixture`),
      element("p", "", message.text),
      element("time", "", shortDateTime(message.occurredAt)),
    );
    timeline.append(row);
  }
  card.append(note, timeline);
  return card;
}

function renderHistory(item) {
  const card = detailCard("TRAZABILIDAD / 04", "Actividad comercial");
  const timeline = element("div", "activity-timeline");
  const activity = [...item.activity].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  for (const entry of activity) {
    const row = element("div", "activity-row");
    row.append(
      element("span", "activity-node"),
      element("strong", "", entry.type.replaceAll("_", " ")),
      element("p", "", entry.detail),
      element("time", "", shortDateTime(entry.occurredAt)),
    );
    timeline.append(row);
  }
  card.append(timeline);
  return card;
}

function renderOrigin(item) {
  const card = detailCard("ORIGEN / EVIDENCIA", item.attribution.classification === "META_EXACTO" ? "Anuncio y creativo" : "Origen desconocido");
  if (item.attribution.classification === "DESCONOCIDO") {
    const unknown = element("div", "unknown-origin");
    unknown.append(
      element("strong", "", "DESCONOCIDO"),
      element("p", "", "No llegó evidencia publicitaria. SPORTEX no inventa campaña, anuncio ni creativo."),
    );
    card.append(unknown);
    return card;
  }

  const creative = element("div", "creative-preview");
  creative.style.setProperty("--creative-accent", item.attribution.creative?.accent || "#2767ff");
  creative.append(
    element("span", "creative-format", item.attribution.creative?.format || "ANUNCIO"),
    element("b", "", item.attribution.creative?.visualLabel || "CREATIVO FICTICIO"),
    element("strong", "", item.attribution.creative?.title || item.attribution.adName || "Anuncio ficticio"),
    element("p", "", item.attribution.creative?.body || "Sin descripción del creativo."),
  );
  const metadata = element("dl", "origin-metadata");
  for (const [label, value] of [
    ["Campaña", item.attribution.campaignName],
    ["Anuncio", item.attribution.adName],
    ["ID ficticio", item.attribution.adId],
    ["Evidencia", item.attribution.evidenceMessageId],
  ]) {
    metadata.append(element("dt", "", label), element("dd", "", value || "No informado"));
  }
  card.append(creative, metadata);
  return card;
}

function fieldLabel(text, control) {
  const label = element("label", "command-field");
  label.append(document.createTextNode(text), control);
  return label;
}

function renderCommands(item) {
  const wrapper = element("div", "command-stack");

  const stageCard = detailCard("ACCIÓN / ETAPA", "Cambiar etapa");
  const stageForm = element("form", "command-form");
  const stageSelect = element("select");
  stageSelect.id = "commercial-stage-input";
  for (const stage of commercialStages) {
    const option = element("option", "", stageLabel(stage));
    option.value = stage;
    option.selected = stage === item.opportunity.stage;
    option.disabled = stage !== item.opportunity.stage && !item.opportunity.allowedStageTransitions.includes(stage);
    stageSelect.append(option);
  }
  const stageButton = element("button", "button button--primary button--full", "Guardar etapa");
  stageButton.type = "submit";
  stageForm.append(
    fieldLabel("Etapa actual", stageSelect),
    element("p", "command-help", "Las transiciones habilitadas las decide el Core."),
    stageButton,
  );
  stageForm.addEventListener("submit", (event) => {
    event.preventDefault();
    void saveCommercialStage(item, stageSelect.value, stageButton);
  });
  stageCard.append(stageForm);

  const actionCard = detailCard("ACCIÓN / PRÓXIMO PASO", "Editar próxima acción");
  const actionForm = element("form", "command-form");
  const actionInput = element("textarea");
  actionInput.id = "commercial-next-action-input";
  actionInput.maxLength = 240;
  actionInput.required = true;
  actionInput.value = item.opportunity.nextAction;
  const dueInput = element("input");
  dueInput.type = "date";
  dueInput.value = item.opportunity.nextActionDueAt || "";
  const actionButton = element("button", "button button--primary button--full", "Guardar próxima acción");
  actionButton.type = "submit";
  actionForm.append(
    fieldLabel("Descripción", actionInput),
    fieldLabel("Fecha objetivo", dueInput),
    actionButton,
  );
  actionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!actionForm.reportValidity()) return;
    void saveCommercialNextAction(item, actionInput.value, dueInput.value || null, actionButton);
  });
  actionCard.append(actionForm);

  const followCard = detailCard("ACCIÓN / SEGUIMIENTO", "Registrar nota interna");
  const followForm = element("form", "command-form");
  const followInput = element("textarea");
  followInput.id = "commercial-followup-input";
  followInput.placeholder = "Qué ocurrió y qué conviene recordar";
  followInput.maxLength = 1000;
  followInput.required = true;
  const outcomeSelect = element("select");
  for (const [value, label] of [
    ["SIN_CAMBIOS", "Sin cambios"],
    ["AVANZO", "Avanzó"],
    ["SIN_RESPUESTA", "Sin respuesta"],
    ["NO_CONTINUA", "No continúa"],
  ]) {
    const option = element("option", "", label);
    option.value = value;
    outcomeSelect.append(option);
  }
  const followButton = element("button", "button button--signal button--full", "Registrar seguimiento");
  followButton.type = "submit";
  followForm.append(
    fieldLabel("Resultado", outcomeSelect),
    fieldLabel("Nota interna", followInput),
    element("p", "command-help", "Esto no envía mensajes ni activa automatizaciones."),
    followButton,
  );
  followForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!followForm.reportValidity()) return;
    void saveCommercialFollowUp(item, followInput.value, outcomeSelect.value, followButton);
  });
  followCard.append(followForm);

  wrapper.append(stageCard, actionCard, followCard);
  return wrapper;
}

function renderLeadDetail(item) {
  const detail = $("#lead-detail");
  detail.replaceChildren();
  detail.tabIndex = -1;
  if (!item) {
    const empty = element("div", "lead-detail-empty");
    empty.append(
      element("span", "empty-number", "—"),
      element("h2", "", "Elegí un lead"),
      element("p", "", "La ficha completa aparecerá en este panel."),
    );
    detail.append(empty);
    return;
  }

  const header = element("header", "lead-detail-head");
  const back = element("button", "mobile-back", "← Volver a leads");
  back.type = "button";
  back.addEventListener("click", () => {
    state.mobileDetailOpen = false;
    renderCommercial();
    $("#lead-master").focus({ preventScroll: true });
  });
  const identity = element("div", "lead-title");
  identity.append(
    element("span", "section-code", `LEAD ${item.id.replace("workspace-ficticio-", "#")}`),
    element("h2", "", item.lead.teamName || "Equipo por confirmar"),
    element("p", "", `${item.conversation.contactName} · ${productLabel(item.lead.productType)} · ${item.lead.quantity ?? "?"} prendas`),
  );
  const status = element("div", "lead-status-lockup");
  const stage = element("span", "detail-stage", stageLabel(item.opportunity.stage));
  stage.dataset.stage = item.opportunity.stage;
  status.append(
    stage,
    element("small", "", `VERSIÓN ${item.opportunity.version}`),
    element("strong", "", item.opportunity.nextAction),
    element("time", "", item.opportunity.nextActionDueAt ? `Objetivo ${shortDate(item.opportunity.nextActionDueAt)}` : "Sin fecha objetivo"),
  );
  header.append(back, identity, status);

  const body = element("div", "lead-detail-grid");
  const main = element("div", "detail-main");
  main.append(renderBrief(item), renderQualification(item), renderConversation(item), renderHistory(item));
  const side = element("aside", "detail-side");
  side.append(renderOrigin(item), renderCommands(item));
  body.append(main, side);
  detail.append(header, body);
}

function replaceCommercialItem(updated) {
  const index = state.commercial.findIndex((item) => item.id === updated.id);
  if (index >= 0) state.commercial[index] = updated;
  state.selectedCommercialId = updated.id;
}

async function runCommercialMutation(button, busyLabel, operation, successMessage) {
  setButtonBusy(button, true, busyLabel);
  try {
    const response = await operation();
    replaceCommercialItem(response.data);
    renderCommercial();
    toast(successMessage);
  } catch (error) {
    if (error instanceof UiError && error.code === "commercial_version_conflict") await loadData();
    toast(friendlyError(error), "error");
  } finally {
    setButtonBusy(button, false, "");
  }
}

async function saveCommercialStage(item, stage, button) {
  if (stage === item.opportunity.stage) {
    toast("La etapa ya está seleccionada.");
    return;
  }
  await runCommercialMutation(button, "Guardando…", () => api(
    `/v1/local/commercial/workspace/${encodeURIComponent(item.id)}/stage`,
    {
      method: "PATCH",
      body: JSON.stringify({
        stage,
        expectedVersion: item.opportunity.version,
        reason: stage === "SENA_VALIDADA"
          ? "Seña ficticia validada manualmente en la demo local"
          : "Cambio manual desde la demo CRM local",
      }),
    },
  ), `Etapa actualizada a ${stageLabel(stage)}.`);
}

async function saveCommercialNextAction(item, description, dueAt, button) {
  await runCommercialMutation(button, "Guardando…", () => api(
    `/v1/local/commercial/workspace/${encodeURIComponent(item.id)}/next-action`,
    {
      method: "PATCH",
      body: JSON.stringify({ description: description.trim(), dueAt, expectedVersion: item.opportunity.version }),
    },
  ), "Próxima acción guardada en el Core local.");
}

async function saveCommercialFollowUp(item, note, outcome, button) {
  await runCommercialMutation(button, "Registrando…", () => api(
    `/v1/local/commercial/workspace/${encodeURIComponent(item.id)}/follow-ups`,
    {
      method: "POST",
      body: JSON.stringify({ note: note.trim(), outcome, expectedVersion: item.opportunity.version }),
    },
  ), "Seguimiento interno registrado. No se envió ningún mensaje.");
}

function clearCommercialFilters() {
  $("#lead-search").value = "";
  $("#stage-filter").value = "";
  $("#product-filter").value = "";
  $("#attribution-filter").value = "";
  state.mobileDetailOpen = false;
  renderCommercial();
}

function renderCommercial() {
  const exactCount = state.commercial.filter((item) => item.attribution.classification === "META_EXACTO").length;
  const unknownCount = state.commercial.length - exactCount;
  const pendingCount = state.commercial.filter((item) => item.opportunity.nextActionStatus === "PENDIENTE").length;
  $("#commercial-count-nav").textContent = String(state.commercial.length);
  $("#metric-conversations").textContent = String(state.commercial.length).padStart(2, "0");
  $("#metric-exact").textContent = String(exactCount).padStart(2, "0");
  $("#metric-unknown").textContent = String(unknownCount).padStart(2, "0");
  $("#metric-actions").textContent = String(pendingCount).padStart(2, "0");
  $("#persistence-status").textContent = state.config?.localCommercialPersistenceEnabled ? "GUARDADO LOCAL" : "MEMORIA";

  renderStageBoard();
  const items = filteredCommercial();
  if (!items.some((item) => item.id === state.selectedCommercialId)) {
    state.selectedCommercialId = items[0]?.id ?? null;
  }
  renderLeadList(items);
  renderLeadDetail(items.find((item) => item.id === state.selectedCommercialId) ?? null);
  $(".crm-workspace").classList.toggle("is-detail-open", state.mobileDetailOpen && Boolean(state.selectedCommercialId));
}

function fillClientSelect() {
  const select = $("#order-client");
  const previous = select.value;
  select.replaceChildren();
  for (const client of state.clients) {
    const option = document.createElement("option");
    option.value = client.id;
    option.textContent = client.teamName ? `${client.displayName} — ${client.teamName}` : client.displayName;
    select.append(option);
  }
  if (state.clients.some((client) => client.id === previous)) select.value = previous;
  syncTeamFromClient();
}

function switchView(name) {
  $("#commercial-view").hidden = name !== "commercial";
  $("#orders-view").hidden = name !== "orders";
  $("#clients-view").hidden = name !== "clients";
  $("#local-demo-actions").hidden = !state.localDemo || name !== "commercial";
  $("#new-order-button").hidden = name === "commercial";
  $$(".nav-item").forEach((button) => button.classList.toggle("is-active", button.dataset.view === name));
}

function clientMode() {
  return $("input[name=clientMode]:checked").value;
}

function syncClientMode() {
  const isNew = clientMode() === "new";
  $("#existing-client-fields").hidden = isNew;
  $("#new-client-fields").hidden = !isNew;
  $("#new-client-name").required = isNew;
  $("#order-client").required = !isNew;
  if (!isNew) syncTeamFromClient();
}

function syncTeamFromClient() {
  if (clientMode() !== "existing") return;
  const client = state.clients.find((item) => item.id === $("#order-client").value);
  if (client?.teamName) $("#order-team").value = client.teamName;
}

function openOrderDialog() {
  state.orderAttempt = {
    clientKey: crypto.randomUUID(),
    paymentKey: crypto.randomUUID(),
    orderKey: crypto.randomUUID(),
    clientId: null,
    paymentId: null,
  };
  $("#order-form").reset();
  $("#order-error").textContent = "";
  fillClientSelect();
  const mustCreateClient = state.clients.length === 0;
  const mode = $(`input[name=clientMode][value=${mustCreateClient ? "new" : "existing"}]`);
  mode.checked = true;
  syncClientMode();
  $("#order-dialog").showModal();
}

async function createClientIfNeeded() {
  if (state.orderAttempt.clientId) return state.orderAttempt.clientId;
  if (clientMode() === "existing") {
    const id = $("#order-client").value;
    if (!id) throw new UiError("Elegí un cliente.");
    state.orderAttempt.clientId = id;
    return id;
  }

  const body = {
    displayName: $("#new-client-name").value.trim(),
    ...( $("#new-client-team").value.trim() ? { teamName: $("#new-client-team").value.trim() } : {} ),
    ...( $("#new-client-phone").value.trim() ? { primaryPhone: $("#new-client-phone").value.trim() } : {} ),
  };
  const response = await api("/v1/clients", {
    method: "POST",
    headers: { "idempotency-key": state.orderAttempt.clientKey },
    body: JSON.stringify(body),
  });
  state.orderAttempt.clientId = response.data.id;
  if (!$("#order-team").value.trim() && response.data.teamName) $("#order-team").value = response.data.teamName;
  return response.data.id;
}

async function certifyDeposit(clientId) {
  if (state.orderAttempt.paymentId) return state.orderAttempt.paymentId;
  const response = await api("/v1/payments/certify", {
    method: "POST",
    headers: { "idempotency-key": state.orderAttempt.paymentKey },
    body: JSON.stringify({
      clientId,
      evidenceReference: $("#deposit-reference").value.trim(),
      amountCents: Number($("#deposit-amount").value) * 100,
      currency: "UYU",
    }),
  });
  state.orderAttempt.paymentId = response.data.id;
  return response.data.id;
}

async function saveOrder() {
  const form = $("#order-form");
  if (!form.reportValidity()) return;
  const button = $("#save-order-button");
  $("#order-error").textContent = "";
  setButtonBusy(button, true, "Guardando…");

  try {
    const clientId = await createClientIfNeeded();
    const paymentId = await certifyDeposit(clientId);
    await api("/v1/orders/from-certified-payment", {
      method: "POST",
      headers: { "idempotency-key": state.orderAttempt.orderKey },
      body: JSON.stringify({
        clientId,
        certifiedPaymentId: paymentId,
        teamName: $("#order-team").value.trim(),
        quotedTotalCents: Number($("#order-total").value) * 100,
        currency: "UYU",
      }),
    });
    $("#order-dialog").close();
    await loadData();
    switchView("orders");
    toast("Pedido creado y seña certificada.");
  } catch (error) {
    $("#order-error").textContent = friendlyError(error);
  } finally {
    setButtonBusy(button, false, "");
  }
}

function commercialFixture(kind) {
  const suffix = `${kind}-${crypto.randomUUID()}`;
  const exact = kind === "exact";
  return {
    event: "messages.upsert",
    instance: "LOCAL_FIXTURE",
    data: {
      key: {
        id: `msg-ficticio-${suffix}`,
        remoteJid: `contacto-ficticio-${suffix}`,
        fromMe: false,
      },
      pushName: exact ? "Martina · caso ficticio" : "Diego · caso ficticio",
      messageTimestamp: new Date().toISOString(),
      message: {
        conversation: exact
          ? "Hola, vi el anuncio de camisetas y quiero consultar para mi equipo."
          : "Buenas, quisiera consultar por indumentaria para un equipo.",
      },
      ...(exact ? {
        contextInfo: {
          externalAdReply: {
            sourceId: `ad-ficticio-${suffix}`,
            sourceUrl: `https://example.invalid/anuncio/${suffix}`,
            ctwaClid: `ctwa-ficticio-${suffix}`,
            ref: `ref-ficticia-${suffix}`,
          },
        },
      } : {}),
    },
  };
}

async function replayCommercialFixture(kind, button) {
  if (!state.localDemo) return;
  const payload = commercialFixture(kind);
  setButtonBusy(button, true, "Procesando…");
  try {
    await api("/v1/local/evolution-replays", {
      method: "POST",
      headers: { "idempotency-key": `replay-${payload.data.key.id}` },
      body: JSON.stringify(payload),
    });
    await loadData();
    switchView("commercial");
    toast(kind === "exact"
      ? "Caso ficticio cargado con atribución exacta."
      : "Caso ficticio cargado como origen desconocido.");
  } catch (error) {
    toast(friendlyError(error), "error");
  } finally {
    setButtonBusy(button, false, "");
  }
}

function openResetDemoDialog() {
  $("#reset-confirmation").checked = false;
  $("#confirm-reset-button").disabled = true;
  $("#reset-error").textContent = "";
  $("#reset-demo-dialog").showModal();
}

async function resetCommercialDemo() {
  if (!$("#reset-confirmation").checked) return;
  const button = $("#confirm-reset-button");
  setButtonBusy(button, true, "Restaurando…");
  $("#reset-error").textContent = "";
  try {
    await api("/v1/local/commercial-demo/reset", {
      method: "POST",
      body: JSON.stringify({ confirmation: "RESTAURAR_DATOS_FICTICIOS" }),
    });
    state.selectedCommercialId = null;
    state.mobileDetailOpen = false;
    clearCommercialFilters();
    await loadData();
    $("#reset-demo-dialog").close();
    toast("Se restauraron los 18 leads ficticios iniciales.");
  } catch (error) {
    $("#reset-error").textContent = friendlyError(error);
  } finally {
    setButtonBusy(button, false, "");
    button.disabled = !$("#reset-confirmation").checked;
  }
}

function openPasswordDialog(forced = false) {
  state.passwordForced = forced;
  $("#password-form").reset();
  $("#password-error").textContent = "";
  $("#password-cancel").hidden = forced;
  $("#password-message").textContent = forced
    ? "Por seguridad, cambiá la contraseña temporal antes de continuar."
    : "Elegí una contraseña nueva de al menos 10 caracteres.";
  $("#password-dialog").showModal();
}

async function savePassword() {
  const password = $("#new-password").value;
  const repeated = $("#repeat-password").value;
  if (password.length < 10) {
    $("#password-error").textContent = "La contraseña debe tener al menos 10 caracteres.";
    return;
  }
  if (password !== repeated) {
    $("#password-error").textContent = "Las contraseñas no coinciden.";
    return;
  }
  const button = $("#password-save");
  setButtonBusy(button, true, "Guardando…");
  try {
    await auth("/user", {
      method: "PUT",
      body: JSON.stringify({ password, data: { password_change_required: false } }),
    });
    state.passwordForced = false;
    if (state.session) state.session.passwordChangeRequired = false;
    $("#password-dialog").close();
    toast("Contraseña actualizada.");
  } catch (error) {
    $("#password-error").textContent = friendlyError(error);
  } finally {
    setButtonBusy(button, false, "");
  }
}

async function logout() {
  try {
    if (state.token) await auth("/logout", { method: "POST", body: "{}" });
  } catch {
    // La sesión local se cierra aunque Supabase no responda.
  }
  clearSession();
  showLogin();
}

async function bootstrapAuthenticated() {
  await loadSession();
  await loadData();
  showApp();
}

async function initialize() {
  try {
    const response = await fetch("/v1/public-config");
    state.config = (await jsonResponse(response)).data;
    $("#release-label").textContent = `${state.config.environment} · ${state.config.release}`;
  } catch (error) {
    $("#login-error").textContent = friendlyError(error);
    return;
  }

  if (state.config.localCommercialReplayEnabled) {
    state.localDemo = true;
    state.token = null;
    state.refreshToken = null;
    $("#release-label").textContent = state.config.localCommercialPersistenceEnabled
      ? "LOCAL · PERSISTENTE"
      : "LOCAL · MEMORIA";
    try {
      await bootstrapAuthenticated();
      switchView("commercial");
    } catch (error) {
      $("#login-error").textContent = friendlyError(error);
    }
    return;
  }

  if (!state.token) {
    showLogin();
    return;
  }
  try {
    await bootstrapAuthenticated();
  } catch {
    clearSession();
    showLogin();
  }
}

$("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector("button[type=submit]");
  $("#login-error").textContent = "";
  setButtonBusy(button, true, "Verificando…");
  try {
    const response = await auth("/token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({
        email: $("#login-email").value.trim(),
        password: $("#login-password").value,
      }),
    });
    persistSession(response);
    await bootstrapAuthenticated();
  } catch (error) {
    clearSession();
    $("#login-error").textContent = error.code === "request_failed"
      ? "Correo o contraseña incorrectos."
      : friendlyError(error);
  } finally {
    setButtonBusy(button, false, "");
  }
});

$$('[data-open-order], #new-order-button').forEach((button) => button.addEventListener("click", openOrderDialog));
[$("#lead-search"), $("#stage-filter"), $("#product-filter"), $("#attribution-filter")]
  .forEach((control) => control.addEventListener("input", () => {
    state.mobileDetailOpen = false;
    renderCommercial();
  }));
$("#clear-filters").addEventListener("click", clearCommercialFilters);
$("#reset-demo-button").addEventListener("click", openResetDemoDialog);
$("#reset-confirmation").addEventListener("change", (event) => {
  $("#confirm-reset-button").disabled = !event.currentTarget.checked;
});
$("#confirm-reset-button").addEventListener("click", resetCommercialDemo);
$$(".nav-item").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.view)));
$$("input[name=clientMode]").forEach((input) => input.addEventListener("change", syncClientMode));
$("#order-client").addEventListener("change", syncTeamFromClient);
$("#save-order-button").addEventListener("click", saveOrder);
$("#logout-button").addEventListener("click", logout);
$("#account-button").addEventListener("click", () => openPasswordDialog(false));
$("#password-save").addEventListener("click", savePassword);
$("#password-dialog").addEventListener("cancel", (event) => {
  if (state.passwordForced) event.preventDefault();
});
$("#password-dialog").addEventListener("close", () => {
  if (state.passwordForced) window.setTimeout(() => $("#password-dialog").showModal(), 0);
});

void initialize();
