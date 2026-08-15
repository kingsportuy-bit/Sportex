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

function rgbChannels(cssColor) {
  const channels = cssColor.match(/[\d.]+/gu)?.slice(0, 3).map(Number);
  assert.equal(channels?.length, 3, `unsupported computed color: ${cssColor}`);
  return channels;
}

function relativeLuminance(cssColor) {
  return rgbChannels(cssColor)
    .map((channel) => channel / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrastRatio(first, second) {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

async function openWhatsApp(page, mobile, theme) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate((selectedTheme) => {
    document.documentElement.dataset.theme = selectedTheme;
    localStorage.setItem("sportex_theme", selectedTheme);
  }, theme);
  const config = await page.evaluate(() => fetch("/v1/public-config").then((response) => response.json()));
  assert.equal(config.data.conversationTimelineEnabled, true);
  const whatsappNavigation = page.locator('[data-view="whatsapp"]');
  if (mobile) await whatsappNavigation.evaluate((button) => button.click());
  else await whatsappNavigation.click();
  if (mobile) await page.locator(".whatsapp-row").first().click();
  await page.locator(".whatsapp-operational-event").first().waitFor({ state: "visible" });
}

async function inspectViewport(name, viewport, mobile, theme) {
  const page = await browser.newPage({ viewport });
  try {
    await openWhatsApp(page, mobile, theme);
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
    const closeDetails = page.getByRole("button", { name: "Cerrar detalles" });
    const detailsStyle = await details.evaluate((node) => ({
      opacity: getComputedStyle(node).opacity,
      backgroundColor: getComputedStyle(node).backgroundColor,
    }));
    const closeStyle = await closeDetails.evaluate((node) => {
      const style = getComputedStyle(node);
      const header = node.closest(".whatsapp-inline-details-head");
      return {
        color: style.color,
        backgroundColor: style.backgroundColor,
        borderColor: style.borderTopColor,
        headerBackgroundColor: header ? getComputedStyle(header).backgroundColor : "",
      };
    });
    const closeTextContrast = contrastRatio(closeStyle.color, closeStyle.backgroundColor);
    const closeBoundaryContrast = contrastRatio(closeStyle.borderColor, closeStyle.headerBackgroundColor);
    assert.equal(detailsStyle.opacity, "1");
    assert.notEqual(detailsStyle.backgroundColor, "rgba(0, 0, 0, 0)");
    assert.ok(closeTextContrast >= 4.5, JSON.stringify({ name, theme, closeStyle, closeTextContrast }));
    assert.ok(closeBoundaryContrast >= 3, JSON.stringify({ name, theme, closeStyle, closeBoundaryContrast }));
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
    } else {
      assert.equal(await composer.isVisible(), true);
    }
    await page.screenshot({ path: resolve(outputDirectory, `${name}-details.png`), fullPage: true });
    await closeDetails.click();
    await details.waitFor({ state: "hidden" });
    await composer.waitFor({ state: "visible" });
    assert.equal(await composer.inputValue(), draft);

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
      theme,
      detailsVisible: await details.isVisible(),
      closeStyle,
      closeTextContrast,
      closeBoundaryContrast,
      eventTextSize,
      scroll: before,
      screenshot,
    });
  } finally {
    await page.close();
  }
}

try {
  for (const theme of ["light", "dark"]) {
    await inspectViewport(`desktop-${theme}-1280x480`, { width: 1280, height: 480 }, false, theme);
    await inspectViewport(`mobile-${theme}-390x844`, { width: 390, height: 844 }, true, theme);
  }
  process.stdout.write(`${JSON.stringify({ ok: true, baseUrl, results }, null, 2)}\n`);
} finally {
  await browser.close();
}
