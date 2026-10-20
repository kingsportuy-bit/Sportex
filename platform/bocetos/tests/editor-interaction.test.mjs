import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {nextAvailableSketchId,unionRegion,rotatedBounds,textureActionPositions,preferredFontDefaults,preferenceSnapshot,withPreferences} from '../public/editor-geometry.js';
import {initialParameterSketch} from '../public/element-layout.js';
const source=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const extract=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end));

test('closing sketch 3 reuses 3 after reopening; holes and histories stay independent',()=>{
  const sketches=new Map([[1,{}],[2,{}],[3,{}]]);sketches.delete(3);
  assert.equal(nextAvailableSketchId(sketches.keys()),3);sketches.set(3,{});assert.equal(nextAvailableSketchId(sketches.keys()),4);
  sketches.delete(2);assert.equal(nextAvailableSketchId(sketches.keys()),2);
  const fields={},$=id=>fields[id]??={addEventListener(){}};
  const c=vm.createContext({mockupCatalog:[],sketches,$,nextAvailableSketchId,preferenceSnapshot,withPreferences,initialParameterSketch,initialParameters:null,positionRevision:3,captureGeneralParameters(){},structuredClone,Map,
    fixedLayerKeys:[],editHistories:new Map([[2,{old:true}]]),recordHistory(){},captureSketch(){return c.current;},
    restoreSketch(s){c.current=s;},renderSketchTabs(){},notice(){},scheduleWorkspaceSave(){},runPendingReferenceAdjustment(){},window:{confirm:()=>true}});
  c.current={inputs:{...preferredFontDefaults},logos:{brand:[],crest:[]},layers:{},layerStyles:{},visibleLayers:{}};
  c.browserPreferences=preferenceSnapshot(c.current,[]);c.rememberPreferences=()=>{};c.blankSketch=c.current;c.activeSketchId=1;c.nextSketchId=90;c.generatingSketchId=null;
  vm.runInContext(extract('function newSketch(',"$('new-sketch').addEventListener"),c);
  vm.runInContext('newSketch()',c);assert.equal(c.activeSketchId,2);assert.equal(c.editHistories.has(2),false);assert.equal(c.sketches.size,3);
});

test('cached logos, independent fonts, positions and nonuniform dimensions survive serialization',async()=>{
  const logo={id:'uploaded-brand',name:'Mi marca',image:{src:'data:image/png;base64,logo-file'}};
  const original={inputs:{...preferredFontDefaults,'brand-select':logo.id,'player-name':'NO COPIAR'},logos:{brand:[logo],crest:[]},
    layers:{brand:{x:219,y:420,size:62,scaleX:1.3,scaleY:.8,rotation:12},'front-number':{x:300,y:510,size:140}},
    layerStyles:{brand:{enabled:true,color:'#ff00ff',width:2}},visibleLayers:{brand:true,'front-number':true}};
  const blank={...original,inputs:{'player-name':'NOMBRE'},logos:{brand:[],crest:[]},layers:{},layerStyles:{},visibleLayers:{},customBackground:null,sponsors:[],generatedParts:{},designVariants:[]};
  const preferences=preferenceSnapshot(original,['brand','front-number']);
  const fresh=withPreferences(blank,preferences);
  assert.equal(fresh.inputs['number-font'],'club-sc-internacional-2023');assert.equal(fresh.inputs['name-font'],'club-real-madrid-font-2024-2025');
  assert.equal(fresh.inputs['player-name'],'NOMBRE');assert.deepEqual(fresh.layers.brand,original.layers.brand);
  fresh.layers.brand.x=900;assert.equal(original.layers.brand.x,219);
  const c=vm.createContext({loadImage:async src=>({src}),prepareClips:async()=>{}});
  vm.runInContext(extract('function imageSource(','function workspaceDb('),c);
  c.doc=fresh;const serialized=vm.runInContext('serializeSketch(doc)',c);
  const disk=structuredClone(serialized);assert.equal(disk.logos.brand[0].src,logo.image.src);
  c.disk=disk;const restored=await vm.runInContext('hydrateSketch(disk)',c);
  assert.equal(restored.logos.brand[0].image.src,logo.image.src);assert.equal(restored.inputs['brand-select'],logo.id);
  assert.equal(restored.layers.brand.scaleX,1.3);assert.equal(restored.layers.brand.scaleY,.8);
});

test('active texture cannot switch through another piece or select until tick/cross; cancel restores its snapshot',()=>{
  const clips={front:{x:0},left:{x:0}},fields={},$=id=>fields[id]??={value:'front'};
  const c=vm.createContext({$,structuredClone,activeClips:()=>clips,updateTextureScale(){},updateTextureMode(){},presentScene(){},render(){},scheduleWorkspaceSave(){},state:{},
    editingTexture:true,pieceEditing:false,pieceEditSnapshot:null,hoveredTexture:null,textureSide:'front',textureDrag:null,textureResize:null,textureRotation:null});
  vm.runInContext(extract('function textureSelection()', 'function clipTransform('),c);
  vm.runInContext(extract('function beginPieceEdit(', 'function finishTextureAdjustment('),c);
  vm.runInContext("beginPieceEdit('front','front')",c);clips.front.x=.2;
  $('texture-piece').value='left:back';vm.runInContext("beginPieceEdit('left','back')",c);
  assert.equal(vm.runInContext('textureSelection().piece',c),'front');assert.equal(c.pieceEditSnapshot.clip.x,0);
  vm.runInContext('finishPieceEdit(true)',c);assert.equal(clips.front.x,0);
  vm.runInContext("beginPieceEdit('left','back')",c);clips.left.x=.4;vm.runInContext('finishPieceEdit(false)',c);assert.equal(clips.left.x,.4);assert.equal(c.pieceEditing,false);
});

test('floating actions avoid rotated bounds and remain separate at extreme zoom',()=>{
  const viewport={x:0,y:0,width:1000,height:900},size={width:90,height:36};
  for(const rotation of [0,35,90,145,-90]){
    const r={x:300,y:260,width:250,height:340,rotation};const p=textureActionPositions(r,viewport,size,size),b=rotatedBounds(r,36);
    for(const position of Object.values(p)){
      assert(position.y>=0&&position.y+36<=900);
      assert(position.x+45<=b.x||position.x-45>=b.x+b.width||position.y+36<=b.y||position.y>=b.y+b.height);
    }
  }
  const p=textureActionPositions({x:-400,y:-500,width:1800,height:1900,rotation:110},viewport,size,size);
  assert(p.confirm.y-p.center.y>100);
});

test('many pointer updates coalesce into one paint covering old/new positions and the sponsor twin',()=>{
  const callbacks=new Map(),paint=[];let n=0;
  const c=vm.createContext({unionRegion,rotatedBounds,W:1080,H:1920,state:{garmentCache:{}},requestAnimationFrame:fn=>{callbacks.set(++n,fn);return n;},cancelAnimationFrame:id=>callbacks.delete(id),
    updateTextureScale(){},render:(selected,region)=>paint.push(region)});
  vm.runInContext(extract('let interactionFrame=',"canvas.addEventListener('pointermove'"),c);
  for(let i=0;i<60;i++){c.region={x:100+i,y:200,width:20,height:50};vm.runInContext('queueInteraction(region,true)',c);}
  assert.equal(callbacks.size,1);assert.equal(c.state.garmentCache,null);
  vm.runInContext('flushInteraction()',c);assert.equal(paint.length,1);assert.equal(paint[0].x,100);assert.equal(paint[0].width,79);
  assert.equal(callbacks.size,0);
});
