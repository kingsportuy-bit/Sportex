const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const state = {
  config: null,
  token: sessionStorage.getItem("sportex_access_token"),
  refreshToken: sessionStorage.getItem("sportex_refresh_token"),
  session: null,
  clients: [],
  orders: [],
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
  return new Intl.DateTimeFormat("es-UY", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
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
  $("#tenant-name").textContent = state.session.tenantName;
  $("#account-email").textContent = state.session.email || "Cuenta";
  $("#account-initials").textContent = initials(state.session.email || state.session.tenantName);
  if (state.session.passwordChangeRequired) openPasswordDialog(true);
}

async function loadData() {
  const [clients, orders] = await Promise.all([api("/v1/clients"), api("/v1/orders")]);
  state.clients = clients.data;
  state.orders = orders.data;
  renderClients();
  renderOrders();
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
  $("#orders-view").hidden = name !== "orders";
  $("#clients-view").hidden = name !== "clients";
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
