import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {initialParameterSketch} from '../public/element-layout.js';
import * as elementLayout from '../public/element-layout.js';
import {nextAvailableSketchId,preferenceSnapshot,preferredFontDefaults} from '../public/editor-geometry.js';

const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const source=(start,end)=>app.slice(app.indexOf(start),app.indexOf(end));
const empty=()=>({mockRevision:2,positionRevision:1,inputs:{'player-name':'NOMBRE','player-number':'10'},logos:{brand:[],brand2:[],crest:[]},layers:{brand2:{x:100,y:100,size:10}},texts:[],sponsors:[],visibleLayers:{},layerStyles:{},trimEdits:{},trimModelRevision:'approved',referenceData:null,generatedParts:{},designVariants:[],view:'base'});
const base=()=>({inputs:{'name-font':'base-font','include-shorts':false,'shirt-color':'#123456','show-brand2':true,'brand2-select':'saved-logo'},logoFiles:{brand2:'base.png'},layers:{brand2:{x:797,y:315,size:48,scaleX:1.9,scaleY:1.9}},visibleLayers:{brand2:true},texts:[],sponsors:[],trimEdits:{curve:{nodes:[1,2]}},layerStyles:{brand2:{enabled:true,color:'#ffffff',width:2}}});
function context(current,model,blank=empty()){
  const fields={},c=vm.createContext({$:id=>fields[id]??={addEventListener(){}},structuredClone,initialParameterSketch,nextAvailableSketchId,preferenceSnapshot,preferredFontDefaults,positionRevision:3,initialParameters:model,blankSketch:blank,browserPreferences:current,sketches:new Map([[1,current]]),editHistories:new Map(),activeSketchId:1,nextSketchId:2,fixedLayerKeys:['brand2'],current,
    restoreInitialParameters:elementLayout.restoreInitialParameters,captureGeneralParameters(){},recordHistory(){},captureSketch:()=>c.current,rememberPreferences(){},restoreSketch:sketch=>{c.current=sketch;},renderSketchTabs(){},notice(){},scheduleWorkspaceSave(){c.saved=true;}});
  vm.runInContext(source('function newSketch()', 'let confirmationResolver='),c);return c;
}

test('Nuevo boceto uses the saved base while preserving the previous document and cached Logo2',()=>{
  const model=base(),current={...empty(),inputs:{'name-font':'edited-font','shirt-color':'#ff0000','include-shorts':true,'brand2-select':'other'},layers:{brand2:{x:20,y:40,size:150}},visibleLayers:{brand2:false},texts:[{id:'text-extra'}],trimEdits:{},layerStyles:{},referenceData:'reference',designVariants:[{rawImage:'generated'}],logos:{brand:[],crest:[],brand2:[{id:'cached-id',name:'base.png',image:{src:'original'}},{id:'other',name:'other.png',image:{src:'other'}}]}};
  const before=structuredClone(current),c=context(current,model);c.newSketch();const fresh=c.current;
  assert.deepEqual(fresh.layers.brand2,model.layers.brand2);assert.equal(fresh.inputs['name-font'],'base-font');assert.equal(fresh.inputs['shirt-color'],'#123456');assert.equal(fresh.inputs['include-shorts'],false);assert.equal(fresh.visibleLayers.brand2,true);
  assert.deepEqual(fresh.trimEdits,model.trimEdits);assert.deepEqual(fresh.layerStyles,model.layerStyles);assert.deepEqual(fresh.texts,[]);assert.equal(fresh.inputs['brand2-select'],'cached-id');assert.equal(fresh.logos.brand2[0].image,current.logos.brand2[0].image);
  assert.equal(fresh.referenceData,null);assert.equal(fresh.designVariants.length,0);assert.equal(c.activeSketchId,2);assert.equal(c.saved,true);assert.deepEqual(c.sketches.get(1),before);
  fresh.layers.brand2.x=3;fresh.trimEdits.curve.nodes.push(5);assert.equal(model.layers.brand2.x,797);assert.deepEqual(model.trimEdits.curve.nodes,[1,2]);
});

test('base assets and text definitions survive unrelated latest selections or deleted elements',()=>{
  const model={...base(),sponsors:[{id:'sponsor-base',name:'sponsor.png',visible:false}],texts:[{id:'text-base',value:'BASE',font:'base-font',color:'#ffffff'}],layers:{...base().layers,'sponsor-base':{x:10,y:20,size:90},'text-base':{x:20,y:40,size:70}}};
  const blank={...empty(),logos:{brand:[],crest:[],brand2:[{id:'saved-logo',name:'base.png',image:{src:'base-original'}}]},sponsors:[{id:'sponsor-base',name:'sponsor.png',image:{src:'sponsor-original'}}],layers:{...empty().layers,'text-old':{x:999},'sponsor-old':{x:888}}};
  const fresh=initialParameterSketch(blank,model,{logos:{brand2:[{id:'other',name:'other.png',image:{src:'other'}}]},sponsors:[{id:'sponsor-new',name:'new.png'}]});
  assert.equal(fresh.inputs['brand2-select'],'saved-logo');assert.equal(fresh.logos.brand2[0].image.src,'base-original');assert.deepEqual(fresh.sponsors.map(s=>s.id),['sponsor-base']);assert.equal(fresh.sponsors[0].image.src,'sponsor-original');assert.equal(fresh.sponsors[0].visible,false);assert.deepEqual(fresh.texts,model.texts);assert.equal(fresh.layers['text-old'],undefined);assert.equal(fresh.layers['sponsor-old'],undefined);
});

test('restoring an older workspace cannot erase the shipped base; an explicitly saved base still wins',async()=>{
  for(const savedModel of [null,{...base(),layers:{brand2:{x:650,y:350,size:60}}}]){
    const shipped=base(),oldBlank=empty(),current=empty(),c=context(current,shipped,oldBlank);
    c.savedRecord={version:2,fontPreferenceVersion:1,activeSketchId:1,sketches:[[1,current]],blankSketch:oldBlank,initialParameters:savedModel};
    Object.assign(c,{readWorkspace:async()=>c.savedRecord,hydrateSketch:async s=>s,withApprovedTrimModel:s=>s,workspaceSchemaVersion:2,parameterSetup:false,console});
    vm.runInContext(source('async function restoreWorkspace()', 'function captureSketch()'),c);
    assert.equal(await c.restoreWorkspace(),true);c.newSketch();assert.deepEqual(c.current.layers.brand2,(savedModel||shipped).layers.brand2);assert.equal(c.current.inputs['name-font'],'base-font');
    const actualMigration=source('  if (sketch.mockRevision !== 2)', '  const migratedInputs =');
    const rendered=vm.createContext({sketch:c.current,positionRevision:3,fixedLayerKeys:['brand2'],frontPositions:{brand2:{x:801,y:320,size:48}},state:{layers:structuredClone(c.current.layers)}});
    vm.runInContext(actualMigration,rendered);assert.deepEqual(rendered.state.layers.brand2,(savedModel||shipped).layers.brand2,'a new document must not migrate an already current base back to old positions');
  }
});

test('la base defectuosa en cache no reactiva vivos ni duplica el nombre en Nuevo boceto; documentos y archivos se conservan',async()=>{
  const shipped=JSON.parse(readFileSync(new URL('../public/initial-parameters.json',import.meta.url),'utf8'));
  const stale=structuredClone(shipped),id='text-1792439241236';delete stale.presetRevision;stale.approvedAt='2026-10-19';
  stale.texts=[{id,value:'NOMBRE',font:'club-real-madrid-font-2024-2025',color:'#ffffff'}];
  stale.layers[id]={x:815,y:395.1402248768759,size:66,scaleX:0.9285940532748821,scaleY:0.9285940532748821};
  stale.layers['back-name']={...stale.layers['back-name'],x:797,y:649.670331295039};stale.visibleLayers[id]=true;stale.layerStyles[id]={enabled:false,color:'#ffffff',width:3};
  for(const group of ['shoulder','shirt-side','short-side','short-hem'])stale.inputs[`trim-${group}-enabled`]=true;
  stale.logoFiles.brand2='own-logo.png';stale.inputs['brand2-select']='own-logo';
  const current={...empty(),inputs:{'trim-shoulder-enabled':true},texts:[{id,value:'EDITADO POR USUARIO'}]},before=structuredClone(current),c=context(current,shipped);
  const logo={id:'own-logo',name:'own-logo.png',image:{src:'own-image'}};
  c.savedRecord={version:2,fontPreferenceVersion:1,cuffOverlayVersion:1,activeSketchId:1,sketches:[[1,current]],blankSketch:{...empty(),layers:{...stale.layers},visibleLayers:{...stale.visibleLayers}},initialParameters:stale,preferences:{...empty(),logos:{brand:[],brand2:[logo],crest:[]}}};
  Object.assign(c,{readWorkspace:async()=>c.savedRecord,hydrateSketch:async s=>s,withApprovedTrimModel:s=>s,workspaceSchemaVersion:2,console});
  vm.runInContext(source('async function restoreWorkspace()', 'function captureSketch()'),c);
  assert.equal(await c.restoreWorkspace(),true);assert.deepEqual(c.current,before);
  c.newSketch();
  for(const group of ['sleeve','shoulder','shirt-side','short-side','short-hem'])assert.equal(c.current.inputs[`trim-${group}-enabled`],false,group);
  assert.deepEqual(c.current.texts,[]);assert.equal(c.current.layers[id],undefined);assert.equal(c.current.visibleLayers[id],undefined);assert.equal(c.current.layerStyles[id],undefined);
  assert.equal(c.current.layers['back-name'].y,377.1402248768759);assert.equal(c.current.layers['back-name'].x,797);assert.equal(c.current.layers['back-number'].x,797);assert.equal(c.current.layers['back-name'].size,66);
  assert.equal(c.current.inputs['show-front-number'],false);assert.equal(c.current.visibleLayers['front-number'],false);
  assert.equal(c.current.inputs['brand2-select'],'own-logo');assert.equal(c.current.logos.brand2[0].image.src,'own-image');
  assert.deepEqual(c.sketches.get(1),before);assert.equal(stale.layers['back-name'].y,649.670331295039);
});
