import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {patternGeometryVersion} from '../public/pattern-geometry.js';
import {captureTextureTransforms,restoreTextureTransforms} from '../public/reference-compare.js';
const source = fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const code = source.slice(source.indexOf('const referenceColorFields ='), source.indexOf("$('copy-reference-colors').addEventListener"));

function fixture() {
  const inputs = new Map(), messages = [], history = [], palette = [];
  const $ = id => {
    if (!inputs.has(id)) inputs.set(id, { id,value: '#000000', checked: false, classList: { toggle() {} }, setAttribute() {} });
    return inputs.get(id);
  };
  const context = vm.createContext({ console, Object, Error, String, Boolean, Map, AbortSignal, structuredClone, patternGeometryVersion, captureTextureTransforms,restoreTextureTransforms,$, activeSketchId: 1, editingTexture: false,generationBusy:false,
    state: { referenceData: 'reference-1', apiReady: true, assetsReady: true },
    recordHistory: () => history.push(Object.fromEntries([...inputs].map(([id, input]) => [id, { value: input.value, checked: input.checked }]))),
    rememberDocumentColor: color => palette.push(color), updateSelectedControls() {}, invalidateGarment() {}, scheduleWorkspaceSave() {},updateGenerate() {} });
  vm.runInContext(code, context);
  context.lab={fetch:(...args)=>context.fetch(...args)};
  context.state.layerStyles={};context.state.layers={};
  context.buildReferenceDetailContext=()=>({context:{extended:true,outlines:true,alignment:false,elements:[],targets:[],sources:[]},variant:null,styles:{},layers:{},transforms:{},srcs:{},structure:''});
  vm.runInContext("var baseline=Object.fromEntries([...Object.values(referenceColorFields).map(([id])=>[id,$(id).value]),...['cuffs-enabled','brand-color-enabled','short-brand-color-enabled'].map(id=>[id,$(id).checked])]);var sample=Object.fromEntries(Object.keys(referenceColorFields).map(key=>[key,null]));", context);
  return { context, $, inputs, messages, history, palette };
}

test('copies independent numbers, brand overlays, shorts and socks; absent/manual changes remain intact; atomic history', () => {
  const { context, $, history, palette } = fixture();
  vm.runInContext("sample.frontNumber='#111111';sample.backNumber='#222222';sample.shortNumber='#333333';sample.brand='#ABCDEF';sample.shortBrand='#778899';sample.short='#444444';sample.socks='#555555';sample.cuffs='#666666';sample.neck='#999999';$('neck-color').value='#123456';var outcome=applyReferenceColors(sample,baseline);", context);
  assert.equal($('front-number-color').value, '#111111'); assert.equal($('back-number-color').value, '#222222'); assert.equal($('short-number-color').value, '#333333');
  assert.equal($('brand-color').value, '#abcdef'); assert.equal($('short-brand-color').value, '#778899');
  assert.equal($('brand-color-enabled').checked, true); assert.equal($('short-brand-color-enabled').checked, true);
  assert.equal($('short-color').value, '#444444'); assert.equal($('sock-color').value, '#555555');
  assert.equal($('cuffs-enabled').checked, true); assert.equal($('cuff-color').disabled, false);
  assert.equal($('neck-color').value, '#123456'); assert.equal($('ink-color').value, '#000000');
  assert.equal(history.length, 2); assert.equal(history[0]['short-color'].value, '#000000'); assert.equal(history[1]['short-color'].value, '#444444');
  assert(palette.includes('#555555'));
  const before = $('short-color').value;
  assert.throws(() => vm.runInContext("applyReferenceColors({...sample,socks:'#gggggg'},baseline)", context));
  assert.equal($('short-color').value, before); assert.equal(history.length, 2);
});

test('each color comparison independently restores its baseline and replays cached results without another API call',async()=>{
  const {context,$}=fixture();let calls=0;
  vm.runInContext('for(const id of Object.keys(referenceComparisonGroups))$(id).checked=true;',context);
  const detected={neck:'#010101',cuffs:'#020202',frontNumber:'#112233',backNumber:'#445566',shortNumber:'#778899',name:'#aabbcc',brand:'#ddeeff',shortBrand:'#123456',short:'#654321',socks:'#fedcba'};
  context.fetch=async()=>{calls++;return {ok:true,json:async()=>({colors:detected,outlines:{},textures:{},inferred:[]})};};
  await vm.runInContext('copyReferenceColors()',context);assert.equal(calls,1);
  const cases=[['reference-socks',['sock-color']],['reference-shorts',['short-color']],['reference-shirt-number',['front-number-color','back-number-color']],['reference-name',['ink-color']],['reference-short-number',['short-number-color']],['reference-shirt-logo',['brand-color']],['reference-short-logo',['short-brand-color']],['reference-neck-cuffs',['neck-color','cuff-color']]];
  for(const [id,fields] of cases){
    const applied=fields.map(field=>$(field).value);
    $(id).checked=false;context.event={target:$(id)};vm.runInContext('toggleReferenceComparison(event)',context);
    fields.forEach(field=>assert.equal($(field).value,'#000000',id));
    if(id==='reference-shirt-logo')assert.equal($('brand-color-enabled').checked,false);
    if(id==='reference-short-logo')assert.equal($('short-brand-color-enabled').checked,false);
    $(id).checked=true;vm.runInContext('toggleReferenceComparison(event)',context);
    fields.forEach((field,i)=>assert.equal($(field).value,applied[i],id));
  }
  assert.equal(calls,1);
  const saved=JSON.stringify(context.state.referenceComparison);assert(!saved.includes('data:image'));assert(saved.includes('front-number-color'));
  context.state.referenceComparison=JSON.parse(saved);$('reference-shirt-number').checked=false;context.event={target:$('reference-shirt-number')};vm.runInContext('toggleReferenceComparison(event)',context);
  assert.equal($('front-number-color').value,'#000000');assert.equal($('back-number-color').value,'#000000');
  $('reference-shirt-number').checked=true;vm.runInContext('toggleReferenceComparison(event)',context);assert.equal($('front-number-color').value,'#112233');assert.equal($('back-number-color').value,'#445566');
});

test('in-flight analysis cannot alter another sketch/reference or overwrite a changed visibility toggle', async () => {
  const { context, $ } = fixture(); let resolve;
  context.fetch = () => new Promise(done => { resolve = done; });
  const task = vm.runInContext('copyReferenceColors()', context);
  context.activeSketchId = 2;
  resolve({ ok: true, json: async () => ({ colors: { short: '#ffffff' } }) });
  await task; assert.equal($('short-color').value, '#000000');
  context.activeSketchId = 1;
  vm.runInContext("sample.brand='#ffffff';$('brand-color-enabled').checked=true;applyReferenceColors(sample,baseline)", context);
  assert.equal($('brand-color').value, '#000000');
  const task2 = vm.runInContext('copyReferenceColors()', context);
  context.state.referenceData = 'reference-2';
  resolve({ ok: true, json: async () => ({ colors: { short: '#ffffff' } }) });
  await task2; assert.equal($('short-color').value, '#000000');
});

test('combined analysis is one undo step, applies both sleeve views independently and protects subsequent manual edits',async()=>{
  const {context,$,history}=fixture();
  const clipCode=source.slice(source.indexOf('function clipTransform('),source.indexOf('function activeClips('));vm.runInContext(clipCode,context);
  $('reference-outlines').checked=true;$('reference-alignment').checked=true;
  context.state.layerStyles={};context.state.layers={'back-number':{size:300}};
  const clip={src:'texture-image',x:0,y:0,scale:1,bleed:.1,cropRevision:4};
  const variant={clips:{right:clip}};context.state.designVariants=[variant];context.state.activeVariant=0;
  context.packet={variant,context:{extended:true,outlines:true,alignment:true,elements:[{id:'back-number'}],targets:[{id:'right:front',piece:'right',side:'front'},{id:'right:back',piece:'right',side:'back'}]},styles:{'back-number':'null'},layers:{'back-number':JSON.stringify(context.state.layers['back-number'])},srcs:{right:clip.src},transforms:{}};
  vm.runInContext("packet.structure=referenceStructure();for(const t of packet.context.targets)packet.transforms[t.id]=referenceTransformSignature(packet.variant.clips[t.piece],t.piece,t.side);",context);
  context.buildReferenceDetailContext=()=>context.packet;
  context.result={colors:Object.fromEntries(['neck','cuffs','frontNumber','backNumber','shortNumber','name','brand','shortBrand','short','socks'].map(key=>[key,null])),outlines:{'back-number':{enabled:true,color:'#00ffaa',width:3,certainty:'observed'}},textures:{'right:front':{x:.1,y:.2,scale:1.3,rotation:25,certainty:'observed'},'right:back':{x:-.2,y:-.1,scale:.8,rotation:-31,certainty:'observed'}},inferred:[]};
  context.fetch=async()=>({ok:true,json:async()=>context.result});
  await vm.runInContext('copyReferenceColors()',context);
  assert.equal(history.length,2);
  assert.equal(context.state.layerStyles['back-number'].color,'#00ffaa');
  assert.equal(clip.views.front.scaleX,1.3);assert.equal(clip.views.back.scaleX,.8);assert.equal(clip.views.back.rotation,-31);
  assert.equal(clip.src,'texture-image');assert.equal(clip.cropRevision,4);assert.equal(clip.bleed,.1);
  vm.runInContext("for(const t of packet.context.targets)packet.transforms[t.id]=referenceTransformSignature(packet.variant.clips[t.piece],t.piece,t.side);packet.styles['back-number']=JSON.stringify(state.layerStyles['back-number']);",context);
  clip.views.front.x=.77;context.state.layerStyles['back-number'].width=8;
  const outcome=vm.runInContext('applyReferenceExtras(result,packet)',context);
  assert.equal(clip.views.front.x,.77);assert.equal(context.state.layerStyles['back-number'].width,8);
  assert(outcome.skipped.includes('right:front'));assert(outcome.skipped.includes('back-number'));
  assert(outcome.applied.includes('estampado:right:back'));
  context.result.textures['right:back'].rotation=Infinity;
  assert.throws(()=>vm.runInContext('validateReferenceExtras(result,packet.context)',context));
});

test('a measured pattern cannot be zoomed by vision; local refit remains reversible and protects in-flight manual edits',()=>{
  const {context,$}=fixture();$('reference-alignment').checked=true;
  vm.runInContext(source.slice(source.indexOf('function clipTransform('),source.indexOf('function activeClips(')),context);
  const clip={src:'pixels',patternGeometry:1,x:.1,y:.2,scale:.8,scaleX:.8,scaleY:.8,rotation:4};
  const variant={clips:{front:clip}};context.state.designVariants=[variant];context.state.activeVariant=0;
  const target={id:'front:front',piece:'front',side:'front'};
  context.packet={variant,context:{elements:[],targets:[]},patternTargets:[target],srcs:{front:'pixels'},transforms:{}};
  vm.runInContext("packet.structure=referenceStructure();packet.transforms['front:front']=referenceTransformSignature(packet.variant.clips.front,'front','front');var before=captureReferenceGroups(packet);",context);
  context.result={textures:{'front:front':{scale:3,x:.7,y:.7,rotation:90,certainty:'observed'}}};
  vm.runInContext('applyReferenceExtras(result,packet)',context);
  assert.equal(clip.scale,1);assert.equal(clip.x,0);assert.equal(clip.rotation,0);
  assert.equal(context.before['reference-alignment'].transforms.front.scale,.8);
  vm.runInContext("packet.transforms['front:front']=referenceTransformSignature(packet.variant.clips.front,'front','front');",context);
  clip.x=.33;vm.runInContext('applyReferenceExtras(result,packet)',context);assert.equal(clip.x,.33);
});
