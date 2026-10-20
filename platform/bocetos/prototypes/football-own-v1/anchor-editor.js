import * as defaultSchema from './anchors.js';
import {changeAnchorField,dragAnchor,anchorHandles,hitAnchor,canvasPoint,anchorScreenRect} from './anchors.js';

export function installAnchorEditor({canvas,renderer,onChange,schema=defaultSchema}){
  const {anchorStorageKey,defaultAnchorProfile,validateAnchorProfile,withAnchor}=schema;
  const $=id=>document.getElementById(id),clone=v=>JSON.parse(JSON.stringify(v));
  let profile=null,initial=null,layouts=[],gesture=null,fieldBefore=null;
  const history=[];
  const type=()=>document.querySelector('[name=collar]:checked').value;
  const side=()=>document.querySelector('[name=side]:checked').value;
  const status=text=>$('anchor-status').textContent=text;
  const active=()=>profile.anchors[type()][side()];
  function syncFields(){
    if(!profile)return;
    const a=active();for(const field of ['centerX','top','width','height'])$(`anchor-${field}`).value=Number((a[field]*100).toFixed(2));
    $('keepRatio').checked=a.keepRatio;$('undo-anchor').disabled=!history.length;
    canvas.classList.toggle('editing',$('editAnchors').checked);
  }
  function persist(){
    try{localStorage.setItem(anchorStorageKey,JSON.stringify(profile));status('Anclajes guardados en este navegador. Exportá el JSON para compartirlos.');}
    catch{status('El navegador no permite guardar. Exportá el JSON para conservar los ajustes.');}
  }
  function commit(before){
    if(JSON.stringify(before)!==JSON.stringify(profile)){
      history.push(clone(before));if(history.length>30)history.shift();persist();
    }
    syncFields();onChange();
  }
  function load(){
    initial=defaultAnchorProfile(renderer.materials);profile=clone(initial);
    try{const stored=localStorage.getItem(anchorStorageKey);if(stored)profile=validateAnchorProfile(JSON.parse(stored));status(stored?'Se recuperaron tus anclajes guardados.':'Listo para ajustar. Cada cambio se guarda en este navegador.');}
    catch{status('No se recuperaron ajustes guardados. Podés importar un JSON o ajustar desde la base.');}
    for(const id of ['reset-anchor','export-anchors','import-anchors'])$(id).disabled=false;
    syncFields();
  }
  function stopGesture(cancel=false){
    if(!gesture)return;
    const g=gesture;gesture=null;
    if(cancel){profile=g.before;syncFields();onChange();status('Arrastre cancelado.');}
    else commit(g.before);
    if(canvas.hasPointerCapture(g.pointerId))canvas.releasePointerCapture(g.pointerId);
  }
  for(const field of ['centerX','top','width','height']){
    const input=$(`anchor-${field}`);
    input.addEventListener('focus',()=>{if(profile)fieldBefore=clone(profile);});
    input.addEventListener('input',()=>{
      if(!profile||!Number.isFinite(input.valueAsNumber))return;
      try{
        profile=withAnchor(profile,type(),side(),changeAnchorField(active(),field,input.valueAsNumber/100));
        // Mantener el campo que se está escribiendo; sincronizar el tamaño vinculado.
        for(const other of ['width','height'])if(other!==field)$(`anchor-${other}`).value=Number((active()[other]*100).toFixed(2));
        onChange();
      }catch(error){status(error.message);}
    });
    input.addEventListener('change',()=>{if(profile){commit(fieldBefore||profile);fieldBefore=clone(profile);}});
  }
  $('keepRatio').addEventListener('change',()=>{
    if(!profile)return;const before=clone(profile);
    profile=withAnchor(profile,type(),side(),changeAnchorField(active(),'keepRatio',$('keepRatio').checked));commit(before);
  });
  for(const radio of document.querySelectorAll('[name=side],[name=collar]'))radio.addEventListener('change',()=>{stopGesture();syncFields();onChange();});
  for(const id of ['editAnchors','focusNeck'])$(id).addEventListener('change',()=>{stopGesture();syncFields();onChange();});
  $('undo-anchor').addEventListener('click',()=>{if(!history.length)return;stopGesture(true);profile=history.pop();persist();syncFields();onChange();});
  $('reset-anchor').addEventListener('click',()=>{if(!profile)return;const before=clone(profile);profile=withAnchor(profile,type(),side(),initial.anchors[type()][side()]);commit(before);});
  function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  $('export-anchors').addEventListener('click',()=>{if(profile)download(new Blob([JSON.stringify(validateAnchorProfile(profile),null,2)+'\n'],{type:'application/json'}),'sportex-anclajes-camiseta.json');});
  $('import-anchors').addEventListener('click',()=>$('anchor-file').click());
  $('anchor-file').addEventListener('change',async()=>{
    const file=$('anchor-file').files[0];$('anchor-file').value='';if(!file||!profile)return;
    try{
      if(file.size>65536)throw new Error('El JSON debe pesar menos de 64 KB.');
      const next=validateAnchorProfile(JSON.parse(await file.text()));stopGesture(true);const before=clone(profile);profile=next;commit(before);status('JSON importado y guardado en este navegador.');
    }catch(error){status(`No se importó el archivo: ${error.message}`);}
  });
  const point=event=>canvasPoint({x:event.clientX,y:event.clientY},canvas.getBoundingClientRect(),{width:canvas.width,height:canvas.height});
  function find(point){
    if(!profile||!$('editAnchors').checked)return null;
    for(const layout of layouts.slice().sort((a,b)=>(b.side===side())-(a.side===side()))){
      const rect=anchorScreenRect(layout,renderer.placement(type(),layout.side,profile));
      const handle=hitAnchor(point,rect,9/point.scale);if(handle)return {layout,handle};
    }
    return null;
  }
  canvas.addEventListener('pointerdown',event=>{
    if(event.button!==0||gesture)return;const start=point(event),hit=find(start);if(!hit)return;
    event.preventDefault();canvas.focus({preventScroll:true});document.querySelector(`[name=side][value=${hit.layout.side}]`).checked=true;
    gesture={pointerId:event.pointerId,start,layout:hit.layout,handle:hit.handle,type:type(),side:hit.layout.side,before:clone(profile),anchor:clone(profile.anchors[type()][hit.layout.side])};
    canvas.setPointerCapture(event.pointerId);syncFields();onChange();
  });
  canvas.addEventListener('pointermove',event=>{
    if(gesture&&event.pointerId===gesture.pointerId){
      const g=gesture,p=point(event),dx=(p.x-g.start.x)/g.layout.scale,dy=(p.y-g.start.y)/g.layout.scale;
      profile=withAnchor(profile,g.type,g.side,dragAnchor(g.anchor,g.handle,dx,dy,renderer.materials.body[g.side]));syncFields();onChange();canvas.style.cursor='grabbing';
    }else{
      const hit=find(point(event)),resize={nw:'nwse',se:'nwse',ne:'nesw',sw:'nesw',n:'ns',s:'ns',w:'ew',e:'ew'};
      canvas.style.cursor=hit?(hit.handle==='move'?'grab':`${resize[hit.handle]}-resize`):'default';
    }
  });
  canvas.addEventListener('pointerup',event=>{if(gesture?.pointerId===event.pointerId)stopGesture();});
  canvas.addEventListener('pointercancel',()=>stopGesture(true));
  canvas.addEventListener('lostpointercapture',()=>{if(gesture)stopGesture(true);});
  canvas.addEventListener('keydown',event=>{
    if(event.key==='Escape'){stopGesture(true);return;}
    if(!profile||!$('editAnchors').checked)return;
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();$('undo-anchor').click();return;}
    const deltas={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]},delta=deltas[event.key];if(!delta)return;
    event.preventDefault();const before=clone(profile),amount=event.shiftKey?10:1;
    profile=withAnchor(profile,type(),side(),dragAnchor(active(),'move',delta[0]*amount,delta[1]*amount,renderer.materials.body[side()]));commit(before);
  });
  function draw(viewLayouts){
    layouts=viewLayouts;if(!profile||!$('editAnchors').checked)return;
    const ctx=canvas.getContext('2d'),box=canvas.getBoundingClientRect(),unit=1/Math.min(box.width/canvas.width,box.height/canvas.height);
    ctx.save();
    for(const layout of layouts){
      const rect=anchorScreenRect(layout,renderer.placement(type(),layout.side,profile)),selected=layout.side===side();
      ctx.strokeStyle=selected?'#1a6947':'#63776b';ctx.lineWidth=(selected?1.7:1)*unit;ctx.setLineDash([5*unit,4*unit]);ctx.strokeRect(rect.x,rect.y,rect.width,rect.height);ctx.setLineDash([]);
      if(!selected)continue;
      for(const p of Object.values(anchorHandles(rect))){ctx.fillStyle='#e9f56c';ctx.fillRect(p.x-4*unit,p.y-4*unit,8*unit,8*unit);ctx.strokeRect(p.x-4*unit,p.y-4*unit,8*unit,8*unit);}
      const cx=rect.x+rect.width/2,cy=rect.y+rect.height/2;ctx.beginPath();ctx.moveTo(cx-7*unit,cy);ctx.lineTo(cx+7*unit,cy);ctx.moveTo(cx,cy-7*unit);ctx.lineTo(cx,cy+7*unit);ctx.stroke();
    }
    ctx.restore();
  }
  return {load,draw,get profile(){return profile;},get focus(){return $('focusNeck').checked?side():null;}};
}
