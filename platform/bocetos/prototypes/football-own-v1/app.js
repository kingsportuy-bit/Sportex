import {collarTypes,collarLabels,defaults} from './renderer.js';
import {createBasicCollarRenderer,basicAnchorSchema,basicLayerNames} from './basic-renderer.js';
import {installAnchorEditor} from './anchor-editor.js';
const $=id=>document.getElementById(id),canvas=$('preview');
const makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
const renderer=createBasicCollarRenderer(makeCanvas),comparisons=[];
const editor=installAnchorEditor({canvas,renderer,onChange:schedule,schema:basicAnchorSchema});
function read(){const value={...defaults,anchors:editor.profile,collar:document.querySelector('[name=collar]:checked').value,showPieces:$('showPieces').checked};for(const id of ['color','second','sleeve','neckColor','pattern'])value[id]=$(id).value;return value;}
let frame=0,ready=false;
function paint(){frame=0;if(!ready)return;const s=read();editor.draw(renderer.drawPair(canvas,s,editor.focus));$('variant').textContent=`Cuello ${collarLabels[s.collar].toLocaleLowerCase('es')}`;$('view-label').textContent=editor.focus?(editor.focus==='front'?'Frente · detalle del cuello':'Espalda · detalle del cuello'):'Frente y espalda';if(document.querySelector('details').open)for(const [key,c]of comparisons)renderer.drawPair(c,{...s,collar:key});}
function schedule(){if(!frame)frame=requestAnimationFrame(paint);}
for(const id of ['color','second','sleeve','neckColor','pattern','showPieces'])$(id).addEventListener('input',schedule);
for(const radio of document.querySelectorAll('[name=collar]'))radio.addEventListener('change',schedule);
document.querySelector('details').addEventListener('toggle',schedule);
const presets={white:['#f4f5f3','#f4f5f3','#f4f5f3','#f4f5f3','solid'],black:['#151a17','#151a17','#151a17','#151a17','solid'],red:['#ce302e','#ce302e','#ce302e','#ce302e','solid'],stripes:['#edf0ed','#1c2520','#edf0ed','#1c2520','stripes']};
for(const b of document.querySelectorAll('[data-preset]'))b.addEventListener('click',()=>{const p=presets[b.dataset.preset];['color','second','sleeve','neckColor','pattern'].forEach((id,i)=>$(id).value=p[i]);$('showPieces').checked=false;schedule();});
$('download').addEventListener('click',()=>{const output=makeCanvas(1600,1000);renderer.drawPair(output,read());output.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`sportex-camiseta-propia-${read().collar}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});});
function loadImage(src){return new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error(`No se pudo cargar ${src}.`));i.src=src;});}
try{
  const files=[['v','assets/collar-v.png'],['polo','assets/collar-polo.png'],...['front','back'].flatMap(side=>basicLayerNames.map(name=>[`${side}-${name}`,`base/${side}-${name}.png`]))];
  const entries=await Promise.all(files.map(async([key,file])=>[key,await loadImage(file)]));
  renderer.load(Object.fromEntries(entries));editor.load();
  for(const key of collarTypes){const figure=document.createElement('figure'),c=makeCanvas(850,600),label=document.createElement('figcaption');label.textContent=collarLabels[key];figure.append(c,label);$('comparison').append(figure);comparisons.push([key,c]);}
  ready=true;$('download').disabled=false;$('status').textContent='Fútbol básico listo. Ajustá cada cuello sobre el mockup actual.';paint();
}catch(error){$('status').textContent=`${error.message} Recargá la página para reintentar.`;}
