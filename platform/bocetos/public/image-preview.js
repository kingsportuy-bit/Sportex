// View-only transforms; intentionally separate from document state and undo.
export function zoomAt(view, factor, pointer) {
  const scale = Math.max(1, Math.min(8, view.scale * factor));
  const ratio = scale / view.scale;
  return { scale, x: pointer.x - (pointer.x - view.x) * ratio, y: pointer.y - (pointer.y - view.y) * ratio };
}

export function clampView(view, image, viewport) {
  const maxX = Math.max(0, (image.width * view.scale - viewport.width) / 2);
  const maxY = Math.max(0, (image.height * view.scale - viewport.height) / 2);
  return { scale: view.scale, x: maxX ? Math.max(-maxX, Math.min(maxX, view.x)) : 0, y: maxY ? Math.max(-maxY, Math.min(maxY, view.y)) : 0 };
}

export function installImagePreview(dialog, viewport, image) {
  let view = { scale: 1, x: 0, y: 0 }, drag = null;
  function paint() {
    view = clampView(view, { width: image.offsetWidth, height: image.offsetHeight }, { width: viewport.clientWidth, height: viewport.clientHeight });
    image.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
    viewport.classList.toggle('is-zoomed', view.scale > 1);
    viewport.classList.toggle('is-panning', Boolean(drag));
  }
  function reset() { view = { scale: 1, x: 0, y: 0 }; drag = null; paint(); }
  image.addEventListener('load', reset);
  image.addEventListener('dragstart', event => event.preventDefault());
  viewport.addEventListener('wheel', event => {
    event.preventDefault();
    if (drag) return;
    const rect = viewport.getBoundingClientRect();
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1);
    view = zoomAt(view, Math.exp(-Math.max(-160, Math.min(160, delta)) * .0025), { x: event.clientX - rect.left - rect.width / 2, y: event.clientY - rect.top - rect.height / 2 });
    paint();
  }, { passive: false });
  viewport.addEventListener('pointerdown', event => {
    if (event.button !== 0 || view.scale <= 1) return;
    event.preventDefault();
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: view.x, startY: view.y };
    viewport.setPointerCapture(event.pointerId); paint();
  });
  viewport.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    view.x = drag.startX + event.clientX - drag.x; view.y = drag.startY + event.clientY - drag.y; paint();
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) viewport.addEventListener(type, event => {
    if (drag?.id !== event.pointerId) return;
    drag = null;
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    paint();
  });
  viewport.addEventListener('keydown', event => {
    if (event.key === '+' || event.key === '=') { event.preventDefault(); view = zoomAt(view, 1.25, { x: 0, y: 0 }); paint(); }
    else if (event.key === '-') { event.preventDefault(); view = zoomAt(view, .8, { x: 0, y: 0 }); paint(); }
    else if (event.key === '0') { event.preventDefault(); reset(); }
    else if (event.key.startsWith('Arrow') && view.scale > 1) {
      event.preventDefault(); view.x += event.key === 'ArrowLeft' ? 60 : event.key === 'ArrowRight' ? -60 : 0;
      view.y += event.key === 'ArrowUp' ? 60 : event.key === 'ArrowDown' ? -60 : 0; paint();
    }
  });
  dialog.addEventListener('close', reset);
  // The preview cannot edit the underlying document through global shortcuts.
  dialog.addEventListener('keydown', event => event.stopPropagation());
  window.addEventListener('resize', () => { if (dialog.open) paint(); });
}
