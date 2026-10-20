import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
test('Vivos is step 03, image design is 04 and reference colors is a quick action',()=>{
  const sections=[...html.matchAll(/<details class="step-section" aria-labelledby="([^"]+)"[^>]*><summary><span class="step-number">(\d+)<\/span>/g)];
  assert.deepEqual(sections.map(m=>[m[1],m[2]]),[['garment-title','01'],['colors-title','02'],['trims-title','03'],['ai-title','04'],['textures-title','05']]);
  assert(html.includes('id="copy-reference-colors"'));assert(!html.includes('id="reference-colors-title"'));
});
test('all trim controls enter the existing sketch snapshot and default off for old sketches',()=>{
  const groups=['sleeve','shoulder','shirt-side','short-side','short-hem'];
  const controls=new Map([...html.matchAll(/<(input|select)\b[^>]*\bid="([^"]+)"[^>]*>/g)].map(m=>[m[2],m[0]]));
  const trimInputIds=[...controls.keys()].filter(id=>id.startsWith('trim-')&&!id.startsWith('trim-editor-'));
  const c=vm.createContext({trimInputIds,referenceComparisonGroups:{},colorIds:[],designPieceKeys:[],numberColorIds:[],fixedLayerKeys:[]});
  vm.runInContext(app.slice(app.indexOf('const sketchInputIds ='),app.indexOf('const defaultInputs =')),c);
  const saved=[...vm.runInContext('sketchInputIds',c)];
  for(const group of groups){
    const id=`trim-${group}-enabled`;assert(controls.has(id),`${group} activation is missing`);
    assert(!/\bchecked\b/.test(controls.get(id)));assert(saved.includes(id),`${group} is not persisted`);
  }
  assert(trimInputIds.length>=18);
  for(const id of trimInputIds)assert(saved.includes(id),id);
});
