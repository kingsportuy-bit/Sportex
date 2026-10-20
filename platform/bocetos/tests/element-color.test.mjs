import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {colorableElements} from '../public/element-selection.js';

const source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
function harness(selection){
  const nodes=new Map(),pending=[],history=[],palette=[];
  const $=id=>{if(!nodes.has(id))nodes.set(id,{id,value:'#123456',checked:false,textContent:'',disabled:false});return nodes.get(id);};
  const context=vm.createContext({$,colorableElements,editingTexture:false,preferencesDirty:false,activePaletteField:'shirt-color',selection,
    state:{selected:selection.at(-1),texts:[{id:'text-note',color:'#abcdef'}],layers:{crest:{x:100},'sponsor-one':{x:200}},layerStyles:{crest:{color:'#ff0000'}}},
    selectedLayerKeys:()=>context.selection,queueTextStylePreview:key=>pending.push(key),flushTextStylePreview:()=>pending.push('flush'),
    recordHistory:()=>history.push($('front-number-color').value),rememberDocumentColor:color=>palette.push(color)});
  vm.runInContext(source.slice(source.indexOf('function applySelectionColor('),source.indexOf("for(const type of ['input','change'])$('selected-text-color-input')")),context);
  vm.runInContext(source.slice(source.indexOf('function paletteTarget('),source.indexOf('function updateDocumentPalette(')),context);
  vm.runInContext(source.slice(source.indexOf('function applyPaletteColor('),source.indexOf("$('palette-add-color').addEventListener")),context);
  return {context,$,nodes,pending,history,palette};
}

test('group fill supports numbers, names, custom text and all brand logos, excluding crests and sponsors',()=>{
  assert.deepEqual(colorableElements(['brand','brand2','short-brand','front-number','back-number','short-number','back-name','text-note','crest','short-crest','sponsor-one','unknown']),
    ['brand','brand2','short-brand','front-number','back-number','short-number','back-name','text-note']);
});

test('actual group color command applies all eligible fills in one render and preserves excluded graphics and geometry',()=>{
  const keys=['front-number','back-number','short-number','back-name','brand','brand2','short-brand','text-note','crest','short-crest','sponsor-one'];
  const h=harness(keys),before=structuredClone({layers:h.context.state.layers,styles:h.context.state.layerStyles});
  h.context.applySelectionColor('#f05a28',true);
  for(const id of ['front-number-color','back-number-color','short-number-color','ink-color','brand-color','brand2-color','short-brand-color'])assert.equal(h.$(id).value,'#f05a28');
  for(const key of ['brand','brand2','short-brand'])assert.equal(h.$(`${key}-color-enabled`).checked,true);
  assert.equal(h.context.state.texts[0].color,'#f05a28');assert.equal(h.context.preferencesDirty,true);
  assert.deepEqual(h.pending,[...colorableElements(keys),'flush']);
  assert.deepEqual({layers:h.context.state.layers,styles:h.context.state.layerStyles},before);
  for(const id of ['crest-color','short-crest-color','sponsor-one-color','shirt-color'])assert(!h.nodes.has(id));
});

test('palette targets the whole mixed selection, including when its active element is a sponsor, with history around the group',()=>{
  const h=harness(['front-number','text-note','brand2','crest','sponsor-one']);
  h.context.applyPaletteColor('#224466');
  assert.equal(h.$('front-number-color').value,'#224466');assert.equal(h.$('brand2-color').value,'#224466');assert.equal(h.context.state.texts[0].color,'#224466');
  assert.deepEqual(h.palette,['#224466']);assert.deepEqual(h.history,['#123456','#224466']);assert.deepEqual(h.pending,['front-number','text-note','brand2','flush']);
});

test('a group containing only crests and sponsors cannot recolor the garment through palette fallback',()=>{
  const h=harness(['crest','short-crest','sponsor-one']);
  h.context.applyPaletteColor('#abcdef');h.context.applySelectionColor('#abcdef',true);
  assert.deepEqual(h.pending,[]);assert.deepEqual(h.history,[]);assert.deepEqual(h.palette,[]);assert.equal(h.nodes.size,0);
});
