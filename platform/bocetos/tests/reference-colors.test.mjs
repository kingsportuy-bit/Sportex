import test from 'node:test';
import assert from 'node:assert/strict';
import { createColorAnalyzer, colorRoles, validateColors } from '../reference-colors.mjs';
import { createEditorServer } from '../server.mjs';

const reference = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jP1sAAAAASUVORK5CYII=';
const colors = Object.fromEntries(Object.keys(colorRoles).map((key, i) => [key, i % 2 ? null : '#ABC123']));
const response = (value = colors) => ({ ok: true, json: async () => ({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }] }) });

test('vision request covers all ten roles, includes shorts/socks, stores no response; duplicate analysis uses cache', async () => {
  let calls = 0, clock = 1000;
  const analyze = createColorAnalyzer({ apiKey: () => 'test-only', now: () => clock, fetchImpl: async (url, options) => {
    calls++;
    assert.equal(url, 'https://api.openai.com/v1/responses');
    const payload = JSON.parse(options.body);
    assert.equal(payload.store, false);
    assert.equal(payload.input[0].content[1].image_url, reference);
    assert.equal(payload.text.format.strict, true);
    assert.deepEqual(payload.text.format.schema.required, Object.keys(colorRoles));
    assert(payload.text.format.schema.properties.short);
    assert(payload.text.format.schema.properties.socks);
    assert.equal(payload.text.format.schema.properties.neck.pattern, '^#[0-9a-fA-F]{6}$');
    assert(payload.input[0].content[0].text.includes('#RRGGBB'));
    return response();
  } });
  const first = await analyze(reference);
  assert.equal(first.status, 200); assert.equal(first.body.colors.neck, '#abc123'); assert.equal(first.body.colors.cuffs, null);
  assert.equal((await analyze(reference)).body.cached, true); assert.equal(calls, 1);
  clock += 600_001; await analyze(reference); assert.equal(calls, 2);
});

test('response failures report their real cause instead of blaming the reference image', async () => {
  const cases = [
    [{ status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' } }, 'token_limit'],
    [{ status: 'incomplete' }, 'incomplete'],
    [{ status: 'completed', output: [] }, 'empty_response'],
    [{ status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal' }] }] }, 'refusal'],
    [{ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: 'not json' }] }] }, 'invalid_json'],
    [{ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ ...colors, neck: 'blue' }) }] }] }, 'invalid_colors']
  ];
  for (const [payload, code] of cases) {
    const diagnostics = [];
    const analyze = createColorAnalyzer({ apiKey: () => 'test-only', fetchImpl: async () => ({ ok: true, json: async () => payload }), onDiagnostic: d => diagnostics.push(d) });
    const result = await analyze(reference);
    assert.equal(result.status, 502); assert.equal(result.body.code, code); assert.equal(result.body.colors, undefined);
    assert(!result.body.error.includes('referencia más clara'));
    assert(diagnostics.some(d => d.code === code));
    assert(!JSON.stringify(diagnostics).includes('test-only'));
  }
});

test('strict validation rejects incomplete/unexpected colors and accepts absence without inventing colors', () => {
  assert.throws(() => validateColors({ ...colors, socks: '#fff' }));
  assert.throws(() => validateColors({ ...colors, unknown: '#ffffff' }));
  const missing = { ...colors }; delete missing.short; assert.throws(() => validateColors(missing));
  assert(Object.values(validateColors(Object.fromEntries(Object.keys(colorRoles).map(key => [key, null])))).every(color => color === null));
});

test('no key, busy requests, provider failure and malformed results never apply colors; failed analysis can retry', async () => {
  let calls = 0;
  assert.equal((await createColorAnalyzer({ apiKey: () => '', fetchImpl: () => { throw Error('must not call'); } })(reference)).status, 503);
  let finish;
  const analyze = createColorAnalyzer({ apiKey: () => 'test-only', fetchImpl: () => { calls++; return new Promise(resolve => { finish = resolve; }); } });
  const pending = analyze(reference);
  assert.equal((await analyze(reference)).status, 429);
  finish({ ok: false, status: 429 }); assert.equal((await pending).status, 429);
  const retry = analyze(reference); finish(response()); assert.equal((await retry).status, 200); assert.equal(calls, 2);
  for (const invalid of [response({ neck: '#ffffff' }), { ok: true, json: async () => ({ status: 'incomplete' }) }, { ok: true, json: async () => ({ status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal' }] }] }) }]) {
    const result = await createColorAnalyzer({ apiKey: () => 'test-only', fetchImpl: async () => invalid })(reference);
    assert.equal(result.status, 502); assert.equal(result.body.colors, undefined);
  }
});

test('HTTP route validates images before invoking analysis and serves the imported editor', async () => {
  let calls = 0;
  const server = createEditorServer({ analyzeColors: async image => { calls++; assert.equal(image, reference); return { status: 200, body: { colors } }; } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const body of [null, {}, { reference: 'https://example.com/image.png' }]) {
      assert.equal((await fetch(`${url}/api/reference-colors`, { method: 'POST', body: JSON.stringify(body) })).status, 400);
    }
    const font=await fetch(`${url}/assets/fonts/club-sc-internacional-2023.ttf`);assert.equal(font.status,200);assert.equal(font.headers.get('cache-control'),'public, max-age=604800');await font.arrayBuffer();
    assert.equal(calls, 0);
    const result = await fetch(`${url}/api/reference-colors`, { method: 'POST', body: JSON.stringify({ reference }) });
    assert.equal(result.status, 200); assert.deepEqual((await result.json()).colors, colors); assert.equal(calls, 1);
    for (const path of ['/', '/app.js', '/image-preview.js', '/atlas-crop.js', '/reference-compare.js', '/artwork-registration.js', '/pattern-geometry.js', '/editor-geometry.js', '/stripe-scale.js', '/assets/psd-kit/photoBody.png', '/assets/psd-kit/hires/photoBody.png']) {
      const asset = await fetch(`${url}${path}`); assert.equal(asset.status, 200, path); assert.equal(asset.headers.get('cache-control'), 'no-store'); await asset.arrayBuffer();
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
});
