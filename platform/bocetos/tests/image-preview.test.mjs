import test from 'node:test';
import assert from 'node:assert/strict';
import { zoomAt, clampView, installImagePreview } from '../public/image-preview.js';

test('zoom keeps pointer anchored and respects fit/8x limits; panning cannot lose image', () => {
  const view = { scale: 2, x: 50, y: -20 }, point = { x: 120, y: 200 };
  const next = zoomAt(view, 1.5, point);
  assert.equal((point.x - view.x) / view.scale, (point.x - next.x) / next.scale);
  assert.equal((point.y - view.y) / view.scale, (point.y - next.y) / next.scale);
  assert.equal(zoomAt(view, 100, point).scale, 8); assert.equal(zoomAt(view, .001, point).scale, 1);
  assert.deepEqual(clampView({ scale: 2, x: 9999, y: -9999 }, { width: 400, height: 700 }, { width: 800, height: 900 }), { scale: 2, x: 0, y: -250 });
  assert.deepEqual(clampView({ scale: 1, x: 50, y: -30 }, { width: 400, height: 700 }, { width: 800, height: 900 }), { scale: 1, x: 0, y: 0 });
});

test('preview wheel/pan/reset are isolated from document history and keyboard actions', () => {
  const surface = () => ({ events: {}, style: {}, classList: { toggle() {} }, addEventListener(name, fn) { (this.events[name] ||= []).push(fn); }, emit(name, event = {}) { for (const fn of this.events[name] || []) fn(event); } });
  const dialog = surface(), image = surface(), viewport = surface(); let capture = null;
  image.offsetWidth = 400; image.offsetHeight = 700;
  Object.assign(viewport, { clientWidth: 800, clientHeight: 900, getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 900 }), setPointerCapture: id => { capture = id; }, hasPointerCapture: id => capture === id, releasePointerCapture: () => { capture = null; } });
  const previousWindow = globalThis.window; globalThis.window = { addEventListener() {} };
  try {
    installImagePreview(dialog, viewport, image);
    let prevented = false;
    viewport.emit('wheel', { deltaY: -160, deltaMode: 0, clientX: 400, clientY: 450, preventDefault() { prevented = true; } });
    assert(prevented); assert(!image.style.transform.includes('scale(1)'));
    viewport.emit('pointerdown', { button: 0, pointerId: 1, clientX: 400, clientY: 450, preventDefault() {} }); assert.equal(capture, 1);
    viewport.emit('pointermove', { pointerId: 1, clientX: 400, clientY: 430 });
    viewport.emit('pointerup', { pointerId: 1 }); assert.equal(capture, null);
    let stopped = false; dialog.emit('keydown', { stopPropagation() { stopped = true; } }); assert(stopped);
    dialog.emit('close'); assert.equal(image.style.transform, 'translate(0px, 0px) scale(1)');
    image.emit('load'); assert.equal(image.style.transform, 'translate(0px, 0px) scale(1)');
  } finally { globalThis.window = previousWindow; }
});
