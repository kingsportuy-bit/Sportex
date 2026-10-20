import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8'),html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const extract=(a,b)=>app.slice(app.indexOf(a),app.indexOf(b));

test('routine canvas comments are silent while errors remain visible and accessible',()=>{
  const node={classList:{toggle(){}}},c=vm.createContext({$:()=>node});vm.runInContext(extract('function notice(', 'function makeCanvas('),c);
  c.notice('Prendas actualizadas');assert.equal(node.hidden,true);c.notice('No se pudo leer la imagen.',true);assert.equal(node.hidden,false);assert.equal(node.textContent,'No se pudo leer la imagen.');c.notice('');assert.equal(node.hidden,true);
});
test('context controls replace the parameter/multiselect buttons and keep both texture-adjustment entry points',()=>{
  for(const id of ['edit-elements','action-multi-select','parameter-setup-actions'])assert(!html.includes(`id="${id}"`));
  for(const id of ['edit-texture','adjust-textures','action-outline','selected-text-font','text-letter-spacing','toggle-left-panel','toggle-right-panel'])assert(html.includes(`id="${id}"`));
  assert(html.indexOf('id="text-font-control"')>html.indexOf('id="text-spacing-control"'));assert(html.includes('class="text-tool-icon"'));
  assert(!/id="cuffs-enabled"[^>]*checked/.test(html));
  for(const piece of ['front','back','right','left','short'])for(const part of ['ai','file','custom'])assert(html.includes(`id="texture-${part}-${piece}"`));
});
test('hiding a modern AI piece cannot reveal the old flattened image beneath it',()=>{
  const drawn=[],c=vm.createContext({W:10,H:20,state:{designVariants:[{clips:{front:{src:'ai-front'}}}],activeVariant:0,generatedParts:{shirt:'flattened-shirt',shirtSleeves:'flattened-sleeves'}},$:()=>({checked:true,value:'#123456'}),drawPhotoshopParts(){},drawPowerClips(){},drawGarmentTrims(){},tintedMask:name=>name});
  vm.runInContext(extract('function drawPhotoshopGarment(', 'const garmentSurface='),c);c.drawPhotoshopGarment({drawImage:image=>drawn.push(image)},['shirt'],true);
  assert(!drawn.includes('flattened-shirt'));assert(!drawn.includes('flattened-sleeves'));assert(drawn.indexOf('photoCuffs')>drawn.indexOf('photoSleeveRight'));
});
test('custom textures and source choices survive disk serialization and hydrate their original images',async()=>{
  const loaded=[],c=vm.createContext({textureImages:new Map(),loadImage:async src=>{loaded.push(src);return {src};},prepareClips:async()=>{}});
  vm.runInContext(extract('function imageSource(', 'function workspaceDb('),c);
  const doc={logos:{brand:[],brand2:[],crest:[]},sponsors:[],generatedParts:{},designVariants:[],customTextures:{front:{name:'propia.png',clip:{src:'original-file',custom:true,x:.2,scaleY:1.3}}},textureModes:{front:'custom'}};
  const disk=c.serializeSketch(doc),restored=await c.hydrateSketch(structuredClone(disk));
  assert.deepEqual(restored.customTextures,doc.customTextures);assert.deepEqual(restored.textureModes,doc.textureModes);assert.equal(c.textureImages.get('original-file').src,'original-file');assert.deepEqual(loaded,['original-file']);
});
test('per-text selection changes font through the existing height-normalized renderer and stores one history action',()=>{
  const fields={'selected-text-font':{value:'new-font',addEventListener(_event,fn){this.change=fn;}},'name-font':{value:'old-name'},'number-font':{value:'old-number'}};let saves=0,renders=0;
  const c=vm.createContext({$:id=>fields[id],state:{selected:'back-number',texts:[]},isTextLayer:()=>true,selectedLayerKeys:()=>[c.state.selected],recordHistory(){},fontHeightCache:new Map(),trackedFontCache:new Map(),render(){renders++;},scheduleWorkspaceSave(){saves++;}});
  vm.runInContext(extract("$('selected-text-font').addEventListener", "$('action-outline').addEventListener"),c);
  fields['selected-text-font'].change({target:{value:'new-font'}});assert.equal(fields['number-font'].value,'new-font');assert.equal(fields['name-font'].value,'old-name');assert.equal(saves,1);assert.equal(renders,1);
  c.state.selected='text-own';c.state.texts=[{id:'text-own',font:'old-font'}];fields['selected-text-font'].change({target:{value:'own-font'}});assert.equal(c.state.texts[0].font,'own-font');assert.equal(fields['number-font'].value,'new-font');
});

test('editor confirmation resolves only its own accept action and cancellation preserves all sketches',async()=>{
  const nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,{addEventListener(event,handler){this[event]=handler;},focus(){this.focused=true;},querySelector(){return null;}});return nodes.get(id);};
  const dialog=$('editor-confirm-dialog');dialog.showModal=()=>{dialog.open=true;};dialog.close=value=>{dialog.open=false;dialog.returnValue=value;nodes.get('editor-confirm-dialog')['onclose']?.();};
  dialog.addEventListener=(event,handler)=>{dialog['on'+event]=handler;};
  const sketches=new Map([[1,{title:'original'}],[2,{title:'test'}]]),c=vm.createContext({$,sketches,editHistories:new Map(),activeSketchId:1,generatingSketchId:null,nextAvailableSketchId:()=>2,tabTitle:id=>`Boceto ${id}`,notice(){},rememberPreferences(){},captureSketch:()=>sketches.get(1),renderSketchTabs(){},runPendingReferenceAdjustment(){},scheduleWorkspaceSave(){}});
  vm.runInContext(extract('let confirmationResolver=',"$('new-sketch').addEventListener"),c);
  const canceled=c.closeSketch(2);assert.equal(sketches.size,2);assert.equal(dialog.open,true);assert.equal($('editor-confirm-cancel').focused,true);
  $('editor-confirm-cancel').click();await canceled;assert.equal(sketches.size,2);
  const accepted=c.closeSketch(2);assert.equal(sketches.size,2);$('editor-confirm-accept').click();await accepted;assert.equal(sketches.size,1);assert.equal(sketches.get(1).title,'original');
  assert(!app.includes('window.confirm('));assert(html.includes('role="alertdialog"'));
});

test('Escape inside a native font or piece selector leaves texture adjustment open',()=>{
  let keydown,closed=0;const c=vm.createContext({document:{addEventListener:(_event,handler)=>{keydown=handler;}},trimEditor:null,$:()=>({open:false}),editingTexture:true,finishTextureAdjustment:()=>{closed++;}});
  const handler=app.split('\n').find(line=>line.startsWith("document.addEventListener('keydown',event=>{if(trimEditor?.active"));vm.runInContext(handler,c);
  keydown({key:'Escape',target:{closest:()=>({tagName:'SELECT'})}});assert.equal(closed,0);
  keydown({key:'Escape',target:{closest:()=>null}});assert.equal(closed,1);
});
