// Pack the real pattern rectangles at one shared scale. No piece is rotated
// or stretched, and the provider canvas stays the same size as the old grid.
export const compactAtlasVersion='compact-v1';
const gutter=16;

function orders(items){
  if(items.length<2)return [items];
  return items.flatMap((item,i)=>orders(items.filter((_,j)=>i!==j)).map(rest=>[item,...rest]));
}
function pack(order,patterns,width,height,scale){
  let free=[{x:0,y:0,width:width-2*gutter+gutter,height:height-2*gutter+gutter}];
  const placed=[];
  for(const piece of order){
    const p=patterns[piece],w=Math.max(1,Math.round(p.width*scale))+gutter,h=Math.max(1,Math.round(p.height*scale))+gutter;
    const fits=free.filter(r=>w<=r.width&&h<=r.height).sort((a,b)=>
      Math.min(a.width-w,a.height-h)-Math.min(b.width-w,b.height-h)||
      Math.max(a.width-w,a.height-h)-Math.max(b.width-w,b.height-h)||a.y-b.y||a.x-b.x);
    if(!fits.length)return null;
    const r={x:fits[0].x,y:fits[0].y,width:w,height:h};
    placed.push({piece,x:r.x+gutter,y:r.y+gutter,width:w-gutter,height:h-gutter,pattern:{...p}});
    // Split all intersecting free spaces; their overlap is removed by the next
    // occupied rectangle. Discard contained spaces to keep this list small.
    const split=[];
    for(const f of free){
      if(r.x>=f.x+f.width||r.x+r.width<=f.x||r.y>=f.y+f.height||r.y+r.height<=f.y){split.push(f);continue;}
      if(r.x>f.x)split.push({...f,width:r.x-f.x});
      if(r.x+r.width<f.x+f.width)split.push({...f,x:r.x+r.width,width:f.x+f.width-r.x-r.width});
      if(r.y>f.y)split.push({...f,height:r.y-f.y});
      if(r.y+r.height<f.y+f.height)split.push({...f,y:r.y+r.height,height:f.y+f.height-r.y-r.height});
    }
    free=split.filter((a,i)=>!split.some((b,j)=>j!==i&&b.x<=a.x&&b.y<=a.y&&b.x+b.width>=a.x+a.width&&b.y+b.height>=a.y+a.height&&(j<i||b.x<a.x||b.y<a.y||b.width>a.width||b.height>a.height)));
  }
  return placed;
}

export function compactAtlas(tiles,patterns){
  if(!Array.isArray(tiles)||!tiles.length||tiles.length>5||new Set(tiles).size!==tiles.length||tiles.some(piece=>!patterns[piece]||![patterns[piece].width,patterns[piece].height].every(n=>Number.isFinite(n)&&n>0)))throw new Error('Las dimensiones de las piezas no son válidas.');
  const columns=tiles.length>4?3:tiles.length>1?2:1,rows=Math.ceil(tiles.length/columns),width=columns*512,height=rows*512;
  const upper=Math.min(...tiles.map(piece=>Math.min((width-2*gutter)/patterns[piece].width,(height-2*gutter)/patterns[piece].height)));
  let best={scale:0,rectangles:null};
  for(const order of orders(tiles)){
    if(best.rectangles&&!pack(order,patterns,width,height,best.scale))continue;
    let low=best.scale,high=upper,rectangles=pack(order,patterns,width,height,low);
    for(let step=0;step<18;step++){
      const scale=(low+high)/2,candidate=pack(order,patterns,width,height,scale);
      if(candidate){low=scale;rectangles=candidate;}else high=scale;
    }
    if(low>best.scale)best={scale:low,rectangles};
  }
  return {columns,rows,tiles:[...tiles],packing:compactAtlasVersion,gutter,pixelsPerUnit:best.scale,
    rectangles:tiles.map(piece=>best.rectangles.find(r=>r.piece===piece))};
}

export function validCompactAtlas(layout){
  if(layout?.packing!==compactAtlasVersion||layout.gutter!==gutter||!Number.isFinite(layout.pixelsPerUnit)||layout.pixelsPerUnit<=0||!Array.isArray(layout.rectangles)||!layout.rectangles.length)return false;
  const width=layout.columns*512,height=layout.rows*512;
  if(!Number.isFinite(width)||!Number.isFinite(height))return false;
  const rectangles=layout.rectangles;
  for(const r of rectangles){
    if(![r.x,r.y,r.width,r.height].every(Number.isInteger)||r.width<1||r.height<1||r.x<gutter||r.y<gutter||r.x+r.width>width-gutter||r.y+r.height>height-gutter||!r.pattern)return false;
    if(![r.pattern.width,r.pattern.height].every(n=>Number.isFinite(n)&&n>0)||Math.abs(r.width-r.pattern.width*layout.pixelsPerUnit)>.51||Math.abs(r.height-r.pattern.height*layout.pixelsPerUnit)>.51)return false;
  }
  for(let i=0;i<rectangles.length;i++)for(let j=i+1;j<rectangles.length;j++){
    const a=rectangles[i],b=rectangles[j];
    if(!(a.x+a.width+gutter<=b.x||b.x+b.width+gutter<=a.x||a.y+a.height+gutter<=b.y||b.y+b.height+gutter<=a.y))return false;
  }
  return true;
}
