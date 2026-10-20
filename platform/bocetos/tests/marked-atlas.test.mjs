import test from 'node:test';
import assert from 'node:assert/strict';
import {detectMarkedAtlas,warpMarkedTile} from '../public/marked-atlas.js';

function sample(){
 const width=512,height=512,data=new Uint8ClampedArray(width*height*4);
 for(let i=0;i<data.length;i+=4)data.set([0,255,0,255],i);
 // A displaced generated pattern: dark side panels, yellow middle, actual extra fabric outside the cutline.
 for(let y=70;y<430;y++)for(let x=90;x<422;x++)data.set(x<170||x>340?[10,60,30,255]:[240,205,20,255],(y*width+x)*4);
 for(let y=90;y<=410;y++)for(let x=120;x<=390;x++)if(y===90||y===410||x===120||x===390)data.set([255,0,255,255],(y*width+x)*4);
 const visible=Array.from({length:360},(_,y)=>y>=30&&y<330?[30,270]:[]),outer=Array.from({length:360},()=>[0,300]);
 const layout={columns:1,rows:1,tiles:['front'],cutline:'#ff00ff',separator:'#00ff00',rectangles:[{piece:'front',x:106,y:76,width:300,height:360,shape:{visible,outer}}]};
 return {data,width,height,layout};
}
test('observed cutline registers a moved pattern to the mask while keeping both side details inside',()=>{
 const f=sample(),found=detectMarkedAtlas(f.data,f.width,f.height,f.layout);
 assert.equal(found.length,1);assert.equal(found[0].piece,'front');
 const out=warpMarkedTile(f.data,f.width,f.height,f.layout,found[0]);
 const pixel=(x,y)=>[...out.data.slice((y*out.width+x)*4,(y*out.width+x)*4+4)];
 assert.deepEqual(pixel(32,180),[10,60,30,255]);assert.deepEqual(pixel(267,180),[10,60,30,255]);
 assert.deepEqual(pixel(150,180),[240,205,20,255]);
 assert.deepEqual(pixel(15,180),[10,60,30,255],'copy genuinely generated continuation');
 assert.equal(out.missingVisible,0);
 for(let i=0;i<out.data.length;i+=4)assert(!(out.data[i]>180&&out.data[i+2]>180&&out.data[i+1]<80),'registration ink is removed');
});
test('missing or broken registration contours are rejected without silently using a bounding rectangle',()=>{
 const f=sample();for(let y=90;y<160;y++)f.data[(y*f.width+120)*4+1]=255;
 assert.throws(()=>detectMarkedAtlas(f.data,f.width,f.height,f.layout),/contorno/);
});

test('faint antialiased registration ink still closes the contour',()=>{
 const f=sample();for(let i=0;i<f.data.length;i+=4)if(f.data[i]===255&&f.data[i+2]===255&&f.data[i+1]===0)f.data.set([165,75,165,255],i);
 assert.equal(detectMarkedAtlas(f.data,f.width,f.height,f.layout).length,1);
});
