import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {silhouetteOutputVersion} from '../public/silhouette-atlas.js';
import {generationBleed,registrationVersion,registrationWindow,registrationInstructions,croppedContentWindow,textureBaseGeometry,normalizedPatternTile,normalizedPatternVersion,silhouetteGuideVersion,rectangularOutputVersion,fittedRectangleVersion} from '../public/artwork-registration.js';
import {twoPassVersion} from '../public/two-pass-atlas.js';
import {compactAtlas} from '../public/atlas-layout.js';
const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
test('new atlas reserves ten percent of garment size per edge without changing visible landmark positions',()=>{
  const r={x:80,y:16,width:360,height:480}, visible=registrationWindow(r);
  assert.equal(generationBleed,.2);assert.equal(visible.width,300);assert.equal(visible.height,400);
  assert.equal(visible.x-r.x,30);assert.equal(visible.y-r.y,40);
  // The renderer fits the full rectangle with bleed; every silhouette landmark maps back exactly.
  for(const u of [0,.18,.5,.87,1]){
    const rectangleU=(u+.10)/1.20;
    const rendered=(rectangleU-.5)*300*1.20+150;
    assert(Math.abs(rendered-u*300)<1e-10);
  }
  const legacy=registrationWindow(r,.1);assert(Math.abs(legacy.width-360/1.1)<1e-10);
});
test('new rectangular generation uses measured pattern proportions without generated bleed',()=>{
  const code=app.slice(app.indexOf('function generationLayout('),app.indexOf('const artworkRegionsCache'));
  const context=vm.createContext({compactAtlas,generationBleed,registrationVersion,silhouetteGuideVersion,silhouetteOutputVersion,rectangularOutputVersion,fittedRectangleVersion,twoPassVersion,pieceRectangle:()=>({width:300,height:400})});
  vm.runInContext(code,context);const layout=vm.runInContext("generationLayout(['front','back'])",context);
  assert.equal(layout.bleed,0);assert.equal(layout.registration,registrationVersion);assert.equal(layout.outputShape,fittedRectangleVersion);assert.equal(layout.pipeline,undefined);assert.equal(layout.guide,undefined);
  for(const r of layout.rectangles){assert.equal(r.width/r.height,.75);assert.equal(r.height,480);}
  const prompt=registrationInstructions(layout);
  assert(prompt.includes('0%'));assert(!prompt.includes('exact printable silhouette'));
  const guide=app.slice(app.indexOf('function rectangularDesignInput('),app.indexOf('async function clipDesignToPart('));
  assert(guide.includes('powerClipMask(rect.piece,side)'));assert(guide.includes('patternGuidePixels'));assert(guide.includes('registrationWindow(rect,layout.bleed)'));
});

test('actual crop drift cannot change visible stripe width or move the garment center',()=>{
  const expected={piece:'front',x:80,y:16,width:360,height:480};
  const layout={rectangles:[expected],bleed:.2};const inner=registrationWindow(expected,.2);
  const bounds={width:300,height:400};
  for(const actual of [expected,{x:70,y:12,width:385,height:490}]){
    const contentWindow=croppedContentWindow(layout,'front',actual);
    const image={width:actual.width,height:actual.height};
    const geometry=textureBaseGeometry({contentWindow,bleed:.2},image,bounds);
    // A stripe landmark generated at its GUIDE coordinate keeps that garment position.
    for(const u of [0,.15,.5,.85,1]){
      const px=inner.x+u*inner.width-actual.x;
      const drawn=150+geometry.offsetX+(px/image.width-.5)*geometry.width;
      assert(Math.abs(drawn-u*bounds.width)<1e-9);
    }
    // The numeric bleed must not be multiplied into the explicit registration again.
    assert.deepEqual(textureBaseGeometry({contentWindow,bleed:.9},image,bounds),geometry);
  }
});
test('missing generated coverage fails rather than inventing a margin by zooming',()=>{
  const layout={rectangles:[{piece:'front',x:80,y:16,width:360,height:480}],bleed:.2};
  assert.throws(()=>croppedContentWindow(layout,'front',{x:200,y:16,width:120,height:480}),/está incompleto/);
});
test('flattened renderer and editor use registered content; legacy saved overscan remains compatible',()=>{
  const code=app.slice(app.indexOf('function drawPieceTexture('),app.indexOf('async function applyShirtPieces('));
  const calls=[];const c={save(){},beginPath(){},rect(){},clip(){},restore(){},drawImage(...args){calls.push(args);}};
  const context=vm.createContext({textureBaseGeometry,c});vm.runInContext(code,context);
  const rect={piece:'front',x:0,y:0,width:360,height:480};
  const contentWindow=croppedContentWindow({rectangles:[rect],bleed:.2},'front',rect);
  context.image={width:360,height:480,contentWindow};
  vm.runInContext('drawPieceTexture(c,image,0,0,300,400)',context);
  assert.equal(calls[0][3],360);assert.equal(calls[0][4],480);assert(Math.abs(calls[0][1]+30)<1e-9);
  const legacy=textureBaseGeometry({bleed:.1},{width:300,height:400},{width:300,height:400});
  assert.equal(legacy.width,330);assert.equal(legacy.height,440.00000000000006);
  assert(app.includes('const base=textureBaseGeometry(clip,image,b)'));
});

test('displaced complete sleeves recover without assumed bleed or an extra zoom',()=>{
  const layout={rectangles:[{piece:'right',x:142,y:528,width:228,height:480}],bleed:.2};
  const actual={piece:'right',x:149,y:615,width:237,height:383};
  const content=croppedContentWindow(layout,'right',actual);
  assert.deepEqual(content,{x:0,y:0,width:1,height:1,reviewRequired:true});
  const base=textureBaseGeometry({contentWindow:content,bleed:.2},{width:237,height:383},{width:84,height:177});
  assert.equal(base.height,177);assert.equal(base.offsetX,0);assert.equal(base.offsetY,0);
  assert(!app.includes('mask=powerClipMask(rect.piece,side)'));
});

test('generated rectangles are normalized to each pattern aspect before rendering with a uniform scale',()=>{
  const expected={piece:'front',x:48,y:16,width:416,height:480};
  const layout={registration:registrationVersion,rectangles:[expected],bleed:.2};
  const a=normalizedPatternTile(layout,'front',{x:65,y:15,width:410,height:542});
  const b=normalizedPatternTile(layout,'front',{x:76,y:20,width:430,height:563});
  assert.deepEqual(a,b);assert.equal(a.width/a.height,416/480);
  const garment={width:416,height:480};const base=textureBaseGeometry({contentWindow:a.contentWindow,bleed:.2},a,garment);
  assert(Math.abs(base.width/garment.width-1.2)<1e-9);assert(Math.abs(base.height/garment.height-1.2)<1e-9);
  assert(Math.abs(base.offsetX)<1e-9);assert(Math.abs(base.offsetY)<1e-9);
});
test('atlas tile copies the full detected artwork into its requested pattern dimensions, retaining its visible window',()=>{
  const layout={registration:registrationVersion,columns:2,rows:2,bleed:.2,rectangles:[{piece:'right',x:142,y:528,width:228,height:480}]};
  const actual={x:149,y:615,width:237,height:383},calls=[];
  const tile={getContext:()=>({drawImage:(...args)=>calls.push(args)})};
  const context=vm.createContext({silhouetteOutputVersion,rectangularOutputVersion,fittedRectangleVersion,patternGeometryVersion:1,registrationVersion,normalizedPatternVersion,normalizedPatternTile,croppedContentWindow,
    document:{createElement:()=>tile},artworkRectangle:()=>actual,layout,image:{width:1024,height:1024}});
  const code=app.slice(app.indexOf('function atlasTile('),app.indexOf('function drawPieceTexture('));vm.runInContext(code,context);
  vm.runInContext("atlasTile(image,layout,'right')",context);
  assert.equal(tile.width,228);assert.equal(tile.height,480);assert.equal(tile.patternAspectRevision,normalizedPatternVersion);
  assert.deepEqual(calls[0].slice(1),[149,615,237,383,0,0,228,480]);
  assert(Math.abs(tile.contentWindow.width-1/1.2)<1e-9);
});
