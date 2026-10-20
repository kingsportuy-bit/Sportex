import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {detectAtlasRectangles,inspectAtlasRectangles,validateManualRectangles} from '../public/atlas-crop.js';
import {recoveredVariant,installAtlasRecovery} from '../public/atlas-recovery.js';
import {normalizedPatternTile,registrationVersion} from '../public/artwork-registration.js';

const layout={columns:2,rows:2,tiles:['front','back','right','left'],separator:'#00ff00',bleed:.2,registration:registrationVersion,
  rectangles:[{piece:'front',x:116,y:16,width:280,height:480},{piece:'back',x:628,y:16,width:280,height:480},{piece:'right',x:218,y:698,width:76,height:140},{piece:'left',x:730,y:698,width:76,height:140}]};
const actual=[{piece:'front',x:50,y:16,width:410,height:480},{piece:'back',x:560,y:16,width:410,height:480},{piece:'right',x:150,y:560,width:236,height:440},{piece:'left',x:650,y:560,width:236,height:440}];
function sheet(rectangles){
  const data=new Uint8ClampedArray(1024*1024*4);
  for(let i=0;i<data.length;i+=4)data.set([0,255,0,255],i);
  for(const r of rectangles)for(let y=r.y;y<r.y+r.height;y++)for(let x=r.x;x<r.x+r.width;x++)data.set([60,15,22,255],(y*1024+x)*4);
  return data;
}

test('complete sleeves enlarged by the generator are recovered independently of guide scale, with no invented bleed',()=>{
  const found=detectAtlasRectangles(sheet(actual),1024,1024,layout);
  for(const piece of ['left','right']){
    const crop=found.find(r=>r.piece===piece);assert.equal(crop.reviewRequired,true);
    assert.deepEqual({...crop,reviewRequired:undefined},{...actual.find(r=>r.piece===piece),reviewRequired:undefined});
    const normalized=normalizedPatternTile(layout,piece,crop);
    assert.equal(normalized.width,crop.width);assert.equal(normalized.height,crop.height);
    assert.deepEqual(normalized.contentWindow,{x:0,y:0,width:1,height:1,reviewRequired:true});
  }
});

test('partial detection retains valid suggestions but never auto-applies a missing sleeve',()=>{
  const pixels=sheet(actual.filter(r=>r.piece!=='right'));
  const found=inspectAtlasRectangles(pixels,1024,1024,layout);
  assert.equal(found.filter(r=>!r.error).length,3);assert(found.find(r=>r.piece==='right').error);
  assert.throws(()=>detectAtlasRectangles(pixels,1024,1024,layout),/Corregir separación/);
});

test('manual recovery rejects missing, duplicate, overlapping, nonfinite and out-of-image crops',()=>{
  assert.equal(validateManualRectangles(actual,layout).length,4);
  assert.throws(()=>validateManualRectangles(actual.slice(1),layout),/todas/);
  for(const change of [{piece:'back'},{x:NaN},{width:0},{x:-1},{y:1000},{x:550,y:16,width:300,height:400}]){
    assert.throws(()=>validateManualRectangles([{...actual[0],...change},...actual.slice(1)],layout));
  }
});

test('recovery preserves original and inherited clips; failed preparation commits no partial crops',async()=>{
  const original={rawImage:'original',parts:{short:'saved-short'},layout,clips:{front:{src:'old',cropRevision:4},short:{src:'short',cropRevision:4}},cropError:'ambiguous'};
  const before=structuredClone(original),variant=recoveredVariant(original,actual);
  assert.deepEqual(original,before);assert.equal(variant.rawImage,original.rawImage);assert.deepEqual(Object.keys(variant.clips),['short']);
  variant.layout.manualRectangles[0].x+=1;assert.deepEqual(original,before);
  const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
  const code=app.slice(app.indexOf('async function prepareClips('),app.indexOf('function powerClipMask('));
  let fail=true;const context=vm.createContext({variant,structuredClone,atlasCropRevision:4,textureImages:new Map(),loadImage:async()=>({}),
    atlasRectangles:()=>validateManualRectangles(variant.layout.manualRectangles,variant.layout),atlasTile:(_image,_layout,piece)=>{if(fail&&piece==='right')throw Error('crop failed');return{toDataURL:()=>`new:${piece}`,contentWindow:{x:0,y:0,width:1,height:1,reviewRequired:true}};}});
  vm.runInContext(code,context);await vm.runInContext('prepareClips(variant)',context);
  assert.equal(variant.cropError,'crop failed');assert.deepEqual(Object.keys(variant.clips),['short']);assert.deepEqual(original,before);
  fail=false;await vm.runInContext('prepareClips(variant)',context);
  assert.equal(variant.cropError,undefined);assert.equal(variant.clips.right.src,'new:right');assert.equal(variant.clips.short.src,'short');assert.deepEqual(original,before);
  const restored=JSON.parse(JSON.stringify(variant));assert.deepEqual(validateManualRectangles(restored.layout.manualRectangles,restored.layout),restored.layout.manualRectangles);
});

test('manual crop interaction supports redraw, cancel, numeric entry and apply without network',async()=>{
  class Element{
    constructor(){this.events={};this.children=[];this.dataset={};this.value='';}
    addEventListener(name,handler){this.events[name]=handler;}replaceChildren(...children){this.children=children;}setAttribute(){}showModal(){this.open=true;}close(){this.open=false;}
  }
  const dialog=new Element(),canvas=new Element(),tabs=new Element(),status=new Element(),confirm=new Element(),close=new Element();
  const fields=Object.fromEntries(['x','y','width','height'].map(key=>[key,new Element()]));let applied;
  canvas.getContext=()=>({clearRect(){},drawImage(){},getImageData(){throw Error('unrecognized background');},save(){},restore(){},strokeRect(){},setLineDash(){},fillRect(){},fillText(){},measureText(){return{width:40};}});
  canvas.getBoundingClientRect=()=>({left:0,top:0,width:512,height:512});canvas.setPointerCapture=()=>{};canvas.hasPointerCapture=()=>false;
  const previous=globalThis.document;globalThis.document={createElement:()=>new Element()};
  try{
    const open=installAtlasRecovery({dialog,canvas,tabs,status,fields,confirm,close,onApply:async(rectangles,session)=>{applied={rectangles,session};}});
    open({}, {columns:1,rows:1,tiles:['right'],rectangles:[{piece:'right',x:10,y:10,width:100,height:200}]},'current');
    assert.equal(confirm.disabled,true);
    canvas.events.pointerdown({button:0,clientX:20,clientY:30,pointerId:1,preventDefault(){}});
    canvas.events.pointermove({clientX:120,clientY:230});canvas.events.pointerup({pointerId:1});assert.equal(confirm.disabled,false);assert.equal(fields.width.value,100);
    canvas.events.pointerdown({button:0,clientX:0,clientY:0,pointerId:2,preventDefault(){}});canvas.events.pointermove({clientX:400,clientY:400});canvas.events.pointercancel();assert.equal(fields.width.value,100);
    fields.width.value='110';fields.width.events.change();await confirm.events.click();
    assert.equal(applied.rectangles[0].width,110);assert.equal(applied.session,'current');assert.equal(dialog.open,false);
  }finally{globalThis.document=previous;}
});
