import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright-core";

const baseUrl = process.env.SPORTEX_BASE_URL ?? "http://127.0.0.1:8091";
const executablePath = process.env.SPORTEX_BROWSER_EXECUTABLE
  ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const outputDirectory = resolve(process.env.SPORTEX_E2E_OUTPUT ?? ".sportex-local/e2e-conversation-timeline");
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ executablePath, headless: true });
const results = [];

async function openWhatsApp(page, mobile) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  const config = await page.evaluate(() => fetch("/v1/public-config").then((response) => response.json()));
  assert.equal(config.data.conversationTimelineEnabled, true);
  const whatsappNavigation = page.locator('[data-view="whatsapp"]');
  if (mobile) await whatsappNavigation.evaluate((button) => button.click());
  else await whatsappNavigation.click();
  if (mobile) await page.locator(".whatsapp-row").first().click();
  await page.locator(".whatsapp-operational-event").first().waitFor({ state: "visible" });
}

async function inspectViewport(name, viewport, mobile) {
  const page = await browser.newPage({ viewport });
  try {
    await openWhatsApp(page, mobile);
    const composer = page.locator(".whatsapp-composer-input");
    const conversation = page.locator(".whatsapp-chat-pane .lead-conversation");
    const draft = `Borrador E2E ${name}`;
    await composer.fill(draft);
    await conversation.evaluate((node) => { node.scrollTop = 0; });
    const before = await conversation.evaluate((node) => ({
      scrollTop: node.scrollTop,
      scrollHeight: node.scrollHeight,
      clientHeight: node.clientHeight,
      distanceFromBottom: node.scrollHeight - node.scrollTop - node.clientHeight,
      overflowY: getComputedStyle(node).overflowY,
    }));

    await page.getByRole("button", { name: "Abrir detalles del contacto y del proceso" }).click();
    const details = page.getByRole("complementary", { name: "Detalles del contacto y del proceso" });
    await details.waitFor({ state: "visible" });
    await details.evaluate(async (node) => {
      await Promise.all(node.getAnimations({ subtree: true }).map((animation) => animation.finished));
    });
    const detailsStyle = await details.evaluate((node) => ({
      opacity: getComputedStyle(node).opacity,
      backgroundColor: getComputedStyle(node).backgroundColor,
    }));
    assert.equal(detailsStyle.opacity, "1");
    assert.notEqual(detailsStyle.backgroundColor, "rgba(0, 0, 0, 0)");
    assert.equal(await composer.inputValue(), draft);
    const after = await conversation.evaluate((node) => ({
      scrollTop: node.scrollTop,
      distanceFromBottom: node.scrollHeight - node.scrollTop - node.clientHeight,
    }));
    assert.ok(["auto", "scroll"].includes(before.overflowY));
    if (before.distanceFromBottom < 80) {
      assert.ok(after.distanceFromBottom <= 2, JSON.stringify({ name, before, after }));
    } else {
      assert.ok(Math.abs(after.scrollTop - before.scrollTop) <= 2, JSON.stringify({ name, before, after }));
    }

    const eventTextSize = Number.parseFloat(await page.locator(".whatsapp-operational-copy small").first()
      .evaluate((node) => getComputedStyle(node).fontSize));
    assert.ok(eventTextSize >= 10);

    if (mobile) {
      const box = await details.boundingBox();
      const workspaceBox = await page.locator(".whatsapp-detail-workspace").boundingBox();
      assert.ok(box && workspaceBox);
      assert.ok(Math.abs(box.width - workspaceBox.width) <= 2);
      assert.ok(Math.abs(box.height - workspaceBox.height) <= 2);
      await page.screenshot({ path: resolve(outputDirectory, `${name}-details.png`), fullPage: true });
      await page.getByRole("button", { name: "Cerrar detalles" }).click();
      await composer.waitFor({ state: "visible" });
      assert.equal(await composer.inputValue(), draft);
    } else {
      assert.equal(await composer.isVisible(), true);
    }

    const screenshot = resolve(outputDirectory, `${name}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
    results.push({
      name,
      viewport,
      visibleMessages: await page.locator(".message-row").evaluateAll((nodes) =>
        nodes.filter((node) => node.getClientRects().length > 0).length),
      visibleEvents: await page.locator(".whatsapp-operational-event").evaluateAll((nodes) =>
        nodes.filter((node) => node.getClientRects().length > 0).length),
      composerVisible: await composer.isVisible(),
      draftPreserved: (await composer.inputValue()) === draft,
      detailsVisible: mobile ? false : await details.isVisible(),
      eventTextSize,
      scroll: before,
      screenshot,
    });
  } finally {
    await page.close();
  }
}

try {
  await inspectViewport("desktop-1280x480", { width: 1280, height: 480 }, false);
  await inspectViewport("mobile-390x844", { width: 390, height: 844 }, true);
  process.stdout.write(`${JSON.stringify({ ok: true, baseUrl, results }, null, 2)}\n`);
} finally {
  await browser.close();
}
