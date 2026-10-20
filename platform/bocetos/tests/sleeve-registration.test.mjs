import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {silhouetteOutputVersion} from '../public/silhouette-atlas.js';
import {readRgbaPng} from './png-fixture.mjs';
import {patternBounds,sleevePatternFrame} from '../public/pattern-geometry.js';
import {stripePeriod,sharedStripeScale} from '../public/stripe-scale.js';
import {generationBleed,registrationVersion,registrationInstructions,silhouetteGuideVersion,rectangularOutputVersion,fittedRectangleVersion} from '../public/artwork-registration.js';
import {twoPassVersion} from '../public/two-pass-atlas.js';
import {detectAtlasRectangles} from '../public/atlas-crop.js';
import {compactAtlas} from '../public/atlas-layout.js';
const source=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');

test('real PSD sleeve frames align to each cuff and include the entire rotated piece',()=>{
  const cuffs=readRgbaPng(new URL('../public/assets/psd-kit/photoCuffs.png',import.meta.url));
  const angles=[];
  for(const side of ['front','back'])for(const raglan of ['', 'Raglan']){
    const png=readRgbaPng(new URL(`../public/assets/psd-kit/${side}-photoDesignShirtSleeves${raglan}.png`,import.meta.url));
    for(const screenLeft of [true,false]){
      const data=png.data.slice(),split=side==='front'?268:800;
      for(let i=0;i<png.width*png.height;i++)if(screenLeft?i%png.width>=split:i%png.width<split)data[i*4+3]=0;
      const bounds=patternBounds(data,png.width,png.height),frame=sleevePatternFrame(data,cuffs.data,png.width,png.height,bounds);
      angles.push({side,raglan:!!raglan,screenLeft,angle:Number(frame.angle.toFixed(2))});
      assert(Math.abs(frame.angle)>1&&Math.abs(frame.angle)<20,JSON.stringify(angles.at(-1)));
      assert.equal(Math.sign(frame.angle),screenLeft?1:-1);
      const a=frame.angle*Math.PI/180,b=frame.bounds,cx=b.x+b.width/2,cy=b.y+b.height/2;
      for(let y=bounds.y;y<bounds.y+bounds.height;y++)for(let x=bounds.x;x<bounds.x+bounds.width;x++)if(data[(y*png.width+x)*4+3]>=128){
        const u=(x-cx)*Math.cos(a)+(y-cy)*Math.sin(a),v=-(x-cx)*Math.sin(a)+(y-cy)*Math.cos(a);
        assert(Math.abs(u)<=b.width/2+1.5&&Math.abs(v)<=b.height/2+1.5,'rotated pattern lost a mask pixel');
      }
    }
  }
  console.log('Measured cuff angles',JSON.stringify(angles));
});

function stripes(width,height,period,colors=[[120,30,40],[75,20,30]]){
  const data=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)data.set([...colors[Math.floor(x/(period/2))%2],255],(y*width+x)*4);
  return {data,width,height};
}
test('matching stripe repeat keeps physical width on a smaller sleeve without altering a unique or differently colored motif',()=>{
  const body=stripePeriod(stripes(400,200,40)),sleeve=stripePeriod(stripes(240,200,40));
  assert(body&&sleeve);assert.equal(body.pixels,40);assert.equal(sleeve.pixels,40);
  assert.equal(sharedStripeScale(body,sleeve,1,2.5),2.5);
  assert.equal(sharedStripeScale(body,sleeve,1,1),1);
  assert.equal(sharedStripeScale(body,stripePeriod(stripes(240,200,40,[[255,200,0],[0,0,0]])),1,2.5),1);
  const gradient=stripes(400,100,40);for(let i=0;i<gradient.data.length;i+=4)gradient.data[i]=gradient.data[i+1]=gradient.data[i+2]=(i/4%400)/2;
  assert.equal(stripePeriod(gradient),null);assert.equal(sharedStripeScale(body,null,1,2.5),1);
});

test('one guide uses common physical scale, smaller sleeve crops still separate cleanly',()=>{
  const patterns={front:{x:100,y:250,width:300,height:500},back:{x:600,y:250,width:300,height:500},left:{x:20,y:320,width:85,height:150},right:{x:450,y:320,width:85,height:150}};
  const c=vm.createContext({compactAtlas,generationBleed,registrationVersion,silhouetteGuideVersion,silhouetteOutputVersion,rectangularOutputVersion,fittedRectangleVersion,twoPassVersion,pieceRectangle:p=>patterns[p],powerClipMask:p=>({frame:{angle:6,bounds:patterns[p]}})});
  vm.runInContext(source.slice(source.indexOf('function generationLayout('),source.indexOf('const stripeProfileCache')),c);
  const layout=vm.runInContext("generationLayout(['front','back','left','right'])",c);layout.separator='#00ff00';
  const pixels=new Uint8ClampedArray(1024*1024*4);for(let i=0;i<pixels.length;i+=4)pixels.set([0,255,0,255],i);
  for(const r of layout.rectangles){
    const expected=r.pattern.width/r.pattern.height;assert(Math.abs(r.width-r.height*expected)<1.5);
    assert(Math.abs(r.width/r.pattern.width-layout.pixelsPerUnit)<.01);
    for(let y=r.y;y<r.y+r.height;y++)for(let x=r.x;x<r.x+r.width;x++)pixels.set([100,20,30,255],(y*1024+x)*4);
  }
  assert(layout.rectangles[2].height<layout.rectangles[0].height/2);
  const rectangles=detectAtlasRectangles(pixels,1024,1024,{...layout,outputShape:undefined});assert.equal(rectangles.length,4);
  assert(registrationInstructions(layout).includes('FEWER repeats'));
});
