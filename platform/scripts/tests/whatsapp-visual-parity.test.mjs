import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';

// Frozen public-code reference recovered from the last visually approved release.
// Changing it requires a new explicit visual approval, not snapshot regeneration.
const baseline = JSON.parse(readFileSync(new URL('./fixtures/whatsapp-approved-8823a773.json', import.meta.url), 'utf8'));
const app = readFileSync(new URL('../../frontend/app.js', import.meta.url), 'utf8').replaceAll('\r\n', '\n');
const css = readFileSync(new URL('../../frontend/styles.css', import.meta.url), 'utf8').replaceAll('\r\n', '\n');
function extract(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `Missing ${name}`);
  const end = source.indexOf('\nfunction ', start + 1);
  assert.ok(end > start);
  return source.slice(start, end).trimEnd();
}
function fingerprint(value) { return createHash('sha256').update(value).digest('hex'); }

test('WhatsApp SVG helper preserves attributes required by approved halo masks', () => {
  assert.equal(extract(app, 'svgPath'), baseline.svgPath);
});
test('WhatsApp tab geometry, gradients and masks match the approved production artifact', () => {
  assert.equal(extract(app, 'drawWhatsAppTabbedPanelFrame'), baseline.drawWhatsAppTabbedPanelFrame);
});
test('Protected frontend styles preserve approved WhatsApp design; company styles remain isolated', () => {
  const marker = css.indexOf('/* Mi empresa comparte');
  assert.ok(marker > 0);
  assert.equal(fingerprint(css.slice(0, marker).trimEnd()), fingerprint(baseline.css));
  assert.ok(css.slice(marker).includes('.company-form'));
});
test('Regression guard rejects the deployed 51c2dfe renderer that lost approved geometry', () => {
  const regressed = execFileSync('git', ['show', '51c2dfea8abcc05bcce56a015c5ed2b2295a9ee8:platform/frontend/app.js'], { cwd: new URL('../../', import.meta.url), encoding: 'utf8' }).replaceAll('\r\n', '\n');
  assert.notEqual(extract(regressed, 'drawWhatsAppTabbedPanelFrame'), baseline.drawWhatsAppTabbedPanelFrame);
});
