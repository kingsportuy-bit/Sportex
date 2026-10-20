import test from 'node:test';
import assert from 'node:assert/strict';
import {readRgbaPng} from './png-fixture.mjs';
import {patternGuidePixels,registrationWindow,normalizedPatternTile,textureBaseGeometry} from '../public/artwork-registration.js';
import {patternBounds,sleevePatternFrame} from '../public/pattern-geometry.js';
const blue=(pixels,x,y)=>pixels.data[(y*pixels.width+x)*4]===183;

test('hidden curved sides are continuation even inside the inner bounding rectangle; ten percent extra stays outside it',()=>{
  const mask={width:100,height:100,data:new Uint8ClampedArray(40000)};
  // Tapered body, narrower at the waist than the shoulders; neckline is empty.
  for(let y=10;y<90;y++)for(let x=20;x<80;x++)if((y<35||x>=30&&x<70)&&!(y<20&&x>=40&&x<60))mask.data[(y*100+x)*4+3]=255;
  const rect={piece:'front',width:72,height:96,pattern:{x:20,y:10,width:60,height:80}};
  const guide=patternGuidePixels(rect,.2,mask),inner=registrationWindow({x:0,y:0,...rect},.2);
  assert.equal(inner.x,6);assert.equal(inner.y,8);assert.equal(inner.width,60);assert.equal(inner.height,80);
  assert(blue(guide,36,50));assert(!blue(guide,7,50),'hidden waist side must not be called visible');
  assert(blue(guide,7,25),'visible shoulder width belongs inside the blue shape');assert(!blue(guide,36,10),'neck void needs continuation, not a collar');
  for(let y=0;y<guide.height;y++)for(let x=0;x<guide.width;x++)if(x<6||x>=66||y<8||y>=88)assert(!blue(guide,x,y),'outer bleed cannot contain visible reference artwork');
});

test('guide from real PSD torso masks maps each blue pixel back inside the same rendered garment',()=>{
  for(const side of ['front','back'])for(const raglan of ['', 'Raglan']){
    const mask=readRgbaPng(new URL(`../public/assets/psd-kit/${side}-photoDesignShirtBody${raglan}.png`,import.meta.url));
    const p=patternBounds(mask.data,mask.width,mask.height),rect={piece:side,x:16,y:16,width:Math.round(p.width*.8*1.2),height:Math.round(p.height*.8*1.2),pattern:p};
    const guide=patternGuidePixels(rect,.2,mask),layout={rectangles:[rect],bleed:.2};
    const tile=normalizedPatternTile(layout,side,rect),geometry=textureBaseGeometry({patternGeometry:1,contentWindow:tile.contentWindow},tile,p);
    let visible=0,hiddenWithinBox=0;
    const inner=registrationWindow({x:0,y:0,width:rect.width,height:rect.height},.2);
    for(let y=0;y<guide.height;y++)for(let x=0;x<guide.width;x++){
      if(blue(guide,x,y)){
        visible++;
        const mx=Math.floor(p.x+p.width/2+geometry.offsetX+((x+.5)/guide.width-.5)*geometry.width);
        const my=Math.floor(p.y+p.height/2+geometry.offsetY+((y+.5)/guide.height-.5)*geometry.height);
        assert(mask.data[(my*mask.width+mx)*4+3]>=128,`${side} ${raglan}: guide and rendered mask disagree`);
      }else if(x>inner.x&&x<inner.x+inner.width&&y>inner.y&&y<inner.y+inner.height)hiddenWithinBox++;
    }
    assert(visible>30000);assert(hiddenWithinBox>500,'a rectangle must not replace the actual curved pattern');
  }
});

test('real sleeve guide unrotates the printable mask while leaving the generated bleed around it',()=>{
  const cuffs=readRgbaPng(new URL('../public/assets/psd-kit/photoCuffs.png',import.meta.url));
  for(const side of ['front','back'])for(const screenLeft of [true,false]){
    const mask=readRgbaPng(new URL(`../public/assets/psd-kit/${side}-photoDesignShirtSleeves.png`,import.meta.url));
    const split=side==='front'?268:800;
    for(let i=0;i<mask.width*mask.height;i++)if(screenLeft?i%mask.width>=split:i%mask.width<split)mask.data[i*4+3]=0;
    const bounds=patternBounds(mask.data,mask.width,mask.height),frame=sleevePatternFrame(mask.data,cuffs.data,mask.width,mask.height,bounds);
    const rect={width:Math.round(frame.bounds.width*1.2),height:Math.round(frame.bounds.height*1.2),pattern:frame.bounds};
    const guide=patternGuidePixels(rect,.2,mask,frame.angle),a=frame.angle*Math.PI/180;
    let matches=0;
    for(let y=0;y<guide.height;y++)for(let x=0;x<guide.width;x++)if(blue(guide,x,y)){
      const u=((x+.5)/guide.width-.5)*frame.bounds.width*1.2,v=((y+.5)/guide.height-.5)*frame.bounds.height*1.2;
      const mx=Math.floor(frame.bounds.x+frame.bounds.width/2+u*Math.cos(a)-v*Math.sin(a)),my=Math.floor(frame.bounds.y+frame.bounds.height/2+u*Math.sin(a)+v*Math.cos(a));
      assert(mask.data[(my*mask.width+mx)*4+3]>=128);matches++;
    }
    assert(matches>4000);
  }
});
