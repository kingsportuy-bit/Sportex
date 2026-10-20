import {captureTextureTransforms} from './reference-compare.js';

// Live accessors let the existing adjustment canvas edit or restore the chosen source.
export function resolveTextureClips(ai={},custom={},modes={}){
  const clips={};
  for(const piece of new Set([...Object.keys(ai),...Object.keys(custom)])){
    const own=modes[piece]==='custom',source=own?custom[piece]?.clip:ai[piece];
    if(modes[piece]==='none'||!source)continue;
    Object.defineProperty(clips,piece,{enumerable:true,get:()=>own?custom[piece].clip:ai[piece],set:value=>{if(own)custom[piece].clip=value;else ai[piece]=value;}});
  }
  return clips;
}
// Metrics are measured at 1000px. Scale the font uniformly to its visible ink.
export function fitTextInk(metrics,height){
  const ascent=metrics.actualBoundingBoxAscent||0,descent=metrics.actualBoundingBoxDescent||0;
  const ratio=height/Math.max(1,ascent+descent),left=metrics.actualBoundingBoxLeft??metrics.width/2,right=metrics.actualBoundingBoxRight??metrics.width/2;
  return {height,width:Math.max(1,left+right)*ratio,fontSize:1000*ratio,
    baselineOffset:(ascent-descent)*ratio/2,inkOffsetX:(left-right)*ratio/2};
}

export function proportionalResize(r,point){
  const b=r.bounds,cx=b.x+b.width/2,cy=b.y+b.height/2,angle=r.rotation||0;
  const rotate=(p,x,y,a)=>({x:x+(p.x-x)*Math.cos(a)-(p.y-y)*Math.sin(a),y:y+(p.x-x)*Math.sin(a)+(p.y-y)*Math.cos(a)});
  const p=rotate(point,cx,cy,-angle),dx=(p.x-r.anchorX)*r.hx,dy=(p.y-r.anchorY)*r.hy;
  const ratio=Math.max(.05,Math.min(20,r.hx&&r.hy?(dx*b.width+dy*b.height)/(b.width*b.width+b.height*b.height):r.hx?dx/b.width:dy/b.height));
  const center=rotate({x:r.anchorX+r.hx*b.width*ratio/2,y:r.anchorY+r.hy*b.height*ratio/2},cx,cy,angle),scale=(r.initialScaleY??1)*ratio;
  return {x:center.x,y:center.y,scaleX:(r.initialScaleX??r.initialScaleY??1)*ratio,scaleY:scale};
}

export function trackedGlyphLayout(value,measure,gap){
  let prefix='',left=Infinity,right=-Infinity;
  const glyphs=Array.from(value).map((text,index)=>{prefix+=text;const m=measure(text),x=measure(prefix).width-m.width+index*gap;left=Math.min(left,x-(m.actualBoundingBoxLeft??0));right=Math.max(right,x+(m.actualBoundingBoxRight??m.width));return {text,x};});
  const center=(left+right)/2;return {width:Math.max(1,right-left),glyphs:glyphs.map(g=>({...g,x:g.x-center}))};
}

export function compositionTransform(bounds,includeSocks,frame=1440,height=1920){
  if(includeSocks||!bounds.length)return {scale:1,x:0,y:0};
  const left=Math.min(...bounds.map(b=>b.x)),right=Math.max(...bounds.map(b=>b.x+b.width)),top=Math.min(...bounds.map(b=>b.y)),bottom=Math.max(...bounds.map(b=>b.y+b.height));
  const scale=Math.min((frame-120)/(right-left),(height-160)/(bottom-top));
  return {scale,x:540-(left+right)/2*scale,y:height/2-(top+bottom)/2*scale};
}

export function initialParameterSketch(blank,model,assets={}){
  if(!model)return blank;
  // Cached files are reusable; the settings of the last edited sketch are not defaults.
  const logos=Object.fromEntries(['brand','brand2','crest'].map(type=>[type,[...new Map([...(blank.logos?.[type]||[]),...(assets.logos?.[type]||[])].map(logo=>[logo.id,logo])).values()]]));
  const inputs={...blank.inputs,...model.inputs,'design-format':'3:4','cuffs-enabled':false};
  for(const type of ['brand','brand2','crest'])inputs[`${type}-select`]=(logos[type].find(logo=>logo.id===model.inputs?.[`${type}-select`])||logos[type].find(logo=>logo.name===model.logoFiles?.[type]))?.id||'';
  const sponsorFiles=[...(blank.sponsors||[]),...(assets.sponsors||[])];
  const sponsors=(model.sponsors||[]).flatMap(sponsor=>{const file=sponsorFiles.find(file=>file.id===sponsor.id)||sponsorFiles.find(file=>file.name===sponsor.name);return file?[{...file,...sponsor}]:[];});
  const layers=Object.fromEntries(Object.entries(blank.layers||{}).filter(([key])=>!key.startsWith('text-')&&!key.startsWith('sponsor-')));
  return {...blank,inputs,logos,sponsors,elementModel:structuredClone(model),layers:{...layers,...structuredClone(model.layers)},texts:structuredClone(model.texts||[]),visibleLayers:{...blank.visibleLayers,...model.visibleLayers},layerStyles:structuredClone(model.layerStyles||{}),trimEdits:structuredClone(model.trimEdits||{}),backgroundMode:model.backgroundMode||blank.backgroundMode,customBackground:model.backgroundMode==='custom'?(assets.customBackground??blank.customBackground):null,documentPalette:[...(model.documentPalette||[])]};
}

export function parameterInputs(inputs){
  const content=new Set(['notes','player-name','player-number']);
  return Object.fromEntries(Object.entries(inputs).filter(([id,value])=>!content.has(id)&&['string','boolean','number'].includes(typeof value)));
}

export function replacementImageSize(size,previous,next){
  return size*Math.max(1,next.width/next.height)/Math.max(1,previous.width/previous.height);
}

export function makeElementModel(sketch,keys){
  const layers=Object.fromEntries(keys.filter(key=>sketch.layers[key]).map(key=>[key,
    {...Object.fromEntries(['x','y','size','scaleX','scaleY','rotation','letterSpacing'].filter(field=>Number.isFinite(sketch.layers[key][field])).map(field=>[field,sketch.layers[key][field]])),...(sketch.layers[key].attachment?{attachment:structuredClone(sketch.layers[key].attachment)}:{})}]));
  return {schemaVersion:1,kind:'sportex-initial-parameters',textSizing:'visible-height',layers,
    inputs:parameterInputs(sketch.inputs),
    backgroundMode:sketch.backgroundMode||sketch.inputs['background-select'],documentPalette:[...(sketch.documentPalette||[])],
    layerStyles:structuredClone(Object.fromEntries(keys.filter(key=>sketch.layerStyles?.[key]).map(key=>[key,sketch.layerStyles[key]]))),
    trimEdits:structuredClone(sketch.trimEdits||{}),
    sponsors:(sketch.sponsors||[]).map(({id,name,visible})=>({id,name,visible:visible!==false})),texts:structuredClone(sketch.texts||[]),
    texturePlacements:captureTextureTransforms(sketch.designVariants?.[sketch.activeVariant]?.clips||{},['front','back','left','right','short']),
    logoFiles:Object.fromEntries(['brand','brand2','crest'].map(key=>[key,sketch.logos?.[key]?.find(logo=>logo.id===sketch.inputs[`${key}-select`])?.name||null])),
    visibleLayers:Object.fromEntries(keys.map(key=>[key,sketch.visibleLayers[key]!==false]))};
}
