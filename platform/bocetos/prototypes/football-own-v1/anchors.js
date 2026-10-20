export const bodyRevision='football-match-v2';
export const anchorStorageKey=`sportex:own-football:anchors:${bodyRevision}`;
const types=['round','v','polo'],sides=['front','back'];
const fields=['centerX','top','width','height'];
export const anchorLimits={centerX:[.05,.95],top:[-.05,.4],width:[.08,.7],height:[.015,.5]};
const copy=value=>JSON.parse(JSON.stringify(value));
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
function boundedScale(anchor,scale){
  return clamp(scale,Math.max(anchorLimits.width[0]/anchor.width,anchorLimits.height[0]/anchor.height),Math.min(anchorLimits.width[1]/anchor.width,anchorLimits.height[1]/anchor.height));
}

export function defaultAnchor(body,collar,type){
  if(body.neckAnchors?.[type])return {...body.neckAnchors[type],keepRatio:true};
  const width=type==='polo'?.36:.30;
  return {centerX:.5,top:-.006,width,height:width*body.width*collar.height/collar.width/body.height,keepRatio:true};
}
export function defaultAnchorProfile(materials,identity={model:'football-own-v1',bodyRevision}){
  return {schemaVersion:1,...identity,anchors:Object.fromEntries(types.map(type=>[type,Object.fromEntries(sides.map(side=>[side,defaultAnchor(materials.body[side],materials[type][side],type)]))]))};
}
export function clampAnchor(anchor){
  const a={...anchor};
  for(const field of fields){if(!Number.isFinite(a[field]))throw new Error('El anclaje contiene un número inválido.');a[field]=clamp(a[field],...anchorLimits[field]);}
  a.centerX=clamp(a.centerX,a.width/2,1-a.width/2);
  a.keepRatio=a.keepRatio!==false;
  return a;
}
export function validateAnchorProfile(data,identity={model:'football-own-v1',bodyRevision}){
  if(!data||data.schemaVersion!==1||data.model!==identity.model||data.bodyRevision!==identity.bodyRevision)throw new Error('El JSON no corresponde a esta versión de camiseta.');
  const anchors={};
  if(!data.anchors||Object.keys(data.anchors).sort().join()!==types.slice().sort().join())throw new Error('El archivo debe contener los tres cuellos.');
  for(const type of types){
    const views=data.anchors[type];if(!views||Object.keys(views).sort().join()!==sides.slice().sort().join())throw new Error(`Falta frente o espalda de ${type}.`);
    anchors[type]={};
    for(const side of sides){
      const a=views[side];
      if(!a||typeof a.keepRatio!=='boolean')throw new Error('La proporción del anclaje no es válida.');
      for(const field of fields){const[min,max]=anchorLimits[field];if(typeof a[field]!=='number'||!Number.isFinite(a[field])||a[field]<min||a[field]>max)throw new Error(`El valor ${field} está fuera del rango permitido.`);}
      if(a.centerX<a.width/2-1e-8||a.centerX>1-a.width/2+1e-8)throw new Error('El anclaje queda fuera del ancho de la camiseta.');
      anchors[type][side]=Object.fromEntries([...fields,'keepRatio'].map(key=>[key,a[key]]));
    }
  }
  return {schemaVersion:1,...identity,anchors};
}
export function withAnchor(profile,type,side,anchor){
  if(!types.includes(type)||!sides.includes(side))throw new Error('Anclaje desconocido.');
  const next=copy(profile);next.anchors[type][side]=clampAnchor(anchor);return validateAnchorProfile(next,{model:profile.model,bodyRevision:profile.bodyRevision});
}
export function createAnchorSchema(identity){return {
  anchorStorageKey:`sportex:collar-anchors:${identity.model}:${identity.bodyRevision}`,
  defaultAnchorProfile:materials=>defaultAnchorProfile(materials,identity),
  validateAnchorProfile:data=>validateAnchorProfile(data,identity),withAnchor
};}
export function anchorPlacement(anchor,body){return {x:(anchor.centerX-anchor.width/2)*body.width,y:anchor.top*body.height,width:anchor.width*body.width,height:anchor.height*body.height};}
export function placementAnchor(rect,body,keepRatio=true){return clampAnchor({centerX:(rect.x+rect.width/2)/body.width,top:rect.y/body.height,width:rect.width/body.width,height:rect.height/body.height,keepRatio});}

export function dragAnchor(anchor,handle,dx,dy,body){
  const r=anchorPlacement(anchor,body),n={...r};
  if(handle==='move'){n.x+=dx;n.y+=dy;return placementAnchor(n,body,anchor.keepRatio);}
  const west=handle.includes('w'),east=handle.includes('e'),north=handle.includes('n'),south=handle.includes('s');
  let width=Math.max(body.width*.08,r.width+(east?dx:west?-dx:0));
  let height=Math.max(body.height*.015,r.height+(south?dy:north?-dy:0));
  if(anchor.keepRatio){
    if(Math.abs(width/r.width-1)>=Math.abs(height/r.height-1))height=width*r.height/r.width;
    else width=height*r.width/r.height;
    const scale=boundedScale(anchor,width/r.width);width=r.width*scale;height=r.height*scale;
  }
  n.width=width;n.height=height;
  n.x=west?r.x+r.width-width:east?r.x:r.x+(r.width-width)/2;
  n.y=north?r.y+r.height-height:south?r.y:r.y+(r.height-height)/2;
  return placementAnchor(n,body,anchor.keepRatio);
}

export function changeAnchorField(anchor,field,value){
  if(field==='keepRatio')return {...anchor,keepRatio:Boolean(value)};
  if(!fields.includes(field)||!Number.isFinite(value))throw new Error('El valor del anclaje no es válido.');
  const next={...anchor,[field]:value};
  if(anchor.keepRatio&&(field==='width'||field==='height')){
    const scale=boundedScale(anchor,value/anchor[field]);next.width=anchor.width*scale;next.height=anchor.height*scale;
  }
  return clampAnchor(next);
}

export function anchorHandles(rect){
  const{x,y,width:w,height:h}=rect;
  return {nw:{x,y},n:{x:x+w/2,y},ne:{x:x+w,y},e:{x:x+w,y:y+h/2},se:{x:x+w,y:y+h},s:{x:x+w/2,y:y+h},sw:{x,y:y+h},w:{x,y:y+h/2}};
}
export function hitAnchor(point,rect,radius){
  for(const[key,p]of Object.entries(anchorHandles(rect)))if(Math.hypot(point.x-p.x,point.y-p.y)<=radius)return key;
  return point.x>=rect.x&&point.x<=rect.x+rect.width&&point.y>=rect.y&&point.y<=rect.y+rect.height?'move':null;
}
export function canvasPoint(client,box,size){
  const scale=Math.min(box.width/size.width,box.height/size.height);
  return {x:(client.x-box.left-(box.width-size.width*scale)/2)/scale,y:(client.y-box.top-(box.height-size.height*scale)/2)/scale,scale};
}
export function anchorScreenRect(layout,placement){
  return {x:layout.x+(placement.x+layout.pad)*layout.scale,y:layout.y+(placement.y+layout.pad)*layout.scale,width:placement.width*layout.scale,height:placement.height*layout.scale};
}
