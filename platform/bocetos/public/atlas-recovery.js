import {inspectAtlasRectangles, validateManualRectangles} from './atlas-crop.js';

const labels={front:'Frente',back:'Espalda',right:'Manga derecha',left:'Manga izquierda',short:'Short',socks:'Medias'};

// A recovery is a new variant. Never modify the saved original or its crops.
export function recoveredVariant(original,rectangles){
  const layout=structuredClone(original.layout);
  layout.manualRectangles=validateManualRectangles(rectangles,layout);
  const clips=structuredClone(original.clips||{});
  for(const piece of layout.tiles)delete clips[piece];
  return {parts:{...original.parts},rawImage:original.rawImage,layout,clips};
}

export function installAtlasRecovery({dialog,canvas,tabs,status,fields,confirm,close,onApply}){
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  let image,layout,rectangles=[],selected,drag=null,busy=false,session;
  const rect=()=>rectangles.find(r=>r.piece===selected);
  // Modal inputs are temporary crop coordinates, not document preferences.
  for(const eventName of ['keydown','input','change','focusin'])dialog.addEventListener(eventName,event=>event.stopPropagation());
  function render(){
    ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
    for(const r of rectangles){
      ctx.save();ctx.strokeStyle=r.piece===selected?'#d5ed4b':'#45c8ff';ctx.lineWidth=r.piece===selected?3:1.5;ctx.setLineDash([8,5]);ctx.strokeRect(r.x,r.y,r.width,r.height);
      ctx.setLineDash([]);ctx.font='bold 15px sans-serif';const text=labels[r.piece];ctx.fillStyle='#09110ee6';ctx.fillRect(r.x,r.y,ctx.measureText(text).width+12,24);ctx.fillStyle='#fff';ctx.fillText(text,r.x+6,r.y+17);ctx.restore();
    }
    for(const button of tabs.children){button.setAttribute('aria-pressed',String(button.dataset.piece===selected));button.textContent=`${labels[button.dataset.piece]}${rectangles.some(r=>r.piece===button.dataset.piece)?' ✓':''}`;}
    const r=rect();for(const [key,input] of Object.entries(fields))input.value=r?Math.round(r[key]*100)/100:'';
    try{validateManualRectangles(rectangles,layout);confirm.disabled=busy;status.textContent='Recortes completos. Revisá sus bordes antes de aplicar. El margen deberá comprobarse en Ajustar estampado.';}
    catch(error){confirm.disabled=true;status.textContent=error.message;}
  }
  function setRect(next){rectangles=rectangles.filter(r=>r.piece!==selected);rectangles.push({piece:selected,...next});render();}
  function point(event){const b=canvas.getBoundingClientRect();return{x:Math.max(0,Math.min(canvas.width,(event.clientX-b.left)*canvas.width/b.width)),y:Math.max(0,Math.min(canvas.height,(event.clientY-b.top)*canvas.height/b.height))};}
  canvas.addEventListener('pointerdown',event=>{if(busy||event.button!==0)return;event.preventDefault();drag={start:point(event),before:structuredClone(rectangles)};canvas.setPointerCapture(event.pointerId);});
  canvas.addEventListener('pointermove',event=>{if(!drag)return;const p=point(event),a=drag.start;setRect({x:Math.min(a.x,p.x),y:Math.min(a.y,p.y),width:Math.abs(a.x-p.x),height:Math.abs(a.y-p.y)});});
  canvas.addEventListener('pointerup',event=>{if(!drag)return;const r=rect();if(!r||r.width<8||r.height<8)rectangles=drag.before;drag=null;if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);render();});
  canvas.addEventListener('pointercancel',()=>{if(drag)rectangles=drag.before;drag=null;render();});
  for(const input of Object.values(fields))input.addEventListener('change',()=>{if(!busy)setRect(Object.fromEntries(Object.entries(fields).map(([key,field])=>[key,Number(field.value)])));});
  close.addEventListener('click',()=>{if(!busy)dialog.close();});
  dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
  confirm.addEventListener('click',async()=>{
    if(busy)return;
    try{
      const validated=validateManualRectangles(rectangles,layout);busy=true;confirm.disabled=true;close.disabled=true;status.textContent='Separando las piezas…';
      await onApply(validated,session);dialog.close();
    }catch(error){status.textContent=error.message;}
    finally{busy=false;close.disabled=false;confirm.disabled=false;}
  });
  return (source,sourceLayout,context)=>{
    image=source;layout=structuredClone(sourceLayout);session=context;selected=layout.tiles[0];drag=null;
    canvas.width=layout.columns*512;canvas.height=layout.rows*512;
    ctx.drawImage(image,0,0,canvas.width,canvas.height);
    try{rectangles=layout.manualRectangles?validateManualRectangles(layout.manualRectangles,layout):inspectAtlasRectangles(ctx.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height,layout).filter(r=>!r.error);}
    catch{rectangles=[];}
    tabs.replaceChildren(...layout.tiles.map(piece=>{const button=document.createElement('button');button.type='button';button.className='tool-button';button.dataset.piece=piece;button.addEventListener('click',()=>{if(!busy){selected=piece;render();}});return button;}));
    render();dialog.showModal();
  };
}
