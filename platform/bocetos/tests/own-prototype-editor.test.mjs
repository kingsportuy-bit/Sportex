import test from 'node:test';
import assert from 'node:assert/strict';
import {installAnchorEditor} from '../prototypes/football-own-v1/anchor-editor.js';
import {anchorPlacement,anchorStorageKey,defaultAnchorProfile} from '../prototypes/football-own-v1/anchors.js';

function harness(t,stored=new Map()){
  class Element{
    constructor(value=''){this.value=value;this.checked=false;this.disabled=false;this.files=[];this.style={};this.listeners={};this.classList={toggle(){}};this.captures=new Set();}
    addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}
    async emit(name,data={}){for(const fn of this.listeners[name]||[])await fn({preventDefault(){},...data});}
    click(){return this.emit('click');}
    get valueAsNumber(){return this.value===''?NaN:Number(this.value);}
    focus(){} setPointerCapture(id){this.captures.add(id);}hasPointerCapture(id){return this.captures.has(id);}releasePointerCapture(id){this.captures.delete(id);}
  }
  const nodes=Object.fromEntries(['anchor-status','anchor-centerX','anchor-top','anchor-width','anchor-height','keepRatio','editAnchors','focusNeck','undo-anchor','reset-anchor','export-anchors','import-anchors','anchor-file'].map(id=>[id,new Element()]));
  nodes.editAnchors.checked=true;
  const radios={collar:['round','v','polo'].map(v=>new Element(v)),side:['front','back'].map(v=>new Element(v))};radios.collar[0].checked=radios.side[0].checked=true;
  const document={getElementById:id=>nodes[id],querySelectorAll:()=>[...radios.side,...radios.collar],querySelector:selector=>{
    const name=selector.includes('name=side')?'side':'collar',value=selector.match(/value=(\w+)/)?.[1];return radios[name].find(r=>value?r.value===value:r.checked);
  }};
  const oldDoc=globalThis.document,oldStorage=globalThis.localStorage;let writes=0;
  globalThis.document=document;globalThis.localStorage={getItem:key=>stored.get(key)||null,setItem:(key,value)=>{writes++;stored.set(key,value);}};
  t.after(()=>{if(oldDoc===undefined)delete globalThis.document;else globalThis.document=oldDoc;if(oldStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=oldStorage;});
  const body={width:500,height:800},neck={width:400,height:160},materials={body:{front:body,back:body},round:{front:neck,back:neck},v:{front:neck,back:neck},polo:{front:neck,back:neck}};
  const canvas=new Element();canvas.width=1600;canvas.height=1000;canvas.getBoundingClientRect=()=>({left:0,top:0,width:1600,height:1000});
  canvas.getContext=()=>({save(){},restore(){},setLineDash(){},strokeRect(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){}});
  const renderer={materials,placement:(type,side,profile)=>anchorPlacement(profile.anchors[type][side],body)};
  const editor=installAnchorEditor({canvas,renderer,onChange(){}});editor.load();
  return {editor,nodes,canvas,stored,materials,writes:()=>writes,select(name,value){for(const r of radios[name])r.checked=r.value===value;return radios[name].find(r=>r.checked).emit('change');}};
}

test('editar, deshacer y recargar usan el guardado local real del controlador',async t=>{
  const h=harness(t),before=structuredClone(h.editor.profile);
  await h.nodes['anchor-width'].emit('focus');h.nodes['anchor-width'].value='36';await h.nodes['anchor-width'].emit('input');await h.nodes['anchor-width'].emit('change');
  assert.equal(h.editor.profile.anchors.round.front.width,.36);
  assert.equal(JSON.parse(h.stored.get(anchorStorageKey)).anchors.round.front.width,.36);
  assert.equal(h.editor.profile.anchors.round.back.width,.3);
  await h.nodes['undo-anchor'].click();assert.deepEqual(h.editor.profile,before);
  const saved=structuredClone(before);saved.anchors.v.back.top=.02;h.stored.set(anchorStorageKey,JSON.stringify(saved));h.editor.load();
  assert.equal(h.editor.profile.anchors.v.back.top,.02);
});
test('cancelar el puntero revierte el gesto; confirmar lo guarda una sola vez',async t=>{
  const h=harness(t),before=structuredClone(h.editor.profile),layout={side:'front',x:100,y:50,scale:1,pad:64};h.editor.draw([layout]);
  const event={pointerId:3,button:0,clientX:414,clientY:139.2};
  await h.canvas.emit('pointerdown',event);await h.canvas.emit('pointermove',{...event,clientX:434});
  assert.ok(h.editor.profile.anchors.round.front.centerX>.5);
  await h.canvas.emit('pointercancel',event);assert.deepEqual(h.editor.profile,before);assert.equal(h.writes(),0);
  await h.canvas.emit('pointerdown',event);await h.canvas.emit('pointermove',{...event,clientX:434});await h.canvas.emit('pointerup',event);
  assert.ok(Math.abs(h.editor.profile.anchors.round.front.centerX-.54)<1e-9);assert.equal(h.writes(),1);
});
test('un JSON inválido no reemplaza ni guarda la configuración vigente',async t=>{
  const h=harness(t),before=structuredClone(h.editor.profile);
  h.nodes['anchor-file'].files=[{size:100,text:async()=>JSON.stringify({...before,bodyRevision:'otra'})}];
  await h.nodes['anchor-file'].emit('change');assert.deepEqual(h.editor.profile,before);assert.equal(h.writes(),0);assert.match(h.nodes['anchor-status'].textContent,/No se importó/);
});
