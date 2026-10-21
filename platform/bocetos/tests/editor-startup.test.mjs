import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {initialParameterSketch} from '../public/element-layout.js';
import {mockupParameters,mockupSnapshot,mockupOptionInputs,companyMockupParameters} from '../public/mockup-config.js';
import {withApprovedTrimModel} from '../public/trim-defaults.js';
import {preferredFontDefaults} from '../public/editor-geometry.js';
const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const factory=JSON.parse(readFileSync(new URL('../public/initial-parameters.json',import.meta.url),'utf8'));
const source=(start,end)=>app.slice(app.indexOf(start),app.indexOf(end));

// Only ids actually present in the shipped HTML exist. No fallback node can
// hide a broken HTML/JS contract. This fixture observes calls, not raster output.
function harness({editor=false,preview=false,cached=null}={}){
  const nodes=new Map(),frames=[],errors=[],notices=[];
  function node(attrs=''){
    const value=name=>new RegExp(`\\b${name}="([^"]*)"`).exec(attrs)?.[1];
    const n={value:value('value')||'',type:value('type')||'',checked:/\bchecked\b/.test(attrs),disabled:/\bdisabled\b/.test(attrs),hidden:/\bhidden\b/.test(attrs),textContent:'',attributes:new Map(),classList:{remove(){},toggle(){}},style:{setProperty(){}},options:[],parentElement:null,
      toggleAttribute(key,on){if(on)this.attributes.set(key,'');else this.attributes.delete(key);},
      add(option){this.options.push(option);},replaceChildren(...items){this.options=items;},append(){},setAttribute(){},querySelector(){return {disabled:false};},querySelectorAll(){return [];},closest(){return this.parentElement;}};
    n.parentElement={toggleAttribute:n.toggleAttribute,attributes:new Map()};return n;
  }
  for(const match of html.matchAll(/<([a-z][\w-]*)\b([^>]*\bid="([^"]+)"[^>]*)>/gi))nodes.set(match[3],node(match[2]));
  const $=id=>nodes.get(id)||null;
  const parameters=structuredClone(factory);Object.assign(parameters.inputs,{'shirt-color':'#aa2244','include-socks':false,'show-front-number':false});parameters.layers['back-name'].y=348;
  const model={id:'football-basic',kitId:'football-basic-v1',name:'Configurado',revision:2,parameters,options:Object.fromEntries(Object.keys(mockupOptionInputs).map(key=>[key,true]))};
  const controls=[...nodes].filter(([,n])=>['checkbox','color','range','text','number'].includes(n.type)).map(([id])=>id);
  const sketchInputIds=[...new Set([...Object.keys(factory.inputs),...controls,'player-name','player-number'])].filter(id=>$(id));
  const state={assets:{},assetsReady:false,layers:structuredClone(factory.layers),logos:{brand:[],brand2:[],crest:[]},sponsors:[],texts:[],visibleLayers:{},layerStyles:{},trimEdits:{},documentPalette:[],customTextures:{},textureModes:{},referenceRegions:{},generatedParts:{},designVariants:[],activeVariant:-1,view:'base',backgroundMode:'none'};
  const lab={managed:!editor,mockupEditor:editor,preview,company:{settings:{},assets:[]},install(){},record:{id:model.id,kitId:model.kitId,version:4,draft:model},installEditor(){}};
  const c=vm.createContext({state,lab,$,initialParameterSketch,mockupParameters,mockupSnapshot,mockupOptionInputs,companyMockupParameters,withApprovedTrimModel,preferredFontDefaults,structuredClone,
    factoryParameters:null,initialParameters:null,mockupCatalog:editor?[]:[model],labFontsReady:Promise.resolve(),fontHeightCache:new Map(),trackedFontCache:new Map(),
    footballFonts:Object.fromEntries(['number-font','name-font'].map(id=>[factory.inputs[id],{weight:400,family:'Fixture'}])),
    document:{fonts:{load:async()=>[]},createElement(){return {...node(),getContext:()=>({fillRect(){},fillText(){}}),toDataURL:()=> 'fixture:sample'};},querySelector(){return node();}},
    loadImage:async()=>({width:180,height:100}),fetch:async path=>({ok:true,json:async()=>path==='/initial-parameters.json'?structuredClone(factory):{ready:true}}),
    sketchInputIds,defaultInputs:Object.fromEntries(sketchInputIds.map(id=>[id,$(id).type==='checkbox'?$(id).checked:$(id).value])),
    frontPositions:structuredClone(factory.layers),positionRevision:3,fixedLayerKeys:Object.keys(factory.layers),numberColorIds:['front-number-color','back-number-color','short-number-color'],
    inlineEdit:null,selectionMarquee:null,elementRotation:null,elementResize:null,textureDrag:null,editingTexture:false,pieceEditing:false,pieceEditSnapshot:null,textureEditSnapshot:null,
    activeSketchId:1,blankSketch:null,sketches:new Map(),persistenceReady:false,
    updateReferenceRegions(){},updateSelectedControls(){},updateGenerate(){},updateTextureMode(){},updateTrimControls(){},updateSponsorList(){},updateFrame(){},
    invalidateGarment(){frames.push({shirt:$('shirt-color').value,front:$('show-front-number').checked,nameY:state.layers['back-name'].y,socks:$('include-socks').checked});},
    updateViewButtons(){c.invalidateGarment();},renderSketchTabs(){},scheduleWorkspaceSave(){},recordHistory(){},runPendingReferenceAdjustment(){},confirmEditorAction(){},
    restoreWorkspace:async()=>{if(cached){c.restoreSketch(cached);return true;}return false;},
    notice:(message,error)=>notices.push({message,error}),console:{error:(...args)=>errors.push(args)},
    Option:function(label,value){this.textContent=label;this.value=value;},requestAnimationFrame:fn=>fn()});
  vm.runInContext(source('function captureSketch()','function tabTitle('),c);
  vm.runInContext(source('function applyMockupAvailability(','$(\'raglan-enabled\').addEventListener'),c);
  vm.runInContext(app.split('\n').find(line=>line.startsWith('function registrationReviewMessage(')),c);
  vm.runInContext(source('async function init()','\ninit();'),c);
  return {c,nodes,frames,errors,notices,model};
}

test('arranque de empresa aplica la base publicada antes del primer dibujo, sin zoom ni click',async()=>{
  const h=harness();await h.c.init();
  assert.equal(h.errors.length,0,h.errors.map(args=>String(args[1]?.stack||args)).join('\n'));
  assert.ok(h.frames.length);assert.deepEqual(h.frames[0],{shirt:'#aa2244',front:false,nameY:348,socks:false});
  assert.equal(h.c.persistenceReady,true);assert.equal(h.c.sketches.size,1);assert.ok(!h.notices.some(n=>n.error));
});

test('opciones de los cinco grupos de vivos se aplican y se restauran con el HTML real',()=>{
  const h=harness(),options={...h.model.options,shirtTrim:false,shortTrim:false,shortHem:false};
  assert.doesNotThrow(()=>h.c.applyMockupAvailability({...h.model,options}));
  for(const group of ['shirt-side','short-side','short-hem']){assert.ok(h.nodes.get(`trim-${group}-group`).attributes.has('data-mockup-unavailable'));assert.equal(h.nodes.get(`trim-${group}-enabled`).disabled,true);}
  h.c.applyMockupAvailability(h.model);
  for(const group of ['shirt-side','short-side','short-hem'])assert.ok(!h.nodes.get(`trim-${group}-group`).attributes.has('data-mockup-unavailable'));
});

test('configurador y vista de prueba arrancan sin romper el guardado ni requerir interaccion',async()=>{
  for(const preview of [false,true]){const h=harness({editor:true,preview});await h.c.init();assert.equal(h.errors.length,0,h.errors.map(args=>String(args[1]?.stack||args)).join('\n'));assert.equal(h.c.persistenceReady,true);assert.equal(h.frames[0].shirt,'#aa2244');}
});

test('boceto en cache se dibuja al reabrir y conserva sus ediciones sin borrar el documento',async()=>{
  const seed=harness();await seed.c.init();const cached=structuredClone(seed.c.captureSketch());cached.inputs['shirt-color']='#445566';cached.layers['back-name'].y=290;
  const before=structuredClone(cached),h=harness({cached});await h.c.init();
  assert.equal(h.errors.length,0);assert.equal(h.frames.at(-1).shirt,'#445566');assert.equal(h.frames.at(-1).nameY,290);
  assert.equal(h.c.persistenceReady,true);assert.deepEqual(cached,before);
});

test('un error real cargando imagenes sigue avisando y no activa persistencia ni dibujo incompleto',async()=>{
  const h=harness();h.c.loadImage=async()=>{throw new Error('fixture: imagen ausente');};await h.c.init();
  assert.equal(h.errors.length,1);assert.ok(h.notices.some(n=>n.error));assert.equal(h.c.persistenceReady,false);assert.equal(h.frames.length,0);assert.equal(h.c.state.assetsReady,false);
});
