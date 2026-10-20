import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {patternBounds} from '../public/pattern-geometry.js';
const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const section=(a,b)=>app.slice(app.indexOf(a),app.indexOf(b));

test('raglan and cuff toggles keep exactly the same front/back mask and frame, while sleeves switch independently',()=>{
  const width=32,height=40,controls={'raglan-enabled':{checked:false},'cuffs-enabled':{checked:true}},drawn=[];
  const assets=Object.fromEntries(['Body','BodyRaglan','Sleeves','SleevesRaglan'].map(name=>['photoDesignShirt'+name,{name}]));
  assets.photoCuffs={name:'Cuffs'};
  const context=vm.createContext({W:width,H:height,outputScale:1,exportAssets:null,state:{assets},powerClipMasks:new Map(),$:id=>controls[id],flatMaskName:()=>'',patternBounds,
    maskBounds:()=>({x:0,y:0,width:width/2,height}),maskPixels:()=>new Uint8ClampedArray(width*height*4),sleevePatternFrame:(_d,_c,_w,_h,bounds)=>({angle:0,bounds}),
    makeCanvas:()=>{const data=new Uint8ClampedArray(width*height*4);return {width,height,getContext:()=>({
      drawImage:image=>{drawn.push(image.name);for(let p=3;p<data.length;p+=4)data[p]=255;},
      clearRect:(x,y,w,h)=>{for(let yy=y;yy<Math.min(height,y+h);yy++)for(let xx=x;xx<Math.min(width,x+w);xx++)data[(yy*width+xx)*4+3]=0;},
      getImageData:()=>({data})})};}
  });
  vm.runInContext(section('function powerClipMask(','// Rear sleeves'),context);
  const front=context.powerClipMask('front','front'),back=context.powerClipMask('back','back'),sleeve=context.powerClipMask('right','front');
  controls['raglan-enabled'].checked=true;
  assert.equal(context.powerClipMask('front','front'),front);assert.equal(context.powerClipMask('back','back'),back);
  const raglanSleeve=context.powerClipMask('right','front');assert.notEqual(raglanSleeve,sleeve);
  controls['cuffs-enabled'].checked=false;
  assert.equal(context.powerClipMask('front','front'),front);assert.equal(context.powerClipMask('back','back'),back);
  assert.equal(context.powerClipMask('right','front'),raglanSleeve,'cuffs overlay the same full sleeve mask without changing texture registration');
  assert(!drawn.includes('BodyRaglan'));assert(drawn.includes('SleevesRaglan'));
});

test('garment paints the same body in both modes and always composites sleeves above it',()=>{
  const controls={'raglan-enabled':{checked:false},'apply-sleeves':{checked:true},'cuffs-enabled':{checked:true}},calls=[];
  const context=vm.createContext({W:10,H:20,exportAssets:null,state:{designVariants:[],activeVariant:-1,generatedParts:{shirt:'fixed-body',shirtRaglan:'old-raglan-body',shirtSleeves:'sleeves',shirtSleevesRaglan:'raglan-sleeves'},assets:{}},$:id=>controls[id]||{value:'#112233'},drawPhotoshopParts:()=>calls.push('base'),tintedMask:name=>name,drawGarmentTrims:()=>calls.push('trims'),drawPowerClips:(_c,_parts,stage)=>calls.push('clips:'+stage)});
  vm.runInContext(section('function drawPhotoshopGarment(','const garmentSurface'),context);
  const c={drawImage:image=>calls.push(image)};
  for(const raglan of [false,true]){
    controls['raglan-enabled'].checked=raglan;calls.length=0;context.drawPhotoshopGarment(c,['shirt'],true);
    assert(calls.includes('fixed-body'));assert(!calls.includes('old-raglan-body'));
    assert(calls.indexOf('photoSleeveLeft')>calls.indexOf('clips:body'));
    assert(calls.indexOf('clips:sleeves')>calls.indexOf('fixed-body'));
    assert(calls.includes(raglan?'raglan-sleeves':'sleeves'));
    assert(calls.indexOf('trims')>calls.indexOf('clips:sleeves'));assert(calls.indexOf('trims')<calls.indexOf('photoCuffs'));
  }
  vm.runInContext(section('function resolvedMask(','function maskPixels('),context);
  assert.equal(context.resolvedMask('photoBody'),'photoBody');assert.equal(context.resolvedMask('photoSleeveLeft'),'photoSleeveLeftRaglan');
});

test('raglan lighting changes only the sleeve overlay, preserving every body color outside it',()=>{
  const controls={'raglan-enabled':{checked:false},'shadows-opacity':{value:'100'},'highlights-opacity':{value:'0'},'shadows-blend':{value:'normal'},'highlights-blend':{value:'normal'}};
  const normal=new Uint8ClampedArray([20,30,40,255,50,60,70,255]),raglan=new Uint8ClampedArray([200,210,220,255,230,240,250,255]),sleeve=new Uint8ClampedArray([0,0,0,255,0,0,0,0]);
  const context=vm.createContext({W:2,H:1,outputScale:1,$:id=>controls[id],maskPixels:name=>name==='photoDesignShirtSleevesRaglan'?sleeve:name.includes('Raglan')?raglan:normal,photoCoverage:()=>({left:0,top:0,right:2,bottom:1,alpha:[255,255]}),blendChannel:(_base,layer)=>layer});
  vm.runInContext(section('function applyPhotoshopLights(','// Each print stays separate'),context);
  const render=()=>{let result;context.applyPhotoshopLights({getImageData:()=>({data:new Uint8ClampedArray([100,100,100,255,100,100,100,255])}),putImageData:image=>result=image.data},['shirt']);return result;};
  const before=render();controls['raglan-enabled'].checked=true;const after=render();
  assert.deepEqual(before.slice(4),after.slice(4));assert.notDeepEqual(before.slice(0,4),after.slice(0,4));
});
