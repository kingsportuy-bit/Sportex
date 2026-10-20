import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {fittedRectangleVersion,rectangularOutputVersion,registrationVersion,silhouetteGuideVersion,generationBleed,normalizedPatternTile,textureBaseGeometry} from '../public/artwork-registration.js';
import {patternGeometryVersion} from '../public/pattern-geometry.js';
import {extendedArtworkPrompt} from '../extended-artwork-prompt.mjs';
import {silhouetteOutputVersion,validSilhouetteLayout} from '../public/silhouette-atlas.js';
import {twoPassVersion} from '../public/two-pass-atlas.js';
import {compactAtlas,validCompactAtlas} from '../public/atlas-layout.js';
const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const patterns={front:{x:100,y:250,width:300,height:500},back:{x:600,y:250,width:310,height:510},right:{x:20,y:320,width:85,height:150},left:{x:450,y:320,width:90,height:145},short:{x:100,y:800,width:350,height:260}};
function layout(tiles=['front','back','right','left']){
  const context=vm.createContext({compactAtlas,fittedRectangleVersion,registrationVersion,pieceRectangle:p=>patterns[p],powerClipMask:p=>({frame:{angle:6,bounds:patterns[p]}})});
  vm.runInContext(app.slice(app.indexOf('function generationLayout('),app.indexOf('const stripeProfileCache')),context);
  return {...context.generationLayout(tiles),separator:'#00ff00'};
}
test('full detected rectangles fit the measured pattern on both axes without overscan or hidden margins',()=>{
  const sheet=layout();assert.equal(sheet.bleed,0);assert.equal(sheet.guide,undefined);assert.equal(sheet.pipeline,undefined);
  for(const rect of sheet.rectangles){
    assert(Math.abs(rect.width-rect.pattern.width*sheet.pixelsPerUnit)<.51);
    assert(Math.abs(rect.height-rect.pattern.height*sheet.pixelsPerUnit)<.51);
    const tile=normalizedPatternTile(sheet,rect.piece,{x:rect.x+5,y:rect.y-3,width:rect.width*.95,height:rect.height*1.03});
    assert.deepEqual(tile.contentWindow,{x:0,y:0,width:1,height:1});
    const geometry=textureBaseGeometry({...tile,patternGeometry:patternGeometryVersion},tile,rect.pattern);
    assert.equal(geometry.width,rect.pattern.width);assert.equal(geometry.height,rect.pattern.height);assert.equal(geometry.offsetX,0);assert.equal(geometry.offsetY,0);
  }
});
test('compact atlas spends most pixels on artwork without enlarging the sheet or shrinking sleeves independently',()=>{
  const sheet=layout(),width=sheet.columns*512,height=sheet.rows*512;
  assert.equal(width,1024);assert.equal(height,1024);
  const area=sheet.rectangles.reduce((sum,r)=>sum+r.width*r.height,0);
  assert(area/(width*height)>.60,`artwork covers only ${(area/(width*height)*100).toFixed(1)}%`);
  for(const r of sheet.rectangles){
    assert(r.x>=16&&r.y>=16&&r.x+r.width<=width-16&&r.y+r.height<=height-16);
    assert(Math.abs(r.width-r.pattern.width*sheet.pixelsPerUnit)<.51);
    assert(Math.abs(r.height-r.pattern.height*sheet.pixelsPerUnit)<.51);
  }
  for(let i=0;i<sheet.rectangles.length;i++)for(let j=i+1;j<sheet.rectangles.length;j++){
    const a=sheet.rectangles[i],b=sheet.rectangles[j];
    assert(a.x+a.width+16<=b.x||b.x+b.width+16<=a.x||a.y+a.height+16<=b.y||b.y+b.height+16<=a.y);
  }
});
test('compact four/five-piece atlases use one OpenAI call each at the existing image size and allow sleeve cuffs',async()=>{
  const image='data:image/png;base64,eA==',body={mock:image,reference:image,mask:image,width:1024,height:1024,parts:['shirt'],layout:layout()};
  let calls=0,result;
  const context=vm.createContext({validCompactAtlas,process:{env:{OPENAI_API_KEY:'test-only'}},upstreamPort:0,generating:false,generationBleed,registrationVersion,silhouetteGuideVersion,rectangularOutputVersion,fittedRectangleVersion,twoPassVersion,extendedArtworkPrompt,silhouetteOutputVersion,validSilhouetteLayout,registrationInstructions:()=>'',AbortSignal,
    readJson:async()=>body,isImage:()=>true,json:(_r,status,value)=>{result={status,value};},fetch:async(_url,options)=>{
      calls++;const request=JSON.parse(options.body);assert.equal(request.n,1);assert.equal(request.size,`${body.width}x${body.height}`);assert.equal(request.quality,'medium');assert.equal(request.images.length,2);
      assert(request.prompt.startsWith('Create ONE flat fabric-print atlas'));assert(request.prompt.includes('Sleeve cuff bands and stripes may remain'));assert(!request.prompt.includes('OUTPAINT'));assert(!request.prompt.includes('10%'));
      return {ok:true,json:async()=>({data:[{b64_json:'eA=='}]})};
    }});
  const server=fs.readFileSync(new URL('../server.mjs',import.meta.url),'utf8');vm.runInContext(server.slice(server.indexOf('async function generate('),server.indexOf('async function proxyGenerator(')),context);
  await context.generate({},{});assert.equal(result.status,200);assert.equal(calls,1);
  const validLayout=structuredClone(body.layout);
  body.layout.rectangles[1].x=body.layout.rectangles[0].x;body.layout.rectangles[1].y=body.layout.rectangles[0].y;
  await context.generate({},{});assert.equal(result.status,400,'overlapping compact pieces cannot reach OpenAI');assert.equal(calls,1);
  body.layout=validLayout;
  body.phase='continuation';await context.generate({},{});assert.equal(result.status,400);assert.equal(calls,1);
  delete body.phase;body.layout=layout(['front','back','right','left','short']);body.parts.push('short');body.width=1536;
  await context.generate({},{});assert.equal(result.status,200);assert.equal(calls,2);
  body.parts.push('socks');body.layout.tiles[0]='socks';body.layout.rectangles[0].piece='socks';
  await context.generate({},{});assert.equal(result.status,400,'socks never reach paid generation');assert.equal(calls,2);
});
test('editor applies a single image to its original sketch after switching tabs and consumes one local credit',async()=>{
  const nodes=new Map(),initial={referenceData:'reference:A',referenceRegions:{},assetsReady:true,generatedParts:{},designVariants:[]},other={...initial,referenceData:'reference:B',designVariants:[]};
  let calls=0,credits=0;const context=vm.createContext({state:initial,activeSketchId:1,sketches:new Map([[1,initial],[2,other]]),generationBusy:false,referenceColorsBusy:false,generationsRemaining:1,generatingSketchId:null,structuredClone,
    $:id=>{if(!nodes.has(id))nodes.set(id,{value:'',hidden:false,checked:false});return nodes.get(id);},readGenerationBalance:()=>1,updateGenerationBalance(){},updateGenerate(){},selectedParts:()=>['front','back','right','left'],generationLayout:layout,activeClips:()=>({}),flatMaskName:()=>'',invalidateGarment(){},renderSketchTabs(){},notice(){},
    rectangularDesignInput:()=>({image:'guide',mask:'mask'}),croppedReferences:async()=>({}),consumeGeneration:()=>credits++,scheduleWorkspaceSave(){},
    loadImage:async src=>({src}),atlasRectangles(){},registrationVersion,normalizedPatternTile(){},artworkRectangle(){},applyShirtPieces:async()=>({src:'shirt'}),atlasTile:()=>({toDataURL:()=>'tile'}),atlasCropRevision:4,prepareClips:async()=>{},registerSleeveClips(){},registrationReviewMessage:()=>'',updateViewButtons(){},showRawAiPreview(){},runPendingReferenceAdjustment(){},
    fetch:async(_url,options)=>{calls++;const request=JSON.parse(options.body);assert.equal(request.phase,undefined);assert.equal(request.layout.bleed,0);assert.equal(request.layout.pipeline,undefined);context.activeSketchId=2;context.state=other;return {ok:true,json:async()=>({image:'one-atlas',usage:{total_tokens:123}})};}
  });
  context.lab={fetch:(...args)=>context.fetch(...args)};
  vm.runInContext(app.slice(app.indexOf('async function generate()'),app.indexOf('async function exportPng(')),context);await context.generate();
  assert.equal(calls,1);assert.equal(credits,1);assert.equal(initial.designVariants.length,1);assert.equal(other.designVariants.length,0);
  assert.equal(initial.designVariants[0].rawImage,'one-atlas');assert.equal(Object.keys(initial.designVariants[0].clips).length,4);assert.equal(context.generationBusy,false);
});
