import {createPrototypeRenderer,collarTypes,collarLabels,defaults} from './renderer.js';
const $=id=>document.getElementById(id),canvas=$('preview');
const makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
const renderer=createPrototypeRenderer(makeCanvas),comparisons=[];
function read(){const value={...defaults,collar:document.querySelector('[name=collar]:checked').value,showPieces:$('showPieces').checked};for(const id of ['color','second','sleeve','neckColor','pattern'])value[id]=$(id).value;return value;}
let frame=0,ready=false;
function paint(){frame=0;if(!ready)return;const s=read();renderer.drawPair(canvas,s);$('variant').textContent=`Cuello ${collarLabels[s.collar].toLocaleLowerCase('es')}`;if(document.querySelector('details').open)for(const [key,c]of comparisons)renderer.drawPair(c,{...s,collar:key});}
function schedule(){if(!frame)frame=requestAnimationFrame(paint);}
for(const id of ['color','second','sleeve','neckColor','pattern','showPieces'])$(id).addEventListener('input',schedule);
for(const radio of document.querySelectorAll('[name=collar]'))radio.addEventListener('change',schedule);
document.querySelector('details').addEventListener('toggle',schedule);
const presets={white:['#f4f5f3','#f4f5f3','#f4f5f3','#f4f5f3','solid'],black:['#151a17','#151a17','#151a17','#151a17','solid'],red:['#ce302e','#ce302e','#ce302e','#ce302e','solid'],stripes:['#edf0ed','#1c2520','#edf0ed','#1c2520','stripes']};
for(const b of document.querySelectorAll('[data-preset]'))b.addEventListener('click',()=>{const p=presets[b.dataset.preset];['color','second','sleeve','neckColor','pattern'].forEach((id,i)=>$(id).value=p[i]);$('showPieces').checked=false;schedule();});
$('download').addEventListener('click',()=>canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`sportex-camiseta-propia-${read().collar}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}));
function loadImage(src){return new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error(`No se pudo cargar ${src}.`));i.src=src;});}
try{
  const names={body:'body-neutral',round:'collar-round',v:'collar-v',polo:'collar-polo'};
  const entries=await Promise.all(Object.entries(names).map(async([key,file])=>[key,await loadImage(`assets/${file}.png`)]));
  renderer.load(Object.fromEntries(entries));
  for(const key of collarTypes){const figure=document.createElement('figure'),c=makeCanvas(850,600),label=document.createElement('figcaption');label.textContent=collarLabels[key];figure.append(c,label);$('comparison').append(figure);comparisons.push([key,c]);}
  ready=true;$('download').disabled=false;$('status').textContent='Prueba lista. Podés cambiar cuello, colores y estampado.';paint();
}catch(error){$('status').textContent=`${error.message} Recargá la página para reintentar.`;}
