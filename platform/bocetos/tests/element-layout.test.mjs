import test from 'node:test';
import assert from 'node:assert/strict';
import {fitTextInk,proportionalResize,makeElementModel,initialParameterSketch} from '../public/element-layout.js';
import {preferenceSnapshot,withPreferences} from '../public/editor-geometry.js';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');

test('different font metrics retain visible height using a uniform font size and natural width',()=>{
  const a=fitTextInk({actualBoundingBoxAscent:700,actualBoundingBoxDescent:100,actualBoundingBoxLeft:260,actualBoundingBoxRight:240,width:510},80);
  const b=fitTextInk({actualBoundingBoxAscent:500,actualBoundingBoxDescent:0,actualBoundingBoxLeft:200,actualBoundingBoxRight:200,width:410},80);
  assert.equal(a.height,80);assert.equal(b.height,80);assert.equal(a.fontSize,100);assert.equal(b.fontSize,160);
  assert.equal(a.width,50);assert.equal(b.width,64);assert.equal(a.baselineOffset,30);assert.equal(b.baselineOffset,40);
  assert.equal(a.inkOffsetX,1);assert.equal(b.inkOffsetX,0);
});

test('proportional resize changes both axes together and holds the opposite corner',()=>{
  const result=proportionalResize({bounds:{x:100,y:200,width:80,height:40},hx:1,hy:1,anchorX:100,anchorY:200,initialScaleY:1,rotation:0},{x:260,y:280});
  assert.equal(result.scaleX,2);assert.equal(result.scaleY,2);assert.equal(result.x,180);assert.equal(result.y,240);
  const side=proportionalResize({bounds:{x:100,y:200,width:80,height:40},hx:1,hy:0,anchorX:100,anchorY:220,initialScaleY:1,rotation:0},{x:220,y:220});
  assert.equal(side.scaleX,1.5);assert.equal(side.scaleY,1.5);assert.equal(side.x,160);assert.equal(side.y,220);
});

test('latest manual preferences persist separately without mutating the saved initial base',()=>{
  const sketch={inputs:{'name-font':'name','number-font':'digits','brand2-select':'logo2','show-brand2':true},
    logos:{brand:[],brand2:[{id:'logo2',image:{src:'original'}}],crest:[]},layers:{brand2:{x:790,y:320,size:50,originalTransform:{x:1}},'back-number':{x:800,y:580,size:300}},layerStyles:{},visibleLayers:{brand2:true,'back-number':true}};
  sketch.elementModel=makeElementModel(sketch,['brand2','back-number']);
  assert.equal(sketch.elementModel.layers.brand2.originalTransform,undefined);assert.equal(sketch.elementModel.logos,undefined);
  sketch.layers.brand2.x=400;sketch.inputs['name-font']='latest-name';const pref=preferenceSnapshot(sketch,['brand2','back-number']);
  const fresh=withPreferences({...sketch,inputs:{'player-name':'NOMBRE'}},pref);
  assert.equal(fresh.layers.brand2.x,400);assert.equal(fresh.inputs['name-font'],'latest-name');assert.equal(fresh.logos.brand2[0].id,'logo2');assert.equal(fresh.inputs['brand2-select'],'logo2');
  fresh.layers.brand2.size=80;assert.equal(sketch.elementModel.layers.brand2.size,50);assert.equal(fresh.inputs['player-name'],'NOMBRE');
});

test('initial parameter JSON includes toggles, colors, styles and trims while omitting document content and image data',()=>{
  const sketch={inputs:{'name-font':'name','number-font':'digits','include-shorts':false,'include-socks':true,'raglan-enabled':true,'gen-front':true,'show-back-name':false,'shirt-color':'#123456','notes':'NO COPIAR','player-name':'CLIENTE','player-number':'18'},
    logos:{brand:[{id:'brand-file',name:'marca.png',image:{src:'data:image/png,private'}}],brand2:[],crest:[]},layers:{'back-name':{x:800,y:300,size:60}},layerStyles:{'back-name':{enabled:true,color:'#ffffff',width:2}},visibleLayers:{'back-name':false},trimEdits:{linkedVersion:3,'individual:sleeve:left:front:single:0':{nodes:[]}}};
  sketch.inputs['brand-select']='brand-file';
  const model=makeElementModel(sketch,['back-name']);
  for(const id of ['include-shorts','include-socks','raglan-enabled','gen-front','show-back-name','shirt-color'])assert.equal(model.inputs[id],sketch.inputs[id]);
  for(const id of ['notes','player-name','player-number'])assert.equal(model.inputs[id],undefined);
  assert.deepEqual(model.layerStyles['back-name'],sketch.layerStyles['back-name']);assert.deepEqual(model.trimEdits,sketch.trimEdits);
  assert.equal(model.logoFiles.brand,'marca.png');assert(!JSON.stringify(model).includes('data:image'));
  const pref=preferenceSnapshot(sketch,['back-name']);assert.equal(pref.inputs['include-shorts'],false);assert.equal(pref.inputs['raglan-enabled'],true);
});

test('initial parameters provide missing defaults and latest values take priority for dimensions, options and styles',()=>{
  const blank={inputs:{'name-font':'blank','include-shorts':true,'player-name':'NOMBRE'},layers:{'back-name':{x:800,y:300,size:40}},layerStyles:{},visibleLayers:{'back-name':true},logos:{brand:[],crest:[]}};
  const base={inputs:{'name-font':'base','include-shorts':false},layers:{'back-name':{x:780,y:350,size:70}},visibleLayers:{'back-name':false},layerStyles:{'back-name':{enabled:true,color:'#ff0000',width:2}}};
  const pref={inputs:{'name-font':'latest'},elementModel:base,logos:blank.logos,layers:{},layerStyles:{},visibleLayers:{}};
  const fresh=withPreferences(blank,pref);assert.equal(fresh.inputs['name-font'],'latest');assert.equal(fresh.inputs['include-shorts'],false);
  assert.equal(fresh.layers['back-name'].size,70);assert.equal(fresh.visibleLayers['back-name'],false);assert.equal(fresh.layerStyles['back-name'].color,'#ff0000');
  assert.equal(fresh.inputs['player-name'],'NOMBRE');
});

test('retired parameter setup controls cannot overwrite the saved base',()=>{
  const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  assert(!html.includes('id="edit-elements"'));assert(!html.includes('id="parameter-setup-actions"'));
  assert(!source.includes('function captureGeneralParameters('));assert(source.includes('parameterSetup:false'));
});

test('actual text layout retains ink height and visual center without a maximum-width squeeze',()=>{
  const fields={'name-font':{value:'one'},'number-font':{value:'one'},'player-name':{value:'NOMBRE'},'player-number':{value:'10'}};
  const measure={font:'',measureText(){return this.font.includes('One')?{actualBoundingBoxAscent:700,actualBoundingBoxDescent:100,actualBoundingBoxLeft:2600,actualBoundingBoxRight:2400,width:5100}:{actualBoundingBoxAscent:500,actualBoundingBoxDescent:0,actualBoundingBoxLeft:2000,actualBoundingBoxRight:2000,width:4100};}};
  const c=vm.createContext({fitTextInk,fontHeightCache:new Map(),fontMeasureContext:measure,footballFonts:{one:{family:'One',weight:400},two:{family:'Two',weight:400}},defaultFootballFont:'one',$:id=>fields[id],imageForLayer:()=>null,
    state:{texts:[],layers:{'back-name':{x:801,y:386,size:100,scaleX:2,scaleY:1}}}});
  vm.runInContext(source.slice(source.indexOf('function textLayout('),source.indexOf('const placementTargets=')),c);
  const first=c.layerBounds('back-name');fields['name-font'].value='two';const second=c.layerBounds('back-name');
  for(const b of [first,second]){assert.equal(b.height,70);assert.equal(b.x,801);assert.equal(b.y,386);assert.equal(b.scaleX,2);assert.equal(b.scaleY,1);}
  assert.equal(first.width,875);assert.equal(second.width,1120);assert(first.width>300,'long names keep their natural width and explicit manual stretching');
});
