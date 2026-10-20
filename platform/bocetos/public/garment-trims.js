import {decodeCurve,encodeCurve,sampleCurve,transformNodes} from './trim-path.js';
// Coordinates stay in the editor's logical space, including the 2× PNG renderer.
export const trimGroups = ['sleeve', 'shoulder', 'shirt-side', 'short-side', 'short-hem'];
const fields = {
  sleeve: ['enabled', 'color', 'width'],
  shoulder: ['enabled', 'style', 'color', 'width'],
  'shirt-side': ['enabled', 'color', 'width'],
  'short-side': ['enabled', 'style', 'mode', 'color', 'color2', 'width'],
  'short-hem': ['enabled', 'color', 'width']
};
export const trimInputIds = trimGroups.flatMap(group => fields[group].map(field => `trim-${group}-${field}`));
export function readTrimSettings(read) {
  return Object.fromEntries(trimGroups.map(group => [group, Object.fromEntries(fields[group].map(field => [field, read(`trim-${group}-${field}`)]))]));
}
export function trimSettingsForMold(settings, raglan) {
  if (!raglan) return settings;
  return {...settings, sleeve:{...settings.sleeve,enabled:false}, shoulder:{...settings.shoulder,enabled:false}};
}

const profiles = new WeakMap();
const mix = (a, b, t) => a + (b - a) * t;
function interpolate(values, at) {
  const i = Math.max(0, Math.min(values.length - 1, at)), lo = Math.floor(i);
  return mix(values[lo], values[Math.min(lo + 1, values.length - 1)], i - lo);
}
function complete(values) {
  const indices = values.flatMap((v, i) => Number.isFinite(v) ? [i] : []);
  if (!indices.length) return values.fill(0);
  for (let i = 0; i < indices[0]; i++) values[i] = values[indices[0]];
  for (let k = 1; k < indices.length; k++) {
    const a = indices[k - 1], b = indices[k];
    for (let i = a + 1; i < b; i++) values[i] = mix(values[a], values[b], (i - a) / (b - a));
  }
  for (let i = indices.at(-1) + 1; i < values.length; i++) values[i] = values[indices.at(-1)];
  return values.map((_, i) => [-2, -1, 0, 1, 2].reduce((sum, offset) => sum + values[Math.max(0, Math.min(values.length - 1, i + offset))], 0) / 5);
}
export function trimProfile(mask, scale = 1) {
  if (profiles.has(mask)) return profiles.get(mask);
  const {bounds: b, data} = mask, width = mask.node.width;
  const rows = Math.ceil(b.height), columns = Math.ceil(b.width);
  const left = Array(rows).fill(NaN), right = Array(rows).fill(NaN), top = Array(columns).fill(NaN), bottom = Array(columns).fill(NaN);
  for (let y = Math.floor(b.y * scale); y < Math.ceil((b.y + b.height) * scale); y++) {
    for (let x = Math.floor(b.x * scale); x < Math.ceil((b.x + b.width) * scale); x++) {
      if (data[(y * width + x) * 4 + 3] < 128) continue;
      const row = Math.min(rows - 1, Math.max(0, Math.floor(y / scale - b.y)));
      const col = Math.min(columns - 1, Math.max(0, Math.floor(x / scale - b.x)));
      const xx = (x + .5) / scale, yy = (y + .5) / scale;
      left[row] = Number.isFinite(left[row]) ? Math.min(left[row], xx) : xx;
      right[row] = Number.isFinite(right[row]) ? Math.max(right[row], xx) : xx;
      top[col] = Number.isFinite(top[col]) ? Math.min(top[col], yy) : yy;
      bottom[col] = Number.isFinite(bottom[col]) ? Math.max(bottom[col], yy) : yy;
    }
  }
  const profile = {left: complete(left), right: complete(right), top: complete(top), bottom: complete(bottom)};
  profiles.set(mask, profile); return profile;
}
const line = (points, color, width) => ({points, color, width});
const thickness = (settings, fallback) => Math.max(1, Math.min(24, Number(settings.width) || fallback));
function samples(start, end, step = 3) {
  const count = Math.max(1, Math.ceil(Math.abs(end - start) / step));
  return Array.from({length: count + 1}, (_, i) => mix(start, end, i / count));
}
function seam(mask, scale, edge, inset, from = 0, to = 1, wave = 0) {
  const b = mask.bounds, p = trimProfile(mask, scale), direction = edge === 'left' ? 1 : -1;
  // Hem fragments should not pull a side seam across the middle of a leg.
  const valid = p.left.map((x, i) => p.right[i] - x >= b.width * .6 ? i : -1).filter(i => i >= 0);
  const low = valid[0] ?? 0, high = valid.at(-1) ?? b.height - 1;
  return samples(from, to, 3 / b.height).map(t => {
    const row = Math.max(low, Math.min(high, t * (b.height - 1)));
    return [interpolate(p[edge], row) + direction * (inset + wave * Math.sin(Math.PI * (t - from) / (to - from))), b.y + t * (b.height - 1)];
  });
}

function trimModel(group,settings){
  if(group==='shoulder')return settings.shoulder.style;
  if(group==='short-side')return settings[group].style==='double'?'double':`single-${settings[group].mode}`;
  return group==='shirt-side'?'panel':'single';
}
export function encodeTrimCurve(nodes,entry){
  const frame=entry.stroke.editFrame||{bounds:entry.mask.bounds,angle:0},b=frame.bounds,cx=b.x+b.width/2,cy=b.y+b.height/2,a=-(frame.angle||0)*Math.PI/180;
  const local=transformNodes(nodes,([x,y])=>{const u=cx+(x-cx)*Math.cos(a)-(y-cy)*Math.sin(a),v=cy+(x-cx)*Math.sin(a)+(y-cy)*Math.cos(a);return [entry.stroke.mirror?2*cx-u:u,v];});
  return encodeCurve(local,b);
}
export function decodeTrimCurve(edit,entry){
  const frame=entry.stroke.editFrame||{bounds:entry.mask.bounds,angle:0},b=frame.bounds,nodes=decodeCurve(edit,b);if(!nodes)return null;
  const cx=b.x+b.width/2,cy=b.y+b.height/2,a=(frame.angle||0)*Math.PI/180;
  return transformNodes(nodes,([x,y])=>{if(entry.stroke.mirror)x=2*cx-x;return [cx+(x-cx)*Math.cos(a)-(y-cy)*Math.sin(a),cy+(x-cx)*Math.sin(a)+(y-cy)*Math.cos(a)];});
}
export function migrateTrimEdits(edits,batches){
  if(edits.linkedVersion===3)return edits;
  const result={...edits,linkedVersion:3},entries=batches.flatMap(b=>b.strokes.map(stroke=>({...b,stroke})));
  for(const entry of entries){
    if(result[entry.stroke.editKey])continue;
    // Freeze the former shared shape separately for each mask/view. Identical
    // coordinates retain the rendered fit, but subsequent edits share no data.
    const shared=edits[entry.stroke.sharedKey];
    if(shared&&decodeTrimCurve(shared,entry)){result[entry.stroke.editKey]=structuredClone(shared);continue;}
    const old=edits[entry.stroke.key];if(!old)continue;
    const nodes=decodeCurve(old,entry.mask.bounds);if(nodes)result[entry.stroke.editKey]={...encodeTrimCurve(nodes,entry),widthScale:old.widthScale||1};
  }
  return result;
}
export function trimPanelPolygon(stroke,bounds){
  const points=stroke.points.map(p=>[...p]),first=points[0],last=points.at(-1),outer=stroke.fillToEdge==='left'?bounds.x-2:bounds.x+bounds.width+2,bottom=Math.max(last[1],bounds.y+bounds.height+2);
  return [...points,[last[0],bottom],[outer,bottom],[outer,first[1]]];
}

// Each batch owns its mask: strokes can never leak into another garment.
export function buildTrimBatches(settings, included, getMask, scale = 1, edits = {}) {
  const batches = [];
  const add = (mask, group, strokes, piece, side) => {
    if (!strokes.length) return;
    for (const [index,stroke] of strokes.entries()) {
      stroke.key=`${group}:${piece}:${side}:${index}`;
      const perEdge=group==='shoulder'?(settings.shoulder.style==='triple'?3:1):group==='short-side'?(settings[group].style==='double'||settings[group].mode!=='solid'?2:1):1;
      stroke.mirror=group==='sleeve'?(side==='front'?piece==='left':piece==='right'):index>=perEdge;
      stroke.editFrame=group==='sleeve'?mask.frame:undefined;
      stroke.sharedKey=`shared:${group}:${trimModel(group,settings)}:${index%perEdge}`;
      stroke.editKey=`individual:${group}:${piece}:${side}:${trimModel(group,settings)}:${index}`;
    }
    batches.push({mask, group, piece, side, strokes});
  };
  for (const side of ['front', 'back']) {
    if (included.includes('shirt')) {
      const sleeve = settings.sleeve;
      if (sleeve.enabled) for (const piece of ['left', 'right']) {
        const mask = getMask(piece, side), f = mask.frame || {bounds: mask.bounds, angle: 0};
        const b = f.bounds, cx = b.x + b.width / 2, cy = b.y + b.height / 2, angle = (f.angle || 0) * Math.PI / 180;
        const w = thickness(sleeve, 3), offsets = [0];
        const point = (x, y) => [cx + x * Math.cos(angle) - y * Math.sin(angle), cy + x * Math.sin(angle) + y * Math.cos(angle)];
        add(mask, 'sleeve', offsets.map(x => line([point(x, -b.height * .8), point(x, b.height * .8)], sleeve.color, w)),piece,side);
      }
      const shoulder = settings.shoulder;
      if (shoulder.enabled&&side==='front') {
        const mask = getMask('shoulder', side), b = mask.bounds, body = mask.bodyBounds || b, p = trimProfile(mask, scale), w = shoulder.style==='single'?thickness(sleeve,3):thickness(shoulder, 3);
        const offsets = shoulder.style === 'triple' ? [0, w * 1.8, w * 3.6] : [0], strokes = [];
        for (const edge of ['left', 'right']) {
          const left = edge === 'left', start = body.x + body.width * (left ? .31 : .69), end = b.x + b.width * (left ? .12 : .88);
          for (const offset of offsets) strokes.push(line(samples(start, end).map(x => [x, interpolate(p.top, x - b.x) + 5 + w / 2 + offset]), shoulder.color, w));
        }
        add(mask, 'shoulder', strokes,'shoulder',side);
      }
      const shirt = settings['shirt-side'];
      if (shirt.enabled) {
        const mask = getMask(side, side), w = thickness(shirt, 4);
        add(mask, 'shirt-side', ['left', 'right'].map(edge => ({...line(seam(mask, scale, edge, 6 + w / 2, .28, 1, 5), shirt.color, w),fillToEdge:edge})),side,side);
      }
    }
    if (included.includes('short')) {
      const shorts = settings['short-side'], hem = settings['short-hem'];
      if (!shorts.enabled && !hem.enabled) continue;
      const mask = getMask('short', side), b = mask.bounds;
      if (shorts.enabled) {
        const w = thickness(shorts, 12),band=w*1.25,strokes = [];
        for (const edge of ['left', 'right']) {
          if (shorts.style === 'double') {
            for (let i = 0; i < 2; i++) strokes.push(line(seam(mask, scale, edge, 4 + w / 4 + i * w * .75), i ? shorts.color2 : shorts.color, w / 2));
          } else if (shorts.mode === 'vertical') {
            for (let i = 0; i < 2; i++) strokes.push(line(seam(mask, scale, edge, 4 + band / 4 + i * band / 2), i ? shorts.color2 : shorts.color, band / 2));
          } else if (shorts.mode === 'horizontal') {
            strokes.push(line(seam(mask, scale, edge, 4 + band / 2, 0, .5), shorts.color, band), line(seam(mask, scale, edge, 4 + band / 2, .5, 1), shorts.color2, band));
          } else strokes.push(line(seam(mask, scale, edge, 4 + band / 2), shorts.color, band));
        }
        add(mask, 'short-side', strokes,'short',side);
      }
      if (hem.enabled) {
        const p = trimProfile(mask, scale), w = thickness(hem, 5), strokes = []; let points = [];
        // A real crotch produces two independent bottom contours, never a bridge.
        for (const x of samples(0, b.width - 1, 2)) {
          const y = interpolate(p.bottom, x);
          if (y >= b.y + b.height * .8) points.push([b.x + x, y - w / 2 - 2]);
          else {if (points.length > 1) strokes.push(line(points, hem.color, w)); points = [];}
        }
        if (points.length > 1) strokes.push(line(points, hem.color, w));
        add(mask, 'short-hem', strokes,'short',side);
      }
    }
  }
  const linked=migrateTrimEdits(edits,batches);
  for(const batch of batches)for(const stroke of batch.strokes){const edit=linked[stroke.editKey],nodes=decodeTrimCurve(edit,{...batch,stroke});
    if(nodes){stroke.points=sampleCurve(nodes);if(!stroke.fillToEdge)stroke.width*=Math.max(.2,Math.min(8,edit.widthScale||1));}
  }
  return batches;
}

export function paintTrimBatches(context, batches, surface, scale = 1) {
  const c = surface.getContext('2d');
  for (const {mask, strokes} of batches) {
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, surface.width, surface.height);
    c.setTransform(scale, 0, 0, scale, 0, 0); c.lineCap = 'butt'; c.lineJoin = 'round';
    for (const stroke of strokes) {
      const {points, color, width}=stroke;
      c.strokeStyle = color; c.lineWidth = width; c.beginPath();
      (stroke.fillToEdge?trimPanelPolygon(stroke,mask.bounds):points).forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
      if(stroke.fillToEdge){c.closePath();c.fillStyle=color;c.fill();}else c.stroke();
    }
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'destination-in'; c.drawImage(mask.node, 0, 0);
    context.drawImage(surface, 0, 0, surface.width / scale, surface.height / scale);
  }
  c.globalCompositeOperation = 'source-over';
}
