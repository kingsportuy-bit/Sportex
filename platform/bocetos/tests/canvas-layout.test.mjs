import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {fitTextInk,trackedGlyphLayout,compositionTransform,proportionalResize,initialParameterSketch} from '../public/element-layout.js';
import {preferenceSnapshot} from '../public/editor-geometry.js';
import {patternBounds} from '../public/pattern-geometry.js';
import {readRgbaPng} from './png-fixture.mjs';
const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');

test('3:4 is the only format, position panel is removed, reference is a quick button and replacement lives below the element',()=>{
  assert(!html.includes('data-format='));assert(!html.includes('value="9:16"'));assert(!html.includes('element-layout-panel'));
  assert(html.includes('value="3:4" selected'));assert(html.indexOf('id="copy-reference-colors"')>html.indexOf('id="generate"'));
  assert(html.indexOf('id="action-replace-graphic"')>html.indexOf('id="selected-text-color"'));
  assert(!html.slice(html.indexOf('id="canvas-actions"'),html.indexOf('id="document-palette"')).includes('action-replace-graphic'));
});

test('real shirt and shirt/short masks are centered and enlarged; full kit retains its exact composition',()=>{
  const bounds=['photoDesignShirt','photoShort'].map(name=>{const mask=readRgbaPng(new URL(`../public/assets/psd-kit/${name}.png`,import.meta.url));return patternBounds(mask.data,mask.width,mask.height);});
  for(const boxes of [[bounds[0]],bounds]){
    const t=compositionTransform(boxes,false),left=Math.min(...boxes.map(b=>b.x)),right=Math.max(...boxes.map(b=>b.x+b.width)),top=Math.min(...boxes.map(b=>b.y)),bottom=Math.max(...boxes.map(b=>b.y+b.height));
    assert(t.scale>1);assert(Math.abs(180+t.x+(left+right)/2*t.scale-720)<1e-8);assert(Math.abs(t.y+(top+bottom)/2*t.scale-960)<1e-8);
    assert(180+t.x+left*t.scale>=59.99);assert(180+t.x+right*t.scale<=1380.01);assert(t.y+top*t.scale>=79.99);assert(t.y+bottom*t.scale<=1840.01);
  }
  assert.deepEqual(compositionTransform(bounds,true),{x:0,y:0,scale:1});
});

test('pointer inversion and on-screen handles use the same adaptive composition',()=>{
  const c=vm.createContext({W:1080,H:1920,state:{assetsReady:true},compositionTransform,maskBounds:()=>({x:20,y:180,width:1040,height:620}),$:()=>({checked:false}),canvas:{getBoundingClientRect:()=>({left:100,top:200,width:720,height:960})},frameWidth:()=>1440});
  vm.runInContext(app.slice(app.indexOf('function transform()'),app.indexOf('const brandColorCache=')),c);
  vm.runInContext(app.slice(app.indexOf('function pointerPosition('),app.indexOf("canvas.addEventListener('pointerdown'")),c);
  const point=c.framePoint(345,387),restored=c.pointerPosition({clientX:100+point.x/2,clientY:200+point.y/2});
  assert(Math.abs(restored.x-345)<1e-8);assert(Math.abs(restored.y-387)<1e-8);assert(Math.abs(c.screenUnit()*c.transform().scale-2)<1e-8);
});

test('side handles stretch one axis for every element; corners retain its current manual aspect and opposite anchor',()=>{
  const c=vm.createContext({proportionalResize});
  vm.runInContext(app.slice(app.indexOf('function anchoredTextureTransform('),app.indexOf('const shoulderTrimMasks=')),c);
  vm.runInContext(app.slice(app.indexOf('function rotatePoint('),app.indexOf('function hitRotationHandle(')),c);
  vm.runInContext(app.slice(app.indexOf('function resizedElement('),app.indexOf('let litSceneReady=')),c);
  const base={key:'back-name',bounds:{x:100,y:200,width:100,height:50},width:100,height:50,initialScaleX:2,initialScaleY:1,rotation:0,centerX:150,centerY:225};
  const width=c.resizedElement({...base,hx:1,hy:0,anchorX:100,anchorY:225,dx:100,dy:0},{x:250,y:225});
  assert.equal(width.scaleX,3);assert.equal(width.scaleY,1);assert.equal(width.x,175);assert.equal(width.y,225);
  const height=c.resizedElement({...base,hx:0,hy:1,anchorX:150,anchorY:200,dx:0,dy:50},{x:150,y:300});
  assert.equal(height.scaleX,2);assert.equal(height.scaleY,2);assert.equal(height.x,150);assert.equal(height.y,250);
  const corner=c.resizedElement({...base,hx:1,hy:1,anchorX:100,anchorY:200,dx:100,dy:50},{x:300,y:300});
  assert.equal(corner.scaleX,4);assert.equal(corner.scaleY,2);assert.equal(corner.x,200);assert.equal(corner.y,250);
});

test('letter spacing contracts and expands actual glyph bounds around the visual center',()=>{
  const measure=value=>({width:value.length*10,actualBoundingBoxLeft:0,actualBoundingBoxRight:value.length*10});
  const compact=trackedGlyphLayout('ABC',measure,-2),expanded=trackedGlyphLayout('ABC',measure,4);
  assert.equal(compact.width,26);assert.equal(expanded.width,38);assert.deepEqual(compact.glyphs.map(g=>g.x),[-13,-5,3]);
});

test('text can change height without changing its manually stretched width, including letter spacing',()=>{
  let measurements=0;const measure={font:'1000px Font',textAlign:'center',measureText(value){measurements++;const size=Number(this.font.match(/([\d.]+)px/)[1]),width=value.length*size/2;return {width,actualBoundingBoxAscent:size*.8,actualBoundingBoxDescent:size*.2,actualBoundingBoxLeft:this.textAlign==='center'?width/2:0,actualBoundingBoxRight:this.textAlign==='center'?width/2:width};}};
  const fields={'name-font':{value:'font'},'player-name':{value:'AB'}};
  const c=vm.createContext({fitTextInk,trackedGlyphLayout,fontHeightCache:new Map(),trackedFontCache:new Map(),fontMeasureContext:measure,footballFonts:{font:{family:'Font',weight:400}},defaultFootballFont:'font',$:id=>fields[id],imageForLayer:()=>null,state:{texts:[],layers:{'back-name':{x:800,y:350,size:100,scaleX:2,scaleY:1,letterSpacing:-3}}}});
  vm.runInContext(app.slice(app.indexOf('function textLayout('),app.indexOf('const placementTargets=')),c);
  const before=c.layerBounds('back-name'),count=measurements;c.layerBounds('back-name');assert.equal(measurements,count,'moving or repainting reuses tracked glyph metrics');c.state.layers['back-name'].scaleY=2;const taller=c.layerBounds('back-name');
  assert.equal(before.width,taller.width);assert.equal(taller.height,2*before.height);assert.equal(taller.x,before.x);assert.equal(taller.y,before.y);
});

test('approved initial parameters seed dimensions and font choices while latest cached Logo2 survives new sketches',()=>{
  const model=JSON.parse(readFileSync(new URL('../public/initial-parameters.json',import.meta.url),'utf8'));
  assert.equal(model.approvedAt,'2026-10-19');assert.equal(model.inputs['design-format'],'3:4');assert.equal(model.layers.brand2.x,797);assert(model.texts.length>0);
  const blank={inputs:{},logos:{brand:[],brand2:[],crest:[]},layers:{},layerStyles:{},visibleLayers:{},texts:[]};
  const base=initialParameterSketch(blank,model),live={...base,logos:{...blank.logos,brand2:[{id:'cached-two',name:model.logoFiles.brand2,image:{src:'data:image/png,original'}}]},inputs:{...base.inputs,'brand2-select':'cached-two'},layers:{...base.layers,brand2:{...base.layers.brand2,x:790,letterSpacing:2}}};
  const prefs=preferenceSnapshot(live,Object.keys(live.layers)),next=initialParameterSketch(base,model,prefs);
  assert.deepEqual(next.layers.brand2,model.layers.brand2);assert.equal(next.logos.brand2[0].image.src,'data:image/png,original');assert.equal(next.inputs['brand2-select'],'cached-two');assert.equal(next.inputs['name-font'],model.inputs['name-font']);
});
