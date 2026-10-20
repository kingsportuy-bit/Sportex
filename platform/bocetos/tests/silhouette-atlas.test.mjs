import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {silhouetteGuide,silhouetteOutputVersion,validSilhouetteLayout} from '../public/silhouette-atlas.js';
import {patternGuidePixels,generationBleed,registrationVersion,silhouetteGuideVersion,normalizedPatternTile,textureBaseGeometry,rectangularOutputVersion,fittedRectangleVersion,visibleGuideLandmarks} from '../public/artwork-registration.js';
import {twoPassVersion} from '../public/two-pass-atlas.js';
import {detectAtlasRectangles,exteriorMask} from '../public/atlas-crop.js';
import {readRgbaPng} from './png-fixture.mjs';
import {patternBounds,sleevePatternFrame} from '../public/pattern-geometry.js';
import {extendedArtworkPrompt} from '../extended-artwork-prompt.mjs';

function fixture(pieces=['front','back','right','left']){
  const cuffs=readRgbaPng(new URL('../public/assets/psd-kit/photoCuffs.png',import.meta.url));
  const columns=pieces.length>1?2:1,layout={columns,rows:Math.ceil(pieces.length/columns),tiles:pieces,rectangles:[],bleed:.2,registration:registrationVersion,guide:silhouetteGuideVersion,outputShape:silhouetteOutputVersion,separator:'#00ff00'};
  const guides=[];
  for(const [i,piece] of pieces.entries()){
    const sleeve=['left','right'].includes(piece),side=piece==='back'?'back':'front';
    const file=sleeve?'photoDesignShirtSleeves':piece==='socks'?'photoSocks':piece==='short'?'photoShort':'photoDesignShirtBody';
    const mask=readRgbaPng(new URL(`../public/assets/psd-kit/${side}-${file}.png`,import.meta.url));
    if(sleeve)for(let p=0;p<mask.width*mask.height;p++)if(piece==='right'?p%mask.width>=268:p%mask.width<268)mask.data[p*4+3]=0;
    const bounds=patternBounds(mask.data,mask.width,mask.height),frame=sleeve?sleevePatternFrame(mask.data,cuffs.data,mask.width,mask.height,bounds):{bounds,angle:0};
    const width=Math.round(frame.bounds.width*.75*1.2),height=Math.round(frame.bounds.height*.75*1.2);
    const rect={piece,x:i%columns*512+Math.round((512-width)/2),y:Math.floor(i/columns)*512+Math.round((512-height)/2),width,height,pattern:frame.bounds};
    const guide=silhouetteGuide(patternGuidePixels(rect,.2,mask,frame.angle),.2,layout.separator);rect.shape=guide.shape;
    guides.push(guide);layout.rectangles.push(rect);
  }
  const width=columns*512,height=layout.rows*512,data=new Uint8ClampedArray(width*height*4);
  for(let i=0;i<data.length;i+=4)data.set([0,255,0,255],i);
  for(let i=0;i<guides.length;i++){
    const g=guides[i],r=layout.rectangles[i];
    for(let y=0;y<r.height;y++)for(let x=0;x<r.width;x++)if(g.data[(y*r.width+x)*4]!==0)data.set([210,80,20,255],((r.y+y)*width+r.x+x)*4);
  }
  return {data,width,height,layout,guides};
}

test('real mask shapes with contour bleed separate without requiring rectangular fill, including disconnected socks',()=>{
  for(const pieces of [['front','back','right','left'],['short','socks']]){
    const f=fixture(pieces);assert(validSilhouetteLayout(f.layout));
    const found=detectAtlasRectangles(f.data,f.width,f.height,f.layout);
    for(let i=0;i<found.length;i++){
      assert.equal(found[i].silhouette,true);assert.equal(found[i].marginReviewRequired,false);
      assert.equal(found[i].x,f.layout.rectangles[i].x);assert.equal(found[i].width,f.layout.rectangles[i].width);
      const g=f.guides[i],r=f.layout.rectangles[i];
      assert.equal(g.data[1],255,'corner outside curved contour stays separator');
      let blue=0,peach=0;for(let p=0;p<g.data.length;p+=4){if(g.data[p]===183)blue++;if(g.data[p]===246)peach++;}
      assert(blue>1000&&peach>1000);
      const tile=normalizedPatternTile(f.layout,r.piece,found[i]),base=textureBaseGeometry({patternGeometry:1,contentWindow:tile.contentWindow},tile,r.pattern);
      assert(Math.abs(base.width/r.pattern.width-1.2)<1e-9,'no extra cover/zoom after clipping');
    }
  }
});

test('missing visible artwork and filled bounding rectangles fail; missing outer continuation is flagged without enlarging it',()=>{
  const f=fixture(['front']),r=f.layout.rectangles[0];
  const rectangle=f.data.slice();
  for(let y=r.y;y<r.y+r.height;y++)for(let x=r.x;x<r.x+r.width;x++)rectangle.set([200,60,20,255],(y*f.width+x)*4);
  assert.throws(()=>detectAtlasRectangles(rectangle,f.width,f.height,f.layout),/silueta/);
  const hole=f.data.slice();
  for(let y=r.y+r.height*.4|0;y<r.y+r.height*.6;y++)for(let x=r.x+r.width*.4|0;x<r.x+r.width*.6;x++)hole[(y*f.width+x)*4+3]=0;
  // Transparent internal missing pixels must count as absent even if isolated.
  assert.throws(()=>detectAtlasRectangles(hole,f.width,f.height,f.layout),/silueta/);
  const noMargin=f.data.slice();
  for(let y=0;y<r.height;y++)for(let x=0;x<r.width;x++)if(f.guides[0].data[(y*r.width+x)*4]===246)noMargin.set([0,255,0,255],((r.y+y)*f.width+r.x+x)*4);
  const crop=detectAtlasRectangles(noMargin,f.width,f.height,f.layout)[0];assert(crop.marginReviewRequired);
  assert.equal(crop.width,r.width);assert(normalizedPatternTile(f.layout,'front',crop).contentWindow.reviewRequired);
});

test('exterior removal preserves enclosed green print details; malformed masks are rejected',()=>{
  const f=fixture(['front']),r=f.layout.rectangles[0],cx=Math.floor(r.x+r.width/2),cy=Math.floor(r.y+r.height/2);
  for(let y=cy;y<cy+10;y++)for(let x=cx;x<cx+10;x++)f.data.set([0,255,0,255],(y*f.width+x)*4);
  const outside=exteriorMask(f.data,f.width,f.height,f.layout.separator);
  assert.equal(outside[0],1);assert.equal(outside[cy*f.width+cx],0);
  const bad=structuredClone(f.layout);bad.rectangles[0].shape.outer[0]=[-1,999];assert(!validSilhouetteLayout(bad));
  delete bad.rectangles[0].shape;assert(!validSilhouetteLayout(bad));
  const badRow=structuredClone(f.layout);badRow.rectangles[0].shape.visible[0]=null;assert(!validSilhouetteLayout(badRow));
});

test('browser input protects the separator and cropping removes it without shifting the registered source',()=>{
  const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8'),f=fixture(['front']),r=f.layout.rectangles[0];
  const canvases=[];
  const document={createElement:()=>{
    const node={width:0,height:0,clears:[],fills:[],toDataURL(){return this;}};
    const c={clearRect(...args){node.clears.push(args);},fillRect(...args){node.fills.push([this.fillStyle,...args]);},
      createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(pixels){node.pixels=pixels;},
      drawImage(source,...args){node.drawn={source,args};node.pixels=source.pixels||{data:source.data};},getImageData(){return {data:node.pixels.data.slice()};}};
    node.getContext=()=>c;canvases.push(node);return node;
  }};
  const mask=readRgbaPng(new URL('../public/assets/psd-kit/front-photoDesignShirtBody.png',import.meta.url));
  const ctx=vm.createContext({document,silhouetteGuide,silhouetteOutputVersion,silhouetteGuideVersion,registrationVersion,patternGuidePixels,rectangularOutputVersion,fittedRectangleVersion,visibleGuideLandmarks,twoPassVersion,
    powerClipMask:()=>({...mask,node:mask}),outputScale:1,exteriorMask});
  vm.runInContext(app.slice(app.indexOf('function rectangularDesignInput('),app.indexOf('async function clipDesignToPart(')),ctx);
  const input=ctx.rectangularDesignInput(f.width,f.height,f.layout);
  assert.equal(input.mask.fills[0][0],'#000');
  const expected=r.shape.outer.flatMap((row,y)=>row.flatMap((left,i)=>i%2===0?[[r.x+left,r.y+y,row[i+1]-left,1]]:[]));
  assert.deepEqual(JSON.parse(JSON.stringify(input.mask.clears.slice(1))),expected,'only contour plus continuation is editable');
  assert.deepEqual([...input.image.drawn.source.pixels.data.slice(0,4)],[0,255,0,255]);
  vm.runInContext(app.slice(app.indexOf('const silhouetteSources='),app.indexOf('function atlasRectangles(')),ctx);
  const source=ctx.transparentSilhouetteSource(f,f.layout),middle=(Math.floor(r.y+r.height/2)*f.width+Math.floor(r.x+r.width/2))*4;
  assert.equal(source.width,f.width);assert.equal(source.height,f.height);
  assert.equal(source.pixels.data[3],0);assert.equal(source.pixels.data[middle+3],255);
  assert.equal(source.pixels.data[middle],f.data[middle]);
  assert.equal(ctx.transparentSilhouetteSource(f,f.layout),source,'source cleanup is cached without changing geometry');
});

test('silhouette request remains one image call, excludes rectangular instructions and validates shape before calling',async()=>{
  const f=fixture(['front']),server=fs.readFileSync(new URL('../server.mjs',import.meta.url),'utf8');
  const body={mock:'data:image/png;base64,eA==',reference:'data:image/png;base64,eA==',mask:'data:image/png;base64,eA==',width:512,height:512,parts:['shirt'],layout:f.layout};
  let calls=0,result;
  const context=vm.createContext({process:{env:{OPENAI_API_KEY:'test'}},upstreamPort:0,generating:false,generationBleed,registrationVersion,silhouetteGuideVersion,silhouetteOutputVersion,rectangularOutputVersion,fittedRectangleVersion,twoPassVersion,validSilhouetteLayout,extendedArtworkPrompt,registrationInstructions:()=>'',AbortSignal,
    readJson:async()=>body,isImage:()=>true,json:(_res,status,value)=>{result={status,value};},
    fetch:async(_url,options)=>{calls++;const request=JSON.parse(options.body);assert.equal(request.n,1);assert(request.prompt.includes('EXACT SHAPE OF THE SUPPLIED MASKS'));assert(!request.prompt.includes('Keep each specified rectangle solid'));assert(!request.prompt.includes('complete straight-edged'));assert(request.prompt.includes('10%'));return{ok:true,json:async()=>({data:[{b64_json:'eA=='}]})};}});
  vm.runInContext(server.slice(server.indexOf('async function generate('),server.indexOf('async function proxyGenerator(')),context);
  await vm.runInContext('generate({},{})',context);assert.equal(result.status,200);assert.equal(calls,1);
  delete body.layout.rectangles[0].shape;await vm.runInContext('generate({},{})',context);assert.equal(result.status,400);assert.equal(calls,1);
});
