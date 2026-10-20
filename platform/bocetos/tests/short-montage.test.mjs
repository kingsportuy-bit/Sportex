import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {clipPatternBounds} from '../public/pattern-geometry.js';
import {textureBaseGeometry} from '../public/artwork-registration.js';

const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
test('short editing fits the complete rectangle to each mask without historical overscan',()=>{
  const clip={src:'short',x:0,y:0,scale:1,contentWindow:{x:.1,y:.1,width:.8,height:.8}};
  const bounds={front:{x:100,y:700,width:300,height:400},back:{x:600,y:710,width:280,height:390}};
  const context=vm.createContext({activeClips:()=>({short:clip}),textureImageForView:()=>({width:200,height:300}),
    powerClipMask:(_piece,side)=>({bounds:bounds[side],legacyBounds:{x:0,y:600,width:500,height:600}}),
    clipTransform:clip=>clip,clipPatternBounds,textureBaseGeometry});
  vm.runInContext(app.slice(app.indexOf('function texturePlacement('),app.indexOf('function textureHandles(')),context);
  for(const side of ['front','back']){
    const result=context.texturePlacement('short',side),b=bounds[side];
    assert.equal(result.x,b.x);assert.equal(result.y,b.y);
    assert.equal(result.width,b.width);assert.equal(result.height,b.height);
  }
});
test('generation selection excludes socks while solid-color socks remain visible',()=>{
  const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  const nodes=new Map([...html.matchAll(/<input\b[^>]*\bid="([^"]+)"[^>]*>/g)].map(match=>[match[1],{checked:true}]));
  const context=vm.createContext({$:id=>nodes.get(id)});
  vm.runInContext(app.slice(app.indexOf('function visibleParts('),app.indexOf('function flatMaskName(')),context);
  assert.deepEqual([...context.selectedParts()],['front','back','right','left','short']);
  assert.deepEqual([...context.visibleParts()],['shirt','short','socks']);
  assert(nodes.has('sock-color'),'solid sock color stays editable');
});
