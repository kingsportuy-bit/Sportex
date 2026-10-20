import {exteriorMask,inspectAtlasRectangles} from './atlas-crop.js';
export const twoPassVersion='visible-then-bleed-v1';
export function guideVisibleRows(pixels){
  return Array.from({length:pixels.height},(_,y)=>{
    const runs=[];let open=false;
    for(let x=0;x<pixels.width;x++){
      const p=(y*pixels.width+x)*4,inside=pixels.data[p]===183&&pixels.data[p+1]===215&&pixels.data[p+2]===237;
      if(inside&&!open){runs.push(x);open=true;}
      if(open&&(!inside||x===pixels.width-1)){runs.push(inside?x+1:x);open=false;}
    }return runs;
  });
}
const rgb=separator=>separator==='#ff00ff'?[255,0,255,255]:[0,255,0,255];
export function visibleOnlyGuide(pixels,separator){
  const data=pixels.data.slice();
  for(let p=0;p<data.length;p+=4)if(data[p]!==183||data[p+1]!==215||data[p+2]!==237)data.set(rgb(separator),p);
  return {...pixels,data};
}
function bounds(rows){
  const ys=rows.flatMap((r,y)=>r.length?[y]:[]);
  return ys.length?{top:ys[0],bottom:ys.at(-1)}:null;
}
const runWidth=r=>r.reduce((n,x,i)=>n+(i%2?x-r[i-1]:0),0);
function arcX(runs,t){
  let remaining=Math.max(0,Math.min(.999999,t))*runWidth(runs);
  for(let i=0;i<runs.length;i+=2){const w=runs[i+1]-runs[i];if(remaining<w)return runs[i]+remaining;remaining-=w;}
  return runs.at(-1)-1;
}
// Register the FIRST pass, which contains visible fabric only. Its outside
// edge is therefore a visible seam, not an unknown boundary inside bleed.
export function registerVisibleAtlas(pixels,layout){
  const {width,height,data}=pixels,outside=exteriorMask(data,width,height,layout.separator),sx=width/(layout.columns*512),sy=height/(layout.rows*512);
  const result=new Uint8ClampedArray(data.length);
  const sample=(x,y)=>{
    const x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0;let weight=0;const c=[0,0,0];
    for(const [dx,dy,w] of [[0,0,(1-fx)*(1-fy)],[1,0,fx*(1-fy)],[0,1,(1-fx)*fy],[1,1,fx*fy]]){
      const xx=Math.max(0,Math.min(width-1,x0+dx)),yy=Math.max(0,Math.min(height-1,y0+dy)),p=yy*width+xx;
      if(outside[p]||data[p*4+3]<128)continue;weight+=w;for(let k=0;k<3;k++)c[k]+=data[p*4+k]*w;
    }
    if(weight<1e-8)return null;return [...c.map(v=>Math.round(v/weight)),255];
  };
  for(const [index,r] of layout.rectangles.entries()){
    const col=index%layout.columns,row=Math.floor(index/layout.columns),left=Math.round(col*512*sx),right=Math.round((col+1)*512*sx),top=Math.round(row*512*sy),bottom=Math.round((row+1)*512*sy);
    const sourceRows=Array.from({length:height},()=>[]);
    for(let y=top;y<bottom;y++){
      const runs=sourceRows[y];let open=false;
      for(let x=left;x<right;x++){
        const p=y*width+x,inside=!outside[p]&&data[p*4+3]>=128;
        if(inside&&!open){runs.push(x);open=true;}
        if(open&&(!inside||x===right-1)){runs.push(inside?x+1:x);open=false;}
      }
      // Registration must follow substantial fabric, not a stray isolated pixel.
      sourceRows[y]=runs.flatMap((x,i)=>i%2===0&&runs[i+1]-x>=2?[x,runs[i+1]]:[]);
    }
    const source=bounds(sourceRows),target=bounds(r.visibleRows);
    if(!source||!target||source.bottom-source.top<12)throw new Error(`No se reconoce el diseño visible de ${r.piece}. El primer paso se conserva.`);
    const nearest=y=>{let yy=Math.max(source.top,Math.min(source.bottom,Math.round(y)));if(sourceRows[yy].length)return sourceRows[yy];for(let d=1;d<height;d++){if(sourceRows[yy-d]?.length)return sourceRows[yy-d];if(sourceRows[yy+d]?.length)return sourceRows[yy+d];}return [];};
    let count=0;
    for(let y=Math.max(0,Math.floor((r.y+target.top)*sy));y<Math.min(height,Math.ceil((r.y+target.bottom+1)*sy));y++){
      const localY=Math.max(target.top,Math.min(target.bottom,Math.floor((y+.5)/sy-r.y))),tr=r.visibleRows[localY];if(!tr.length)continue;
      const v=Math.max(0,Math.min(1,((y+.5)/sy-r.y-target.top)/Math.max(1,target.bottom-target.top+1))),sourceY=source.top+v*(source.bottom-source.top),sr=nearest(sourceY),tw=runWidth(tr);let preceding=0;
      for(let i=0;i<tr.length;i+=2){
        for(let x=Math.ceil((r.x+tr[i])*sx-.5);x<Math.ceil((r.x+tr[i+1])*sx-.5);x++){
          if(x<0||x>=width)continue;
          const localX=(x+.5)/sx-r.x,t=(preceding+localX-tr[i])/tw,sourceX=arcX(sr,t),pixel=sample(sourceX,sourceY)||sample(Math.floor(sourceX),Math.round(sourceY));
          if(!pixel)throw new Error(`Faltan píxeles visibles de ${r.piece}. El primer paso se conserva.`);
          result.set(pixel,(y*width+x)*4);count++;
        }preceding+=tr[i+1]-tr[i];
      }
    }
    if(count<100)throw new Error(`La pieza visible de ${r.piece} está incompleta.`);
  }
  return {data:result,width,height};
}
export function continuationInput(visible,layout){
  const {width,height}=visible,data=new Uint8ClampedArray(width*height*4),mask=new Uint8ClampedArray(data.length),sx=width/(layout.columns*512),sy=height/(layout.rows*512);
  for(let p=0;p<width*height;p++){data.set(rgb(layout.separator),p*4);mask[p*4+3]=255;}
  for(const r of layout.rectangles)for(let y=Math.floor(r.y*sy);y<Math.ceil((r.y+r.height)*sy);y++)for(let x=Math.floor(r.x*sx);x<Math.ceil((r.x+r.width)*sx);x++){
    const p=(y*width+x)*4;
    if(visible.data[p+3])data.set(visible.data.subarray(p,p+4),p);
    else{data.set([246,211,186,255],p);mask[p+3]=0;}
  }
  return {image:{data,width,height},mask:{data:mask,width,height}};
}
// Register a uniquely identifiable side-color boundary in the second pass to
// its frozen first-pass boundary. Only hidden pixels are resampled. Without
// this, an outpainter can move a green side strip and leave a yellow gap beside
// the preserved center. Repeated/ambiguous boundaries are left for review.
function alignHiddenSidePanels(data,visible,layout){
  const {width,height}=visible,source=data.slice(),sx=width/(layout.columns*512),sy=height/(layout.rows*512);
  const colorAt=(d,x,y)=>[d[(y*width+x)*4],d[(y*width+x)*4+1],d[(y*width+x)*4+2]];
  const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
  for(const r of layout.rectangles){
    const l=Math.floor(r.x*sx),rr=Math.ceil((r.x+r.width)*sx)-1;
    for(let y=Math.floor(r.y*sy);y<Math.min(height,Math.ceil((r.y+r.height)*sy));y++){
      let left=rr,right=l;
      for(let x=l;x<=rr;x++)if(visible.data[(y*width+x)*4+3]){left=Math.min(left,x);right=Math.max(right,x);}
      if(right-left<16)continue;
      const middle=Math.round((left+right)/2);if(!visible.data[(y*width+middle)*4+3])continue;
      const center=colorAt(visible.data,middle,y),anchors=[[l,l],[middle,middle],[rr,rr]];
      for(const side of [-1,1]){
        const edge=side<0?left:right,inset=Math.max(2,Math.min(5,Math.round((right-left)*.02))),edgeColor=colorAt(visible.data,edge-side*inset,y);
        if(distance(edgeColor,center)<75)continue;
        const isPanel=(d,x)=>{const c=colorAt(d,x,y);return distance(c,edgeColor)<Math.min(100,distance(c,center));};
        let target=null,consecutive=0;
        for(let x=edge-side*inset;side<0?x<middle:x>middle;x-=side){
          consecutive=isPanel(visible.data,x)?0:consecutive+1;
          if(consecutive===3){target=x+side*2;break;}
        }
        if(target===null)continue;
        const runs=[];let start=null;
        for(let x=side<0?l:middle;x<=(side<0?middle:rr);x++){
          if(isPanel(source,x)){if(start===null)start=x;}
          else if(start!==null){if(x-start>=3)runs.push([start,x]);start=null;}
        }
        if(start!==null)runs.push([start,side<0?middle:rr]);
        if(runs.length!==1)continue;
        const from=side<0?runs[0][1]:runs[0][0];
        if(Math.abs(from-target)>(right-left)*.4||from<=l||from>=rr)continue;
        anchors.push([from,target]);
      }
      anchors.sort((a,b)=>a[1]-b[1]);
      if(anchors.some((a,i)=>i&&a[0]<=anchors[i-1][0]))continue;
      for(let x=l;x<=rr;x++){
        const p=(y*width+x)*4;if(visible.data[p+3])continue;
        let n=0;while(n+2<anchors.length&&x>anchors[n+1][1])n++;
        const a=anchors[n],b=anchors[n+1],xx=a[0]+(x-a[1])/Math.max(1,b[1]-a[1])*(b[0]-a[0]),x0=Math.max(l,Math.min(rr,Math.floor(xx))),x1=Math.min(rr,x0+1),f=xx-Math.floor(xx);
        for(let c=0;c<4;c++)data[p+c]=Math.round(source[(y*width+x0)*4+c]*(1-f)+source[(y*width+x1)*4+c]*f);
      }
    }
  }
}
export function composeContinuation(visible,generated,layout){
  if(visible.width!==generated.width||visible.height!==generated.height||visible.data.length!==generated.data.length)throw new Error('El segundo paso cambió las dimensiones. El primero se conserva.');
  const input=continuationInput(visible,layout),data=generated.data.slice(),sx=generated.width/(layout.columns*512),sy=generated.height/(layout.rows*512);
  const actual=inspectAtlasRectangles(generated.data,generated.width,generated.height,layout);
  // The provider can shift an outer edge by a few pixels. Normalize only the
  // newly generated hidden fabric; the visible center below is copied exactly.
  for(let i=0;i<layout.rectangles.length;i++){
    const r=layout.rectangles[i],a=actual[i];
    if(a.error||Math.abs(a.width/r.width-1)>.12||Math.abs(a.height/r.height-1)>.12||Math.abs(a.x-r.x)>r.width*.12||Math.abs(a.y-r.y)>r.height*.12)throw new Error(`El margen de ${r.piece} cambió demasiado de lugar. El diseño visible se conserva.`);
    for(let y=Math.floor(r.y*sy);y<Math.ceil((r.y+r.height)*sy);y++)for(let x=Math.floor(r.x*sx);x<Math.ceil((r.x+r.width)*sx);x++){
      const p=(y*generated.width+x)*4;if(visible.data[p+3])continue;
      const xx=Math.max(a.x*sx,Math.min((a.x+a.width)*sx-1,a.x*sx+((x+.5)/sx-r.x)/r.width*a.width*sx-.5));
      const yy=Math.max(a.y*sy,Math.min((a.y+a.height)*sy-1,a.y*sy+((y+.5)/sy-r.y)/r.height*a.height*sy-.5));
      const x0=Math.floor(xx),y0=Math.floor(yy),x1=Math.min(generated.width-1,x0+1),y1=Math.min(generated.height-1,y0+1),fx=xx-x0,fy=yy-y0;
      for(let c=0;c<4;c++)data[p+c]=Math.round(generated.data[(y0*generated.width+x0)*4+c]*(1-fx)*(1-fy)+generated.data[(y0*generated.width+x1)*4+c]*fx*(1-fy)+generated.data[(y1*generated.width+x0)*4+c]*(1-fx)*fy+generated.data[(y1*generated.width+x1)*4+c]*fx*fy);
    }
  }
  alignHiddenSidePanels(data,visible,layout);
  let missing=0,hidden=0;
  for(let p=0;p<data.length;p+=4){
    // Absolute conservation, independent of what the provider did with its mask.
    if(visible.data[p+3])data.set(visible.data.subarray(p,p+4),p);
    else if(input.mask.data[p+3])data.set(input.image.data.subarray(p,p+4),p);
    else{hidden++;const r=data[p],g=data[p+1],b=data[p+2];if(data[p+3]<128||(layout.separator==='#00ff00'?g>145&&g-r>75&&g-b>75:Math.min(r,b)>145&&Math.min(r,b)-g>70)||Math.abs(r-246)<3&&Math.abs(g-211)<3&&Math.abs(b-186)<3)missing++;}
  }
  if(missing/Math.max(1,hidden)>.005)throw new Error('El segundo paso dejó margen sin generar. El diseño visible se conserva para reintentar solo el margen.');
  return {data,width:visible.width,height:visible.height};
}
