import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {textureBaseGeometry} from '../public/artwork-registration.js';
import {clipPatternBounds} from '../public/pattern-geometry.js';
const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const extract=(start,end)=>app.slice(app.indexOf(start),app.indexOf(end));

test('uploaded artwork fits inside each piece with its original aspect and no bleed enlargement',()=>{
  for(const source of [{width:900,height:300},{width:300,height:900},{width:400,height:400}])for(const b of [{width:340,height:520},{width:344,height:532},{width:82,height:152},{width:326,height:245}]){
    const base=textureBaseGeometry({custom:true,patternGeometry:1,bleed:.2,contentWindow:{x:.1,y:.1,width:.8,height:.8}},source,b);
    assert(Math.abs(base.width/base.height-source.width/source.height)<1e-10);
    assert(base.width<=b.width+1e-8&&base.height<=b.height+1e-8,'the file must fit inside rather than cover the whole piece');
    assert.equal(base.offsetX,0);assert.equal(base.offsetY,0);
  }
});

function renderer(clip,piece='front',density=1){
  const image={width:900,height:300,src:'source'},bounds={x:10,y:20,width:100,height:200},drawn=[],warped=[];
  const lc={setTransform(){},fillRect(){},save(){},restore(){},translate(){},rotate(){},drawImage(...args){drawn.push(args);}};
  const mask={node:{},bounds,legacyBounds:bounds};
  const c=vm.createContext({activeClips:()=>({[piece]:clip}),textureImageForView:()=>image,powerClipMask:()=>mask,clipPatternBounds,textureBaseGeometry,clipTransform:()=>clip,outputScale:density,clippedTextureCache:new Map(),$:()=>({checked:true,value:'#ffffff'}),document:{createElement:()=>({getContext:()=>lc})},drawTorsoTexture:(...args)=>warped.push(args)});
  vm.runInContext(extract('function drawPowerClips(', 'function updateTextureEditor('),c);
  vm.runInContext(extract('function texturePlacement(', 'function textureHandles('),c);
  c.drawPowerClips({drawImage(){}},['shirt','short']);
  return {drawn:drawn.filter(args=>args[0]===image),warped,placement:c.texturePlacement(piece,'front')};
}
test('uploads use the same undeformed geometry in the garment, adjustment handles and 2x export',()=>{
  for(const piece of ['front','back','short','right','left'])for(const density of [1,2]){
    const result=renderer({custom:true,patternGeometry:1,scaleX:1,scaleY:1},piece,density);
    assert.equal(result.warped.length,0,`${piece}: a file upload must never use garment deformation`);
    for(const draw of result.drawn){assert.equal(draw[3],100);assert(Math.abs(draw[4]-100/3)<1e-8);}
    assert.equal(result.placement.width,100);assert(Math.abs(result.placement.height-100/3)<1e-8);
  }
});
test('manual independent scale remains editable without losing the original proportional base',()=>{
  const result=renderer({custom:true,patternGeometry:1,scaleX:1.5,scaleY:.75,x:.2,y:-.1});
  assert.equal(result.warped.length,0);assert.equal(result.drawn[0][3],150);assert(Math.abs(result.drawn[0][4]-25)<1e-8);
  assert.equal(result.placement.width,150);assert(Math.abs(result.placement.height-25)<1e-8);
  assert.equal(result.placement.x,5);assert.equal(result.placement.y,87.5);
});
test('generated AI torso swatches retain their existing garment-side deformation',()=>{
  const result=renderer({patternGeometry:1,scaleX:1,scaleY:1});
  assert.equal(result.warped.length,1);assert.equal(result.drawn.length,0);
  assert.equal(result.placement.width,100);assert.equal(result.placement.height,200);
});
