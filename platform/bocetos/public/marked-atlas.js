export const cutlineColor=separator=>separator==='#ff00ff'?'#00ffff':'#ff00ff';
export const outerlineColor=separator=>separator==='#ff00ff'?'#00ff00':'#00ffff';
export function isCutline(r,g,b,color){return color==='#00ffff'?Math.min(g,b)>125&&Math.min(g,b)-r>65:color==='#00ff00'?g>145&&g-Math.max(r,b)>65:Math.min(r,b)>125&&Math.min(r,b)-g>65;}
const inRuns=(runs,x)=>runs.some((left,i)=>i%2===0&&x>=left&&x<runs[i+1]);
function rowBounds(rows){
 let left=Infinity,top=rows.length,right=0,bottom=0;
 rows.forEach((runs,y)=>{if(runs.length){left=Math.min(left,runs[0]);right=Math.max(right,runs.at(-1));top=Math.min(top,y);bottom=y+1;}});
 return {x:left,y:top,width:right-left,height:bottom-top};
}
export function paintCutline(guide,color,outerColor){
 const {data,width,height,shape}=guide,ink=color==='#00ffff'?[0,255,255,255]:[255,0,255,255];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  if(inRuns(shape.visible[y],x)||!inRuns(shape.outer[y],x))continue;
  let near=false;
  for(let dy=-2;dy<=2&&!near;dy++)for(let dx=-2;dx<=2;dx++)if(shape.visible[y+dy]&&inRuns(shape.visible[y+dy],x+dx)){near=true;break;}
  if(near)data.set(ink,(y*width+x)*4);
 }
 if(outerColor)for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  if(!inRuns(shape.outer[y],x))continue;
  let edge=false;for(let dy=-1;dy<=1&&!edge;dy++)for(let dx=-1;dx<=1;dx++)if(!shape.outer[y+dy]||!inRuns(shape.outer[y+dy],x+dx)){edge=true;break;}
  if(edge)data.set(outerColor==='#00ffff'?[0,255,255,255]:[0,255,0,255],(y*width+x)*4);
 }return guide;
}

// Locate the generated CUT LINE, not the exterior artwork edge. Close only
// one-pixel raster gaps; a genuinely missing contour must remain an error.
export function detectMarkedAtlas(data,width,height,layout){
 const wall=new Uint8Array(width*height),ink=new Uint8Array(width*height),queue=new Int32Array(width*height);
 for(let p=0;p<wall.length;p++)if(isCutline(data[p*4],data[p*4+1],data[p*4+2],layout.cutline)){
  const x=p%width,y=Math.floor(p/width);
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(x+dx>=0&&x+dx<width&&y+dy>=0&&y+dy<height)wall[(y+dy)*width+x+dx]=1;
  for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++)if(x+dx>=0&&x+dx<width&&y+dy>=0&&y+dy<height)ink[(y+dy)*width+x+dx]=1;
 }
 let head=0,tail=0;
 const visit=p=>{if(!wall[p]){wall[p]=1;queue[tail++]=p;}};
 for(let x=0;x<width;x++){visit(x);visit((height-1)*width+x);}for(let y=0;y<height;y++){visit(y*width);visit(y*width+width-1);}
 const neighbors=(p,fn)=>{const x=p%width;if(x)fn(p-1);if(x+1<width)fn(p+1);if(p>=width)fn(p-width);if(p+width<wall.length)fn(p+width);};
 while(head<tail)neighbors(queue[head++],visit);
 if(layout.outerline)for(let p=0;p<wall.length;p++)if(wall[p]&&isCutline(data[p*4],data[p*4+1],data[p*4+2],layout.outerline)){
  const x=p%width,y=Math.floor(p/width);
  for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++)if(x+dx>=0&&x+dx<width&&y+dy>=0&&y+dy<height)ink[(y+dy)*width+x+dx]=1;
 }
 const groups=layout.rectangles.map(()=>[]);
 for(let start=0;start<wall.length;start++){
  if(wall[start])continue;head=0;tail=0;visit(start);
  let left=width,right=0,top=height,bottom=0;
  while(head<tail){const p=queue[head++],x=p%width,y=Math.floor(p/width);left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);neighbors(p,visit);}
  if(tail<Math.max(30,width*height*.00005))continue;
  const col=Math.min(layout.columns-1,Math.floor((left+right)/2/width*layout.columns)),row=Math.min(layout.rows-1,Math.floor((top+bottom)/2/height*layout.rows));
  groups[row*layout.columns+col]?.push(Array.from(queue.subarray(0,tail)));
 }
 return layout.rectangles.map((r,i)=>{
  const group=groups[i];
  if(!group.length||group.length>(['socks','short'].includes(r.piece)?2:1))throw new Error(`No se pudo reconocer el contorno interior de ${r.piece}. El original se conserva.`);
  const spans=Array.from({length:height},()=>[]);
  for(const points of group)for(const p of points)spans[Math.floor(p/width)].push(p%width);
  const rows=spans.map(xs=>{xs.sort((a,b)=>a-b);const runs=[];for(let j=0;j<xs.length;j++){if(j===0||xs[j]>xs[j-1]+1)runs.push(xs[j]);if(j===xs.length-1||xs[j+1]>xs[j]+1)runs.push(xs[j]+1);}return runs;});
  const bounds=rowBounds(rows),expected=rowBounds(r.shape.visible);
  if(bounds.width<12||bounds.height<20||!Number.isFinite(expected.x))throw new Error(`El contorno interior de ${r.piece} está incompleto.`);
  return {piece:r.piece,x:r.x,y:r.y,width:r.width,height:r.height,marked:true,sourceRows:rows,sourceBounds:bounds,sourceInk:ink};
 });
}

export function warpMarkedTile(data,width,height,layout,registration,exterior=null){
 const r=layout.rectangles.find(item=>item.piece===registration.piece),target=rowBounds(r.shape.visible),source=registration.sourceBounds;
 const out=new Uint8ClampedArray(r.width*r.height*4);let visible=0,missingVisible=0,margin=0,missingMargin=0;
 const nearestRow=(rows,y)=>{let yy=Math.max(0,Math.min(rows.length-1,Math.floor(y)));if(rows[yy].length)return rows[yy];for(let d=1;d<rows.length;d++){if(rows[yy-d]?.length)return rows[yy-d];if(rows[yy+d]?.length)return rows[yy+d];}return [];};
 const sample=(x,y)=>{
  x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=width||y>=height)return null;
  let p=y*width+x;if(exterior?.[p]||data[p*4+3]<32)return null;
  if(registration.sourceInk[p]||isCutline(data[p*4],data[p*4+1],data[p*4+2],layout.cutline)){
   let found=-1;
   for(let d=1;d<=8&&found<0;d++)for(let dy=-d;dy<=d&&found<0;dy++)for(let dx=-d;dx<=d;dx++){
    if(Math.max(Math.abs(dx),Math.abs(dy))!==d||x+dx<0||x+dx>=width||y+dy<0||y+dy>=height)continue;
    const q=(y+dy)*width+x+dx;if(!exterior?.[q]&&!registration.sourceInk[q]&&data[q*4+3]>32&&!isCutline(data[q*4],data[q*4+1],data[q*4+2],layout.cutline)){found=q;break;}
   }if(found<0)return null;p=found;
  }return data.subarray(p*4,p*4+4);
 };
 for(let y=0;y<r.height;y++){
  const sy=source.y+((y+.5-target.y)/target.height)*source.height-.5;
  const tr=nearestRow(r.shape.visible,y),sr=nearestRow(registration.sourceRows,sy);
  for(let x=0;x<r.width;x++){
   if(!inRuns(r.shape.outer[y],x))continue;
   const inside=inRuns(r.shape.visible[y],x);if(inside)visible++;else margin++;
   // Corresponding intervals keep two socks/legs separate. Use the envelope
   // only where source and target disagree at the neckline transition.
   let ti=0;if(tr.length===sr.length&&tr.length>2){let distance=Infinity;for(let i=0;i<tr.length;i+=2){const d=Math.abs(x-(tr[i]+tr[i+1])/2);if(d<distance){distance=d;ti=i;}}}
   const tl=tr[ti],tw=(ti||tr.length===sr.length?tr[ti+1]:tr.at(-1))-tl;
   const sl=sr[ti],sw=(ti||tr.length===sr.length?sr[ti+1]:sr.at(-1))-sl;
   const pixel=sample(sl+(x+.5-tl)/tw*sw-.5,sy);
   if(pixel)out.set(pixel,(y*r.width+x)*4);else if(inside)missingVisible++;else missingMargin++;
  }
 }
 if(missingVisible/Math.max(1,visible)>.005)throw new Error(`Falta diseño dentro del contorno de ${r.piece}. El original se conserva.`);
 return {data:out,width:r.width,height:r.height,missingVisible,marginReviewRequired:missingMargin/Math.max(1,margin)>.05};
}
