import {parameterInputs} from './element-layout.js';

export function nextAvailableSketchId(ids) {
  const used = new Set(ids);
  let id = 1;
  while (used.has(id)) id++;
  return id;
}

export function unionRegion(a, b, width = 1080, height = 1920) {
  if (!a) return b;
  if (!b) return a;
  const x = Math.max(0, Math.floor(Math.min(a.x, b.x)));
  const y = Math.max(0, Math.floor(Math.min(a.y, b.y)));
  return {x, y, width: Math.min(width, Math.ceil(Math.max(a.x+a.width, b.x+b.width)))-x,
    height: Math.min(height, Math.ceil(Math.max(a.y+a.height, b.y+b.height)))-y};
}

export function rotatedBounds(p, pad = 0) {
  const angle = (p.rotation || 0) * Math.PI / 180;
  const width = Math.abs(p.width*Math.cos(angle)) + Math.abs(p.height*Math.sin(angle)) + pad*2;
  const height = Math.abs(p.width*Math.sin(angle)) + Math.abs(p.height*Math.cos(angle)) + pad*2;
  return {x:p.x+(p.width-width)/2, y:p.y+(p.height-height)/2, width, height};
}

// Work in screen pixels. Keep controls outside the rotated rectangle and its
// rotation handle; if an edge is offscreen, dock to the viewport's side.
export function textureActionPositions(rect, viewport, centerSize, confirmSize) {
  const bounds = rotatedBounds(rect, 42), gap = 10;
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  const place = (size, above) => {
    const desired = above ? bounds.y-size.height-gap : bounds.y+bounds.height+gap;
    let x = rect.x+rect.width/2, y = desired;
    if (y < viewport.y+gap || y+size.height > viewport.y+viewport.height-gap) {
      const left = bounds.x-size.width/2-gap, right = bounds.x+bounds.width+size.width/2+gap;
      x = left-size.width/2 >= viewport.x+gap ? left : right;
      // Distinct docks also keep the two controls apart at extreme zoom.
      y = above ? viewport.y+gap : viewport.y+viewport.height-size.height-gap;
    }
    return {x:clamp(x,viewport.x+size.width/2+gap,viewport.x+viewport.width-size.width/2-gap),
      y:clamp(y,viewport.y+gap,viewport.y+viewport.height-size.height-gap)};
  };
  return {center:place(centerSize,true),confirm:place(confirmSize,false)};
}

export const preferredFontDefaults = {
  'number-font':'club-sc-internacional-2023',
  'name-font':'club-real-madrid-font-2024-2025'
};

export function preferenceSnapshot(sketch, keys) {
  keys=[...new Set([...keys,...(sketch.sponsors||[]).map(s=>s.id),...(sketch.texts||[]).map(t=>t.id)])];
  return {inputs:parameterInputs(sketch.inputs),backgroundMode:sketch.backgroundMode,customBackground:sketch.customBackground,documentPalette:[...(sketch.documentPalette||[])],
    sponsors:(sketch.sponsors||[]).map(s=>({...s})),texts:structuredClone(sketch.texts||[]),
    elementModel:structuredClone(sketch.elementModel||null),trimEdits:structuredClone(sketch.trimEdits||{}),trimModelRevision:sketch.trimModelRevision,logos:sketch.logos, layers:Object.fromEntries(keys.map(k=>[k,structuredClone(sketch.layers[k])])),
    layerStyles:Object.fromEntries(keys.filter(k=>sketch.layerStyles[k]).map(k=>[k,structuredClone(sketch.layerStyles[k])])),
    visibleLayers:Object.fromEntries(keys.map(k=>[k,sketch.visibleLayers[k]]))};
}

export function withPreferences(blank, preferences) {
  if (!preferences) return blank;
  const model=preferences.elementModel;
  return {...blank,elementModel:structuredClone(model||null),backgroundMode:preferences.backgroundMode??model?.backgroundMode??blank.backgroundMode,customBackground:preferences.customBackground??blank.customBackground,documentPalette:[...(preferences.documentPalette??model?.documentPalette??blank.documentPalette??[])],trimEdits:structuredClone(preferences.trimEdits??model?.trimEdits??{}),trimModelRevision:preferences.trimModelRevision??blank.trimModelRevision,inputs:{...blank.inputs,...preferredFontDefaults,...model?.inputs,...preferences.inputs},
    sponsors:(preferences.sponsors||blank.sponsors||[]).map(s=>({...s})),texts:structuredClone(preferences.texts||blank.texts||[]),
    logos:{brand:[...preferences.logos.brand],brand2:[...(preferences.logos.brand2||[])],crest:[...preferences.logos.crest]},
    layers:structuredClone({...blank.layers,...model?.layers,...preferences.layers}),
    visibleLayers:{...blank.visibleLayers,...model?.visibleLayers,...preferences.visibleLayers},
    layerStyles:structuredClone({...blank.layerStyles,...model?.layerStyles,...preferences.layerStyles})};
}
