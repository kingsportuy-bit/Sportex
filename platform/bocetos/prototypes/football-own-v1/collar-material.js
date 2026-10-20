import {parseColor} from './material.js';

// Normalized filtering separates the generated folds from its oversized knit.
function smoothField(material,radius){
  const {width:w,height:h,alpha,gray}=material,stride=w+1;
  const values=new Float64Array(stride*(h+1)),weights=new Float64Array(values.length);
  for(let y=0;y<h;y++){
    let sum=0,weight=0;
    for(let x=0;x<w;x++){
      const p=y*w+x,k=(y+1)*stride+x+1;sum+=gray[p]*alpha[p];weight+=alpha[p];
      values[k]=values[k-stride]+sum;weights[k]=weights[k-stride]+weight;
    }
  }
  const result=new Float32Array(w*h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const left=Math.max(0,x-radius),right=Math.min(w,x+radius+1),top=Math.max(0,y-radius),bottom=Math.min(h,y+radius+1);
    const a=top*stride+left,b=top*stride+right,c=bottom*stride+left,d=bottom*stride+right;
    const weight=weights[d]-weights[b]-weights[c]+weights[a];
    result[y*w+x]=weight?(values[d]-values[b]-values[c]+values[a])/weight:180;
  }
  return result;
}

// Map only actual fabric pixels, skipping the empty opening of the source band.
function sourceMap(target,source){
  const columns=(material,threshold)=>Array.from({length:material.width},(_,x)=>{
    const spans=[];let active=null;
    for(let y=0;y<material.height;y++){
      if(material.alpha[y*material.width+x]>threshold){if(!active){active=[];spans.push(active);}active.push(y*material.width+x);}
      else active=null;
    }
    return spans;
  });
  const original=columns(source,96),shape=columns(target,0),mapped=new Int32Array(target.alpha.length);mapped.fill(-1);
  for(let x=0;x<target.width;x++){
    const wanted=Math.min(source.width-1,Math.floor((x+.5)*source.width/target.width));let samples=original[wanted];
    if(!samples.length)for(let radius=1;radius<source.width;radius++){
      samples=original[wanted-radius]?.length?original[wanted-radius]:original[wanted+radius]?.length?original[wanted+radius]:[];if(samples.length)break;
    }
    if(!samples.length||!shape[x].length)continue;
    const spans=shape[x];
    for(let segment=0;segment<spans.length;segment++){
      // Use the outward-facing band, never the differently lit inner strip.
      const pixels=spans[segment],band=samples[samples.length-1];
      for(let rank=0;rank<pixels.length;rank++)mapped[pixels[rank]]=band[Math.round(rank/Math.max(1,pixels.length-1)*(band.length-1))];
    }
  }
  return mapped;
}

export function matchCollarMaterial(target,reference,shade){
  const mapping=sourceMap(target,reference),soft=smoothField(target,Math.max(2,Math.round(target.width/30))),broad=smoothField(target,Math.max(4,Math.round(target.width/8)));
  const folds=Float32Array.from(soft,(value,p)=>Math.max(.88,Math.min(1.10,Math.sqrt(value/Math.max(1,broad[p])))));
  const {burn,screen}=reference.psdLights;
  target.paint=settings=>{
    const color=parseColor(settings.color),data=new Uint8ClampedArray(target.alpha.length*4),palette=new Uint8ClampedArray(reference.alpha.length*3);
    for(let q=0;q<reference.alpha.length;q++)if(reference.alpha[q])palette.set(shade(color,burn.subarray(q*4,q*4+4),screen.subarray(q*4,q*4+4)),q*3);
    for(let p=0;p<target.alpha.length;p++)if(target.alpha[p]&&mapping[p]>=0){
      const q=mapping[p]*3,j=p*4;
      data[j]=palette[q]*folds[p];data[j+1]=palette[q+1]*folds[p];data[j+2]=palette[q+2]*folds[p];data[j+3]=target.alpha[p];
    }
    return {width:target.width,height:target.height,data};
  };
  target.materialSource='football-basic-original-collar';
}

