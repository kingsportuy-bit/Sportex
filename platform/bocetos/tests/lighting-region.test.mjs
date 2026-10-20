import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {performance} from 'node:perf_hooks';
const source=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');

test('regional lighting matches full rendering pixel for pixel and reduces the processed area',()=>{
  const W=1080,H=1920,total=W*H,base=new Uint8ClampedArray(total*4),mask=new Uint8ClampedArray(total*4),alpha=new Uint8Array(total).fill(255);
  for(let p=0;p<total;p++){base.set([p%255,130,80,255],p*4);mask.set([45,70,105,120],p*4);}
  const regions=[],context=vm.createContext({W,H,outputScale:1,$:id=>({checked:false,value:id.endsWith('opacity')?'80':id.startsWith('shadows')?'linear-burn':'screen'}),maskPixels:()=>mask,photoCoverage:()=>({alpha,left:0,top:0,right:W,bottom:H})});
  vm.runInContext(source.slice(source.indexOf('function blendChannel('),source.indexOf('function photoCoverage(')),context);
  vm.runInContext(source.slice(source.indexOf('function applyPhotoshopLights('),source.indexOf('// Each print stays')),context);
  const surface=data=>({getImageData(x,y,width,height){regions.push(width*height);const result=new Uint8ClampedArray(width*height*4);for(let row=0;row<height;row++)result.set(data.subarray(((y+row)*W+x)*4,((y+row)*W+x+width)*4),row*width*4);return {data:result,width,height};},putImageData(image,x,y){for(let row=0;row<image.height;row++)data.set(image.data.subarray(row*image.width*4,(row+1)*image.width*4),((row+y)*W+x)*4);}});
  const full=base.slice(),partial=base.slice(),r={x:40,y:310,width:180,height:210};context.r=r;
  context.c=surface(full);let t=performance.now();vm.runInContext("applyPhotoshopLights(c,['shirt'])",context);const fullMs=performance.now()-t;
  context.c=surface(partial);t=performance.now();vm.runInContext("applyPhotoshopLights(c,['shirt'],r)",context);const partialMs=performance.now()-t;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const inside=x>=r.x&&x<r.x+r.width&&y>=r.y&&y<r.y+r.height,i=(y*W+x)*4;
    for(let c=0;c<4;c++)if(partial[i+c]!== (inside?full:base)[i+c])assert.fail(`different pixel ${x},${y}`);
  }
  assert.equal(regions[0],2073600);assert.equal(regions[1],37800);
  console.log(`Lighting CPU sample (Node): full ${fullMs.toFixed(1)} ms; sleeve region ${partialMs.toFixed(1)} ms; pixels ${regions.join(' -> ')}`);
});
