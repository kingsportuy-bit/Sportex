import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
test('Guardar modelo exports only trim settings and independent curves, without reference or logo images',()=>{
  const handlers={},nodes=new Map(),controls=['trim-sleeve-enabled','trim-sleeve-width'];
  const key='individual:sleeve:left:front:single:0',source={linkedVersion:3,[key]:{version:1,nodes:[{p:[.5,0],in:[.5,0],out:[.5,.3]},{p:[.5,1],in:[.5,.7],out:[.5,1]}]},'shared:sleeve:single:0':{old:true}};
  const context=vm.createContext({trimInputIds:controls,structuredClone,JSON,Object,encodeURIComponent,state:{assetsReady:true,trimEdits:source},captureSketch:()=>({inputs:{'trim-sleeve-enabled':true,'trim-sleeve-width':'12','shirt-color':'#000000'},referenceData:'data:image/png;base64,private'}),notice(){},$:id=>{if(!nodes.has(id))nodes.set(id,{addEventListener:(_type,handler)=>handlers[id]=handler,click(){this.clicked=true;}});return nodes.get(id);}});
  vm.runInContext(app.slice(app.indexOf("$('save-trim-model').addEventListener"),app.indexOf('async function init()')),context);
  handlers['save-trim-model']();const link=nodes.get('trim-model-download'),model=JSON.parse(decodeURIComponent(link.href.slice(link.href.indexOf(',')+1)));
  assert(link.clicked);assert.equal(link.hidden,false);assert.equal(model.schemaVersion,1);assert.deepEqual(Object.keys(model.inputs),controls);
  assert.deepEqual(Object.keys(model.trimEdits),['linkedVersion',key]);assert.equal(model.trimEdits.linkedVersion,3);assert(!JSON.stringify(model).includes('data:image'));
  model.trimEdits[key].nodes[0].p[0]=8;assert.equal(source[key].nodes[0].p[0],.5);
});
