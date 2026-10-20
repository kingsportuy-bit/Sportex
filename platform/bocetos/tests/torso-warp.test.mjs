import test from 'node:test';
import assert from 'node:assert/strict';
import {torsoEnvelope,warpTorsoPixels} from '../public/torso-warp.js';
import {patternBounds} from '../public/pattern-geometry.js';
import {readRgbaPng} from './png-fixture.mjs';

function artwork(width=100,height=100){
  const data=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)data.set([Math.round(x/(width-1)*255),Math.round(y/(height-1)*255),0,255],(y*width+x)*4);
  return {data,width,height};
}
const identity=(width,height)=>({boundsWidth:width,boundsHeight:height,width,height});
test('central print coordinates stay fixed despite tapered, asymmetric and noisy sides',()=>{
  const width=200,height=240,mask=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++){
    const inset=Math.round(18+10*Math.sin(y/239*Math.PI))+(y%2);
    for(let x=inset;x<width-inset-8;x++)mask[(y*width+x)*4+3]=255;
  }
  const map=torsoEnvelope(mask,width,height,{x:0,y:0,width,height});
  for(let y=0;y<height;y++)for(const x of [60,80,100,120,140]){
    assert(Math.abs(map.u[y*width+x]-x/(width-1))<1e-7,`central vertical stripe moved at ${x},${y}`);
    assert(Math.abs(map.v[y*width+x]-y/(height-1))<1e-7);
  }
  const side=[];for(let y=80;y<160;y++)side.push(map.u[y*width+40]);
  assert(Math.max(...side.slice(1).map((v,i)=>Math.abs(v-side[i])))<.003,'one-pixel mask steps must not become jagged artwork');
});
test('partial shoulder and curved hem rows clip the print without collapsing its horizontal coordinates',()=>{
  const width=100,height=100,mask=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(y<5?x>=40&&x<=60:y>94?x>=35&&x<=65:true)mask[(y*width+x)*4+3]=255;
  const map=torsoEnvelope(mask,width,height,{x:0,y:0,width,height});
  for(const y of [0,3,96,99])for(const x of [42,50,59])assert(Math.abs(map.u[y*width+x]-x/99)<1e-7);
});
test('shoulder and hem keep the neighboring side registration instead of flaring back to the rectangle',()=>{
  const width=160,height=200,mask=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++){
    const inset=y<8||y>192?42:14;
    for(let x=inset;x<width-inset;x++)mask[(y*width+x)*4+3]=255;
  }
  const map=torsoEnvelope(mask,width,height,{x:0,y:0,width,height});
  for(const p of map.indices){
    const x=p%map.width,y=Math.floor(p/map.width),v=y/(map.height-1);
    if(v<=.1||v>=.96)assert(Math.abs(map.u[p]-map.u[100*map.width+x])<1e-7,`cap loses the side registration at ${x},${y}`);
  }
  assert(map.u[100*map.width+20]<20/159,'waist still deforms at its side');
});
test('real PSD shoulders and lower hems keep each visible column stable across edge rows',()=>{
  let checked=0;
  for(const name of ['front-photoDesignShirtBody','back-photoDesignShirtBody','front-photoShort','back-photoShort']){
    const mask=readRgbaPng(new URL(`../public/assets/psd-kit/${name}.png`,import.meta.url)),b=patternBounds(mask.data,mask.width,mask.height);
    const map=torsoEnvelope(mask.data,mask.width,mask.height,b);
    for(const p of map.indices){
      const x=p%map.width,y=Math.floor(p/map.width),v=y/(map.height-1);
      if(v<=.1||v>=.96){
        const anchorY=v<=.1?Math.floor((map.height-1)*.05):Math.ceil((map.height-1)*.98);
        if(mask.data[((map.y+anchorY)*mask.width+map.x+x)*4+3]){checked++;assert(Math.abs(map.u[p]-map.u[anchorY*map.width+x])<1e-7,`${name} at ${x},${y}`);}
      }
    }
  }
  assert(checked>20000);
});
test('antialiased-only edge rows receive artwork rather than exposing the base garment color',()=>{
  const width=30,height=30,mask=new Uint8ClampedArray(width*height*4).fill(255);
  for(let x=0;x<width;x++)mask[x*4+3]=40;
  const map=torsoEnvelope(mask,width,height,{x:0,y:0,width,height}),out=warpTorsoPixels(artwork(),map,identity(width,height));
  assert.equal(map.indices.length,width*height);assert.equal(out.data[3],255);assert.equal(out.data[1],0);
});
test('side envelope keeps both edges visible at the waist while horizontal rows remain level',()=>{
  const width=100,height=100,mask=new Uint8ClampedArray(width*height*4),source=artwork();
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const inset=Math.round(20*Math.sin(y/99*Math.PI)),neckline=10+Math.round(8*Math.sin(x/99*Math.PI));
    if(x>=inset&&x<width-inset&&y>=neckline&&y<height-3)mask[(y*width+x)*4+3]=255;
  }
  const before=source.data.slice(),envelope=torsoEnvelope(mask,width,height,{x:0,y:0,width,height}),out=warpTorsoPixels(source,envelope,identity(width,height));
  const color=(x,y)=>[...out.data.subarray((y*width+x)*4,(y*width+x)*4+4)];
  assert.equal(color(20,50)[0],0,'leftmost source is visible at the narrow waist');
  assert.equal(color(79,50)[0],255,'rightmost source is visible at the narrow waist');
  assert.equal(color(50,18)[1],Math.round(18/99*255),'neckline clips the row without bending it');
  assert.equal(color(50,96)[1],Math.round(96/99*255),'hem does not remap the vertical position');
  for(const y of [25,50,75]){
    const row=[];for(let x=0;x<width;x++)if(color(x,y)[3])row.push(color(x,y)[1]);
    assert.equal(new Set(row).size,1,'a horizontal stripe keeps the same height across the silhouette');
  }
  assert.equal(color(10,50)[3],0,'no artwork leaks beyond the target mask');
  assert.deepEqual(source.data,before,'the generated rectangle remains untouched');
});
test('editing translation, anisotropic dimensions and rotation still act on the rectangle before deformation',()=>{
  const source=artwork(),mask=new Uint8ClampedArray(100*100*4).fill(255),map=torsoEnvelope(mask,100,100,{x:0,y:0,width:100,height:100});
  const rotated=warpTorsoPixels(source,map,{...identity(100,100),rotation:180});
  assert.deepEqual([...rotated.data.slice(0,4)],[255,255,0,255]);
  const moved=warpTorsoPixels(source,map,{...identity(100,100),x:100},[10,20,30]);
  assert.deepEqual([...moved.data.slice(0,4)],[10,20,30,255]);
  const wide=warpTorsoPixels(source,map,{...identity(100,100),width:200});
  assert(wide.data[0]>60&&wide.data[0]<70);assert.equal(wide.data[1],0);
});
test('real shorts preserve lateral edges and horizontal heights without filling the crotch gap',()=>{
  const source=artwork(31,41);let gaps=0,rows=0;
  for(const side of ['front','back']){
    const mask=readRgbaPng(new URL(`../public/assets/psd-kit/${side}-photoShort.png`,import.meta.url)),b=patternBounds(mask.data,mask.width,mask.height);
    const map=torsoEnvelope(mask.data,mask.width,mask.height,b),out=warpTorsoPixels(source,map,identity(b.width,b.height));
    for(let y=0;y<map.height;y++){
      const row=[];for(let x=0;x<map.width;x++)if(mask.data[((map.y+y)*mask.width+map.x+x)*4+3]>=128)row.push(x);
      if(row.length<8)continue;rows++;
      if(y>=map.height*.35&&y<map.height*.78&&row[0]<map.width*.2&&row.at(-1)>map.width*.8){
        assert(out.data[(y*map.width+row[0])*4]<=2);assert(out.data[(y*map.width+row.at(-1))*4]>=253);
      }
      for(const x of row)if(x>=(map.width-1)*.25&&x<=(map.width-1)*.75)assert(Math.abs(map.u[y*map.width+x]-x/(map.width-1))<1e-7);
      for(const x of row)assert(Math.abs(out.data[(y*map.width+x)*4+1]-Math.round(y/(map.height-1)*255))<=1);
      for(let x=row[0];x<=row.at(-1);x++)if(!mask.data[((map.y+y)*mask.width+map.x+x)*4+3]){
        gaps++;assert.equal(out.data[(y*map.width+x)*4+3],0);
      }
    }
  }
  assert(rows>400);assert(gaps>100,'both perneras remain separated');
});
test('real PSD masks preserve side edges and never bend source rows around neckline or hem',()=>{
  const source=artwork(31,41);let points=0;
  for(const side of ['front','back'])for(const raglan of ['', 'Raglan']){
    const mask=readRgbaPng(new URL(`../public/assets/psd-kit/${side}-photoDesignShirtBody${raglan}.png`,import.meta.url)),b=patternBounds(mask.data,mask.width,mask.height);
    const map=torsoEnvelope(mask.data,mask.width,mask.height,b),out=warpTorsoPixels(source,map,identity(b.width,b.height));
    for(let y=0;y<map.height;y++){
      const row=[];for(let x=0;x<map.width;x++)if(mask.data[((map.y+y)*mask.width+map.x+x)*4+3]>=128)row.push(x);
      if(row.length<8)continue;points+=2;
      // Top/bottom silhouette fragments clip their original coordinates. Only
      // the actual side seams map the outer swatch edges into the garment.
      if(y>=map.height*.35&&y<map.height*.78&&row[0]<map.width*.2&&row.at(-1)>map.width*.8){
        assert(out.data[(y*map.width+row[0])*4]<=2,`${side}${raglan} left row ${y}`);
        assert(out.data[(y*map.width+row.at(-1))*4]>=253,`${side}${raglan} right row ${y}`);
      }
      for(const x of row)if(x>=(map.width-1)*.25&&x<=(map.width-1)*.75)assert(Math.abs(map.u[y*map.width+x]-x/(map.width-1))<1e-7);
    }
    for(let x=0;x<map.width;x++){
      const column=[];for(let y=0;y<map.height;y++)if(mask.data[((map.y+y)*mask.width+map.x+x)*4+3]>=128)column.push(y);
      if(column.length<8)continue;points+=2;
      for(const y of [column[0],column.at(-1)]){
        assert(Math.abs(map.v[y*map.width+x]-y/(map.height-1))<1e-7);
        assert(Math.abs(out.data[(y*map.width+x)*4+1]-Math.round(y/(map.height-1)*255))<=1,'only source quantization, never vertical bending');
      }
    }
  }
  assert(points>5000);
});
