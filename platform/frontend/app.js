const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const THEME_STORAGE_KEY = "sportex_theme";
const VIEW_STORAGE_KEY = "sportex_last_view";
const OPERATIONAL_VIEWS = new Set(["whatsapp", "leads", "orders", "clients"]);

function storedOperationalView() {
  try {
    const view = sessionStorage.getItem(VIEW_STORAGE_KEY);
    if (OPERATIONAL_VIEWS.has(view)) return view;
  } catch {
    // La app abre en WhatsApp si el navegador no permite conservar la sesión.
  }
  return "whatsapp";
}

function persistOperationalView(view) {
  try {
    sessionStorage.setItem(VIEW_STORAGE_KEY, view);
  } catch {
    // La navegación funciona aunque el navegador bloquee el almacenamiento de sesión.
  }
}

function storedTheme() {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    if (value === "dark" || value === "light") return value;
  } catch {
    // La interfaz sigue funcionando aunque el navegador bloquee el almacenamiento local.
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  const dark = theme === "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  const toggle = $("#theme-toggle");
  if (!toggle) return;
  toggle.setAttribute("aria-pressed", String(dark));
  toggle.setAttribute("aria-label", dark ? "Activar modo claro" : "Activar modo oscuro");
  $("#theme-toggle-icon").textContent = dark ? "\u2600" : "\u263e";
  $("#theme-toggle-label").textContent = dark ? "Claro" : "Oscuro";
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // La preferencia se conserva durante esta vista aunque no pueda persistirse.
  }
  applyTheme(next);
}

applyTheme(storedTheme());

const state = {
  config: null,
  localDemo: false,
  localWhatsappSimulation: false,
  commercialWorkspace: false,
  realWhatsappOutbound: false,
  token: sessionStorage.getItem("sportex_access_token"),
  refreshToken: sessionStorage.getItem("sportex_refresh_token"),
  session: null,
  clients: [],
  orders: [],
  ordersView: "board",
  commercial: [],
  commercialNextCursor: null,
  commercialPageLoading: false,
  stageDefinitions: { lead: [], order: [] },
  selectedCommercialId: null,
  mobileDetailOpen: false,
  mobileWhatsappDetailOpen: false,
  whatsappDetailsOpen: false,
  mobileWhatsappTab: "chat",
  whatsappStage: "ALL",
  whatsappUnreadOnly: false,
  pendingWhatsappImage: null,
  currentView: storedOperationalView(),
  todayFilter: "all",
  mobileLeadTab: "chat",
  draftResource: null,
  orderAttempt: null,
  passwordForced: false,
  liveRefreshTimer: null,
  liveRefreshBusy: false,
  liveStreamAbort: null,
  liveStreamReconnectTimer: null,
  liveStreamDelay: 1_000,
  commercialSnapshot: "",
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
  commercial_deposit_not_validated: "La seña debe estar validada antes de crear el pedido.",
  commercial_order_data_incomplete: "Faltan la cotización o el nombre del equipo para crear el pedido.",
  commercial_conversion_conflict: "Esta oportunidad ya fue convertida con otros datos de pago.",
  commercial_order_required: "Primero hay que crear y vincular el pedido.",
  order_version_conflict: "El pedido cambió en otra acción. Recargamos su estado más reciente.",
  order_stage_transition_invalid: "Ese movimiento de pedido no está permitido desde su etapa actual.",
  order_stage_not_configured: "Esa etapa ya no está configurada para los pedidos.",
  commercial_stage_not_configured: "Esa etapa ya no está configurada para los leads.",
  stage_definition_in_use: "Antes mové las tarjetas de esta columna a otra etapa.",
  stage_definition_required: "Tiene que quedar al menos una columna activa.",
  stage_definition_reassignment_required: "Elegí a qué columna pasar las tarjetas antes de eliminarla.",
  production_release_confirmation_required: "Confirmá la entrega antes de continuar.",
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
    "production.release",
  ],
};

const orderStatusLabels = {
  intake_pending: "Ingreso",
  design_pending: "Boceto",
  production_ready: "Listo para producción",
  in_production: "En producción",
  completed: "Finalizado",
};

function orderStageLabel(value) {
  return state.stageDefinitions.order.find((stage) => stage.id === value)?.name ?? orderStatusLabels[value] ?? value;
}

function configuredOrderStages() {
  return state.stageDefinitions.order.length ? state.stageDefinitions.order.map((stage) => stage.id) : Object.keys(orderStatusLabels);
}

function canMoveOrderTo(order, status) {
  return status === order.status
    || (orderTransitions[order.status] ?? []).includes(status)
    || (configuredOrderStages().includes(status) && !Object.hasOwn(orderStatusLabels, status));
}

const orderTransitions = {
  intake_pending: ["design_pending"],
  design_pending: ["intake_pending", "production_ready"],
  production_ready: ["design_pending", "in_production"],
  in_production: ["production_ready", "completed"],
  completed: [],
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

function todayLabel() {
  const value = new Intl.DateTimeFormat("es-UY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Montevideo",
  }).format(new Date());
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function commercialSnapshot(items) {
  return JSON.stringify(items.map((item) => [
    item.id,
    item.opportunity.version,
    item.conversation.lastActivityAt,
    item.conversation.unreadCount || 0,
    item.conversation.messages.at(-1)?.providerMessageId || "",
    item.timeline?.at(-1)?.id || "",
  ]));
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
  stopLiveRefresh();
  state.token = null;
  state.refreshToken = null;
  state.session = null;
  state.clients = [];
  state.orders = [];
  state.commercial = [];
  state.selectedCommercialId = null;
  state.mobileDetailOpen = false;
  state.mobileWhatsappDetailOpen = false;
  sessionStorage.removeItem("sportex_access_token");
  sessionStorage.removeItem("sportex_refresh_token");
  sessionStorage.removeItem(VIEW_STORAGE_KEY);
}

function showLogin() {
  delete document.documentElement.dataset.authPending;
  $("#app-view").hidden = true;
  $("#login-view").hidden = false;
  $("#login-password").value = "";
}

function showApp() {
  delete document.documentElement.dataset.authPending;
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
  $("#today-date").textContent = todayLabel();
}

async function refreshAccessToken() {
  if (!state.refreshToken) throw new UiError("La sesión venció.", "authentication_unavailable");
  try {
    const response = await auth("/token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: state.refreshToken }),
    });
    persistSession(response);
  } catch {
    throw new UiError("La sesión venció. Volvé a ingresar.", "authentication_required");
  }
}

function optimisticWhatsappMessage(item, text, pendingImage) {
  const now = new Date().toISOString();
  const message = {
    id: `pending-${crypto.randomUUID()}`,
    provider: "SPORTEX",
    providerMessageId: `pending-${crypto.randomUUID()}`,
    direction: "DELTA",
    occurredAt: now,
    receivedAt: now,
    contentType: pendingImage ? "IMAGE" : "TEXT",
    text,
    media: pendingImage ? { assetId: "pending", mimeType: pendingImage.mimeType, fileName: pendingImage.fileName, sizeBytes: 0, width: null, height: null } : null,
    evidenceRef: "pending",
    sourceKind: "MANUAL",
    fixtureOnly: false,
    pending: true,
  };
  const optimistic = {
    ...item,
    conversation: { ...item.conversation, messages: [...item.conversation.messages, message], lastActivityAt: now },
  };
  replaceCommercialItem(optimistic);
  return optimistic;
}

async function authenticatedFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (state.localDemo) {
    headers.set("x-sportex-tenant-id", localIdentity.tenantId);
    headers.set("x-sportex-actor-id", localIdentity.actorId);
    headers.set("x-sportex-capabilities", localIdentity.capabilities.join(","));
  }
  if (state.token) headers.set("authorization", `Bearer ${state.token}`);
  return fetch(path, { ...options, headers });
}

function appendMessageContent(row, message, item = null) {
  if (message.contentType !== "IMAGE" || !message.media) {
    row.append(element("p", "", message.text));
    return;
  }
  if (message.pending) {
    row.append(element("p", "", "Enviando imagen…"));
    return;
  }
  const figure = element("figure", "whatsapp-image-message is-loading");
  const image = element("img");
  image.alt = message.text || `Imagen: ${message.media.fileName}`;
  image.loading = "lazy";
  image.decoding = "async";
  if (message.media.width && message.media.height) figure.style.aspectRatio = `${message.media.width} / ${message.media.height}`;
  const caption = message.text ? element("figcaption", "", message.text) : null;
  figure.append(image, element("span", "whatsapp-image-loading", "Cargando imagen…"));
  if (caption) figure.append(caption);
  const orderId = item?.opportunity.coreConversion?.orderId;
  if (orderId && message.media.assetId !== "pending") {
    const markSketch = element("button", "button button--quiet whatsapp-mark-sketch", "Usar como boceto vigente");
    markSketch.type = "button";
    markSketch.addEventListener("click", (event) => {
      event.stopPropagation();
      void markCurrentSketch(orderId, message, markSketch);
    });
    figure.append(markSketch);
  }
  row.append(figure);
  void authenticatedFetch(`/v1/commercial/messages/${encodeURIComponent(message.id)}/media`)
    .then(async (response) => {
      if (!response.ok) throw new Error("media_load_failed");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      image.addEventListener("load", () => {
        figure.classList.remove("is-loading");
        figure.querySelector(".whatsapp-image-loading")?.remove();
      }, { once: true });
      image.src = objectUrl;
      figure.tabIndex = 0;
      figure.setAttribute("role", "button");
      figure.setAttribute("aria-label", `Abrir imagen ${message.media.fileName}`);
      const open = () => openWhatsAppImageViewer(blob, message.media.fileName, image.alt);
      figure.addEventListener("click", open);
      figure.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); }
      });
    })
    .catch(() => { figure.querySelector(".whatsapp-image-loading").textContent = "No se pudo mostrar la imagen"; });
}

async function markCurrentSketch(orderId, message, button) {
  if (!message.media) return;
  setButtonBusy(button, true, "Guardando…");
  try {
    let order = state.orders.find((candidate) => candidate.id === orderId);
    if (!order) {
      const response = await api("/v1/orders");
      state.orders = response.data;
      order = state.orders.find((candidate) => candidate.id === orderId);
    }
    if (!order) throw new UiError("El pedido vinculado ya no está disponible.", "order_not_found");
    const details = {
      ...order.details,
      currentSketch: {
        messageId: message.id,
        assetId: message.media.assetId,
        mimeType: message.media.mimeType,
        fileName: message.media.fileName,
        width: message.media.width,
        height: message.media.height,
      },
    };
    const response = await api(`/v1/orders/${encodeURIComponent(order.id)}/details`, {
      method: "PATCH",
      headers: { "idempotency-key": crypto.randomUUID() },
      body: JSON.stringify({ expectedVersion: order.version, details }),
    });
    const index = state.orders.findIndex((candidate) => candidate.id === order.id);
    if (index >= 0) state.orders[index] = response.data;
    toast("Boceto vigente guardado en el pedido.");
  } catch (error) {
    toast(friendlyError(error), "error");
  } finally {
    setButtonBusy(button, false, "");
  }
}

async function openCurrentSketch(sketch) {
  try {
    const response = await authenticatedFetch(`/v1/commercial/messages/${encodeURIComponent(sketch.messageId)}/media`);
    if (!response.ok) throw new Error("sketch_media_load_failed");
    openWhatsAppImageViewer(await response.blob(), sketch.fileName, `Boceto vigente: ${sketch.fileName}`);
  } catch {
    toast("No se pudo abrir el boceto guardado.", "error");
  }
}

function openWhatsAppImageViewer(blob, fileName, alt) {
  const dialog = element("dialog", "whatsapp-image-viewer");
  const objectUrl = URL.createObjectURL(blob);
  const close = element("button", "icon-button", "×");
  close.type = "button";
  close.setAttribute("aria-label", "Cerrar imagen");
  close.addEventListener("click", () => dialog.close());
  const image = element("img");
  image.src = objectUrl;
  image.alt = alt;
  const download = element("a", "button button--primary", "Descargar");
  download.href = objectUrl;
  download.download = fileName.replace(/[^a-zA-Z0-9._-]/gu, "-") || "imagen-whatsapp";
  const body = element("div", "whatsapp-image-viewer-body");
  body.append(close, image, download);
  dialog.append(body);
  dialog.addEventListener("close", () => { URL.revokeObjectURL(objectUrl); dialog.remove(); }, { once: true });
  document.body.append(dialog);
  dialog.showModal();
}

async function loadData({ activeOnly = false } = {}) {
  const wantsCommercial = state.commercialWorkspace && (!activeOnly || state.currentView === "whatsapp" || state.currentView === "leads");
  const wantsOrders = !activeOnly || state.currentView === "orders";
  const wantsClients = !activeOnly || state.currentView === "clients" || wantsOrders;
  const requests = [];
  if (wantsClients) requests.push(["clients", api("/v1/clients")]);
  if (wantsOrders) requests.push(["orders", api("/v1/orders")]);
  if (!activeOnly || state.currentView === "whatsapp" || state.currentView === "leads") requests.push(["leadStages", api("/v1/stage-definitions/lead")]);
  if (wantsOrders) requests.push(["orderStages", api("/v1/stage-definitions/order")]);
  if (wantsCommercial) requests.push(["commercial", api("/v1/commercial/conversations?limit=25")]);
  const responses = await Promise.all(requests.map(async ([key, request]) => [key, await request]));
  const loaded = Object.fromEntries(responses);
  if (loaded.clients) state.clients = loaded.clients.data;
  if (loaded.orders) state.orders = loaded.orders.data;
  if (loaded.leadStages) state.stageDefinitions.lead = loaded.leadStages.data ?? [];
  if (loaded.orderStages) state.stageDefinitions.order = loaded.orderStages.data ?? [];
  if (loaded.commercial) {
    state.commercial = loaded.commercial.data ?? [];
    state.commercialSnapshot = commercialSnapshot(state.commercial);
    state.commercialNextCursor = loaded.commercial.meta?.nextCursor ?? null;
  }
  // La bandeja de WhatsApp empieza en reposo: el operador elige qué conversación abrir.
  if (state.selectedCommercialId && !state.commercial.some((item) => item.id === state.selectedCommercialId)) {
    state.selectedCommercialId = null;
  }
  renderClients();
  renderOrders();
  renderWhatsApp();
  renderCommercial();
}

async function refreshWhatsAppFromDatabase() {
  if (!state.selectedCommercialId) return;
  await refreshWhatsAppItem(state.selectedCommercialId);
}

async function refreshWhatsAppItem(itemId) {
  if (state.liveRefreshBusy || !state.commercialWorkspace || document.hidden) return;
  state.liveRefreshBusy = true;
  try {
    const response = await api(`/v1/commercial/workspace/${encodeURIComponent(itemId)}`);
    const updated = response.data;
    const current = state.commercial.find((item) => item.id === itemId);
    if (current && current.opportunity.version === updated.opportunity.version
      && current.conversation.messages.at(-1)?.providerMessageId === updated.conversation.messages.at(-1)?.providerMessageId) return;
    const composer = $(".whatsapp-composer-input");
    const draft = composer?.value ?? "";
    const restoreFocus = document.activeElement === composer;
    const conversation = $(".whatsapp-chat-pane .lead-conversation");
    const distanceFromBottom = conversation
      ? conversation.scrollHeight - conversation.scrollTop - conversation.clientHeight
      : 0;

    const index = state.commercial.findIndex((item) => item.id === itemId);
    if (index >= 0) state.commercial[index] = updated;
    else state.commercial.unshift(updated);
    state.commercialSnapshot = commercialSnapshot(state.commercial);
    renderWhatsApp();
    renderToday();

    const refreshedComposer = $(".whatsapp-composer-input");
    if (refreshedComposer && state.selectedCommercialId === itemId) {
      refreshedComposer.value = draft;
      if (restoreFocus) refreshedComposer.focus({ preventScroll: true });
    }
    const refreshedConversation = $(".whatsapp-chat-pane .lead-conversation");
    if (refreshedConversation && distanceFromBottom < 80) {
      refreshedConversation.scrollTop = refreshedConversation.scrollHeight;
    }
  } catch (error) {
    if (error?.code !== "request_failed") console.warn("SPORTEX live refresh paused", error);
  } finally {
    state.liveRefreshBusy = false;
  }
}

async function loadNextCommercialPage() {
  if (state.commercialPageLoading || !state.commercialNextCursor) return;
  state.commercialPageLoading = true;
  try {
    const response = await api(`/v1/commercial/conversations?limit=25&cursor=${encodeURIComponent(state.commercialNextCursor)}`);
    const known = new Set(state.commercial.map((item) => item.id));
    state.commercial.push(...(response.data ?? []).filter((item) => !known.has(item.id)));
    state.commercialNextCursor = response.meta?.nextCursor ?? null;
    state.commercialSnapshot = commercialSnapshot(state.commercial);
    renderWhatsApp();
  } catch (error) {
    console.warn("SPORTEX conversation page failed", error);
  } finally {
    state.commercialPageLoading = false;
  }
}

async function openWhatsAppConversation(itemId) {
  const item = state.commercial.find((candidate) => candidate.id === itemId);
  if (!item) return;
  state.selectedCommercialId = itemId;
  state.mobileWhatsappDetailOpen = true;
  state.mobileWhatsappTab = "chat";
  state.draftResource = null;
  renderWhatsApp();
  try {
    const response = await api(`/v1/commercial/workspace/${encodeURIComponent(itemId)}`);
    replaceCommercialItem(response.data);
    renderWhatsAppDetailPreservingChatState(response.data, true);
  } catch (error) {
    toast(friendlyError(error), "error");
  }
}

function startLiveRefresh() {
  stopLiveRefresh();
  if (state.localDemo || !state.commercialWorkspace || state.currentView !== "whatsapp" || document.hidden) return;
  const controller = new AbortController();
  state.liveStreamAbort = controller;
  void consumeCommercialStream(controller.signal);
}

function stopLiveRefresh() {
  if (state.liveRefreshTimer) window.clearInterval(state.liveRefreshTimer);
  state.liveRefreshTimer = null;
  if (state.liveStreamReconnectTimer) window.clearTimeout(state.liveStreamReconnectTimer);
  state.liveStreamReconnectTimer = null;
  state.liveStreamAbort?.abort();
  state.liveStreamAbort = null;
}

async function consumeCommercialStream(signal) {
  try {
    const response = await authenticatedFetch("/v1/commercial/stream", {
      headers: { accept: "text/event-stream" }, signal,
    });
    if (!response.ok || !response.body) throw new Error("stream_unavailable");
    state.liveStreamDelay = 1_000;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (!signal.aborted) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";
      for (const event of events) {
        const kind = /^event: ([^\n]+)/mu.exec(event)?.[1];
        const raw = /^data: (.+)$/mu.exec(event)?.[1];
        if (kind !== "conversation.changed" || !raw) continue;
        const change = JSON.parse(raw);
        if (typeof change.workspaceItemId === "string") void refreshWhatsAppItem(change.workspaceItemId);
      }
    }
  } catch (error) {
    if (!signal.aborted) console.warn("SPORTEX stream reconnecting", error);
  }
  if (!signal.aborted && state.currentView === "whatsapp" && !document.hidden) {
    const delay = state.liveStreamDelay;
    state.liveStreamDelay = Math.min(state.liveStreamDelay * 2, 30_000);
    state.liveStreamReconnectTimer = window.setTimeout(() => startLiveRefresh(), delay);
  }
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
  list.className = state.ordersView === "board" ? "orders-board" : "orders-sheet";
  const clients = new Map(state.clients.map((client) => [client.id, client]));

  $$("[data-orders-view]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.ordersView === state.ordersView));
  });

  if (state.ordersView === "sheet") {
    const table = document.createElement("table");
    table.innerHTML = "<thead><tr><th>Pedido</th><th>Equipo</th><th>Cliente</th><th>Producto</th><th>Etapa</th><th>Total</th><th></th></tr></thead>";
    const body = document.createElement("tbody");
    for (const order of state.orders) {
      const client = clients.get(order.clientId);
      const row = document.createElement("tr");
      row.append(
        cell(order.orderNumber), cell(order.teamName), cell(client?.displayName || "Sin cliente"),
        cell(order.details?.product || "Por definir"), cell(orderStageLabel(order.status)),
        cell(money(order.quotedTotalCents, order.currency)),
      );
      const actions = document.createElement("td");
      const edit = element("button", "button button--quiet", "Abrir");
      edit.type = "button";
      edit.addEventListener("click", () => openOrderDetails(order));
      actions.append(edit);
      row.append(actions);
      body.append(row);
    }
    table.append(body);
    list.append(table);
  } else {

  const orderStages = configuredOrderStages();
  for (const status of orderStages) {
    const column = element("section", "order-column");
    const columnOrders = state.orders.filter((order) => order.status === status);
    const head = element("header", "order-column-head");
    head.append(element("span", "", orderStageLabel(status)), element("strong", "", String(columnOrders.length)));
    const cards = element("div", "order-card-stack");
    cards.addEventListener("dragover", (event) => event.preventDefault());
    cards.addEventListener("drop", (event) => {
      event.preventDefault();
      const id = event.dataTransfer?.getData("text/plain");
      const order = state.orders.find((candidate) => candidate.id === id);
      if (!order || !canMoveOrderTo(order, status)) return;
      void moveOrderStage(order, status, null);
    });
    for (const order of columnOrders) {
      const client = clients.get(order.clientId);
      const card = element("article", "order-card");
      card.dataset.status = order.status;
      card.draggable = true;
      card.addEventListener("dragstart", (event) => event.dataTransfer?.setData("text/plain", order.id));
      card.append(
        element("span", "order-card-number", order.orderNumber),
        element("strong", "", order.teamName),
        element("small", "", client?.displayName || "Cliente por confirmar"),
        element("span", "order-card-money", money(order.quotedTotalCents, order.currency)),
      );
      const actions = element("div", "order-card-actions");
      const detailsButton = element("button", "button button--quiet", "Editar datos");
      detailsButton.type = "button";
      detailsButton.addEventListener("click", () => openOrderDetails(order));
      actions.append(detailsButton);
      for (const next of configuredOrderStages().filter((status) => status !== order.status && canMoveOrderTo(order, status))) {
        const action = element("button", "button button--quiet", `Mover a ${orderStageLabel(next)}`);
        action.type = "button";
        action.addEventListener("click", () => void moveOrderStage(order, next, action));
        actions.append(action);
      }
      if (actions.childElementCount) card.append(actions);
      cards.append(card);
    }
    column.append(head, cards);
    list.append(column);
  }
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

  const candidates = $("#order-candidates");
  if (candidates) {
    candidates.replaceChildren();
    const pending = state.commercial.filter((item) => item.opportunity.stage === "SENA_VALIDADA" && !item.opportunity.coreConversion);
    for (const item of pending) {
      const row = element("article", "candidate-row");
      const text = element("div");
      text.append(
        element("strong", "", item.lead.teamName),
        element("span", "", `${item.conversation.contactName} · ${state.localDemo ? "seña de ejemplo validada" : "seña validada"}`),
        element("small", "", "Todavía no existe un Pedido vinculado."),
      );
      const button = element("button", "button button--quiet", "Revisar lead");
      button.type = "button";
      button.addEventListener("click", () => {
        state.selectedCommercialId = item.id;
        switchView("leads");
        renderCommercial();
      });
      row.append(text, button);
      candidates.append(row);
    }
  }
}

async function moveOrderStage(order, status, button) {
  if (button) setButtonBusy(button, true, "Guardando…");
  try {
    const response = await api(`/v1/orders/${encodeURIComponent(order.id)}/stage`, {
      method: "PATCH",
      headers: { "idempotency-key": crypto.randomUUID() },
      body: JSON.stringify({ status, expectedVersion: order.version, reason: "Movimiento desde el tablero de pedidos" }),
    });
    const index = state.orders.findIndex((candidate) => candidate.id === response.data.id);
    if (index >= 0) state.orders[index] = response.data;
    renderOrders();
    toast(`Pedido movido a ${orderStageLabel(status)}.`);
  } catch (error) {
    if (error instanceof UiError && error.code === "order_version_conflict") await loadData();
    toast(friendlyError(error), "error");
  } finally {
    if (button) setButtonBusy(button, false, "");
  }
}

function openOrderDetails(order) {
  const dialog = element("dialog", "sheet-dialog order-details-dialog");
  const form = element("form");
  const details = order.details || { product: null, quantity: null, colors: [], sizes: null, notes: null, currentSketch: null };
  const header = element("header", "sheet-head");
  const title = element("div");
  title.append(element("span", "section-code", `PEDIDO / ${order.orderNumber}`), element("h2", "", order.teamName));
  const close = element("button", "icon-button", "×");
  close.type = "button";
  close.setAttribute("aria-label", "Cerrar datos del pedido");
  close.addEventListener("click", () => dialog.close());
  header.append(title, close);

  const grid = element("div", "form-grid");
  const product = element("input"); product.value = details.product || ""; product.maxLength = 120;
  const quantity = element("input"); quantity.type = "number"; quantity.min = "1"; quantity.value = details.quantity || "";
  const colors = element("input"); colors.value = details.colors.join(", "); colors.maxLength = 720;
  const sizes = element("textarea"); sizes.value = details.sizes || ""; sizes.maxLength = 1000;
  const notes = element("textarea"); notes.value = details.notes || ""; notes.maxLength = 2000;
  const block = element("fieldset", "form-block form-block--wide");
  block.append(
    element("legend", "", "Datos del pedido"),
    fieldLabel("Producto", product),
    fieldLabel("Cantidad", quantity),
    fieldLabel("Colores (separados por coma)", colors),
    fieldLabel("Talles", sizes),
    fieldLabel("Notas", notes),
  );
  grid.append(block);
  if (details.currentSketch) {
    const sketch = element("fieldset", "form-block form-block--wide");
    sketch.append(
      element("legend", "", "Boceto vigente"),
      element("p", "", details.currentSketch.fileName),
    );
    const open = element("button", "button button--quiet", "Ver boceto");
    open.type = "button";
    open.addEventListener("click", () => void openCurrentSketch(details.currentSketch));
    sketch.append(open);
    grid.append(sketch);
  }
  const error = element("p", "form-error"); error.setAttribute("role", "alert");
  const save = element("button", "button button--primary", "Guardar datos"); save.type = "submit";
  const footer = element("footer", "sheet-actions"); footer.append(element("span", "", "Los cambios quedan en el historial del pedido."), save);
  form.append(header, grid, error, footer);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void saveOrderDetails(order, {
      product: product.value.trim() || null,
      quantity: quantity.value ? Number(quantity.value) : null,
      colors: colors.value.split(",").map((color) => color.trim()).filter(Boolean),
      sizes: sizes.value.trim() || null,
      notes: notes.value.trim() || null,
      currentSketch: details.currentSketch ?? null,
    }, save, error, dialog);
  });
  dialog.append(form);
  dialog.addEventListener("close", () => dialog.remove(), { once: true });
  document.body.append(dialog);
  dialog.showModal();
}

async function saveOrderDetails(order, details, button, error, dialog) {
  error.textContent = "";
  setButtonBusy(button, true, "Guardando…");
  try {
    const response = await api(`/v1/orders/${encodeURIComponent(order.id)}/details`, {
      method: "PATCH",
      headers: { "idempotency-key": crypto.randomUUID() },
      body: JSON.stringify({ expectedVersion: order.version, details }),
    });
    const index = state.orders.findIndex((candidate) => candidate.id === response.data.id);
    if (index >= 0) state.orders[index] = response.data;
    dialog.close();
    renderOrders();
    toast("Datos del pedido guardados.");
  } catch (caught) {
    error.textContent = friendlyError(caught);
  } finally {
    setButtonBusy(button, false, "");
  }
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

  const candidates = $("#client-candidates");
  if (candidates) {
    candidates.replaceChildren();
    const pending = state.commercial.filter((item) => item.opportunity.stage === "SENA_VALIDADA" && !item.opportunity.coreConversion);
    for (const item of pending) {
      const row = element("article", "candidate-row");
      const text = element("div");
      text.append(
        element("strong", "", item.conversation.contactName),
        element("span", "", item.lead.teamName),
        element("small", "", "Contacto comercial; Cliente automático todavía pendiente."),
      );
      const button = element("button", "button button--quiet", "Abrir conversación");
      button.type = "button";
      button.addEventListener("click", () => {
        state.selectedCommercialId = item.id;
        switchView("leads");
        renderCommercial();
      });
      row.append(text, button);
      candidates.append(row);
    }
  }
}

function element(tagName, className = "", text = "") {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

// En PILOTO_DELTA esta definición vendrá versionada desde el Core por empresa.
// La demo local mantiene una sola fuente para tabs, tableros y comandos.
const salesProcessStages = [
  { id: "NUEVO", label: "Contacto inicial", shortLabel: "Inicial" },
  { id: "EN_CALIFICACION", label: "Calificación", shortLabel: "Calificar" },
  { id: "COTIZADO", label: "Cotización enviada", shortLabel: "Cotizado" },
  { id: "EN_SEGUIMIENTO", label: "Seguimiento", shortLabel: "Seguimiento" },
  { id: "PERDIDO", label: "Cerrado sin venta", shortLabel: "Cerrado" },
  { id: "SENA_VALIDADA", label: "Seña validada", shortLabel: "Seña" },
];

const commercialStages = salesProcessStages.map((stage) => stage.id);
const stageLabels = Object.fromEntries(salesProcessStages.map((stage) => [stage.id, stage.label]));

function stageLabel(value) {
  return state.stageDefinitions.lead.find((stage) => stage.id === value)?.name ?? stageLabels[value] ?? value;
}

function configuredLeadStages() {
  return state.stageDefinitions.lead.length ? state.stageDefinitions.lead.map((stage) => stage.id) : commercialStages;
}

function canMoveLeadTo(item, stage) {
  return stage === item.opportunity.stage
    || item.opportunity.allowedStageTransitions.includes(stage)
    || (configuredLeadStages().includes(stage) && !commercialStages.includes(stage));
}

function productLabel(value) {
  if (value === "CAMISETAS") return "Camisetas";
  if (value === "EQUIPO_COMPLETO") return "Equipo completo";
  return "Producto por confirmar";
}

const demoToday = "2026-08-03";

function leadPriority(item) {
  const dueAt = item.opportunity.nextActionDueAt;
  if (item.opportunity.stage === "PERDIDO") {
    return { key: "closed", label: "Cerrado", reason: item.opportunity.lossReason || "No continúa", rank: 9 };
  }
  if (dueAt && dueAt < demoToday) {
    return { key: "overdue", label: "Vencido", reason: `Venció ${shortDate(dueAt)}`, rank: 0 };
  }
  if (item.opportunity.stage === "NUEVO" || item.opportunity.stage === "EN_CALIFICACION") {
    const missing = item.lead.missingInfo[0];
    return { key: "response", label: "Responder ahora", reason: missing ? `Falta: ${missing}` : "Necesita una respuesta", rank: 1 };
  }
  if (item.opportunity.stage === "EN_SEGUIMIENTO") {
    return { key: "waiting", label: "Esperando cliente", reason: dueAt ? `Revisar ${shortDate(dueAt)}` : "Revisión pendiente", rank: 2 };
  }
  if (item.opportunity.stage === "SENA_VALIDADA") {
    if (item.opportunity.coreConversion) {
      return { key: "action", label: "Pedido creado", reason: item.opportunity.coreConversion.orderNumber, rank: 3 };
    }
    return { key: "decision", label: "Revisar seña", reason: "Cliente y pedido todavía no vinculados", rank: 3 };
  }
  return { key: "action", label: "Próxima acción", reason: dueAt ? `Objetivo ${shortDate(dueAt)}` : "Sin fecha definida", rank: 4 };
}

function commercialSuggestion(item) {
  if (item.lead.missingInfo.length > 0) {
    const missing = item.lead.missingInfo.slice(0, 2).join(" y ").toLowerCase();
    return `Confirmá ${missing} antes de avanzar.`;
  }
  if (item.opportunity.stage === "COTIZADO") return "Confirmá que recibieron la cotización y registrá la decisión.";
  if (item.opportunity.stage === "EN_SEGUIMIENTO") return "Retomá el contacto en la fecha prevista sin repetir preguntas ya respondidas.";
  if (item.opportunity.stage === "SENA_VALIDADA" && item.opportunity.coreConversion) return `El pedido ${item.opportunity.coreConversion.orderNumber} ya quedó vinculado a esta conversación.`;
  if (item.opportunity.stage === "SENA_VALIDADA") return "Revisá la evidencia y convertí la seña validada en Cliente y Pedido desde los detalles.";
  if (item.opportunity.stage === "PERDIDO") return "El cierre ya está registrado; conservá el motivo para Resultados.";
  return "Dejá un próximo paso concreto y una fecha para revisarlo.";
}

function originLabel(item) {
  return item.attribution.classification === "META_EXACTO"
    ? item.attribution.adName || "Anuncio identificado"
    : "Origen desconocido";
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

function renderToday() {
  const open = state.commercial.filter((item) => item.opportunity.stage !== "PERDIDO");
  const priorities = open.map((item) => ({ item, priority: leadPriority(item) }));
  const counts = {
    response: priorities.filter(({ priority }) => priority.key === "response").length,
    overdue: priorities.filter(({ priority }) => priority.key === "overdue").length,
    waiting: priorities.filter(({ priority }) => priority.key === "waiting").length,
    all: priorities.length,
  };
  $("#today-response-count").textContent = String(counts.response);
  $("#today-overdue-count").textContent = String(counts.overdue);
  $("#today-waiting-count").textContent = String(counts.waiting);
  $("#today-action-count").textContent = String(counts.all);
  // La vista "Hoy" puede mantenerse fuera de la navegación sin dejar el
  // refresco comercial atado a un contador que ya no se muestra.
  const todayNavCount = $("#today-count-nav");
  if (todayNavCount) todayNavCount.textContent = String(counts.response + counts.overdue);

  const labels = {
    all: "Todo lo abierto",
    response: "Necesitan respuesta",
    overdue: "Seguimientos vencidos",
    waiting: "Esperando al cliente",
  };
  $("#today-filter-label").textContent = labels[state.todayFilter] || labels.all;
  $$('[data-today-filter]').forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.todayFilter === state.todayFilter);
  });

  const list = $("#today-list");
  list.replaceChildren();
  const visible = priorities
    .filter(({ priority }) => state.todayFilter === "all" || priority.key === state.todayFilter)
    .sort((a, b) => a.priority.rank - b.priority.rank
      || (a.item.opportunity.nextActionDueAt || "9999").localeCompare(b.item.opportunity.nextActionDueAt || "9999"));

  if (visible.length === 0) {
    const empty = element("div", "today-empty");
    empty.append(
      element("strong", "", state.todayFilter === "overdue" ? "No hay seguimientos vencidos" : "No hay conversaciones en este grupo"),
      element("p", "", "La lista se actualizará cuando cambie una etapa o próxima acción."),
    );
    list.append(empty);
    return;
  }

  for (const { item, priority } of visible) {
    const row = element("article", "today-row");
    row.dataset.priority = priority.key;
    const flag = element("div", "today-flag");
    flag.append(element("span", "", priority.label), element("small", "", priority.reason));
    const identity = element("div", "today-identity");
    identity.append(
      element("strong", "", item.lead.teamName || "Equipo por confirmar"),
      element("span", "", `${item.conversation.contactName} · ${productLabel(item.lead.productType)} · ${item.lead.quantity ? `${item.lead.quantity} prendas` : "cantidad por confirmar"}`),
    );
    const next = element("div", "today-next");
    next.append(element("span", "", "Próxima acción"), element("strong", "", item.opportunity.nextAction));
    const openButton = element("button", "button button--primary", "Abrir chat");
    openButton.type = "button";
    openButton.addEventListener("click", () => {
      state.mobileDetailOpen = true;
      state.mobileLeadTab = "chat";
      switchView("whatsapp");
      void openWhatsAppConversation(item.id);
    });
    row.append(flag, identity, next, openButton);
    list.append(row);
  }
}

function renderStageBoard(board) {
  if (!board) return;
  board.replaceChildren();
  const activeStage = $("#stage-filter").value;
  const stages = configuredLeadStages();
  for (const [index, stage] of stages.entries()) {
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
      switchView("leads");
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
  list.className = "lead-list lead-kanban";
  $("#lead-result-count").textContent = `${items.length} ${items.length === 1 ? "resultado" : "resultados"}`;
  if (items.length === 0) {
    leadResultEmpty(list);
    return;
  }

  const leadStages = configuredLeadStages();
  for (const stage of leadStages) {
    const column = element("section", "lead-kanban-column");
    column.dataset.stage = stage;
    const stageItems = items.filter((item) => item.opportunity.stage === stage);
    const header = element("header", "lead-kanban-column-head");
    header.append(element("strong", "", stageLabel(stage)), element("span", "", String(stageItems.length)));
    const cards = element("div", "lead-kanban-stack");
    cards.addEventListener("dragover", (event) => event.preventDefault());
    cards.addEventListener("drop", (event) => {
      event.preventDefault();
      const id = event.dataTransfer?.getData("text/plain");
      const item = state.commercial.find((candidate) => candidate.id === id);
      if (!item || !canMoveLeadTo(item, stage)) return;
      void saveCommercialStage(item, stage, null);
    });
    for (const item of stageItems) {
      const priority = leadPriority(item);
      const card = element("article", "lead-kanban-card");
      card.draggable = true;
      card.dataset.leadId = item.id;
      card.append(
        element("strong", "", item.lead.teamName || "Equipo por confirmar"),
        element("span", "lead-kanban-contact", item.conversation.contactName),
        element("span", "lead-kanban-meta", item.lead.quantity
          ? `${productLabel(item.lead.productType)} · ${item.lead.quantity} prendas`
          : `${productLabel(item.lead.productType)} · cantidad por confirmar`),
        element("span", "lead-kanban-next", item.opportunity.nextAction || priority.reason),
      );
      const message = element("button", "button button--quiet lead-kanban-message", "Responder");
      message.type = "button";
      message.addEventListener("click", (event) => {
        event.stopPropagation();
        switchView("whatsapp");
        void openWhatsAppConversation(item.id);
      });
      card.append(message);
      card.addEventListener("dragstart", (event) => event.dataTransfer?.setData("text/plain", item.id));
      card.addEventListener("click", () => void openLeadDetail(item.id));
      cards.append(card);
    }
    column.append(header, cards);
    list.append(column);
  }
}

async function openLeadDetail(itemId) {
  const item = state.commercial.find((candidate) => candidate.id === itemId);
  if (!item) return;
  state.selectedCommercialId = item.id;
  state.mobileDetailOpen = true;
  state.mobileLeadTab = "chat";
  state.draftResource = null;
  renderCommercial();
  try {
    const response = await api(`/v1/commercial/workspace/${encodeURIComponent(itemId)}`);
    replaceCommercialItem(response.data);
    renderCommercial();
    $("#lead-detail").focus({ preventScroll: true });
  } catch (error) {
    toast(friendlyError(error), "error");
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
  const card = detailCard("CONSULTA / 01", "Información comercial");
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
    grid.append(fact(state.localDemo ? "Cotización de ejemplo" : "Cotización", `${money(item.opportunity.quote.totalCents)} · v${item.opportunity.quote.version}`));
  }
  if (item.opportunity.lossReason) grid.append(fact("Motivo de pérdida", item.opportunity.lossReason));
  card.append(grid);
  if (item.opportunity.depositValidation) {
    const warning = element("p", "safety-note");
    warning.append(element("strong", "", state.localDemo ? "SEÑA DE EJEMPLO · " : "SEÑA VALIDADA · "), document.createTextNode(item.opportunity.depositValidation.note));
    card.append(warning);
  }
  if (item.opportunity.coreConversion) {
    card.append(fact("Pedido vinculado", item.opportunity.coreConversion.orderNumber));
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
  const note = element("div", "read-only-banner", state.localDemo
    ? "Conversación de ejemplo · sin envío desde esta demo"
    : "Conversación vinculada al lead.");
  const timeline = element("div", "conversation-timeline");
  for (const message of item.conversation.messages) {
    const row = element("article", `message-row ${message.direction === "DELTA" ? "is-delta" : "is-client"}`);
    row.append(element("span", "message-author", message.direction === "DELTA" ? "Delta" : item.conversation.contactName));
    appendMessageContent(row, message, item);
    row.append(element("time", "", message.pending ? "Enviando…" : shortDateTime(message.occurredAt)));
    timeline.append(row);
  }
  card.append(note, timeline);
  return card;
}

function renderHistory(item) {
  const card = detailCard("HISTORIAL / 04", "Actividad comercial");
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
    element("b", "", item.attribution.creative?.visualLabel || (state.localDemo ? "CREATIVO DE EJEMPLO" : "ANUNCIO")),
    element("strong", "", item.attribution.creative?.title || item.attribution.adName || "Anuncio sin identificar"),
    element("p", "", item.attribution.creative?.body || "Sin descripción del creativo."),
  );
  const metadata = element("dl", "origin-metadata");
  for (const [label, value] of [
    ["Campaña", item.attribution.campaignName],
    ["Anuncio", item.attribution.adName],
    ["Identificador", item.attribution.adId],
    ["Evidencia", item.attribution.evidenceMessageId],
  ]) {
    metadata.append(element("dt", "", label), element("dd", "", value || "No informado"));
  }
  card.append(creative, metadata);
  return card;
}

function renderContactOverview(item) {
  const card = detailCard("CONTACTO", "Quién está escribiendo");
  const grid = element("div", "brief-grid contact-overview-grid");
  grid.append(
    fact("Nombre", item.conversation.contactName),
    fact("WhatsApp", item.conversation.normalizedPhone || "Número no disponible"),
    fact("Equipo o institución", item.lead.teamName || "Por confirmar"),
    fact("Interés actual", productLabel(item.lead.productType)),
    fact("Cantidad", item.lead.quantity ? `${item.lead.quantity} prendas` : "Por confirmar"),
    fact("Primer contacto", shortDateTime(item.conversation.firstContactAt)),
    fact("Última actividad", shortDateTime(item.conversation.lastActivityAt)),
  );
  card.append(grid);
  return card;
}

function renderProcessOverview(item) {
  const card = detailCard("PROCESO DE VENTA", "Dónde está y qué sigue");
  const body = element("div", "process-overview");
  const current = element("div", "process-current-stage");
  current.append(
    element("span", "process-current-label", "Etapa actual"),
    element("strong", "process-current-value", stageLabel(item.opportunity.stage)),
    element("small", "", `Versión ${item.opportunity.version}`),
  );
  const next = element("div", "process-next-action");
  next.append(
    element("span", "process-current-label", "Próxima acción"),
    element("strong", "", item.opportunity.nextAction),
    element("small", "", item.opportunity.nextActionDueAt
      ? `Fecha objetivo: ${shortDate(item.opportunity.nextActionDueAt)}`
      : "Sin fecha objetivo"),
  );
  body.append(current, next);

  const transitions = element("div", "process-transitions");
  transitions.append(element("span", "process-current-label", "Movimientos disponibles"));
  const transitionList = element("div", "process-transition-list");
  const available = item.opportunity.allowedStageTransitions || [];
  if (available.length === 0) {
    transitionList.append(element("span", "process-transition-empty", "No hay cambios habilitados desde esta etapa"));
  } else {
    for (const stage of available) transitionList.append(element("span", "process-transition-chip", stageLabel(stage)));
  }
  transitions.append(transitionList);
  body.append(transitions);

  if (item.lead.missingInfo.length > 0) {
    const missing = element("div", "process-missing-summary");
    missing.append(
      element("span", "process-current-label", "Para avanzar"),
      element("strong", "", item.lead.missingInfo.join(" · ")),
    );
    body.append(missing);
  }
  card.append(body);
  return card;
}

function renderWhatsAppDetailPreservingChatState(item, focusMenu = false) {
  const composer = $(".whatsapp-composer-input");
  const draft = composer?.value ?? "";
  const restoreComposerFocus = document.activeElement === composer;
  const conversation = $(".whatsapp-chat-pane .lead-conversation");
  const previousScrollTop = conversation?.scrollTop ?? 0;
  const distanceFromBottom = conversation
    ? conversation.scrollHeight - conversation.scrollTop - conversation.clientHeight
    : 0;
  $("#whatsapp-workspace")?.classList.toggle("is-contact-details-open", state.whatsappDetailsOpen);
  renderWhatsAppDetail(item);
  const refreshedComposer = $(".whatsapp-composer-input");
  if (refreshedComposer) {
    refreshedComposer.value = draft;
    if (restoreComposerFocus) refreshedComposer.focus({ preventScroll: true });
  }
  const refreshedConversation = $(".whatsapp-chat-pane .lead-conversation");
  if (refreshedConversation) {
    refreshedConversation.scrollTop = distanceFromBottom < 80
      ? refreshedConversation.scrollHeight
      : previousScrollTop;
  }
  if (focusMenu) $(".whatsapp-chat-menu")?.focus({ preventScroll: true });
}

function openWhatsAppDetails(item) {
  state.whatsappDetailsOpen = true;
  renderWhatsAppDetailPreservingChatState(item);
}

function renderOrderConversion(item) {
  if (!["COTIZADO", "EN_SEGUIMIENTO", "SENA_VALIDADA"].includes(item.opportunity.stage)) return null;
  const card = detailCard("PEDIDO / CORE", item.opportunity.coreConversion ? "Pedido vinculado" : "Crear pedido");
  if (item.opportunity.coreConversion) {
    const conversion = item.opportunity.coreConversion;
    const productionReleased = Boolean(conversion.productionReleasedAt);
    const grid = element("div", "brief-grid");
    grid.append(
      fact("Pedido", conversion.orderNumber),
      fact("Seña", money(conversion.depositCents, conversion.currency)),
      fact("Total", money(conversion.quotedTotalCents, conversion.currency)),
      fact("Estado", productionReleased ? "Listo para producción" : "Pedido creado"),
    );
    card.append(grid);
    if (state.localDemo && !productionReleased) {
      const release = element("button", "button button--primary button--full", "Entregar a producción");
      release.type = "button";
      const error = element("p", "form-error");
      error.setAttribute("role", "alert");
      release.addEventListener("click", () => {
        void releaseCommercialToProduction(item, release, error);
      });
      card.append(
        element("p", "command-help", "Crea una entrega interna trazable. No envía mensajes ni cambia etapas posteriores."),
        error,
        release,
      );
    } else card.append(element("p", "command-help", "El pedido ya está vinculado. Gestioná su avance y finalización desde Pedidos."));
    return card;
  }

  const form = element("form", "command-form");
  const reference = element("input");
  reference.required = true;
  reference.maxLength = 160;
  reference.placeholder = "Ej.: transferencia 1234";
  const amount = element("input");
  amount.type = "number";
  amount.required = true;
  amount.min = "1";
  amount.step = "1";
  amount.placeholder = "Importe en pesos";
  const error = element("p", "form-error");
  error.setAttribute("role", "alert");
  const button = element("button", "button button--primary button--full", "Certificar seña y crear pedido");
  button.type = "submit";
  form.append(
    fieldLabel("Referencia del comprobante", reference),
    fieldLabel("Seña en pesos", amount),
    element("p", "command-help", `Total cotizado: ${money(item.opportunity.quote?.totalCents ?? 0)}. Al confirmar, se crea un único cliente y pedido con la información ya cargada.`),
    error,
    button,
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    void convertCommercialToOrder(item, reference.value, Number(amount.value), button, error);
  });
  card.append(form);
  return card;
}

async function convertCommercialToOrder(item, evidenceReference, amountPesos, button, errorNode) {
  errorNode.textContent = "";
  setButtonBusy(button, true, "Creando…");
  try {
    const base = state.localDemo ? "/v1/local/commercial" : "/v1/commercial";
    await api(`${base}/workspace/${encodeURIComponent(item.id)}/convert-to-order`, {
      method: "POST",
      body: JSON.stringify({
        evidenceReference: evidenceReference.trim(),
        depositCents: amountPesos * 100,
        expectedVersion: item.opportunity.version,
      }),
    });
    await loadData();
    state.selectedCommercialId = item.id;
    state.whatsappDetailsOpen = true;
    renderWhatsApp();
    toast("Cliente, seña y pedido vinculados.");
  } catch (error) {
    errorNode.textContent = friendlyError(error);
  } finally {
    setButtonBusy(button, false, "");
  }
}

async function releaseCommercialToProduction(item, button, errorNode) {
  errorNode.textContent = "";
  setButtonBusy(button, true, "Entregando…");
  try {
    await api(`/v1/local/commercial/workspace/${encodeURIComponent(item.id)}/release-to-production`, {
      method: "POST",
      body: JSON.stringify({
        expectedVersion: item.opportunity.version,
        confirmation: "ENTREGAR_A_PRODUCCION",
      }),
    });
    await loadData();
    state.selectedCommercialId = item.id;
    state.whatsappDetailsOpen = true;
    renderWhatsApp();
    toast("Pedido entregado a producción.");
  } catch (error) {
    errorNode.textContent = friendlyError(error);
  } finally {
    setButtonBusy(button, false, "");
  }
}

function renderWhatsAppInlineDetails(item) {
  const panel = element("aside", "whatsapp-inline-details");
  panel.setAttribute("aria-label", "Detalles del contacto y del proceso");
  const header = element("header", "whatsapp-inline-details-head");
  const identity = element("div");
  identity.append(
    element("span", "page-kicker", "Contacto y proceso"),
    element("h2", "", item.conversation.contactName),
    element("p", "", `${item.lead.teamName || "Equipo por confirmar"} · ${stageLabel(item.opportunity.stage)}`),
  );
  const close = element("button", "icon-button whatsapp-inline-details-close", "×");
  close.type = "button";
  close.setAttribute("aria-label", "Cerrar detalles");
  close.addEventListener("click", () => {
    state.whatsappDetailsOpen = false;
    renderWhatsAppDetailPreservingChatState(item, true);
  });
  header.append(identity, close);
  const body = element("div", "whatsapp-inline-details-body");
  const conversion = renderOrderConversion(item);
  const more = element("details", "whatsapp-more-info");
  more.append(
    element("summary", "", "Más información"),
    renderProcessOverview(item),
    renderOrigin(item),
    renderHistory(item),
    renderCommands(item),
  );
  body.append(
    renderContactOverview(item),
    renderBrief(item),
    renderQuickStage(item),
    ...(conversion ? [conversion] : []),
    more,
  );
  panel.append(header, body);
  return panel;
}

function renderQuickStage(item) {
  const card = detailCard("ETAPA", "Mover lead");
  const form = element("form", "inline-command");
  const select = element("select");
  for (const stage of configuredLeadStages()) {
    const option = element("option", "", stageLabel(stage));
    option.value = stage;
    option.selected = stage === item.opportunity.stage;
    option.disabled = !canMoveLeadTo(item, stage);
    select.append(option);
  }
  const button = element("button", "button button--primary", "Cambiar etapa");
  button.type = "submit";
  form.append(select, button);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void saveCommercialStage(item, select.value, button);
  });
  card.append(form);
  return card;
}

function fieldLabel(text, control) {
  const label = element("label", "command-field");
  label.append(document.createTextNode(text), control);
  return label;
}

function renderCommands(item) {
  const wrapper = element("div", "command-stack");

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

  wrapper.append(actionCard, followCard);
  return wrapper;
}

function openFullLeadSheet(item) {
  const dialog = $("#lead-sheet-dialog");
  dialog.classList.remove("is-whatsapp-detail");
  const content = $("#lead-sheet-content");
  content.replaceChildren();
  const header = element("header", "lead-sheet-head");
  const identity = element("div");
  identity.append(
    element("span", "page-kicker", "Ficha completa"),
    element("h2", "", item.lead.teamName || "Equipo por confirmar"),
    element("p", "", `${item.conversation.contactName} · ${stageLabel(item.opportunity.stage)} · versión ${item.opportunity.version}`),
  );
  const close = element("button", "icon-button", "×");
  close.type = "button";
  close.setAttribute("aria-label", "Cerrar ficha");
  close.addEventListener("click", () => dialog.close());
  header.append(identity, close);
  const body = element("div", "lead-sheet-body");
  body.append(renderBrief(item), renderQualification(item), renderOrigin(item), renderHistory(item));
  content.append(header, body);
  dialog.showModal();
}

function renderDraftArea(item) {
  const draft = element("section", "draft-area");
  const heading = element("header");
  heading.append(element("span", "page-kicker", "Preparar respuesta"), element("small", "", "No se envía desde esta demo"));
  const input = element("textarea", "draft-input");
  input.placeholder = "Escribí o ajustá un borrador…";
  input.value = `Hola ${item.conversation.contactName.split(" ")[0]}, ${commercialSuggestion(item).toLowerCase()}`;
  const actions = element("div", "draft-actions");
  const sizes = element("button", "button button--quiet", "Agregar tabla de talles");
  sizes.type = "button";
  sizes.addEventListener("click", () => {
    state.draftResource = "sizes";
    if (state.currentView === "whatsapp") renderWhatsApp();
    else renderLeadDetail(item);
  });
  const quick = element("button", "button button--quiet", "Usar respuesta rápida");
  quick.type = "button";
  quick.addEventListener("click", () => {
    input.value = item.lead.missingInfo.length
      ? `Perfecto. Para avanzar, ¿me confirmás ${item.lead.missingInfo.slice(0, 2).join(" y ").toLowerCase()}?`
      : "Perfecto, quedó todo anotado. Te confirmo el próximo paso enseguida.";
    input.focus();
  });
  const copy = element("button", "button button--primary", "Copiar borrador");
  copy.type = "button";
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(input.value);
      toast("Borrador copiado. No se envió ningún mensaje.");
    } catch {
      input.select();
      toast("Seleccionamos el borrador para que puedas copiarlo.");
    }
  });
  actions.append(sizes, quick, copy);
  draft.append(heading, input);
  if (state.draftResource === "sizes") {
    const resource = element("div", "draft-resource");
    resource.append(
      element("strong", "", "Tabla de talles agregada al borrador"),
      element("span", "", item.lead.sizeBreakdown.map((size) => `${size.size}: ${size.quantity}`).join(" · ")),
      element("small", "", "Referencia ficticia para revisar antes de cualquier envío futuro."),
    );
    draft.append(resource);
  }
  draft.append(actions);
  return draft;
}

function filteredWhatsApp() {
  const search = normalizedSearch($("#whatsapp-search")?.value);
  return [...state.commercial]
    .filter((item) => {
      if (state.whatsappStage !== "ALL" && item.opportunity.stage !== state.whatsappStage) return false;
      if (state.config?.whatsappUnreadEnabled && state.whatsappUnreadOnly && !(item.conversation.unreadCount > 0)) return false;
      if (!search) return true;
      const lastMessage = item.conversation.messages.at(-1)?.text || "";
      return normalizedSearch([
        item.conversation.contactName,
        item.lead.teamName,
        item.lead.productType,
        lastMessage,
      ].filter(Boolean).join(" ")).includes(search);
    })
    .sort((left, right) => right.conversation.lastActivityAt.localeCompare(left.conversation.lastActivityAt));
}

function renderWhatsAppStages() {
  const rail = $("#whatsapp-stage-tabs");
  if (!rail) return;
  rail.replaceChildren();
  const stages = [
    { id: "ALL", label: "Todas", shortLabel: "Todas" },
    ...(state.stageDefinitions.lead.length
      ? state.stageDefinitions.lead.map((stage) => ({ id: stage.id, label: stage.name, shortLabel: stage.name }))
      : salesProcessStages),
  ];
  for (const [index, stage] of stages.entries()) {
    const active = state.whatsappStage === stage.id;
    const count = stage.id === "ALL"
      ? state.commercial.length
      : state.commercial.filter((item) => item.opportunity.stage === stage.id).length;
    const button = element("button", `whatsapp-stage-tab${active ? " is-active" : ""}`);
    button.type = "button";
    button.dataset.stage = stage.id;
    button.setAttribute("aria-pressed", String(active));
    button.setAttribute("aria-label", `${stage.label}: ${count} conversaciones`);
    button.append(
      element("span", "whatsapp-stage-index", stage.id === "ALL" ? "•" : String(index).padStart(2, "0")),
      element("span", "whatsapp-stage-name", stage.label),
      element("span", "whatsapp-stage-count", String(count)),
    );
    button.addEventListener("click", () => {
      state.whatsappStage = stage.id;
      state.mobileWhatsappDetailOpen = false;
      state.selectedCommercialId = null;
      renderWhatsApp();
      $("#whatsapp-list")?.focus({ preventScroll: true });
    });
    rail.append(button);
  }
}

function renderWhatsAppList(items) {
  const list = $("#whatsapp-list");
  if (!list) return;
  list.replaceChildren();
  $("#whatsapp-result-count").textContent = String(items.length);
  if (items.length === 0) {
    const empty = element("div", "whatsapp-empty");
    empty.append(
      element("strong", "", "No encontramos conversaciones"),
      element("p", "", "Probá con otro nombre, equipo o mensaje."),
    );
    list.append(empty);
    return;
  }

  for (const item of items) {
    const selected = item.id === state.selectedCommercialId;
    const closed = item.opportunity.stage === "PERDIDO";
    const latest = item.conversation.messages.at(-1);
    const unread = state.config?.whatsappUnreadEnabled ? item.conversation.unreadCount || 0 : 0;
    const button = element("button", `whatsapp-row${selected ? " is-selected" : ""}${unread ? " is-unread" : ""}${closed ? " is-closed" : ""}`);
    button.type = "button";
    button.setAttribute("aria-pressed", String(selected));
    const avatar = element("span", "whatsapp-avatar", initials(item.conversation.contactName));
    const copy = element("span", "whatsapp-row-copy");
    const head = element("span", "whatsapp-row-head");
    head.append(
      element("strong", "", item.conversation.contactName),
      element("time", "", latest ? shortDateTime(latest.occurredAt) : ""),
    );
    if (unread) head.append(element("span", "whatsapp-unread-badge", String(unread)));
    copy.append(
      head,
      element("span", "whatsapp-team", item.lead.teamName || "Equipo por confirmar"),
      ...(closed ? [element("span", "whatsapp-closed-state", "Cerrada")] : []),
      element("span", "whatsapp-preview", latest?.contentType === "IMAGE"
        ? `📷 Imagen${latest.text ? ` · ${latest.text}` : ""}`
        : latest?.text || "Sin mensajes"),
    );
    button.append(avatar, copy);
    button.addEventListener("click", () => {
      if (unread) void markWhatsAppRead(item.id);
      void openWhatsAppConversation(item.id);
    });
    list.append(button);
  }
  if (state.commercialNextCursor) {
    const sentinel = element("div", "whatsapp-page-sentinel", "Cargando más conversaciones…");
    list.append(sentinel);
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        void loadNextCommercialPage();
      }, { root: list, rootMargin: "180px" });
      observer.observe(sentinel);
    }
  }
}

async function markWhatsAppRead(itemId) {
  const item = state.commercial.find((candidate) => candidate.id === itemId);
  if (!item || !(item.conversation.unreadCount > 0)) return;
  item.conversation.unreadCount = 0;
  renderWhatsApp();
  try {
    const response = await api(`/v1/commercial/workspace/${encodeURIComponent(itemId)}/read`, { method: "POST" });
    replaceCommercialItem(response.data);
    renderWhatsApp();
  } catch (error) {
    renderWhatsApp();
    toast(friendlyError(error), "error");
  }
}

function renderWhatsAppComposer(item) {
  const composer = element("section", "whatsapp-composer");
  const attach = element("button", "whatsapp-composer-icon", "+");
  attach.type = "button";
  const sendingEnabled = state.localWhatsappSimulation || state.realWhatsappOutbound;
  attach.disabled = !sendingEnabled || !state.config?.whatsappMediaEnabled;
  attach.title = "Adjuntar imagen JPEG, PNG o WebP (máx. 5 MB)";
  attach.setAttribute("aria-label", "Adjuntar");
  const fileInput = element("input", "sr-only");
  fileInput.type = "file";
  fileInput.accept = "image/jpeg,image/png,image/webp";
  const input = element("textarea", "whatsapp-composer-input");
  input.rows = 1;
  input.placeholder = "Escribí un mensaje";
  const send = element("button", "whatsapp-send", "➤");
  send.type = "button";
  send.disabled = !sendingEnabled;
  send.title = state.localWhatsappSimulation
    ? "Enviar dentro de la simulación local"
    : state.realWhatsappOutbound ? "Enviar por WhatsApp" : "El envío se habilitará al conectar WhatsApp";
  send.setAttribute("aria-label", "Enviar mensaje");
  const note = element(
    "small",
    "whatsapp-local-note",
    state.localWhatsappSimulation
      ? "Simulación local · no llega a WhatsApp"
      : state.realWhatsappOutbound ? "Envío manual por WhatsApp" : "Recepción activa · envío deshabilitado",
  );
  const submit = async () => {
    const text = input.value.trim();
    const pendingImage = state.pendingWhatsappImage;
    if ((!text && !pendingImage) || send.disabled || !sendingEnabled) return;
    const optimistic = optimisticWhatsappMessage(item, text, pendingImage);
    input.value = "";
    state.pendingWhatsappImage = null;
    renderWhatsAppDetailPreservingChatState(optimistic, true);
    setButtonBusy(send, true, "…");
    try {
      const path = pendingImage
        ? state.localWhatsappSimulation
          ? `/v1/local/whatsapp-simulated/workspace/${encodeURIComponent(item.id)}/images`
          : `/v1/integrations/evolution/workspace/${encodeURIComponent(item.id)}/images`
        : state.localWhatsappSimulation
          ? `/v1/local/whatsapp-simulated/workspace/${encodeURIComponent(item.id)}/messages`
          : `/v1/integrations/evolution/workspace/${encodeURIComponent(item.id)}/messages`;
      const body = pendingImage ? {
        caption: text,
        mimeType: pendingImage.mimeType,
        fileName: pendingImage.fileName,
        dataBase64: pendingImage.dataBase64,
        ...(state.localWhatsappSimulation ? {} : { confirmation: "ENVIAR_IMAGEN_A_WHATSAPP" }),
      } : state.localWhatsappSimulation ? { text } : { text, confirmation: "ENVIAR_A_WHATSAPP" };
      const result = await api(path, {
        method: "POST",
        headers: { "idempotency-key": `whatsapp-${pendingImage ? "image" : "message"}-${crypto.randomUUID()}` },
        body: JSON.stringify(body),
      });
      replaceCommercialItem(result.data);
      state.selectedCommercialId = item.id;
      renderWhatsAppDetailPreservingChatState(result.data, true);
    } catch (error) {
      replaceCommercialItem(item);
      renderWhatsAppDetailPreservingChatState(item, true);
      toast(friendlyError(error), "error");
    } finally {
      setButtonBusy(send, false, "");
    }
  };
  attach.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast("Elegí una imagen JPEG, PNG o WebP de hasta 5 MB.", "error");
      fileInput.value = "";
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      state.pendingWhatsappImage = {
        mimeType: file.type,
        fileName: file.name,
        dataBase64: String(reader.result).split(",")[1] || "",
        preview: String(reader.result),
      };
      renderWhatsAppDetailPreservingChatState(item);
    }, { once: true });
    reader.readAsDataURL(file);
  });
  send.addEventListener("click", submit);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  });
  if (state.pendingWhatsappImage) {
    const preview = element("div", "whatsapp-image-preview");
    const thumbnail = element("img");
    thumbnail.src = state.pendingWhatsappImage.preview;
    thumbnail.alt = "Vista previa de la imagen a enviar";
    const remove = element("button", "whatsapp-image-remove", "×");
    remove.type = "button";
    remove.setAttribute("aria-label", "Quitar imagen");
    remove.addEventListener("click", () => {
      state.pendingWhatsappImage = null;
      renderWhatsAppDetailPreservingChatState(item);
    });
    preview.append(thumbnail, element("span", "", state.pendingWhatsappImage.fileName), remove);
    composer.append(preview);
  }
  composer.append(attach, fileInput, input, send, note);
  return composer;
}

function renderWhatsAppChatPane(item) {
  const pane = element("section", "lead-chat-pane whatsapp-chat-pane");
  const header = element("header", "lead-focus-head whatsapp-chat-head");
  const back = element("button", "mobile-back", "← Chats");
  back.type = "button";
  back.addEventListener("click", () => {
    state.mobileWhatsappDetailOpen = false;
    renderWhatsApp();
    $("#whatsapp-master").focus({ preventScroll: true });
  });
  const avatar = element("span", "whatsapp-avatar whatsapp-avatar--detail", initials(item.conversation.contactName));
  const identity = element("div", "whatsapp-chat-identity");
  identity.append(
    element("h2", "", item.conversation.contactName),
    element("p", "", `${item.lead.teamName || "Equipo por confirmar"} · ${productLabel(item.lead.productType)}`),
  );
  const menu = element("button", "whatsapp-chat-menu");
  menu.type = "button";
  menu.title = "Abrir detalles del contacto y del proceso";
  menu.setAttribute("aria-label", "Abrir detalles del contacto y del proceso");
  menu.setAttribute("aria-pressed", String(state.whatsappDetailsOpen));
  menu.append(element("span", "whatsapp-details-icon", "⋯"), element("span", "whatsapp-details-label", "Detalles"));
  menu.addEventListener("click", () => openWhatsAppDetails(item));
  header.append(back, avatar, identity, menu);

  const conversation = element("div", "conversation-timeline lead-conversation");
  const timeline = state.config?.conversationTimelineEnabled && item.timeline?.length
    ? item.timeline
    : item.conversation.messages.map((message) => ({
      kind: "MESSAGE",
      id: `message:${message.providerMessageId}`,
      occurredAt: message.occurredAt,
      message,
    }));
  for (const entry of timeline) {
    if (entry.kind === "OPERATIONAL_EVENT") {
      const event = element("aside", "whatsapp-operational-event");
      event.dataset.eventType = entry.eventType;
      event.setAttribute("aria-label", `${entry.label}. ${entry.detail}`);
      const copy = element("span", "whatsapp-operational-copy");
      copy.append(
        element("strong", "", entry.label),
        element("small", "", entry.detail),
      );
      event.append(
        element("span", "whatsapp-operational-mark", "✓"),
        copy,
        element("time", "", shortDateTime(entry.occurredAt)),
      );
      conversation.append(event);
      continue;
    }
    const message = entry.message;
    const row = element("article", `message-row ${message.direction === "DELTA" ? "is-delta" : "is-client"}`);
    row.append(element("span", "message-author", message.direction === "DELTA" ? "Delta" : item.conversation.contactName));
    appendMessageContent(row, message, item);
    row.append(element("time", "", shortDateTime(message.occurredAt)));
    conversation.append(row);
  }
  pane.append(header, conversation, renderWhatsAppComposer(item));
  return pane;
}

function renderWhatsAppDetail(item) {
  const detail = $("#whatsapp-detail");
  if (!detail) return;
  detail.replaceChildren();
  detail.tabIndex = -1;
  if (!item) {
    const empty = element("div", "whatsapp-detail-empty");
    empty.append(
      element("span", "whatsapp-empty-mark", "↗"),
      element("h2", "", "Elegí una conversación"),
      element("p", "", "El chat, los datos confirmados y el próximo paso quedan juntos."),
    );
    detail.append(empty);
    return;
  }
  const workspace = element("div", `whatsapp-detail-workspace${state.whatsappDetailsOpen ? " is-details-open" : ""}`);
  workspace.append(renderWhatsAppChatPane(item));
  if (state.whatsappDetailsOpen) workspace.append(renderWhatsAppInlineDetails(item));
  detail.append(workspace);
}

function renderWhatsApp() {
  const view = $("#whatsapp-view");
  if (!view) return;
  const items = filteredWhatsApp();
  if (state.selectedCommercialId && !items.some((item) => item.id === state.selectedCommercialId)) {
    state.selectedCommercialId = null;
  }
  const totalUnread = state.config?.whatsappUnreadEnabled
    ? state.commercial.reduce((sum, item) => sum + (item.conversation.unreadCount || 0), 0)
    : 0;
  $("#whatsapp-count-nav").textContent = String(totalUnread || state.commercial.length);
  $("#whatsapp-count-nav").classList.toggle("has-unread", totalUnread > 0);
  const unreadFilter = $("#whatsapp-unread-filter");
  if (unreadFilter) unreadFilter.hidden = !state.config?.whatsappUnreadEnabled;
  unreadFilter?.setAttribute("aria-pressed", String(state.whatsappUnreadOnly));
  unreadFilter?.classList.toggle("is-active", state.whatsappUnreadOnly);
  renderWhatsAppStages();
  renderWhatsAppList(items);
  renderWhatsAppDetail(items.find((item) => item.id === state.selectedCommercialId) ?? null);
  $("#whatsapp-workspace").classList.toggle(
    "is-detail-open",
    state.mobileWhatsappDetailOpen && Boolean(state.selectedCommercialId),
  );
  $("#whatsapp-workspace").classList.toggle(
    "is-contact-details-open",
    state.whatsappDetailsOpen && Boolean(state.selectedCommercialId),
  );
}

function renderChatPane(item) {
  const pane = element("section", "lead-chat-pane");
  pane.dataset.mobilePane = "chat";
  const header = element("header", "lead-focus-head");
  const back = element("button", "mobile-back", "← Conversaciones");
  back.type = "button";
  back.addEventListener("click", () => {
    state.mobileDetailOpen = false;
    renderCommercial();
    $("#lead-master").focus({ preventScroll: true });
  });
  const identity = element("div");
  identity.append(
    element("span", "page-kicker", productLabel(item.lead.productType)),
    element("h2", "", item.lead.teamName || "Equipo por confirmar"),
    element("p", "", `${item.conversation.contactName} · ${item.lead.quantity ? `${item.lead.quantity} prendas` : "cantidad por confirmar"}`),
  );
  const sheet = element("button", "button button--quiet", "Ficha completa");
  sheet.type = "button";
  sheet.addEventListener("click", () => openFullLeadSheet(item));
  header.append(back, identity, sheet);

  const conversation = element("div", "conversation-timeline lead-conversation");
  for (const message of item.conversation.messages) {
    const row = element("article", `message-row ${message.direction === "DELTA" ? "is-delta" : "is-client"}`);
    row.append(
      element("span", "message-author", message.direction === "DELTA" ? "Delta" : item.conversation.contactName),
      element("p", "", message.text),
      element("time", "", shortDateTime(message.occurredAt)),
    );
    conversation.append(row);
  }
  pane.append(header, conversation, renderWhatsAppComposer(item));
  return pane;
}

function renderWorkPane(item) {
  const pane = element("aside", "lead-work-pane");
  pane.dataset.mobilePane = "work";
  const head = element("header", "work-head");
  head.append(element("span", "page-kicker", "Trabajo comercial"), element("strong", "", `Versión ${item.opportunity.version}`));

  const stageSection = element("section", "work-section");
  stageSection.append(element("h3", "", "Etapa"));
  const stageForm = element("form", "inline-command");
  const stageSelect = element("select");
  for (const stage of configuredLeadStages()) {
    const option = element("option", "", stageLabel(stage));
    option.value = stage;
    option.selected = stage === item.opportunity.stage;
    option.disabled = !canMoveLeadTo(item, stage);
    stageSelect.append(option);
  }
  const stageButton = element("button", "button button--quiet", "Guardar");
  stageButton.type = "submit";
  stageForm.append(stageSelect, stageButton);
  stageForm.addEventListener("submit", (event) => {
    event.preventDefault();
    void saveCommercialStage(item, stageSelect.value, stageButton);
  });
  stageSection.append(stageForm);

  const summary = element("section", "work-section");
  summary.append(
    element("h3", "", "Resumen"),
    element("p", "work-summary", `${item.lead.teamName || item.conversation.contactName} consulta por ${item.lead.quantity ? `${item.lead.quantity} ` : "cantidad por confirmar de "}${productLabel(item.lead.productType).toLowerCase()} en ${item.lead.colors.join(" y ") || "colores por confirmar"}.`),
  );

  const facts = element("section", "work-section work-facts");
  facts.append(element("h3", "", "Datos confirmados"));
  const factList = element("div", "fact-chips");
  for (const entry of item.lead.confirmedInfo.slice(0, 6)) factList.append(element("span", "", `${entry.label}: ${entry.value}`));
  facts.append(factList);

  const missing = element("section", "work-section work-missing");
  missing.append(element("h3", "", "Datos faltantes"));
  if (item.lead.missingInfo.length === 0) missing.append(element("p", "work-complete", "No falta información para esta etapa."));
  else {
    const list = element("ul");
    for (const value of item.lead.missingInfo) list.append(element("li", "", value));
    missing.append(list);
  }

  const action = element("section", "work-section work-action");
  action.append(element("h3", "", "Próxima acción"));
  const actionForm = element("form", "work-action-form");
  const actionInput = element("textarea");
  actionInput.required = true;
  actionInput.maxLength = 240;
  actionInput.value = item.opportunity.nextAction;
  const due = element("input");
  due.type = "date";
  due.value = item.opportunity.nextActionDueAt || "";
  const save = element("button", "button button--primary", "Guardar siguiente paso");
  save.type = "submit";
  actionForm.append(actionInput, due, save);
  actionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!actionForm.reportValidity()) return;
    void saveCommercialNextAction(item, actionInput.value, due.value || null, save);
  });
  action.append(actionForm);

  const suggestion = element("section", "work-section work-suggestion");
  suggestion.append(element("h3", "", "Sugerencia comercial"), element("p", "", commercialSuggestion(item)));

  const origin = element("section", "work-section work-origin");
  origin.append(
    element("h3", "", "Anuncio de origen"),
    element("strong", "", originLabel(item)),
    element("small", "", "Se conserva aunque cambie el interés actual."),
  );

  const follow = element("details", "work-followup");
  follow.append(element("summary", "", "Registrar seguimiento interno"));
  const followForm = element("form", "work-followup-form");
  const outcome = element("select");
  for (const [value, label] of [["SIN_CAMBIOS", "Sin cambios"], ["AVANZO", "Avanzó"], ["SIN_RESPUESTA", "Sin respuesta"], ["NO_CONTINUA", "No continúa"]]) {
    const option = element("option", "", label);
    option.value = value;
    outcome.append(option);
  }
  const note = element("textarea");
  note.required = true;
  note.placeholder = "Qué ocurrió y qué conviene recordar";
  const followButton = element("button", "button button--quiet", "Registrar seguimiento");
  followButton.type = "submit";
  followForm.append(outcome, note, followButton);
  followForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!followForm.reportValidity()) return;
    void saveCommercialFollowUp(item, note.value, outcome.value, followButton);
  });
  follow.append(followForm);

  pane.append(head, stageSection, summary, facts, missing, action, suggestion, origin, follow);
  return pane;
}

function renderLeadDetail(item) {
  const detail = $("#lead-detail");
  detail.replaceChildren();
  detail.tabIndex = -1;
  if (!item) {
    const empty = element("div", "lead-detail-empty");
    empty.append(element("h2", "", "Elegí una conversación"), element("p", "", "Vas a ver el hilo y el siguiente paso sin salir de Leads."));
    detail.append(empty);
    return;
  }

  const tabs = element("nav", "lead-mobile-tabs");
  for (const [value, label] of [["chat", "Chat"], ["work", "Trabajo"], ["sheet", "Ficha"]]) {
    const button = element("button", state.mobileLeadTab === value ? "is-active" : "", label);
    button.type = "button";
    button.addEventListener("click", () => {
      if (value === "sheet") {
        openFullLeadSheet(item);
        return;
      }
      state.mobileLeadTab = value;
      renderLeadDetail(item);
    });
    tabs.append(button);
  }
  const focus = element("div", "lead-focus");
  focus.dataset.mobileTab = state.mobileLeadTab;
  focus.append(renderChatPane(item), renderWorkPane(item));
  detail.append(tabs, focus);
  window.requestAnimationFrame(() => {
    const conversation = $("#lead-detail .lead-conversation");
    if (conversation) conversation.scrollTop = conversation.scrollHeight;
  });
}

function replaceCommercialItem(updated) {
  const index = state.commercial.findIndex((item) => item.id === updated.id);
  if (index >= 0) state.commercial[index] = updated;
  state.commercialSnapshot = commercialSnapshot(state.commercial);
  state.selectedCommercialId = updated.id;
}

async function runCommercialMutation(button, busyLabel, operation, successMessage) {
  if (button) setButtonBusy(button, true, busyLabel);
  try {
    const response = await operation();
    replaceCommercialItem(response.data);
    if (state.currentView === "whatsapp") renderWhatsApp();
    else renderCommercial();
    toast(successMessage);
  } catch (error) {
    if (error instanceof UiError && error.code === "commercial_version_conflict") await loadData();
    toast(friendlyError(error), "error");
  } finally {
    if (button) setButtonBusy(button, false, "");
  }
}

async function saveCommercialStage(item, stage, button) {
  if (stage === item.opportunity.stage) {
    toast("La etapa ya está seleccionada.");
    return;
  }
  if (!state.localDemo && stage === "SENA_VALIDADA") {
    toast("La validación real de seña se habilitará en su propio corte.", "error");
    return;
  }
  const routePrefix = state.localDemo ? "/v1/local/commercial" : "/v1/commercial";
  await runCommercialMutation(button, "Guardando…", () => api(
    `${routePrefix}/workspace/${encodeURIComponent(item.id)}/stage`,
    {
      method: "PATCH",
      body: JSON.stringify({
        stage,
        expectedVersion: item.opportunity.version,
        reason: stage === "SENA_VALIDADA"
          ? "Seña ficticia validada manualmente en la demo local"
          : state.localDemo ? "Cambio manual desde la demo CRM local" : "Cambio manual desde SPORTEX",
      }),
    },
  ), `Etapa actualizada a ${stageLabel(stage)}.`);
}

async function saveCommercialNextAction(item, description, dueAt, button) {
  const routePrefix = state.localDemo ? "/v1/local/commercial" : "/v1/commercial";
  await runCommercialMutation(button, "Guardando…", () => api(
    `${routePrefix}/workspace/${encodeURIComponent(item.id)}/next-action`,
    {
      method: "PATCH",
      body: JSON.stringify({ description: description.trim(), dueAt, expectedVersion: item.opportunity.version }),
    },
  ), "Próxima acción guardada en el Core local.");
}

async function saveCommercialFollowUp(item, note, outcome, button) {
  const routePrefix = state.localDemo ? "/v1/local/commercial" : "/v1/commercial";
  await runCommercialMutation(button, "Registrando…", () => api(
    `${routePrefix}/workspace/${encodeURIComponent(item.id)}/follow-ups`,
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

function syncLeadStageFilter() {
  const select = $("#stage-filter");
  if (!select) return;
  const selected = select.value;
  select.replaceChildren(element("option", "", "Todas"));
  select.firstElementChild.value = "";
  for (const stage of configuredLeadStages()) {
    const option = element("option", "", stageLabel(stage));
    option.value = stage;
    select.append(option);
  }
  if (configuredLeadStages().includes(selected)) select.value = selected;
}

function renderCommercial() {
  $("#commercial-count-nav").textContent = String(state.commercial.length);
  $("#persistence-status").textContent = state.localDemo
    ? (state.config?.localCommercialPersistenceEnabled ? "GUARDADO LOCAL" : "MEMORIA")
    : "PILOTO DELTA";
  syncLeadStageFilter();

  const items = filteredCommercial();
  if (state.selectedCommercialId && !items.some((item) => item.id === state.selectedCommercialId)) state.selectedCommercialId = null;
  renderLeadList(items);
  renderLeadDetail(items.find((item) => item.id === state.selectedCommercialId) ?? null);
  $(".crm-workspace").classList.toggle("is-detail-open", state.mobileDetailOpen && Boolean(state.selectedCommercialId));
  renderToday();
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

const viewMeta = {
  whatsapp: ["Operación", "WhatsApp"],
  today: ["Operación diaria", "Hoy"],
  leads: ["Operación", "Leads"],
  orders: ["Operación", "Pedidos"],
  clients: ["Operación", "Clientes"],
  ads: ["Marketing", "Anuncios"],
  creatives: ["Marketing", "Creativos"],
  results: ["Marketing", "Resultados"],
  catalog: ["Administración", "Productos, precios y talles"],
  playbooks: ["Administración", "Procesos y respuestas rápidas"],
  suppliers: ["Administración", "Proveedores"],
  settings: ["Administración", "Configuración"],
};

function moduleCard(title, description, meta = "") {
  const card = element("article", "module-card");
  card.append(element("h2", "", title), element("p", "", description));
  if (meta) card.append(element("small", "", meta));
  return card;
}

function renderModule(name) {
  const content = $("#module-content");
  content.replaceChildren();
  const exact = state.commercial.filter((item) => item.attribution.classification === "META_EXACTO");
  const unknown = state.commercial.length - exact.length;
  const meta = viewMeta[name] || ["SPORTEX", "Módulo"];
  $("#module-kicker").textContent = meta[0];
  $("#module-title").textContent = meta[1];

  if (name === "ads") {
    $("#module-description").textContent = "De qué anuncio llegó cada conversación cuando existe evidencia.";
    const grouped = new Map();
    for (const item of exact) {
      const key = item.attribution.adId || item.attribution.adName;
      const group = grouped.get(key) || { name: item.attribution.adName, campaign: item.attribution.campaignName, count: 0 };
      group.count += 1;
      grouped.set(key, group);
    }
    const grid = element("div", "module-grid");
    for (const group of grouped.values()) grid.append(moduleCard(group.name || "Anuncio ficticio", `${group.count} conversaciones atribuidas`, group.campaign || "Campaña ficticia"));
    grid.append(moduleCard("Origen desconocido", `${unknown} conversaciones sin evidencia publicitaria`, "SPORTEX no inventa atribución"));
    content.append(grid);
    return;
  }

  if (name === "creatives") {
    $("#module-description").textContent = "Piezas que originaron conversaciones en esta muestra ficticia.";
    const grid = element("div", "creative-module-grid");
    const seen = new Set();
    for (const item of exact) {
      const creative = item.attribution.creative;
      const key = creative?.title || item.attribution.adId;
      if (seen.has(key)) continue;
      seen.add(key);
      const card = element("article", "creative-module-card");
      card.style.setProperty("--creative-color", creative?.accent || "#2457d6");
      card.append(
        element("span", "", creative?.format || "ANUNCIO"),
        element("h2", "", creative?.title || item.attribution.adName || "Creativo ficticio"),
        element("p", "", creative?.body || "Pieza de referencia para la atribución local."),
        element("small", "", item.attribution.adName || "Anuncio ficticio"),
      );
      grid.append(card);
    }
    content.append(grid);
    return;
  }

  if (name === "results") {
    $("#module-description").textContent = "Etapas, atribución y pérdidas separadas de la operación diaria.";
    const metrics = element("div", "results-metrics");
    const active = state.commercial.filter((item) => item.opportunity.stage !== "PERDIDO").length;
    const deposits = state.commercial.filter((item) => item.opportunity.stage === "SENA_VALIDADA").length;
    metrics.append(
      moduleCard("Conversaciones", String(state.commercial.length), state.localDemo ? "Muestra local" : "Conversaciones atribuidas"),
      moduleCard("Activas", String(active), "Sin las pérdidas"),
      moduleCard("Origen exacto", String(exact.length), `${unknown} desconocidas`),
      moduleCard("Seña validada", String(deposits), "Aún sin pedido vinculado"),
    );
    const funnel = element("section", "results-panel");
    funnel.append(element("h2", "", "Embudo comercial"));
    const board = element("div", "stage-board");
    renderStageBoard(board);
    funnel.append(board);
    const losses = element("section", "results-panel");
    losses.append(element("h2", "", "Motivos de pérdida"));
    for (const item of state.commercial.filter((entry) => entry.opportunity.stage === "PERDIDO")) {
      const row = element("div", "result-row");
      row.append(element("strong", "", item.lead.teamName), element("span", "", item.opportunity.lossReason || "Sin motivo"));
      losses.append(row);
    }
    content.append(metrics, funnel, losses);
    return;
  }

  if (name === "catalog") {
    $("#module-description").textContent = "Referencias ficticias que ayudan a responder sin inventar datos.";
    const sizes = [...new Set(state.commercial.flatMap((item) => item.lead.sizeBreakdown.map((size) => size.size)))];
    const grid = element("div", "module-grid");
    grid.append(
      moduleCard("Camisetas", "Producto disponible en la muestra local.", "Precio: por confirmar antes de cotizar"),
      moduleCard("Equipos completos", "Camiseta, short y medias como interés comercial.", "Precio: por confirmar antes de cotizar"),
      moduleCard("Tabla de talles", sizes.join(" · "), "Se agrega al borrador desde Leads"),
    );
    content.append(grid);
    return;
  }

  if (name === "playbooks") {
    $("#module-description").textContent = "Guías breves para avanzar una conversación con lenguaje natural.";
    const grid = element("div", "playbook-list");
    for (const [title, goal, next] of [
      ["Primer contacto", "Entender producto, cantidad y fecha", "Pedir solo lo que falta"],
      ["Consulta por talles", "Aclarar adulto o niño", "Preparar la tabla correcta"],
      ["Cotización sin respuesta", "Confirmar recepción sin presionar", "Dejar fecha de revisión"],
      ["Seña detectada", "Revisar evidencia y cotización", "Validación humana obligatoria"],
    ]) grid.append(moduleCard(title, goal, next));
    content.append(grid);
    return;
  }

  if (name === "suppliers") {
    $("#module-description").textContent = "Registro ficticio para entender qué información necesitará producción.";
    const grid = element("div", "module-grid");
    grid.append(
      moduleCard("Proveedor de tela A", "Tela sublimada y referencias de color.", "Ficticio · sin canal conectado"),
      moduleCard("Taller Norte", "Corte y confección de camisetas.", "Ficticio · sin mensajes"),
      moduleCard("Medias Sur", "Medias por color y cantidad.", "Ficticio · sin pedidos"),
    );
    content.append(grid);
    return;
  }

  if (!state.localDemo) {
    $("#module-description").textContent = "Capacidades habilitadas para este release del Piloto Delta.";
    const pilotGrid = element("div", "module-grid");
    pilotGrid.append(
      moduleCard("Entorno", "Piloto Delta", "Datos y permisos del tenant activo"),
      moduleCard("WhatsApp", state.config?.evolutionIngressEnabled ? "Recepción habilitada" : "Recepción no habilitada", state.config?.whatsappUnreadEnabled ? "No leídos disponibles" : "Estado no informado en esta pantalla"),
      moduleCard("Operación", "Leads y pedidos gestionados desde SPORTEX", "Sin afirmar estado de servicios externos"),
    );
    content.append(pilotGrid);
    return;
  }

  $("#module-description").textContent = "Controles de esta demo local, sin conexiones ni datos reales.";
  const grid = element("div", "module-grid");
  grid.append(
    moduleCard("Datos locales", state.config?.localCommercialPersistenceEnabled ? "Los cambios ficticios se conservan al reiniciar." : "Los cambios viven en memoria.", "18 leads ficticios"),
    moduleCard("Conexiones", "Evolution, Meta, Chatwoot y Supabase remoto están desconectados.", "Sin mensajes ni deploy"),
  );
  const reset = element("button", "button button--primary", "Restaurar los 18 datos iniciales");
  reset.type = "button";
  reset.addEventListener("click", openResetDemoDialog);
  const resetPanel = element("section", "settings-reset");
  resetPanel.append(element("h2", "", "Restaurar la muestra"), element("p", "", "Descarta únicamente cambios ficticios de esta computadora y recupera la semilla inicial."), reset);
  content.append(grid, resetPanel);
}

function openMobileMenu() {
  $("#app-sidebar").classList.add("is-open");
  $("#sidebar-scrim").hidden = false;
  document.body.classList.add("menu-open");
}

function closeMobileMenu() {
  $("#app-sidebar").classList.remove("is-open");
  $("#sidebar-scrim").hidden = true;
  document.body.classList.remove("menu-open");
}

function switchView(name, { reload = true } = {}) {
  if (name === "commercial") name = "leads";
  if (!OPERATIONAL_VIEWS.has(name)) name = "whatsapp";
  const previousView = state.currentView;
  state.currentView = name;
  persistOperationalView(name);
  if (name === "whatsapp" && previousView !== "whatsapp") {
    state.selectedCommercialId = null;
    state.whatsappDetailsOpen = false;
    state.mobileWhatsappDetailOpen = false;
  }
  $("#today-view").hidden = name !== "today";
  $("#whatsapp-view").hidden = name !== "whatsapp";
  $("#commercial-view").hidden = name !== "leads";
  $("#orders-view").hidden = name !== "orders";
  $("#clients-view").hidden = name !== "clients";
  const isModule = false;
  $("#local-demo-actions").hidden = true;
  $("#new-order-button").hidden = state.localDemo || name !== "orders";
  const meta = viewMeta[name] || ["SPORTEX", name];
  $("#topbar-kicker").textContent = meta[0];
  $("#topbar-title").textContent = meta[1];
  $$(".nav-item").forEach((button) => button.classList.toggle("is-active", button.dataset.view === name));
  if (name === "today") renderToday();
  if (name === "whatsapp") renderWhatsApp();
  if (name === "leads") renderCommercial();
  if (reload) void loadData({ activeOnly: true }).catch((error) => console.warn("SPORTEX view load failed", error));
  if (name === "whatsapp") startLiveRefresh();
  else stopLiveRefresh();
  closeMobileMenu();
  window.scrollTo({ top: 0, behavior: "auto" });
}

function openStageConfiguration(board) {
  const dialog = element("dialog", "sheet-dialog stage-config-dialog");
  const form = element("form");
  const header = element("header", "sheet-head");
  header.append(element("div", "", board === "lead" ? "Columnas de Leads" : "Columnas de Pedidos"));
  const close = element("button", "icon-button", "×"); close.type = "button"; close.addEventListener("click", () => dialog.close()); header.append(close);
  const list = element("div", "stage-config-list");
  const definitions = [...state.stageDefinitions[board]].sort((left, right) => left.position - right.position);
  const refresh = async () => {
    await loadData();
    dialog.close();
    openStageConfiguration(board);
  };
  for (const definition of definitions) {
    const row = element("div", "stage-config-row");
    const input = element("input"); input.value = definition.name; input.maxLength = 80;
    const save = element("button", "button button--quiet", "Guardar"); save.type = "button";
    save.addEventListener("click", async () => {
      await api(`/v1/stage-definitions/${board}/${encodeURIComponent(definition.id)}`, {
        method: "PUT", body: JSON.stringify({ name: input.value.trim(), position: definition.position, terminal: definition.terminal }),
      });
      await refresh();
    });
    const moveEarlier = element("button", "icon-button", "↑"); moveEarlier.type = "button"; moveEarlier.title = "Mover antes";
    const moveLater = element("button", "icon-button", "↓"); moveLater.type = "button"; moveLater.title = "Mover después";
    const index = definitions.indexOf(definition);
    moveEarlier.disabled = index === 0; moveLater.disabled = index === definitions.length - 1;
    const reorder = async (direction) => {
      await api(`/v1/stage-definitions/${board}/${encodeURIComponent(definition.id)}/reorder`, {
        method: "POST", body: JSON.stringify({ direction }),
      });
      await refresh();
    };
    moveEarlier.addEventListener("click", () => void reorder("earlier"));
    moveLater.addEventListener("click", () => void reorder("later"));
    const remove = element("button", "button button--danger", "Eliminar"); remove.type = "button";
    remove.disabled = definitions.length <= 1;
    remove.addEventListener("click", async () => {
      const destination = definitions.find((candidate) => candidate.id !== definition.id);
      if (!destination) return;
      const confirmed = window.confirm(`Las tarjetas de “${definition.name}” pasarán a “${destination.name}”. ¿Eliminar columna?`);
      if (!confirmed) return;
      await api(`/v1/stage-definitions/${board}/${encodeURIComponent(definition.id)}`, {
        method: "DELETE", body: JSON.stringify({ replacementId: destination.id }),
      });
      await refresh();
    });
    row.append(input, moveEarlier, moveLater, save, remove); list.append(row);
  }
  const addRow = element("div", "stage-config-add");
  const addName = element("input"); addName.placeholder = "Nombre de nueva columna"; addName.maxLength = 80;
  const add = element("button", "button button--primary", "Agregar columna");
  add.type = "button";
  add.addEventListener("click", async () => {
    const name = addName.value.trim();
    if (name.length < 2) { addName.focus(); return; }
    const id = `CUSTOM_${crypto.randomUUID().replaceAll("-", "_").slice(0, 24).toUpperCase()}`;
    const position = Math.max(0, ...definitions.map((definition) => definition.position)) + 10;
    await api(`/v1/stage-definitions/${board}/${id}`, {
      method: "PUT", body: JSON.stringify({ name, position, terminal: false }),
    });
    await refresh();
  });
  addRow.append(addName, add);
  form.append(header, list, addRow);
  dialog.append(form); dialog.addEventListener("close", () => dialog.remove(), { once: true }); document.body.append(dialog); dialog.showModal();
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
  try {
    await loadSession();
  } catch (error) {
    if (!state.refreshToken) throw error;
    await refreshAccessToken();
    await loadSession();
  }
  showApp();
  switchView(state.currentView, { reload: false });
  try {
    await loadData({ activeOnly: true });
  } catch (error) {
    // Una falla puntual de datos no invalida una sesión que ya fue comprobada.
    console.warn("SPORTEX initial workspace load failed", error);
    toast("Tu sesión sigue abierta. No pudimos actualizar este panel; reintentamos al cambiar de pestaña.", "error");
  }
}

async function initialize() {
  try {
    const response = await fetch("/v1/public-config");
    state.config = (await jsonResponse(response)).data;
    state.localWhatsappSimulation = Boolean(state.config.localWhatsAppSimulationEnabled);
    state.commercialWorkspace = Boolean(state.config.commercialWorkspaceEnabled);
    state.realWhatsappOutbound = Boolean(state.config.evolutionOutboundEnabled);
    const environmentLabel = state.config.environment === "staging"
      ? "PILOTO DELTA"
      : state.config.environment.toUpperCase();
    $("#release-label").textContent = `${environmentLabel} · ${state.config.release.slice(0, 7)}`;
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
  } catch (error) {
    // Sólo se descarta la sesión si Core confirmó que ya no es válida. Un 403,
    // un corte temporal o un fallo de carga no debe mandar al operador al login.
    if (error instanceof UiError && error.code === "authentication_required") {
      clearSession();
      showLogin();
      $("#login-error").textContent = friendlyError(error);
      return;
    }
    showApp();
    switchView(state.currentView, { reload: false });
    toast(friendlyError(error), "error");
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
$$('[data-orders-view]').forEach((button) => button.addEventListener("click", () => {
  state.ordersView = button.dataset.ordersView;
  renderOrders();
}));
[$("#lead-search"), $("#stage-filter"), $("#product-filter"), $("#attribution-filter")]
  .forEach((control) => control.addEventListener("input", () => {
    state.mobileDetailOpen = false;
    renderCommercial();
  }));
$("#clear-filters").addEventListener("click", clearCommercialFilters);
$("#lead-stage-config").addEventListener("click", () => openStageConfiguration("lead"));
$("#order-stage-config").addEventListener("click", () => openStageConfiguration("order"));
$("#whatsapp-search").addEventListener("input", () => {
  state.mobileWhatsappDetailOpen = false;
  renderWhatsApp();
});
$("#whatsapp-unread-filter").addEventListener("click", () => {
  state.whatsappUnreadOnly = !state.whatsappUnreadOnly;
  state.mobileWhatsappDetailOpen = false;
  state.selectedCommercialId = null;
  renderWhatsApp();
});
$("#reset-demo-button").addEventListener("click", openResetDemoDialog);
$("#reset-confirmation").addEventListener("change", (event) => {
  $("#confirm-reset-button").disabled = !event.currentTarget.checked;
});
$("#confirm-reset-button").addEventListener("click", resetCommercialDemo);
$$(".nav-item").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.view)));
$$('[data-today-filter]').forEach((button) => button.addEventListener("click", () => {
  state.todayFilter = button.dataset.todayFilter;
  renderToday();
}));
$("#mobile-menu-button").addEventListener("click", openMobileMenu);
$("#sidebar-close").addEventListener("click", closeMobileMenu);
$("#sidebar-scrim").addEventListener("click", closeMobileMenu);
$$("input[name=clientMode]").forEach((input) => input.addEventListener("change", syncClientMode));
$("#order-client").addEventListener("change", syncTeamFromClient);
$("#save-order-button").addEventListener("click", saveOrder);
$("#logout-button").addEventListener("click", logout);
$("#account-button").addEventListener("click", () => openPasswordDialog(false));
$("#theme-toggle").addEventListener("click", toggleTheme);
$("#password-save").addEventListener("click", savePassword);
$("#password-dialog").addEventListener("cancel", (event) => {
  if (state.passwordForced) event.preventDefault();
});
$("#password-dialog").addEventListener("close", () => {
  if (state.passwordForced) window.setTimeout(() => $("#password-dialog").showModal(), 0);
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopLiveRefresh();
  else if (state.currentView === "whatsapp") startLiveRefresh();
});

void initialize();
