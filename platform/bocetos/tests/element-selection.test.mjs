import test from 'node:test';
import assert from 'node:assert/strict';
import {toggleElement,marqueeElements,alignElements} from '../public/element-selection.js';
import {makeElementModel} from '../public/element-layout.js';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

test('Shift selection adds and removes individual keys without duplicates',()=>{
  assert.deepEqual(toggleElement(['brand'],'front-number'),['brand','front-number']);
  assert.deepEqual(toggleElement(['brand','front-number'],'brand'),['front-number']);
});
test('mouse rectangle selects intersecting visible instances once, including rotated elements',()=>{
  const instances=[{key:'a',x:100,y:100,width:40,height:20,rotation:0},{key:'a',x:500,y:100,width:40,height:20,rotation:0},{key:'b',x:160,y:100,width:100,height:10,rotation:90},{key:'c',x:300,y:400,width:20,height:20}];
  assert.deepEqual(marqueeElements(instances,{x:75,y:75,width:100,height:50}),['a','b']);
  assert.deepEqual(marqueeElements(instances,{x:600,y:600,width:20,height:20}),[]);
});
test('vertical and horizontal alignment preserve sizes and the other coordinate',()=>{
  const items=[{key:'a',x:100,y:200,width:40,height:80},{key:'b',x:200,y:400,width:60,height:100}],before=structuredClone(items);
  assert.deepEqual(alignElements(items,'vertical'),[{key:'a',x:155,y:200},{key:'b',x:155,y:400}]);
  assert.deepEqual(alignElements(items,'horizontal'),[{key:'a',x:100,y:305},{key:'b',x:200,y:305}]);
  assert.deepEqual(items,before);
});
test('shirt alignment uses the mask center of each view independently',()=>{
  const items=[{key:'front',x:200,y:400,width:50,height:80},{key:'back',x:700,y:500,width:80,height:100}];
  assert.deepEqual(alignElements(items,'shirt',item=>item.x<540?{x:80,width:320}:{x:600,width:340}),[{key:'front',x:240,y:400},{key:'back',x:770,y:500}]);
});

test('canvas alignment moves the selected layers as one undoable action while retaining transforms and attachment',()=>{
  const source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8'),calls=[];
  const layers={a:{x:200,y:300,size:50,rotation:10,attachment:{piece:'front',side:'front'}},b:{x:700,y:500,size:100,rotation:0,scaleX:1.2}};
  const context=vm.createContext({editingTexture:false,W:1080,state:{layers},selectedLayerKeys:()=>['a','b'],layerBounds:key=>({...layers[key],width:layers[key].size,height:layers[key].size}),
    alignElements,rotatableLayer:key=>key==='a',attachmentFor:key=>layers[key].attachment,powerClipMask:piece=>({bounds:piece==='front'?{x:80,width:320}:{x:600,width:340}}),
    preferencesDirty:false,recordHistory:()=>calls.push('history'),render:()=>calls.push('render'),scheduleWorkspaceSave:()=>calls.push('save')});
  vm.runInContext(source.slice(source.indexOf('function alignSelectedElements('),source.indexOf('function hitLayerInstance(')),context);
  context.alignSelectedElements('shirt');
  assert.equal(layers.a.x,240);assert.equal(layers.b.x,770);assert.equal(layers.a.y,300);assert.equal(layers.b.y,500);
  assert.equal(layers.a.rotation,10);assert.equal(layers.b.scaleX,1.2);assert.equal(layers.a.size,50);assert.equal(layers.b.size,100);assert.deepEqual(layers.a.attachment,{piece:'front',side:'front'});
  assert.deepEqual(calls,['history','render','history','save']);assert.equal(context.preferencesDirty,true);
});
test('general parameters capture all configured elements, attachments, custom text and texture placement without image data',()=>{
  const sketch={inputs:{'name-font':'name','raglan-enabled':true},backgroundMode:'transparent',documentPalette:['#123456'],layers:{brand:{x:180,y:380,size:50},'sponsor-1':{x:70,y:430,size:60,rotation:12,attachment:{piece:'right',side:'front'}},'text-1':{x:280,y:350,size:45}},visibleLayers:{brand:true,'sponsor-1':true,'text-1':false},layerStyles:{},
    sponsors:[{id:'sponsor-1',name:'sponsor.png',visible:true,image:{src:'data:image/png,original'}}],texts:[{id:'text-1',value:'TEXTO',font:'name',color:'#ffffff'}],trimEdits:{linkedVersion:3},activeVariant:0,designVariants:[{clips:{front:{src:{src:'data:image/png,texture'},x:.2,y:-.1,scaleX:1.2,rotation:4,views:{back:{rotation:9}}}}}]};
  const first=makeElementModel(sketch,Object.keys(sketch.layers));sketch.layers['sponsor-1'].x=95;sketch.inputs['raglan-enabled']=false;const next=makeElementModel(sketch,Object.keys(sketch.layers));
  assert.deepEqual(next.layers['sponsor-1'].attachment,{piece:'right',side:'front'});assert.equal(next.sponsors[0].name,'sponsor.png');assert.equal(next.texts[0].value,'TEXTO');
  assert.equal(first.layers['sponsor-1'].x,70);assert.equal(next.layers['sponsor-1'].x,95);assert.equal(next.inputs['raglan-enabled'],false);
  assert.equal(next.texturePlacements.front.rotation,4);assert.equal(next.texturePlacements.front.src,undefined);assert(!JSON.stringify(next).includes('data:image'));
  assert.equal(next.backgroundMode,'transparent');assert.deepEqual(next.documentPalette,['#123456']);
});
