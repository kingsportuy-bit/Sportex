import {silhouetteOutputVersion,inspectSilhouettes} from './silhouette-atlas.js';
import {detectMarkedAtlas} from './marked-atlas.js';
import {compactAtlasVersion} from './atlas-layout.js';
export const atlasCropRevision = 4;
export const atlasSeparators = ['#00ff00', '#ff00ff'];

function separatorPixel(r, g, b, color) {
  // Allow small color shifts and edge antialiasing from image generation.
  return color === '#00ff00' ? g > 145 && g - r > 75 && g - b > 75
    : r > 145 && b > 145 && Math.min(r, b) - g > 70;
}

export function chooseAtlasSeparator(data) {
  const scores = atlasSeparators.map(color => {
    let count = 0;
    for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 32 && separatorPixel(data[i], data[i + 1], data[i + 2], color)) count++;
    return count;
  });
  return scores[0] <= scores[1] ? atlasSeparators[0] : atlasSeparators[1];
}

export function exteriorMask(data, width, height, separator) {
  const total = width * height, background = new Uint8Array(total), queue = new Int32Array(total);
  // Old saved atlases had a neutral gray sheet. Estimate its range from the
  // outer sheet, never from the drawing, so off-white stripes remain artwork.
  const border = [];
  if (!separator) {
    const sample = p => { const i = p * 4, r = data[i], g = data[i + 1], b = data[i + 2]; if (data[i + 3] > 240 && Math.max(r, g, b) - Math.min(r, g, b) < 24) border.push((r + g + b) / 3); };
    for (let x = 0; x < width; x++) { sample(x); sample((height - 1) * width + x); }
    for (let y = 0; y < height; y++) { sample(y * width); sample(y * width + width - 1); }
    border.sort((a, b) => a - b);
  }
  const low = border.length ? border[Math.floor((border.length - 1) * .05)] - 12 : 165;
  const high = border.length ? border[Math.floor((border.length - 1) * .95)] + 12 : 200;
  const isBackground = p => {
    const i = p * 4, r = data[i], g = data[i + 1], b = data[i + 2];
    if (data[i + 3] < 32) return true;
    if (separator) return separatorPixel(r, g, b, separator);
    const light = (r + g + b) / 3;
    return Math.max(r, g, b) - Math.min(r, g, b) < 28 && light >= low && light <= high;
  };
  let head = 0, tail = 0;
  const visit = p => { if (!background[p] && isBackground(p)) { background[p] = 1; queue[tail++] = p; } };
  for (let x = 0; x < width; x++) { visit(x); visit((height - 1) * width + x); }
  for (let y = 0; y < height; y++) { visit(y * width); visit(y * width + width - 1); }
  while (head < tail) {
    const p = queue[head++], x = p % width;
    if (x) visit(p - 1); if (x + 1 < width) visit(p + 1);
    if (p >= width) visit(p - width); if (p + width < total) visit(p + width);
  }
  // The separator must actually be present around the sheet. A missing or
  // changed key cannot silently turn the entire atlas into one garment piece.
  if (separator && tail < total * .01) throw new Error('No se reconoce el fondo flúor de separación. El original se conserva sin aplicar.');
  return background;
}

export function inspectAtlasRectangles(data, width, height, layout) {
  if (!layout?.rectangles?.length || data.length !== width * height * 4 || (layout.separator && !atlasSeparators.includes(layout.separator))) throw new Error('La plantilla de piezas no es válida.');
  const exterior = exteriorMask(data, width, height, layout.separator);
  if(layout.cutline)return detectMarkedAtlas(data,width,height,layout);
  if(layout.outputShape===silhouetteOutputVersion){
    // Transparent holes are missing artwork even when enclosed by a piece.
    for(let p=0;p<exterior.length;p++)if(data[p*4+3]<32)exterior[p]=1;
    return inspectSilhouettes(exterior,width,height,layout);
  }
  const queue = new Int32Array(width * height), regions = [];
  for (let start = 0; start < exterior.length; start++) {
    if (exterior[start]) continue;
    let head = 0, tail = 1, left = width, top = height, right = 0, bottom = 0; queue[0] = start; exterior[start] = 1;
    const visit = p => { if (!exterior[p]) { exterior[p] = 1; queue[tail++] = p; } };
    while (head < tail) {
      const p = queue[head++], x = p % width, y = Math.floor(p / width);
      left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x + 1); bottom = Math.max(bottom, y + 1);
      if (x) visit(p - 1); if (x + 1 < width) visit(p + 1);
      if (p >= width) visit(p - width); if (p + width < exterior.length) visit(p + width);
    }
    const rw = right - left, rh = bottom - top;
    if (rw >= 24 && rh >= 24 && tail / (rw * rh) >= .95) regions.push({ x: left, y: top, width: rw, height: rh });
  }
  const sx = width / (layout.columns * 512), sy = height / (layout.rows * 512), used = new Set();
  return layout.rectangles.map((expected, index) => {
    const col = index % layout.columns, row = Math.floor(index / layout.columns);
    const candidates = regions.filter(r => {
      const cx = (r.x + r.width / 2) / sx, cy = (r.y + r.height / 2) / sy;
      const wr = r.width / sx / expected.width, hr = r.height / sy / expected.height;
      if(layout.packing===compactAtlasVersion)return !used.has(r)&&wr>=.65&&hr>=.65&&wr<=1.45&&hr<=1.45
        &&cx>=expected.x-8&&cx<=expected.x+expected.width+8&&cy>=expected.y-8&&cy<=expected.y+expected.height+8;
      return !used.has(r) && Math.floor(cx / 512) === col && Math.floor(cy / 512) === row
        && wr >= .65 && hr >= .65
        && r.width / sx <= 512 * 1.3 && r.height / sy <= 512 * 1.3;
    });
    // Ambiguous, missing or fragmented artwork is not a valid rectangle.
    if (candidates.length !== 1) return {piece:expected.piece,error:`No se pudo separar el rectángulo completo de ${expected.piece}. Abrí Corregir separación para marcarlo sin volver a generar.`};
    const rect = candidates[0]; used.add(rect);
    const wr=rect.width/sx/expected.width,hr=rect.height/sy/expected.height;
    return { piece: expected.piece, x: rect.x / sx, y: rect.y / sy, width: rect.width / sx, height: rect.height / sy,
      ...(wr>1.75||hr>1.5||wr/hr<.62||wr/hr>1.6?{reviewRequired:true}: {}) };
  });
}

export function detectAtlasRectangles(data,width,height,layout){
  const result=inspectAtlasRectangles(data,width,height,layout),failed=result.find(r=>r.error);
  if(failed)throw new Error(failed.error);
  return result;
}

// Coordinates are in the guide's coordinate system, not the image resolution.
export function validateManualRectangles(rectangles,layout){
  const width=layout.columns*512,height=layout.rows*512;
  if(!Array.isArray(rectangles)||rectangles.length!==layout.tiles.length)throw new Error('Marcá todas las piezas.');
  const result=layout.tiles.map(piece=>{
    const matches=rectangles.filter(r=>r.piece===piece),r=matches[0];
    if(matches.length!==1||![r.x,r.y,r.width,r.height].every(Number.isFinite)||r.x<0||r.y<0||r.width<8||r.height<8||r.x+r.width>width+.01||r.y+r.height>height+.01)throw new Error(`Revisá el recorte de ${piece}. Debe quedar dentro de la imagen.`);
    return {piece,x:r.x,y:r.y,width:r.width,height:r.height,reviewRequired:true,manual:true};
  });
  for(let i=0;i<result.length;i++)for(let j=i+1;j<result.length;j++){
    const a=result[i],b=result[j];
    if(Math.min(a.x+a.width,b.x+b.width)>Math.max(a.x,b.x)&&Math.min(a.y+a.height,b.y+b.height)>Math.max(a.y,b.y))throw new Error('Los recortes se superponen. Separá las piezas antes de aplicar.');
  }
  return result;
}
