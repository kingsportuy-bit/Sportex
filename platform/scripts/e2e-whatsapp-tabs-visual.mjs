import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { platform, release } from "node:os";
import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const frontendDirectory = resolve(projectRoot, "frontend");

function parseArguments(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith("--")) throw new Error(`Argumento inválido: ${argument}`);
    const key = argument.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Falta valor para --${key}`);
    options[key] = value;
    index += 1;
  }
  return options;
}

async function sha256File(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

async function verifyReferenceSeal(fixturePath, fixture) {
  const sealPath = resolve(projectRoot, fixture.reference.sealManifestPath);
  const seal = JSON.parse(await readFile(sealPath, "utf8"));
  assert.equal(seal.schemaVersion, 1);
  assert.equal(seal.authority, "user_supplied_target");
  assert.equal(seal.sealedBeforeUiEdit, true);
  assert.deepEqual(seal.canonicalCrop.roi, fixture.reference.crop);
  assert.equal(resolve(projectRoot, seal.canonicalCrop.path), resolve(projectRoot, fixture.reference.preparedPath));

  const verifiedArtifacts = {};
  for (const [name, artifact] of Object.entries(seal.sealedArtifacts)) {
    assert.equal(typeof artifact.path, "string", `${name}: falta path sellado`);
    assert.match(artifact.sha256, /^[a-f0-9]{64}$/, `${name}: hash sellado inválido`);
    const absolutePath = resolve(projectRoot, artifact.path);
    const actualHash = await sha256File(absolutePath);
    assert.equal(actualHash, artifact.sha256, `${name}: el artefacto cambió después del sellado`);
    verifiedArtifacts[name] = { path: absolutePath, sha256: actualHash };
  }
  assert.equal(verifiedArtifacts.fixture.path, fixturePath);
  assert.equal(verifiedArtifacts.fixture.sha256, await sha256File(fixturePath));
  assert.equal(verifiedArtifacts.e2eHarness.path, fileURLToPath(import.meta.url));
  assert.equal(seal.canonicalCrop.sha256, fixture.reference.preparedSha256);
  assert.equal(seal.canonicalCrop.sha256, await sha256File(resolve(projectRoot, seal.canonicalCrop.path)));
  return { path: sealPath, sha256: await sha256File(sealPath), artifacts: verifiedArtifacts };
}

function canonicalRequestKey(method, urlValue) {
  const url = new URL(urlValue);
  const entries = [...url.searchParams.entries()].sort(([leftKey, leftValue], [rightKey, rightValue]) =>
    leftKey.localeCompare(rightKey) || leftValue.localeCompare(rightValue));
  const search = entries.length
    ? `?${entries.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&")}`
    : "";
  return `${method.toUpperCase()} ${url.pathname}${search}`;
}

function validateFixture(fixture) {
  assert.equal(fixture.$schema, "sportex.whatsapp-tabs-visual-fixture.v1");
  assert.equal(fixture.capture.viewport.width, fixture.reference.sourceWidth);
  assert.equal(fixture.capture.viewport.height, fixture.reference.sourceHeight);
  assert.equal(fixture.capture.deviceScaleFactor, 1);
  assert.equal(fixture.capture.coldProcesses, 3);
  assert.equal(fixture.comparison.ssim.windowSize, 11);
  assert.equal(fixture.comparison.ssim.sigma, 1.5);
  assert.equal(fixture.comparison.components.connectivity, 8);
  assert.equal(fixture.stages.length, 7);
  assert.equal(typeof fixture.reference.preparedPath, "string");
  assert.match(fixture.reference.preparedSha256, /^[a-f0-9]{64}$/);
  assert.equal(typeof fixture.reference.sealManifestPath, "string");
  assert.equal(fixture.stages[0].id, "ALL");
  const configuredTotal = fixture.stages.slice(1).reduce((sum, stage) => sum + stage.count, 0);
  assert.equal(configuredTotal, fixture.stages[0].count);
  const crop = fixture.reference.crop;
  assert.ok(crop.x >= 0 && crop.y >= 0 && crop.width > 0 && crop.height > 0);
  assert.ok(crop.x + crop.width <= fixture.reference.sourceWidth);
  assert.ok(crop.y + crop.height <= fixture.reference.sourceHeight);
}

function buildCommercialItems(fixture) {
  const stageIds = fixture.stages.slice(1).map((stage) => stage.id);
  const items = [];
  let sequence = 0;
  for (const stage of fixture.stages.slice(1)) {
    for (let stageIndex = 0; stageIndex < stage.count; stageIndex += 1) {
      sequence += 1;
      const suffix = String(sequence).padStart(2, "0");
      const timestamp = new Date(Date.parse(fixture.clockUtc) - sequence * 60_000).toISOString();
      items.push({
        id: `fixture-workspace-${suffix}`,
        attribution: {
          classification: "DESCONOCIDO",
          source: "FIXTURE_LOCAL",
          adId: null,
          adName: null,
          campaignName: null,
          creative: null,
        },
        conversation: {
          id: `fixture-conversation-${suffix}`,
          contactName: `${fixture.data.contactPrefix} ${suffix}`,
          normalizedPhone: null,
          firstContactAt: timestamp,
          lastActivityAt: timestamp,
          unreadCount: 0,
          messages: [{
            id: `fixture-message-${suffix}`,
            provider: "FIXTURE_LOCAL",
            providerMessageId: `fixture-provider-message-${suffix}`,
            direction: "CLIENT",
            occurredAt: timestamp,
            receivedAt: timestamp,
            contentType: "TEXT",
            text: fixture.data.messageText,
            media: null,
            evidenceRef: "fixture-only",
            sourceKind: "MANUAL",
            fixtureOnly: true,
          }],
          timeline: [],
        },
        lead: {
          teamName: `${fixture.data.teamPrefix} ${suffix}`,
          productType: fixture.data.productType,
          quantity: null,
          sizeBreakdown: [],
          requestedDeliveryAt: null,
          colors: [],
          personalization: [],
          confirmedInfo: [],
          missingInfo: ["Cantidad"],
        },
        opportunity: {
          stage: stage.id,
          version: 1,
          nextAction: fixture.data.nextAction,
          nextActionDueAt: null,
          allowedStageTransitions: stageIds.filter((candidate) => candidate !== stage.id),
          quote: null,
          lossReason: stage.id === "PERDIDO" ? "Cierre ficticio" : null,
          depositValidation: null,
          coreConversion: null,
        },
      });
    }
  }
  return items;
}

function buildApiResponses(fixture, commercialItems) {
  const leadStages = fixture.stages.slice(1).map((stage, index) => ({
    id: stage.id,
    name: stage.label,
    position: index + 1,
    version: 1,
    active: true,
  }));
  const correlation = { correlationId: "fixture-correlation-id" };
  return new Map([
    ["GET /v1/public-config", { data: fixture.api.publicConfig, meta: correlation }],
    ["GET /v1/session", { data: fixture.api.session, meta: correlation }],
    ["GET /v1/clients", { data: [], meta: correlation }],
    ["GET /v1/orders", { data: [], meta: correlation }],
    ["GET /v1/stage-definitions/lead", { data: leadStages, meta: correlation }],
    ["GET /v1/stage-definitions/order", { data: [], meta: correlation }],
    ["GET /v1/commercial/conversations?limit=25", {
      data: commercialItems,
      meta: { ...correlation, nextCursor: null },
    }],
  ]);
}

function contentType(path) {
  return {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".ico": "image/x-icon",
    ".js": "text/javascript; charset=utf-8",
    ".png": "image/png",
  }[extname(path)] ?? "application/octet-stream";
}

async function startStaticServer(allowedPaths) {
  const files = new Map([
    ["/", resolve(frontendDirectory, "index.html")],
    ["/index.html", resolve(frontendDirectory, "index.html")],
    ["/styles.css", resolve(frontendDirectory, "styles.css")],
    ["/app.js", resolve(frontendDirectory, "app.js")],
    ["/favicon.ico", resolve(frontendDirectory, "favicon.ico")],
    ["/assets/sportex-favicon.png", resolve(frontendDirectory, "assets", "sportex-favicon.png")],
    ["/assets/sportex-logo.png", resolve(frontendDirectory, "assets", "sportex-logo.png")],
  ]);
  assert.deepEqual([...files.keys()].sort(), [...allowedPaths].sort());
  const server = createServer(async (request, response) => {
    try {
      if (request.method !== "GET") {
        response.writeHead(405).end();
        return;
      }
      const pathname = new URL(request.url, "http://127.0.0.1").pathname;
      const filePath = files.get(pathname);
      if (!filePath) {
        response.writeHead(404).end();
        return;
      }
      const body = await readFile(filePath);
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-length": body.length,
        "content-type": contentType(filePath),
        "x-content-type-options": "nosniff",
      });
      response.end(body);
    } catch (error) {
      response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      response.end(error.message);
    }
  });
  await new Promise((accept, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", accept);
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((accept, reject) => server.close((error) => error ? reject(error) : accept())),
  };
}

async function configureContext(context, baseUrl, fixture, apiResponses, audit) {
  const baseOrigin = new URL(baseUrl).origin;
  const allowedStaticPaths = new Set(fixture.allowedRequests.staticPaths);
  const allowedApiRoutes = new Set(fixture.allowedRequests.apiRoutes);
  await context.addInitScript(({ clockUtc }) => {
    const NativeDate = Date;
    const fixedTime = NativeDate.parse(clockUtc);
    class FixedDate extends NativeDate {
      constructor(...argumentsList) {
        super(...(argumentsList.length ? argumentsList : [fixedTime]));
      }

      static now() {
        return fixedTime;
      }
    }
    Object.setPrototypeOf(FixedDate, NativeDate);
    globalThis.Date = FixedDate;
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.dataset.visualQa = "deterministic-motion";
      style.textContent = "*,*::before,*::after{animation:none!important;caret-color:transparent!important;scroll-behavior:auto!important;transition:none!important}";
      document.head.append(style);
    }, { once: true });
  }, { clockUtc: fixture.clockUtc });
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method().toUpperCase();
    if (url.origin !== baseOrigin) {
      audit.unexpectedRequests.push({ method, origin: url.origin, path: url.pathname, resourceType: request.resourceType() });
      await route.abort("blockedbyclient");
      return;
    }
    if (url.pathname.startsWith("/v1/")) {
      const key = canonicalRequestKey(method, url.href);
      const payload = apiResponses.get(key);
      if (!allowedApiRoutes.has(key) || !payload) {
        audit.unexpectedRequests.push({ method, origin: url.origin, path: `${url.pathname}${url.search}`, resourceType: request.resourceType() });
        await route.abort("blockedbyclient");
        return;
      }
      audit.requests.push({ method, path: `${url.pathname}${url.search}`, kind: "fixture", status: 200 });
      await route.fulfill({
        status: 200,
        contentType: "application/json; charset=utf-8",
        headers: { "cache-control": "no-store" },
        body: JSON.stringify(payload),
      });
      return;
    }
    if (method !== "GET" || !allowedStaticPaths.has(url.pathname)) {
      audit.unexpectedRequests.push({ method, origin: url.origin, path: `${url.pathname}${url.search}`, resourceType: request.resourceType() });
      await route.abort("blockedbyclient");
      return;
    }
    audit.requests.push({ method, path: `${url.pathname}${url.search}`, kind: "static" });
    await route.continue();
  });
}

function createAudit(name) {
  return {
    name,
    requests: [],
    unexpectedRequests: [],
    consoleErrors: [],
    pageErrors: [],
  };
}

function bindPageAudit(page, audit) {
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      audit.consoleErrors.push({ type: message.type(), text: message.text().slice(0, 500) });
    }
  });
  page.on("pageerror", (error) => audit.pageErrors.push({ name: error.name, message: error.message.slice(0, 500) }));
}

async function waitForVisualStability(page, fixture) {
  await page.locator("#app-view").waitFor({ state: "visible" });
  const allStage = fixture.stages[0];
  await page.locator(`.whatsapp-process-tab[data-stage="${allStage.id}"]`).waitFor({ state: "visible" });
  await page.waitForFunction(({ label, count }) => {
    const button = document.querySelector('.whatsapp-process-tab[data-stage="ALL"]');
    return button?.getAttribute("aria-label") === `${label}: ${count} conversaciones`
      && document.querySelector(".whatsapp-tabbed-panel-frame__active-outline")?.getAttribute("d");
  }, { label: allStage.label, count: allStage.count });
  await page.evaluate(async (fontFamilies) => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.complete
      ? Promise.resolve()
      : new Promise((accept, reject) => {
        image.addEventListener("load", accept, { once: true });
        image.addEventListener("error", reject, { once: true });
      })));
    for (const family of fontFamilies) {
      if (!document.fonts.check(`12px "${family}"`)) throw new Error(`Fuente no disponible: ${family}`);
    }
    await new Promise((accept) => requestAnimationFrame(() => requestAnimationFrame(accept)));
  }, fixture.capture.fontFamilies);
}

async function openFixturePage(browser, server, fixture, apiResponses, viewport, audit) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    screen: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: fixture.capture.deviceScaleFactor,
    locale: fixture.capture.locale,
    timezoneId: fixture.capture.timezoneId,
    colorScheme: fixture.capture.colorScheme,
    reducedMotion: "reduce",
    serviceWorkers: "block",
  });
  await configureContext(context, server.baseUrl, fixture, apiResponses, audit);
  const page = await context.newPage();
  bindPageAudit(page, audit);
  await page.goto(server.baseUrl, { waitUntil: "domcontentloaded" });
  await waitForVisualStability(page, fixture);
  return { context, page };
}

function assertNear(actual, expected, tolerance, label) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: esperado ${expected}±${tolerance}; recibido ${actual}`);
}

async function collectGeometry(page) {
  return page.evaluate(() => {
    const rect = (node) => {
      const value = node.getBoundingClientRect();
      return { x: value.x, y: value.y, width: value.width, height: value.height, top: value.top, right: value.right, bottom: value.bottom, left: value.left };
    };
    const frame = document.querySelector("#whatsapp-tabbed-panel-frame");
    const shell = document.querySelector("#whatsapp-view .whatsapp-workspace-shell");
    const stageBar = document.querySelector("#whatsapp-view .whatsapp-stage-bar");
    const rail = document.querySelector("#whatsapp-stage-tabs");
    const workspace = document.querySelector("#whatsapp-workspace");
    const active = rail.querySelector(".whatsapp-process-tab.is-active");
    const surface = frame.querySelector(".whatsapp-tabbed-panel-frame__surface");
    const activeOutline = frame.querySelector(".whatsapp-tabbed-panel-frame__active-outline");
    const master = document.querySelector("#whatsapp-master");
    const detail = document.querySelector("#whatsapp-detail");
    const activePathData = activeOutline?.getAttribute("d") ?? "";
    const pathNodes = [...frame.querySelectorAll("path")];
    const paths = pathNodes.map((path) => {
      const style = getComputedStyle(path);
      return {
        className: path.getAttribute("class") ?? "",
        d: path.getAttribute("d") ?? "",
        fill: style.fill,
        stroke: style.stroke,
        strokeWidth: style.strokeWidth,
        filter: style.filter,
        opacity: style.opacity,
      };
    });
    const activeLeft = active.getBoundingClientRect().left - shell.getBoundingClientRect().left;
    const activeLength = activeOutline?.getTotalLength() ?? 0;
    const activeBox = activeOutline?.getBBox();
    const activeShape = activeOutline && activeBox && activeLength > 0 ? {
      length: activeLength,
      box: { x: activeBox.x - activeLeft, y: activeBox.y, width: activeBox.width, height: activeBox.height },
      absoluteBox: { x: activeBox.x, y: activeBox.y, width: activeBox.width, height: activeBox.height },
      samples: Array.from({ length: 33 }, (_, index) => {
        const point = activeOutline.getPointAtLength(activeLength * index / 32);
        return { x: point.x - activeLeft, y: point.y };
      }),
    } : null;
    const joinPoint = frame.createSVGPoint();
    joinPoint.x = activeLeft + active.getBoundingClientRect().width / 2;
    joinPoint.y = workspace.getBoundingClientRect().top - shell.getBoundingClientRect().top;
    const joinStrokeHits = pathNodes.filter((path) => {
      const style = getComputedStyle(path);
      return style.stroke !== "none" && typeof path.isPointInStroke === "function" && path.isPointInStroke(joinPoint);
    }).map((path) => path.getAttribute("class") ?? "");
    const tokenSignature = paths.map(({ className, fill, stroke, strokeWidth, filter, opacity }) =>
      ({ className, fill, stroke, strokeWidth, filter, opacity }))
      .sort((left, right) => left.className.localeCompare(right.className));
    return {
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        clientHeight: document.documentElement.clientHeight,
        scrollHeight: document.documentElement.scrollHeight,
      },
      shell: rect(shell),
      stageBar: rect(stageBar),
      rail: { ...rect(rail), scrollWidth: rail.scrollWidth, clientWidth: rail.clientWidth, overflowX: getComputedStyle(rail).overflowX },
      workspace: rect(workspace),
      active: { ...rect(active), stage: active.dataset.stage, ariaPressed: active.getAttribute("aria-pressed") },
      tabs: [...rail.querySelectorAll(".whatsapp-process-tab")].map((button) => ({
        ...rect(button),
        stage: button.dataset.stage,
        active: button.classList.contains("is-active"),
        ariaPressed: button.getAttribute("aria-pressed"),
        ariaLabel: button.getAttribute("aria-label"),
      })),
      frame: {
        viewBox: frame.getAttribute("viewBox"),
        paths,
        activePathData,
        activeShape,
        joinStrokeHits,
        tokenSignature,
        activePathLayerCount: paths.filter((path) => path.d === activePathData).length,
        blurPrimitiveCount: frame.querySelectorAll("feGaussianBlur").length,
        filteredActiveLayerCount: paths.filter((path) => path.d === activePathData && path.filter !== "none").length,
        surfaceFill: surface ? getComputedStyle(surface).fill : "",
      },
      surfaces: {
        master: getComputedStyle(master).backgroundColor,
        detail: getComputedStyle(detail).backgroundColor,
      },
      fonts: {
        activeName: getComputedStyle(active.querySelector(".whatsapp-process-tab__name")).fontFamily,
        activeCount: getComputedStyle(active.querySelector(".whatsapp-process-tab__count")).fontFamily,
      },
    };
  });
}

function assertSharedStateGeometry(snapshot, fixture, label = snapshot.active.stage) {
  const tolerance = fixture.geometry.domTolerance;
  assert.equal(snapshot.tabs.length, fixture.stages.length);
  assert.equal(snapshot.tabs.filter((tab) => tab.active).length, 1);
  assert.equal(snapshot.tabs.filter((tab) => tab.ariaPressed === "true").length, 1);
  assert.equal(snapshot.active.ariaPressed, "true");
  assertNear(snapshot.active.height, fixture.geometry.tabHeight, tolerance, `${label}: altura de pestaña activa`);
  assertNear(snapshot.active.width, fixture.geometry.tabWidth, tolerance, `${label}: ancho de pestaña activa`);
  assertNear(snapshot.workspace.top - snapshot.shell.top, fixture.geometry.tabHeight, tolerance, `${label}: inicio del panel`);
  assertNear(snapshot.active.bottom, snapshot.workspace.top, fixture.geometry.joinTolerance, `${label}: unión pestaña-panel`);
  assert.ok(snapshot.frame.activePathData.length > 0, "Falta el path activo");
  assert.ok(snapshot.frame.activeShape, `${label}: falta firma geométrica del path activo`);
  const viewBox = snapshot.frame.viewBox.split(/\s+/).map(Number);
  assert.equal(viewBox.length, 4, `${label}: viewBox inválido`);
  assert.ok(viewBox.every(Number.isFinite), `${label}: viewBox no numérico`);
  const [viewX, viewY, viewWidth, viewHeight] = viewBox;
  const activeBox = snapshot.frame.activeShape.absoluteBox;
  assert.ok(activeBox.x >= viewX - tolerance && activeBox.y >= viewY - tolerance
    && activeBox.x + activeBox.width <= viewX + viewWidth + tolerance
    && activeBox.y + activeBox.height <= viewY + viewHeight + tolerance,
  `${label}: el path activo queda recortado por el viewBox`);
  assert.ok(snapshot.frame.activePathLayerCount >= 3, `Se esperaban tres capas sobre el mismo path activo; recibido ${snapshot.frame.activePathLayerCount}`);
  assert.ok(snapshot.frame.blurPrimitiveCount >= 2 || snapshot.frame.filteredActiveLayerCount >= 2,
    `Se esperaban dos capas de halo; blur=${snapshot.frame.blurPrimitiveCount}, filtros=${snapshot.frame.filteredActiveLayerCount}`);
  assert.deepEqual(snapshot.frame.joinStrokeHits, [], `${label}: existe una línea o doble trazo bajo la pestaña activa`);
  assert.equal(snapshot.frame.surfaceFill, snapshot.surfaces.master);
  assert.equal(snapshot.surfaces.master, snapshot.surfaces.detail);
}

function assertEquivalentActiveShape(actual, expected, tolerance, label) {
  assertNear(actual.length, expected.length, tolerance, `${label}: longitud del path trasladado`);
  for (const property of ["x", "y", "width", "height"]) {
    assertNear(actual.box[property], expected.box[property], tolerance, `${label}: bbox.${property}`);
  }
  assert.equal(actual.samples.length, expected.samples.length);
  actual.samples.forEach((point, index) => {
    assertNear(point.x, expected.samples[index].x, tolerance, `${label}: muestra ${index}.x`);
    assertNear(point.y, expected.samples[index].y, tolerance, `${label}: muestra ${index}.y`);
  });
}

function assertCanonicalGeometry(snapshot, fixture) {
  const tolerance = fixture.geometry.domTolerance;
  assert.equal(snapshot.viewport.width, fixture.capture.viewport.width);
  assert.equal(snapshot.viewport.height, fixture.capture.viewport.height);
  assert.equal(snapshot.viewport.devicePixelRatio, fixture.capture.deviceScaleFactor);
  assertSharedStateGeometry(snapshot, fixture);
  assertNear(snapshot.rail.left - snapshot.shell.left, fixture.geometry.railGutter, tolerance, "gutter del rail");
  assert.ok(snapshot.document.scrollWidth <= snapshot.document.clientWidth + tolerance, "La página tiene overflow horizontal inesperado");
}

async function assertStageLabelsAndCounts(page, fixture) {
  const actual = await page.locator(".whatsapp-process-tab").evaluateAll((buttons) => buttons.map((button) => ({
    id: button.dataset.stage,
    label: button.querySelector(".whatsapp-process-tab__name")?.textContent,
    count: Number(button.querySelector(".whatsapp-process-tab__count")?.textContent),
    ariaLabel: button.getAttribute("aria-label"),
    ariaPressed: button.getAttribute("aria-pressed"),
  })));
  assert.deepEqual(actual.map(({ id, label, count }) => ({ id, label, count })),
    fixture.stages.map(({ id, label, count }) => ({ id, label, count })));
  for (const stage of fixture.stages) {
    const item = actual.find((candidate) => candidate.id === stage.id);
    assert.equal(item.ariaLabel, `${stage.label}: ${stage.count} conversaciones`);
    assert.ok(item.ariaPressed === "true" || item.ariaPressed === "false");
  }
}

async function assertAccessibility(page, fixture) {
  await assertStageLabelsAndCounts(page, fixture);
  const initial = await page.evaluate(() => {
    const rail = document.querySelector("#whatsapp-stage-tabs");
    const ids = [...document.querySelectorAll("[id]")].map((node) => node.id);
    return {
      railLabel: rail.getAttribute("aria-label"),
      duplicateIds: [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))],
      nativeButtons: [...rail.children].every((node) => node.tagName === "BUTTON" && node.getAttribute("type") === "button"),
    };
  });
  assert.equal(initial.railLabel, "Etapas del proceso comercial");
  assert.deepEqual(initial.duplicateIds, []);
  assert.equal(initial.nativeButtons, true);

  const first = fixture.stages[0].id;
  const second = fixture.stages[1].id;
  const third = fixture.stages[2].id;
  const last = fixture.stages.at(-1).id;
  await page.locator(`.whatsapp-process-tab[data-stage="${first}"]`).focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.stage), second, "ArrowRight no movió el foco");
  await page.keyboard.press("ArrowLeft");
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.stage), first, "ArrowLeft no movió el foco");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("End");
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.stage), last, "End no movió el foco");
  await page.keyboard.press("Home");
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.stage), first, "Home no movió el foco");
  await page.locator(`.whatsapp-process-tab[data-stage="${second}"]`).focus();
  await page.keyboard.press("Enter");
  await waitForVisualStability(page, fixture);
  assert.equal(await page.locator(".whatsapp-process-tab.is-active").getAttribute("data-stage"), second);
  await page.locator(`.whatsapp-process-tab[data-stage="${third}"]`).focus();
  await page.keyboard.press("Space");
  await waitForVisualStability(page, fixture);
  assert.equal(await page.locator(".whatsapp-process-tab.is-active").getAttribute("data-stage"), third);
  await page.locator(`.whatsapp-process-tab[data-stage="${first}"]`).click();
  await waitForVisualStability(page, fixture);
}

async function captureCanonicalMatrix(page, fixture, outputDirectory) {
  const matrixDirectory = resolve(outputDirectory, "matrix");
  await mkdir(matrixDirectory, { recursive: true });
  const matrix = [];
  let invariantReference = null;
  for (const [index, stage] of fixture.stages.entries()) {
    const locator = page.locator(`.whatsapp-process-tab[data-stage="${stage.id}"]`);
    await locator.scrollIntoViewIfNeeded();
    await locator.click();
    await waitForVisualStability(page, fixture);
    const activeStage = await page.locator(".whatsapp-process-tab.is-active").getAttribute("data-stage");
    assert.equal(activeStage, stage.id);
    const geometry = await collectGeometry(page);
    assertCanonicalGeometry(geometry, fixture);
    if (!invariantReference) {
      invariantReference = geometry;
    } else {
      assertEquivalentActiveShape(geometry.frame.activeShape, invariantReference.frame.activeShape,
        fixture.geometry.domTolerance, `${stage.id}: geometría trasladada`);
      assert.deepEqual(geometry.frame.tokenSignature, invariantReference.frame.tokenSignature,
        `${stage.id}: los tokens SVG cambiaron entre estados`);
    }
    const slug = `${String(index + 1).padStart(2, "0")}-${stage.id.toLowerCase()}`;
    const screenshot = resolve(matrixDirectory, `${slug}.png`);
    await page.screenshot({ path: screenshot, clip: fixture.reference.crop, animations: "disabled", caret: "hide" });
    matrix.push({
      stage: stage.id,
      label: stage.label,
      count: stage.count,
      screenshot,
      sha256: await sha256File(screenshot),
      geometry,
    });
  }
  return matrix;
}

async function inspectResponsive(page, fixture, viewport) {
  const baseline = await page.evaluate(() => {
    const rail = document.querySelector("#whatsapp-stage-tabs");
    const shell = document.querySelector("#whatsapp-view .whatsapp-workspace-shell");
    const workspace = document.querySelector("#whatsapp-workspace");
    const railStyle = getComputedStyle(rail);
    const shellRect = shell.getBoundingClientRect();
    const workspaceRect = workspace.getBoundingClientRect();
    return {
      documentClientWidth: document.documentElement.clientWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      railClientWidth: rail.clientWidth,
      railScrollWidth: rail.scrollWidth,
      railOverflowX: railStyle.overflowX,
      shell: { left: shellRect.left, right: shellRect.right, width: shellRect.width, height: shellRect.height },
      workspace: { left: workspaceRect.left, right: workspaceRect.right, width: workspaceRect.width, height: workspaceRect.height },
    };
  });
  assert.ok(baseline.documentScrollWidth <= baseline.documentClientWidth + 1, `${viewport.name}: overflow horizontal de página`);
  assert.ok(baseline.shell.left >= -1 && baseline.shell.right <= viewport.width + 1, `${viewport.name}: shell recortado`);
  assert.ok(baseline.workspace.left >= -1 && baseline.workspace.right <= viewport.width + 1, `${viewport.name}: panel recortado`);
  assert.ok(baseline.shell.height > 0 && baseline.workspace.height > 0, `${viewport.name}: panel sin altura`);
  assert.ok(["auto", "scroll"].includes(baseline.railOverflowX), `${viewport.name}: rail no desplazable`);
  for (const stage of fixture.stages) {
    const locator = page.locator(`.whatsapp-process-tab[data-stage="${stage.id}"]`);
    await locator.scrollIntoViewIfNeeded();
    await locator.click();
    await waitForVisualStability(page, fixture);
    const box = await page.locator(`.whatsapp-process-tab.is-active[data-stage="${stage.id}"]`).boundingBox();
    assert.ok(box && box.width > 0 && box.height > 0, `${viewport.name}: ${stage.id} no accesible`);
    assert.ok(box.x + box.width > 0 && box.x < viewport.width, `${viewport.name}: ${stage.id} fuera de viewport`);
    const geometry = await collectGeometry(page);
    assertSharedStateGeometry(geometry, fixture, `${viewport.name}/${stage.id}`);
  }
  return baseline;
}

async function runResponsiveMatrix(browser, server, fixture, apiResponses, outputDirectory, audits) {
  const responsiveDirectory = resolve(outputDirectory, "responsive");
  await mkdir(responsiveDirectory, { recursive: true });
  const results = [];
  for (const viewport of fixture.responsiveViewports) {
    const audit = createAudit(viewport.name);
    audits.push(audit);
    const { context, page } = await openFixturePage(browser, server, fixture, apiResponses, viewport, audit);
    try {
      await assertAccessibility(page, fixture);
      const baseline = await inspectResponsive(page, fixture, viewport);
      const screenshot = resolve(responsiveDirectory, `${viewport.name}.png`);
      await page.screenshot({ path: screenshot, fullPage: false, animations: "disabled", caret: "hide" });
      results.push({ ...viewport, baseline, screenshot, sha256: await sha256File(screenshot) });
      assert.deepEqual(audit.unexpectedRequests, []);
      assert.deepEqual(audit.consoleErrors, []);
      assert.deepEqual(audit.pageErrors, []);
    } finally {
      await context.close();
    }
  }
  return results;
}

async function launchChrome(executablePath) {
  return chromium.launch({
    executablePath,
    headless: true,
    args: [
      "--headless=new",
      "--disable-background-networking",
      "--disable-component-update",
      "--disable-default-apps",
      "--disable-domain-reliability",
      "--disable-features=MediaRouter,OptimizationHints,Translate",
      "--disable-sync",
      "--force-color-profile=srgb",
      "--force-device-scale-factor=1",
      "--font-render-hinting=none",
      "--metrics-recording-only",
      "--no-first-run",
      "--safebrowsing-disable-auto-update",
    ],
  });
}

async function runColdProcess(index, executablePath, server, fixture, apiResponses, outputDirectory, audits) {
  const browser = await launchChrome(executablePath);
  const audit = createAudit(`cold-${index}`);
  audits.push(audit);
  try {
    const browserVersion = browser.version();
    const { context, page } = await openFixturePage(
      browser,
      server,
      fixture,
      apiResponses,
      fixture.capture.viewport,
      audit,
    );
    try {
      await assertStageLabelsAndCounts(page, fixture);
      const geometry = await collectGeometry(page);
      assertCanonicalGeometry(geometry, fixture);
      const coldDirectory = resolve(outputDirectory, "cold");
      await mkdir(coldDirectory, { recursive: true });
      const cropScreenshot = resolve(coldDirectory, `cold-${index}-all.png`);
      await page.screenshot({ path: cropScreenshot, clip: fixture.reference.crop, animations: "disabled", caret: "hide" });
      let fullScreenshot = null;
      let matrix = null;
      let accessibility = null;
      let responsive = null;
      if (index === 1) {
        fullScreenshot = resolve(outputDirectory, "desktop-all-full.png");
        await page.screenshot({ path: fullScreenshot, fullPage: false, animations: "disabled", caret: "hide" });
        matrix = await captureCanonicalMatrix(page, fixture, outputDirectory);
        await assertAccessibility(page, fixture);
        accessibility = { status: "PASS", keyboard: ["ArrowLeft", "ArrowRight", "Home", "End", "Enter", "Space"] };
        responsive = await runResponsiveMatrix(browser, server, fixture, apiResponses, outputDirectory, audits);
      }
      assert.deepEqual(audit.unexpectedRequests, []);
      assert.deepEqual(audit.consoleErrors, []);
      assert.deepEqual(audit.pageErrors, []);
      const environment = await page.evaluate((fontFamilies) => ({
        userAgent: navigator.userAgent,
        language: navigator.language,
        devicePixelRatio,
        viewport: { width: innerWidth, height: innerHeight },
        fonts: Object.fromEntries(fontFamilies.map((family) => [family, document.fonts.check(`12px "${family}"`)])),
        selectedFonts: {
          name: getComputedStyle(document.querySelector(".whatsapp-process-tab__name")).fontFamily,
          count: getComputedStyle(document.querySelector(".whatsapp-process-tab__count")).fontFamily,
        },
      }), fixture.capture.fontFamilies);
      return {
        index,
        browserVersion,
        environment,
        cropScreenshot,
        cropSha256: await sha256File(cropScreenshot),
        fullScreenshot,
        fullSha256: fullScreenshot ? await sha256File(fullScreenshot) : null,
        geometry,
        matrix,
        accessibility,
        responsive,
      };
    } finally {
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const fixturePath = resolve(options.fixture ?? resolve(scriptDirectory, "fixtures", "whatsapp-tabs-visual.json"));
  const outputDirectory = resolve(options.output ?? resolve(projectRoot, ".sportex-local", "whatsapp-tabs-visual"));
  const executablePath = resolve(options.chrome ?? process.env.SPORTEX_BROWSER_EXECUTABLE
    ?? "C:/Program Files/Google/Chrome/Application/chrome.exe");
  await access(executablePath);
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
  validateFixture(fixture);
  const referenceSeal = await verifyReferenceSeal(fixturePath, fixture);
  const preparedReferencePath = resolve(projectRoot, fixture.reference.preparedPath);
  const actualReferenceHash = await sha256File(preparedReferencePath);
  assert.equal(actualReferenceHash, fixture.reference.preparedSha256, "La referencia visual preparada no coincide con el hash sellado");
  await mkdir(outputDirectory, { recursive: true });
  const commercialItems = buildCommercialItems(fixture);
  assert.equal(commercialItems.length, fixture.stages[0].count);
  const apiResponses = buildApiResponses(fixture, commercialItems);
  assert.deepEqual([...apiResponses.keys()].sort(), [...fixture.allowedRequests.apiRoutes].sort());
  const server = await startStaticServer(fixture.allowedRequests.staticPaths);
  const audits = [];
  try {
    const coldRuns = [];
    for (let index = 1; index <= fixture.capture.coldProcesses; index += 1) {
      coldRuns.push(await runColdProcess(index, executablePath, server, fixture, apiResponses, outputDirectory, audits));
    }
    const coldHashes = coldRuns.map((run) => run.cropSha256);
    assert.equal(new Set(coldHashes).size, 1, `Las tres capturas frías no son idénticas: ${coldHashes.join(", ")}`);
    const executableStats = await stat(executablePath);
    const manifest = {
      schema: "sportex.whatsapp-tabs-visual-candidate.v1",
      status: "CANDIDATE_READY_FOR_COMPARISON",
      createdAtUtc: new Date().toISOString(),
      fixture: { path: fixturePath, sha256: await sha256File(fixturePath), id: fixture.fixtureId },
      reference: {
        sourceSha256: fixture.reference.sourceSha256,
        preparedPath: preparedReferencePath,
        preparedSha256: fixture.reference.preparedSha256,
        crop: fixture.reference.crop,
        strictState: fixture.reference.strictState,
        colorSpace: fixture.reference.colorSpace,
        seal: { path: referenceSeal.path, sha256: referenceSeal.sha256 },
      },
      browser: {
        executablePath,
        executableSize: executableStats.size,
        executableModifiedAtUtc: executableStats.mtime.toISOString(),
        versions: [...new Set(coldRuns.map((run) => run.browserVersion))],
        headlessMode: "new",
      },
      host: { platform: platform(), release: release(), node: process.version },
      capture: fixture.capture,
      coldHashes,
      coldStable: true,
      runs: coldRuns,
      audits,
      unexpectedRequestCount: audits.reduce((sum, audit) => sum + audit.unexpectedRequests.length, 0),
      consoleErrorCount: audits.reduce((sum, audit) => sum + audit.consoleErrors.length + audit.pageErrors.length, 0),
    };
    const manifestPath = resolve(outputDirectory, "candidate-manifest.json");
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    const result = {
      ok: true,
      status: manifest.status,
      outputDirectory,
      manifestPath,
      fixtureSha256: manifest.fixture.sha256,
      coldHashes,
      requests: audits.reduce((sum, audit) => sum + audit.requests.length, 0),
      unexpectedRequests: manifest.unexpectedRequestCount,
      consoleErrors: manifest.consoleErrorCount,
    };
    await writeFile(resolve(outputDirectory, "result.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } finally {
    await server.close();
  }
}

main().catch(async (error) => {
  const options = (() => {
    try {
      return parseArguments(process.argv.slice(2));
    } catch {
      return {};
    }
  })();
  const outputDirectory = resolve(options.output ?? resolve(projectRoot, ".sportex-local", "whatsapp-tabs-visual"));
  const failure = { ok: false, status: "FAIL_CLOSED", name: error.name, message: error.message, stack: error.stack };
  try {
    await mkdir(outputDirectory, { recursive: true });
    await writeFile(resolve(outputDirectory, "failure.json"), `${JSON.stringify(failure, null, 2)}\n`, "utf8");
  } catch {
    process.stderr.write("No se pudo escribir failure.json.\n");
  }
  process.stderr.write(`${JSON.stringify(failure, null, 2)}\n`);
  process.exitCode = 1;
});
