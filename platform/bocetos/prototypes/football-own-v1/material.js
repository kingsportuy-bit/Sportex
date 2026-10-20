// Material neutro y máscaras derivadas de la transparencia real del recurso.
export function largestComponent(binary, width, height) {
  const seen = new Uint8Array(binary.length), queue = new Int32Array(binary.length);
  let best = [];
  for (let start = 0; start < binary.length; start++) {
    if (!binary[start] || seen[start]) continue;
    let head = 0, tail = 1; queue[0] = start; seen[start] = 1;
    while (head < tail) {
      const p = queue[head++], x = p % width, y = Math.floor(p / width);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || xx >= width || yy < 0 || yy >= height) continue;
        const n = yy * width + xx;
        if (binary[n] && !seen[n]) { seen[n] = 1; queue[tail++] = n; }
      }
    }
    if (tail > best.length) best = queue.slice(0, tail);
  }
  const result = new Uint8Array(binary.length);
  for (const p of best) result[p] = 1;
  return result;
}

export function prepareMaterial(rgba, width, height, kind = 'body') {
  const binary = new Uint8Array(width * height);
  for (let p = 0; p < binary.length; p++) {
    const j = p * 4, mean = (rgba[j] + rgba[j+1] + rgba[j+2]) / 3;
    binary[p] = rgba[j+3] > 100 && mean < 244 ? 1 : 0;
  }
  const selected = largestComponent(binary, width, height);
  let left = width, right = 0, top = height, bottom = 0;
  for (let p = 0; p < selected.length; p++) if (selected[p]) {
    const x = p % width, y = Math.floor(p / width);
    left = Math.min(left, x); right = Math.max(right, x+1);
    top = Math.min(top, y); bottom = Math.max(bottom, y+1);
  }
  if (right <= left || bottom <= top) throw new Error('El recurso no contiene una pieza visible.');
  const w = right-left, h = bottom-top;
  const alpha = new Uint8Array(w*h), gray = new Uint8Array(w*h), hist = new Uint32Array(256);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = y*w+x, original = (y+top)*width+x+left, j = original*4;
    let coverage = 0, edgeGray = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x+left+dx, yy = y+top+dy;
      if (xx >= 0 && xx < width && yy >= 0 && yy < height && selected[yy*width+xx]) {
        coverage++;
        const k=(yy*width+xx)*4;
        edgeGray+=.2126*rgba[k]+.7152*rgba[k+1]+.0722*rgba[k+2];
      }
    }
    alpha[p] = Math.round(coverage/9*255);
    gray[p] = Math.round(selected[original] ? .2126*rgba[j]+.7152*rgba[j+1]+.0722*rgba[j+2] : coverage?edgeGray/coverage:180);
    if (selected[original]) hist[gray[p]]++;
  }
  const solid = hist.reduce((a,b)=>a+b,0); let accumulated = 0, reference = 180;
  for (let g = 0; g < 256; g++) { accumulated += hist[g]; if (accumulated >= solid*.72) { reference = g; break; } }
  const holes = new Uint8Array(w*h), exterior = new Uint8Array(w*h), queue = new Int32Array(w*h);
  let head = 0, tail = 0;
  function enqueue(x,y) { const p=y*w+x; if (alpha[p]<128 && !exterior[p]) { exterior[p]=1; queue[tail++]=p; } }
  for (let x=0;x<w;x++) { enqueue(x,0); enqueue(x,h-1); }
  for (let y=0;y<h;y++) { enqueue(0,y); enqueue(w-1,y); }
  while(head<tail) {
    const p=queue[head++],x=p%w,y=Math.floor(p/w);
    if(x)enqueue(x-1,y);if(x<w-1)enqueue(x+1,y);if(y)enqueue(x,y-1);if(y<h-1)enqueue(x,y+1);
  }
  for(let p=0;p<holes.length;p++)holes[p]=!exterior[p]&&alpha[p]<128?1:0;
  const mainHole=largestComponent(holes,w,h);
  const envelope = new Int16Array(w); envelope.fill(-1);
  for(let x=0;x<w;x++)for(let y=0;y<h;y++)if(alpha[y*w+x]>160){envelope[x]=y;break;}
  return { width:w,height:h,alpha,gray,reference,holes:mainHole,envelope,kind,
    sourceBounds:{x:left,y:top,width:w,height:h} };
}

export function parseColor(value) {
  if (!/^#[\da-f]{6}$/i.test(value)) throw new Error('Color inválido.');
  return [1,3,5].map(i=>parseInt(value.slice(i,i+2),16));
}

export function materialPixel(color, gray, reference) {
  const shade=Math.min(1,gray/Math.max(reference,1));
  const highlight=Math.max(0,(gray-reference)/Math.max(255-reference,1))*.32;
  return color.map(c=>Math.round(c*shade*(1-highlight)+255*highlight));
}

export function bodyPiece(x,y,width,height) {
  const u=x/width,v=y/height,seam=.155+Math.min(v/.45,1)*.08;
  if(v<.46&&u<seam)return 'left';
  if(v<.46&&u>1-seam)return 'right';
  return 'body';
}

export function paintMaterial(material, settings) {
  const {width,height,alpha,gray,reference}=material;
  const body=parseColor(settings.color), second=parseColor(settings.second||settings.color);
  const sleeve=parseColor(settings.sleeve||settings.color), data=new Uint8ClampedArray(width*height*4);
  const diagnostic={body:[72,156,208],left:[92,190,125],right:[236,157,82]};
  const lookup=new Map();
  for(const c of [body,second,sleeve,...Object.values(diagnostic)]){
    const lut=new Uint8Array(256*3);for(let g=0;g<256;g++)lut.set(materialPixel(c,g,reference),g*3);lookup.set(c,lut);
  }
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const p=y*width+x,j=p*4;if(!alpha[p])continue;
    let c=body;
    if(material.kind==='body'){
      const piece=bodyPiece(x,y,width,height);
      if(settings.showPieces)c=diagnostic[piece];
      else if(piece!=='body')c=sleeve;
      else if(settings.pattern==='stripes'&&Math.floor((x/width-.5)*10+.5)%2===0)c=second;
    }
    const lut=lookup.get(c),g=gray[p]*3;
    data[j]=lut[g];data[j+1]=lut[g+1];data[j+2]=lut[g+2];data[j+3]=alpha[p];
  }
  return {data,width,height};
}
