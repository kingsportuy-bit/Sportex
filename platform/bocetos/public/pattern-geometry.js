// A PSD subtraction leaves low-alpha pixels around the OTHER pieces. Those
// pixels are useful for antialiasing, but must never define the print's size.
export const patternGeometryVersion = 1;

export function patternBounds(rgba, width, height, scale = 1) {
  const visited = new Uint8Array(width * height), queue = new Int32Array(width * height);
  const components = [];
  for (let start = 0; start < visited.length; start++) {
    if (visited[start] || rgba[start * 4 + 3] < 128) continue;
    let head = 0, tail = 1, left = width, top = height, right = 0, bottom = 0;
    queue[0] = start; visited[start] = 1;
    while (head < tail) {
      const i = queue[head++], x = i % width, y = Math.floor(i / width);
      left = Math.min(left, x); top = Math.min(top, y);
      right = Math.max(right, x + 1); bottom = Math.max(bottom, y + 1);
      for (const n of [x ? i - 1 : -1, x + 1 < width ? i + 1 : -1, y ? i - width : -1, y + 1 < height ? i + width : -1,
        x && y ? i-width-1 : -1, x+1<width && y ? i-width+1 : -1,
        x && y+1<height ? i+width-1 : -1, x+1<width && y+1<height ? i+width+1 : -1]) {
        if (n < 0 || visited[n] || rgba[n * 4 + 3] < 128) continue;
        visited[n] = 1; queue[tail++] = n;
      }
    }
    components.push({left, top, right, bottom, area:tail});
  }
  if (!components.length) return {x:0,y:0,width:0,height:0};
  const largest = Math.max(...components.map(c => c.area));
  // Keep both socks/legs, but discard isolated PSD edge specks.
  const keep = components.filter(c => c.area >= largest * .01);
  const left = Math.min(...keep.map(c => c.left)), top = Math.min(...keep.map(c => c.top));
  return {x:left/scale,y:top/scale,width:(Math.max(...keep.map(c=>c.right))-left)/scale,height:(Math.max(...keep.map(c=>c.bottom))-top)/scale};
}

export function clipPatternBounds(mask, clip) {
  if (clip?.sleeveRegistration === 1 && mask.frame) return mask.frame.bounds;
  // Old saved placements keep their coordinate system until explicitly refit.
  return clip?.patternGeometry === patternGeometryVersion ? mask.bounds : (mask.legacyBounds || mask.bounds);
}

// Fit the real cuff edge, then measure the sleeve in that coordinate system.
// Front and rear projections each have their own angle and dimensions.
export function sleevePatternFrame(data, cuffs, width, height, bounds, scale=1) {
  const points=[];
  for(let x=Math.floor(bounds.x*scale);x<Math.ceil((bounds.x+bounds.width)*scale);x++){
    for(let y=Math.min(height-1,Math.ceil((bounds.y+bounds.height+35)*scale));y>=Math.max(0,Math.floor((bounds.y+bounds.height-40)*scale));y--){
      if(cuffs[(y*width+x)*4+3]>=128){points.push({x:x/scale,y:y/scale});break;}
    }
  }
  const middle=points.slice(Math.floor(points.length*.15),Math.ceil(points.length*.85));
  const mx=middle.reduce((s,p)=>s+p.x,0)/Math.max(1,middle.length),my=middle.reduce((s,p)=>s+p.y,0)/Math.max(1,middle.length);
  const covariance=middle.reduce((s,p)=>s+(p.x-mx)*(p.y-my),0),variance=middle.reduce((s,p)=>s+(p.x-mx)**2,0);
  const angle=middle.length>=8&&variance>0?Math.max(-30,Math.min(30,Math.atan(covariance/variance)*180/Math.PI)):0;
  const a=angle*Math.PI/180,cos=Math.cos(a),sin=Math.sin(a);
  let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
  for(let y=Math.floor(bounds.y*scale);y<Math.ceil((bounds.y+bounds.height)*scale);y++)for(let x=Math.floor(bounds.x*scale);x<Math.ceil((bounds.x+bounds.width)*scale);x++){
    if(data[(y*width+x)*4+3]<128)continue;
    const u=(x*cos+y*sin)/scale,v=(-x*sin+y*cos)/scale;
    left=Math.min(left,u);right=Math.max(right,u+1/scale);top=Math.min(top,v);bottom=Math.max(bottom,v+1/scale);
  }
  if(!Number.isFinite(left))return {angle:0,bounds};
  const u=(left+right)/2,v=(top+bottom)/2,w=right-left,h=bottom-top;
  return {angle,bounds:{x:u*cos-v*sin-w/2,y:u*sin+v*cos-h/2,width:w,height:h}};
}

export function resetPatternPlacement(clip) {
  const {views, ...rest} = clip;
  return {...rest,patternGeometry:patternGeometryVersion,x:0,y:0,scale:1,scaleX:1,scaleY:1,rotation:0,
    contentWindow:clip.contentWindow || {x:0,y:0,width:1,height:1}};
}
