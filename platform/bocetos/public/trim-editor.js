import {curveFromPolyline,sampleCurve,splitCurve,transformNodes,curvePath,nodeBounds} from './trim-path.js';
import {encodeTrimCurve,decodeTrimCurve,trimPanelPolygon} from './garment-trims.js';

const groupNames={sleeve:'Manga',shoulder:'Hombro','shirt-side':'Pieza lateral camiseta','short-side':'Lateral short','short-hem':'Bajo short'};
const svgNS='http://www.w3.org/2000/svg';
const copy=value=>structuredClone(value);
function editablePoints(stroke,mask){
  const points=[];for(let i=1;i<stroke.points.length;i++){
    const a=stroke.points[i-1],b=stroke.points[i],steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/2));
    for(let j=0;j<steps;j++)points.push(a.map((v,k)=>v+(b[k]-v)*j/steps));
  }
  points.push(stroke.points.at(-1));const scale=mask.node.width/1080;
  const visible=points.map(([x,y],i)=>{const xx=Math.floor(x*scale),yy=Math.floor(y*scale);return xx>=0&&yy>=0&&xx<mask.node.width&&yy<mask.node.height&&mask.data[(yy*mask.node.width+xx)*4+3]>24?i:-1;}).filter(i=>i>=0);
  if(visible.length<2)return stroke.points;
  const margin=Math.ceil(stroke.width/2)+2;
  return points.slice(Math.max(0,visible[0]-margin),Math.min(points.length,visible.at(-1)+margin+1));
}
export function installTrimEditor({getBatches,getEdits,setEdits,preview,onStart,onFinish}){
  const $=id=>document.getElementById(id),dialog=$('trim-editor-dialog'),viewport=$('trim-editor-viewport'),stage=$('trim-editor-stage'),overlay=$('trim-editor-overlay'),background=$('trim-editor-canvas');
  let active=false,entries=[],selected='',nodeIndex=0,mode='nodes',drag=null,space=false,frame=0,session=null,history=[],historyIndex=0,scale=1;
  const entry=()=>entries.find(e=>e.stroke.key===selected),nodes=()=>{const e=entry();return e&&(decodeTrimCurve(getEdits()[e.stroke.editKey],e)||curveFromPolyline(e.stroke.points));};
  function make(name,attributes,parent=overlay){const el=document.createElementNS(svgNS,name);for(const [key,value]of Object.entries(attributes))el.setAttribute(key,String(value));parent.append(el);return el;}
  function remember(){const snapshot=copy(getEdits());if(JSON.stringify(snapshot)===JSON.stringify(history[historyIndex]))return;history.splice(historyIndex+1);history.push(snapshot);if(history.length>40)history.shift();historyIndex=history.length-1;}
  function updateHistory(){ $('trim-editor-undo').disabled=historyIndex===0;$('trim-editor-redo').disabled=historyIndex>=history.length-1;}
  function unit(){return background.width/(stage.getBoundingClientRect().width||background.width);}
  function offset(){return (background.width-1080)/2;}
  function paint(){
    if(!active)return;
    const source=preview();if(background.width!==source.width||background.height!==source.height){background.width=source.width;background.height=source.height;}
    background.getContext('2d').drawImage(source,0,0);overlay.setAttribute('viewBox',`0 0 ${source.width} ${source.height}`);draw();
  }
  function queue(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;paint();});}
  function flush(){if(frame)cancelAnimationFrame(frame);frame=0;paint();}
  function write(next,widthScale){
    const e=entry();if(!e)return;
    const key=e.stroke.editKey,existing=getEdits()[key]||{},edits={...getEdits(),[key]:{...encodeTrimCurve(next,e),widthScale:widthScale??existing.widthScale??1}};
    setEdits(edits);queue();
  }
  function point(event){const r=stage.getBoundingClientRect();return [(event.clientX-r.left)*background.width/r.width-offset(),(event.clientY-r.top)*background.height/r.height];}
  function setZoom(next,anchor){
    const r=stage.getBoundingClientRect(),vr=viewport.getBoundingClientRect(),x=anchor?anchor.clientX-vr.left:viewport.clientWidth/2,y=anchor?anchor.clientY-vr.top:viewport.clientHeight/2;
    const px=(vr.left+x-r.left)/scale,py=(vr.top+y-r.top)/scale;
    scale=Math.max(.2,Math.min(5,next));stage.style.width=`${background.width*scale}px`;
    viewport.scrollLeft=Math.max(0,(viewport.clientWidth-background.width*scale)/2)+px*scale-x;viewport.scrollTop=py*scale-y;draw();
  }
  function focus(){const e=entry();if(!e)return;const b=e.mask.bounds;
    scale=Math.max(.2,Math.min(3,(viewport.clientHeight-90)/b.height,(viewport.clientWidth-90)/b.width));stage.style.width=`${background.width*scale}px`;
    viewport.scrollLeft=Math.max(0,(b.x+b.width/2+offset())*scale-viewport.clientWidth/2);viewport.scrollTop=Math.max(0,(b.y+b.height/2)*scale-viewport.clientHeight/2);draw();
  }
  function draw(){
    if(!active)return;overlay.replaceChildren();const u=unit(),root=make('g',{transform:`translate(${offset()} 0)`});
    // Wide transparent targets permit selecting a fine line without pixel hunting.
    for(const e of entries){const n=decodeTrimCurve(getEdits()[e.stroke.editKey],e),points=n?sampleCurve(n):e.stroke.points,d=n?curvePath(n):`M ${points.map(p=>p.join(' ')).join(' L ')}`;
      if(e.stroke.fillToEdge)make('polygon',{points:trimPanelPolygon({...e.stroke,points},e.mask.bounds).map(p=>p.join(',')).join(' '),fill:'transparent','data-line':e.stroke.key,cursor:mode==='transform'?'move':'pointer'},root);
      make('path',{d,fill:'none',stroke:'transparent','stroke-width':Math.max(e.stroke.width,14*u),'data-line':e.stroke.key,cursor:'pointer'},root);}
    const n=nodes();if(!n)return;nodeIndex=Math.max(0,Math.min(n.length-1,nodeIndex));
    const nodeSelect=$('trim-editor-node');if(nodeSelect.options.length!==n.length){nodeSelect.replaceChildren();n.forEach((_,i)=>nodeSelect.add(new Option(String(i+1),String(i))));}nodeSelect.value=String(nodeIndex);nodeSelect.disabled=mode!=='nodes';
    make('path',{d:curvePath(n),fill:'none',stroke:'#58c9ff','stroke-width':1.5*u,'stroke-dasharray':`${5*u} ${3*u}`,'data-line':selected,cursor:mode==='transform'?'move':'pointer'},root);
    if(mode==='nodes'){
      const chosen=n[nodeIndex];
      for(const handle of ['in','out']){
        if((nodeIndex===0&&handle==='in')||(nodeIndex===n.length-1&&handle==='out'))continue;
        const p=chosen[handle];make('line',{x1:chosen.p[0],y1:chosen.p[1],x2:p[0],y2:p[1],stroke:'#58c9ff','stroke-width':u,'pointer-events':'none'},root);
        make('circle',{cx:p[0],cy:p[1],r:5*u,fill:'#58c9ff',stroke:'#101612','stroke-width':u,'data-handle':handle,cursor:'crosshair'},root);
      }
      n.forEach((node,i)=>make('rect',{x:node.p[0]-5*u,y:node.p[1]-5*u,width:10*u,height:10*u,fill:i===nodeIndex?'#cfe64e':'#ffffff',stroke:'#101612','stroke-width':1.5*u,'data-node':i,cursor:'move'},root));
    }else{
      const b=nodeBounds(n);make('rect',{x:b.x,y:b.y,width:b.width,height:b.height,fill:'none',stroke:'#58c9ff','stroke-width':u,'stroke-dasharray':`${4*u} ${3*u}`,'pointer-events':'none'},root);
      for(const hx of [-1,0,1])for(const hy of [-1,0,1])if(hx||hy){const x=b.x+(hx+1)*b.width/2,y=b.y+(hy+1)*b.height/2;make('rect',{x:x-4*u,y:y-4*u,width:8*u,height:8*u,fill:'#cfe64e',stroke:'#101612','stroke-width':u,'data-scale':`${hx},${hy}`,cursor:hx===0?'ns-resize':hy===0?'ew-resize':hx===hy?'nwse-resize':'nesw-resize'},root);}
      const x=b.x+b.width/2,y=b.y-28*u;make('line',{x1:x,y1:b.y,x2:x,y2:y,stroke:'#58c9ff','stroke-width':u},root);make('circle',{cx:x,cy:y,r:5*u,fill:'#cfe64e','data-rotate':'true',cursor:'crosshair'},root);
    }
    $('trim-mode-nodes').setAttribute('aria-pressed',String(mode==='nodes'));$('trim-mode-transform').setAttribute('aria-pressed',String(mode==='transform'));
    $('trim-editor-remove-node').disabled=mode!=='nodes'||n.length<=2;$('trim-editor-add-node').disabled=mode!=='nodes'||n.length>=32;
    $('trim-editor-smooth').disabled=mode!=='nodes';$('trim-editor-smooth').checked=n[nodeIndex].smooth!==false;
    $('trim-editor-help').textContent=mode==='nodes'?`Nodo ${nodeIndex+1} de ${n.length}. ${entry().stroke.fillToEdge?'La curva es el borde interior de la pieza. ':''}Solo cambia esta pieza y vista. Doble clic: agregar nodo. Flechas: mover.`:'Arrastrá para mover. Cuadrados: estirar. Círculo: rotar. Solo cambia esta pieza y vista.';
    updateHistory();
  }
  function choose(key,center=true){selected=key;nodeIndex=0;$('trim-editor-piece').value=key;if(center)focus();else draw();}
  function finish(cancel){
    if(!active)return;if(drag)stop();if(frame)cancelAnimationFrame(frame);frame=0;
    if(cancel)setEdits(copy(session));active=false;drag=null;space=false;dialog.close();preview();onFinish(cancel);$('edit-trims').focus();
  }
  function undo(direction){const next=historyIndex+direction;if(next<0||next>=history.length)return;historyIndex=next;setEdits(copy(history[next]));queue();updateHistory();}
  function addNode(at){const n=nodes();if(!n||n.length>=32)return;let segment=Math.min(nodeIndex,n.length-2),t=.5;
    if(at){let distance=Infinity;for(let i=0;i<n.length-1;i++){const sampled=sampleCurve([n[i],n[i+1]],40);for(let j=1;j<40;j++){const d=Math.hypot(sampled[j][0]-at[0],sampled[j][1]-at[1]);if(d<distance){distance=d;segment=i;t=j/40;}}}}
    write(splitCurve(n,segment,t));nodeIndex=segment+1;remember();flush();
  }
  function removeNode(){const n=nodes();if(!n||n.length<=2)return;n.splice(nodeIndex,1);nodeIndex=Math.min(nodeIndex,n.length-1);write(n);remember();flush();}
  overlay.addEventListener('pointerdown',event=>{
    if(event.button!==0&&event.button!==1)return;event.preventDefault();viewport.focus({preventScroll:true});overlay.setPointerCapture(event.pointerId);
    const target=event.target.closest('[data-line],[data-node],[data-handle],[data-scale],[data-rotate]'),p=point(event);
    if(space||event.button===1||!target){drag={type:'pan',id:event.pointerId,x:event.clientX,y:event.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};return;}
    if(target.dataset.line&&target.dataset.line!==selected)choose(target.dataset.line,false);
    if(target.dataset.node!==undefined){nodeIndex=Number(target.dataset.node);draw();}
    const n=nodes();if(!n)return;
    const type=target.dataset.node!==undefined?'node':target.dataset.handle?'handle':target.dataset.scale?'scale':target.dataset.rotate?'rotate':'move';
    drag={type,id:event.pointerId,start:p,nodes:copy(n),node:nodeIndex,handle:target.dataset.handle,axes:target.dataset.scale?.split(',').map(Number),bounds:nodeBounds(n),widthScale:getEdits()[entry().stroke.editKey]?.widthScale||1};
  });
  overlay.addEventListener('pointermove',event=>{
    if(!drag||drag.id!==event.pointerId)return;
    if(drag.type==='pan'){viewport.scrollLeft=drag.left+drag.x-event.clientX;viewport.scrollTop=drag.top+drag.y-event.clientY;return;}
    const p=point(event),dx=p[0]-drag.start[0],dy=p[1]-drag.start[1],d=drag;let next=copy(d.nodes),widthScale=d.widthScale;
    if(d.type==='move')next=transformNodes(d.nodes,([x,y])=>[x+dx,y+dy]);
    if(d.type==='node')for(const key of ['p','in','out'])next[d.node][key]=d.nodes[d.node][key].map((v,i)=>v+(i?dy:dx));
    if(d.type==='handle'){
      const node=next[d.node],other=d.handle==='in'?'out':'in',length=Math.hypot(...node[other].map((v,i)=>v-node.p[i]));node[d.handle]=p;
      if(node.smooth!==false&&!event.altKey){const delta=p.map((v,i)=>v-node.p[i]),r=Math.hypot(...delta)||1;node[other]=node.p.map((v,i)=>v-delta[i]/r*length);}
    }
    if(d.type==='scale'){
      const [hx,hy]=d.axes,b=d.bounds,ax=b.x+(1-hx)*b.width/2,ay=b.y+(1-hy)*b.height/2;
      const sx=hx?Math.max(.08,1+dx/(hx*b.width)):1,sy=hy?Math.max(.08,1+dy/(hy*b.height)):1;
      next=transformNodes(d.nodes,([x,y])=>[ax+(x-ax)*sx,ay+(y-ay)*sy]);
      widthScale=Math.max(.2,Math.min(8,d.widthScale*Math.sqrt(sx*sy)));
    }
    if(d.type==='rotate'){
      const b=d.bounds,cx=b.x+b.width/2,cy=b.y+b.height/2,a=Math.atan2(p[1]-cy,p[0]-cx)-Math.atan2(d.start[1]-cy,d.start[0]-cx);
      const angle=event.shiftKey?Math.round(a/(Math.PI/12))*Math.PI/12:a;
      next=transformNodes(d.nodes,([x,y])=>[cx+(x-cx)*Math.cos(angle)-(y-cy)*Math.sin(angle),cy+(x-cx)*Math.sin(angle)+(y-cy)*Math.cos(angle)]);
    }
    if(Math.abs(dx)+Math.abs(dy)>.01)write(next,widthScale);
  });
  function stop(){if(!drag)return;if(drag.type!=='pan'){remember();flush();}drag=null;updateHistory();}
  overlay.addEventListener('pointerup',stop);overlay.addEventListener('pointercancel',stop);overlay.addEventListener('lostpointercapture',stop);
  overlay.addEventListener('dblclick',event=>{if(mode==='nodes'&&event.target.closest('[data-line]'))addNode(point(event));});
  viewport.addEventListener('wheel',event=>{event.preventDefault();setZoom(scale*Math.exp(-event.deltaY*.0015),event);},{passive:false});
  dialog.addEventListener('keydown',event=>{
    if(event.code==='Space'&&!event.target.closest('input,select,button')){event.preventDefault();space=true;return;}
    if(event.target.closest('input,select'))return;
    if((event.ctrlKey||event.metaKey)&&['z','y'].includes(event.key.toLowerCase())){event.preventDefault();event.stopPropagation();undo(event.key.toLowerCase()==='y'||event.shiftKey?1:-1);return;}
    if(['Delete','Backspace'].includes(event.key)){event.preventDefault();event.stopPropagation();if(mode==='nodes')removeNode();return;}
    if(event.key.startsWith('Arrow')){event.preventDefault();const amount=event.shiftKey?5:1,dx=event.key==='ArrowLeft'?-amount:event.key==='ArrowRight'?amount:0,dy=event.key==='ArrowUp'?-amount:event.key==='ArrowDown'?amount:0,n=nodes();
      const next=mode==='transform'?transformNodes(n,([x,y])=>[x+dx,y+dy]):n.map((node,i)=>i===nodeIndex?transformNodes([node],([x,y])=>[x+dx,y+dy])[0]:node);write(next);remember();flush();}
  });
  dialog.addEventListener('keyup',event=>{if(event.code==='Space')space=false;});dialog.addEventListener('cancel',event=>{event.preventDefault();finish(true);});
  $('trim-editor-piece').addEventListener('change',event=>choose(event.target.value));
  $('trim-editor-node').addEventListener('change',event=>{nodeIndex=Number(event.target.value);draw();});
  for(const next of ['nodes','transform'])$(`trim-mode-${next}`).addEventListener('click',()=>{mode=next;draw();});
  $('trim-editor-add-node').addEventListener('click',()=>addNode());$('trim-editor-remove-node').addEventListener('click',removeNode);
  $('trim-editor-smooth').addEventListener('change',event=>{const n=nodes();n[nodeIndex].smooth=event.target.checked;write(n);remember();flush();});
  $('trim-editor-reset').addEventListener('click',()=>{const edits={...getEdits()};delete edits[entry().stroke.editKey];setEdits(edits);nodeIndex=0;remember();flush();});
  $('trim-editor-undo').addEventListener('click',()=>undo(-1));$('trim-editor-redo').addEventListener('click',()=>undo(1));
  $('trim-editor-zoom-in').addEventListener('click',()=>setZoom(scale*1.25));$('trim-editor-zoom-out').addEventListener('click',()=>setZoom(scale/1.25));$('trim-editor-focus').addEventListener('click',focus);
  for(const id of ['trim-editor-close','trim-editor-cancel'])$(id).addEventListener('click',()=>finish(true));$('trim-editor-apply').addEventListener('click',()=>finish(false));
  return {get active(){return active;},open(){
    entries=getBatches().flatMap(b=>b.strokes.map((stroke,index)=>({...b,stroke:{...stroke,points:editablePoints(stroke,b.mask)},index})));if(!entries.length)return false;
    onStart();session=copy(getEdits());history=[copy(session)];historyIndex=0;active=true;mode='nodes';nodeIndex=0;
    const select=$('trim-editor-piece');select.replaceChildren();
    for(const e of entries){const piece=e.group==='sleeve'?` ${e.piece==='right'?'derecha':'izquierda'}`:'',view=e.side==='front'?'frente':'espalda';select.add(new Option(`${groupNames[e.group]}${piece} · ${view} · Línea ${e.index+1}`,e.stroke.key));}
    selected=entries[0].stroke.key;dialog.showModal();paint();choose(selected);return true;
  }};
}
