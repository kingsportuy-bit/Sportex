export const silhouetteOutputVersion='mask-bleed-v1';

function runsAt(data,width,y){
  const runs=[];let start=-1;
  for(let x=0;x<=width;x++){
    const visible=x<width&&data[(y*width+x)*4]===183;
    if(visible&&start<0)start=x;
    if(!visible&&start>=0){runs.push(start,x);start=-1;}
  }
  return runs;
}

// Expand the actual contour, not its bounding box. The ellipse uses 10% of
// the pattern width/height as its radii; original visible pixels never move.
export function silhouetteGuide(pixels,bleed,separator='#00ff00'){
  const {width,height}=pixels,visible=Array.from({length:height},(_,y)=>runsAt(pixels.data,width,y));
  const rx=width/(1+bleed)*bleed/2,ry=height/(1+bleed)*bleed/2;
  const differences=Array.from({length:height},()=>new Int32Array(width+1));
  for(let y=0;y<height;y++)for(let dy=-Math.ceil(ry);dy<=Math.ceil(ry);dy++){
    const row=y+dy;if(row<0||row>=height||Math.abs(dy)>ry)continue;
    const dx=Math.ceil(rx*Math.sqrt(Math.max(0,1-(dy/ry)**2)));
    for(let i=0;i<visible[y].length;i+=2){const left=Math.max(0,visible[y][i]-dx),right=Math.min(width,visible[y][i+1]+dx);differences[row][left]++;differences[row][right]--;}
  }
  const data=new Uint8ClampedArray(width*height*4),outer=[];
  const background=separator==='#ff00ff'?[255,0,255,255]:[0,255,0,255];
  for(let y=0;y<height;y++){
    let count=0,start=-1;const runs=[];
    for(let x=0;x<=width;x++){
      count+=differences[y][x];const inside=x<width&&count>0;
      if(inside&&start<0)start=x;if(!inside&&start>=0){runs.push(start,x);start=-1;}
      if(x<width)data.set(inside?(pixels.data[(y*width+x)*4]===183?[183,215,237,255]:[246,211,186,255]):background,(y*width+x)*4);
    }
    outer.push(runs);
  }
  return {width,height,data,shape:{visible,outer}};
}

export function validSilhouetteLayout(layout){
  if(layout?.outputShape!==silhouetteOutputVersion||!Array.isArray(layout.rectangles)||!layout.rectangles.length)return false;
  return layout.rectangles.every(r=>['visible','outer'].every(key=>{
    const rows=r.shape?.[key];
    return Array.isArray(rows)&&rows.length===r.height&&rows.every(row=>Array.isArray(row)&&row.length%2===0&&row.length<=r.width*2&&row.every((value,i)=>Number.isInteger(value)&&value>=0&&value<=r.width&&(i===0||value>row[i-1])))&&rows.some(row=>row.length);
  })&&r.shape.visible.every((row,y)=>row.every((value,i)=>i%2===1||r.shape.outer[y].some((left,j)=>j%2===0&&left<=value&&r.shape.outer[y][j+1]>=row[i+1]))));
}

// Coordinates stay registered to the guide. Never enlarge a smaller generated
// shape to cover missing artwork: check coverage before any crop is committed.
export function inspectSilhouettes(exterior,imageWidth,imageHeight,layout){
  if(!validSilhouetteLayout(layout))throw new Error('La máscara de generación no es válida.');
  const sx=imageWidth/(layout.columns*512),sy=imageHeight/(layout.rows*512);
  return layout.rectangles.map(r=>{
    let visible=0,covered=0,outside=0,spill=0,margin=0,marginCovered=0;
    for(let y=0;y<r.height;y++)for(let x=0;x<r.width;x++){
      const inRuns=rows=>rows[y].some((left,i)=>i%2===0&&x>=left&&x<rows[y][i+1]);
      const artwork=!exterior[Math.min(imageHeight-1,Math.floor((r.y+y+.5)*sy))*imageWidth+Math.min(imageWidth-1,Math.floor((r.x+x+.5)*sx))];
      if(inRuns(r.shape.visible)){visible++;if(artwork)covered++;}
      else if(inRuns(r.shape.outer)){margin++;if(artwork)marginCovered++;}
      else{outside++;if(artwork)spill++;}
    }
    if(covered/visible<.995||outside>30&&spill/outside>.35)return {piece:r.piece,error:`La silueta de ${r.piece} no coincide con la máscara. El original se conserva; revisá Corregir separación.`};
    return {piece:r.piece,x:r.x,y:r.y,width:r.width,height:r.height,silhouette:true,marginReviewRequired:margin>0&&marginCovered/margin<.95};
  });
}
