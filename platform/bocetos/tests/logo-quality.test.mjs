import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
function fixture(scale=1,outline=false){
  const draws=[],surfaces=[],image={width:1826,height:1592},bounds={x:187,y:384,width:48,height:42,image};
  function context(){
    const stack=[];
    return {imageSmoothingEnabled:false,imageSmoothingQuality:'low',globalCompositeOperation:'source-over',
      save(){stack.push([this.imageSmoothingEnabled,this.imageSmoothingQuality]);},
      restore(){[this.imageSmoothingEnabled,this.imageSmoothingQuality]=stack.pop();},
      drawImage(source,...args){draws.push({source,args,smoothing:this.imageSmoothingEnabled,quality:this.imageSmoothingQuality});},fillRect(){}};
  }
  const c=context(),sandbox=vm.createContext({outputScale:scale,layerBounds:()=>bounds,rotatableLayer:()=>false,
    state:{layerStyles:outline?{brand:{enabled:true,color:'#000000',width:2}}:{}},
    document:{createElement(){const node={width:0,height:0,getContext:()=>node.ctx};node.ctx=context();surfaces.push(node);return node;}}});
  const start=app.includes('function drawGraphicImage(')?app.indexOf('function drawGraphicImage('):app.indexOf('function outlinedImage(');
  vm.runInContext(app.slice(start,app.indexOf('let elementResize')),sandbox);
  return {draws,surfaces,image,c,draw:()=>sandbox.drawLayer(c,'brand',false)};
}

test('reducing a high resolution brand uses antialiasing without changing its bounds or source',()=>{
  const f=fixture();f.draw();assert.equal(f.draws.length,1);const draw=f.draws[0];
  assert.equal(draw.quality,'high');assert.equal(draw.smoothing,true);assert.equal(draw.source,f.image);
  assert.deepEqual(draw.args,[163,363,48,42]);
});

test('brand filtering does not leak into the other canvas tools',()=>{
  const f=fixture();f.draw();assert.equal(f.c.imageSmoothingEnabled,false);assert.equal(f.c.imageSmoothingQuality,'low');
});

test('exported brand outline is rasterized at export density instead of stretching a 1x edge',()=>{
  const f=fixture(2,true);f.draw();assert.equal(f.surfaces.length,1);assert.equal(f.surfaces[0].width,96);assert.equal(f.surfaces[0].height,84);
  assert.deepEqual(f.draws[0].args,[0,0,96,84]);assert(f.draws.every(draw=>draw.smoothing&&draw.quality==='high'));
});
