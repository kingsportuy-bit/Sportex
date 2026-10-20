import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
function fixture(){
  const nodes=new Map(),frames=[];let loads=0;
  const c=vm.createContext({W:1080,H:1920,outputScale:1,exportAssets:null,inlineEdit:false,frameWidth:()=>1080,
    state:{assets:{photoBody:{},photoDesignShirtBody:{}},maskPixels:{},photoCoverage:{},garmentCache:{}},
    canvas:{width:1080,height:1920,toDataURL:()=>`${c.canvas.width}x${c.canvas.height}`},sceneCanvas:{width:1080,height:1920},ctx:{setTransform(){}},
    $:id=>{if(!nodes.has(id))nodes.set(id,{disabled:false,showModal(){this.open=true;}});return nodes.get(id);},
    document:{fonts:{ready:Promise.resolve()}},loadImage:async()=>{loads++;return {width:2160,height:3840};},
    render:selection=>{frames.push({scale:c.outputScale,width:c.canvas.width,selection});},notice(){}});
  const start=app.indexOf('let highResolutionAssets');
  if(start>=0)vm.runInContext(app.slice(start,app.indexOf('async function exportPng(')),c);
  vm.runInContext(app.slice(app.indexOf('function openEnlargedImage('),app.indexOf("$('close-enlarged-image').addEventListener")),c);
  return {c,nodes,frames,loads:()=>loads};
}
test('enlarged image uses a clean 2x render and restores the fast 1x editing canvas',async()=>{
  const f=fixture();await f.c.openEnlargedImage();
  assert.equal(f.nodes.get('enlarged-image').src,'2160x3840');
  assert(f.frames.some(r=>r.scale===2&&r.width===2160&&r.selection===false));
  assert.equal(f.c.outputScale,1);assert.equal(f.c.canvas.width,1080);assert.equal(f.c.sceneCanvas.height,1920);
  assert.equal(f.nodes.get('enlarged-image-dialog').open,true);assert.equal(f.nodes.get('expand-design').disabled,false);
  await f.c.openEnlargedImage();assert.equal(f.loads(),2,'fixed high-resolution assets are loaded only once');
});
test('a failed high-resolution render restores the editing canvas and unlocks the preview button',async()=>{
  const f=fixture();f.c.render=()=>{if(f.c.outputScale===2)throw new Error('render failed');};
  await f.c.openEnlargedImage();
  assert.equal(f.c.outputScale,1);assert.equal(f.c.canvas.width,1080);assert.equal(f.c.exportAssets,null);
  assert.equal(f.nodes.get('expand-design').disabled,false);assert.equal(f.nodes.has('enlarged-image'),false);
});
test('opening preview before the mold loads cannot cache an empty high-resolution kit',async()=>{
  const f=fixture();f.c.state.assets={};await f.c.openEnlargedImage();
  assert.equal(f.loads(),0);assert.equal(f.nodes.get('expand-design').disabled,false);
});
