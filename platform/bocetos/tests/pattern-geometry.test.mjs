import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {readRgbaPng} from './png-fixture.mjs';
import {patternBounds,clipPatternBounds,resetPatternPlacement,patternGeometryVersion} from '../public/pattern-geometry.js';
import {textureBaseGeometry,registrationWindow} from '../public/artwork-registration.js';

test('actual PSD torso bounds exclude residual sleeve alpha and isolated edge pixels',()=>{
  for(const [side,tag,expected] of [
    ['front','Body',[97,281,340,520]],['front','BodyRaglan',[117,289,299,512]],
    ['back','Body',[625,283,344,532]],['back','BodyRaglan',[646,288,307,527]]]){
    const png=readRgbaPng(new URL(`../public/assets/psd-kit/${side}-photoDesignShirt${tag}.png`,import.meta.url));
    const actual=patternBounds(png.data,png.width,png.height);
    assert.deepEqual(Object.values(actual),expected,`${side} ${tag}`);
  }
});

test('each anatomical sleeve is measured separately, including its different rear projection',()=>{
  for(const [side,tag,left,right] of [
    ['front','Sleeves',[83,152],[80,146]],['front','SleevesRaglan',[161,192],[157,185]],
    ['back','Sleeves',[82,150],[85,156]],['back','SleevesRaglan',[179,187],[176,193]]]){
    const png=readRgbaPng(new URL(`../public/assets/psd-kit/${side}-photoDesignShirt${tag}.png`,import.meta.url));
    const split=side==='front'?268:800;
    for(const [screenLeft,expected] of [[true,left],[false,right]]){
      const data=png.data.slice();for(let i=0;i<png.width*png.height;i++)if(screenLeft?i%png.width>=split:i%png.width<split)data[i*4+3]=0;
      const b=patternBounds(data,png.width,png.height);assert.deepEqual([b.width,b.height],expected,`${side} ${tag} ${screenLeft}`);
    }
  }
});

test('registered source landmarks map exactly to the PSD pattern, even with a mismatched source aspect',()=>{
  const b={x:117,y:289,width:299,height:512},source={width:416,height:480};
  const inner=registrationWindow({x:0,y:0,...source}),contentWindow={x:inner.x/source.width,y:inner.y/source.height,width:inner.width/source.width,height:inner.height/source.height};
  const base=textureBaseGeometry({patternGeometry:1,contentWindow},source,b);
  assert(Math.abs(base.width-358.8)<1e-8);assert.equal(base.height,614.4);
  for(const [axis,size] of [['x','width'],['y','height']])for(const u of [0,.1,.25,.5,.75,.9,1]){
    const inSource=contentWindow[axis]+u*contentWindow[size];
    const atPattern=b[axis]+b[size]/2+(inSource-.5)*base[size];
    assert(Math.abs(atPattern-(b[axis]+u*b[size]))<1e-8);
  }
  const legacy=textureBaseGeometry({contentWindow},source,b);assert(legacy.width>base.width*1.4,'reproduces previous width inflation');
});

test('hires export uses the same measured frame as the editor within one logical pixel',()=>{
  const small=readRgbaPng(new URL('../public/assets/psd-kit/photoDesignShirtBodyRaglan.png',import.meta.url));
  const large=readRgbaPng(new URL('../moldes/psd-cuello-redondo/kit-photoDesignShirtBodyRaglan.png',import.meta.url));
  for(const front of [true,false]){
    const bounds=[];
    for(const image of [small,large]){const data=image.data.slice();for(let i=0;i<image.width*image.height;i++)if(front?i%image.width>=image.width/2:i%image.width<image.width/2)data[i*4+3]=0;
      bounds.push(patternBounds(data,image.width,image.height,image.width/1080));}
    for(const key of ['x','y','width','height'])assert(Math.abs(bounds[0][key]-bounds[1][key])<=1,key);
  }
});

test('local refit keeps source pixels and generates independent transforms without changing the original',()=>{
  const old={src:'original-pixels',x:.2,y:.1,scale:.7,scaleX:1.3,scaleY:.7,rotation:20,views:{front:{scale:.6},back:{scale:2}}};
  const current=resetPatternPlacement(old);
  assert.equal(current.src,old.src);assert.equal(current.views,undefined);assert.equal(current.scale,1);assert.equal(current.rotation,0);
  assert.equal(old.scale,.7);assert.equal(old.views.back.scale,2);
  const mask={bounds:{width:299},legacyBounds:{width:454}};
  assert.equal(clipPatternBounds(mask,old).width,454);assert.equal(clipPatternBounds(mask,current).width,299);
});

test('generation, clipping and the editor share the same measured mask, for every requested piece',()=>{
  const source=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
  const code=source.slice(source.indexOf('function pieceRectangle('),source.indexOf('function generationLayout('));
  const calls=[];const context=vm.createContext({powerClipMask:(piece,side)=>{calls.push([piece,side]);return {bounds:{x:1,y:2,width:299,height:512}};}});
  vm.runInContext(code,context);for(const p of ['front','back','right','left','short','socks'])assert.equal(vm.runInContext(`pieceRectangle('${p}').width`,context),299);
  assert.deepEqual(calls,[['front','front'],['back','back'],['right','front'],['left','front'],['short','front'],['socks','front']]);
});
