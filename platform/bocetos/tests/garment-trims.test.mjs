import test from 'node:test';
import assert from 'node:assert/strict';
import {buildTrimBatches,paintTrimBatches,trimGroups,trimProfile,migrateTrimEdits,decodeTrimCurve} from '../public/garment-trims.js';
import {patternBounds,sleevePatternFrame} from '../public/pattern-geometry.js';
import {readRgbaPng} from './png-fixture.mjs';
import {preferenceSnapshot,withPreferences} from '../public/editor-geometry.js';
import {curveFromPolyline,encodeCurve,transformNodes,sampleCurve} from '../public/trim-path.js';
const masks=new Map();
function getMask(piece,side){
  const key=`${piece}:${side}`;if(masks.has(key))return masks.get(key);
  const name=piece==='short'?'photoShort':piece==='shoulder'?'photoDesignShirt':piece==='left'||piece==='right'?'photoDesignShirtSleeves':'photoDesignShirtBody';
  const image=readRgbaPng(new URL(`../public/assets/psd-kit/${side}-${name}.png`,import.meta.url));
  const data=image.data.slice(),node={width:image.width,height:image.height};
  if(piece==='left'||piece==='right'){
    const whole=getMask('shoulder',side).bounds,split=whole.x+whole.width/2,left=side==='front'?piece==='right':piece==='left';
    for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++)if(left?x>=split:x<split)data[(y*image.width+x)*4+3]=0;
  }
  const mask={node,data,bounds:patternBounds(data,node.width,node.height)};
  if(piece==='shoulder')mask.bodyBounds=getMask(side,side).bounds;
  if(piece==='left'||piece==='right'){
    const cuffs=readRgbaPng(new URL(`../public/assets/psd-kit/${side}-photoCuffs.png`,import.meta.url));
    mask.frame=sleevePatternFrame(data,cuffs.data,node.width,node.height,mask.bounds);
  }
  masks.set(key,mask);return mask;
}
const settings=()=>Object.fromEntries(trimGroups.map(group=>[group,{enabled:false,color:'#ffffff',color2:'#cfe64e',style:'single',mode:'solid'}]));

test('disabled trims leave every existing garment untouched, including socks',()=>{
  assert.deepEqual(buildTrimBatches(settings(),['shirt','short','socks'],()=>{throw Error('must not need masks');}),[]);
  const s=settings();for(const group of trimGroups)s[group].enabled=true;
  assert.deepEqual(buildTrimBatches(s,['socks'],()=>{throw Error('must not draw on socks');}),[]);
});
test('real PSD sleeves always use one cuff-aligned band in both views, including saved triple choices',()=>{
  const s=settings();s.sleeve.enabled=true;
  const single=buildTrimBatches(s,['shirt'],getMask);assert.equal(single.length,4);assert(single.every(b=>b.strokes.length===1));
  s.sleeve.style='triple';const triple=buildTrimBatches(s,['shirt'],getMask);
  for(const batch of triple){assert.equal(batch.strokes.length,1);
    for(const stroke of batch.strokes){const [a,b]=stroke.points,angle=batch.mask.frame.angle*Math.PI/180;
      assert(Math.abs((b[0]-a[0])*Math.cos(angle)+(b[1]-a[1])*Math.sin(angle))<1e-8,'lines must be perpendicular to the cuff');}
  }
});
test('shoulders follow the upper silhouette and shirt seams stay confined to the sides',()=>{
  const s=settings();s.shoulder.enabled=true;s.shoulder.style='triple';s['shirt-side'].enabled=true;
  const batches=buildTrimBatches(s,['shirt'],getMask);
  for(const {group,mask,strokes} of batches){
    assert.equal(strokes.length,group==='shoulder'?6:2);
    const b=mask.bounds;
    for(const {points} of strokes)for(const [x,y] of points){assert(Number.isFinite(x)&&Number.isFinite(y));
      if(group==='shirt-side'){assert(x<b.x+b.width*.3||x>b.x+b.width*.7);assert(y>=b.y+b.height*.27);}
      else assert(y<b.y+b.height*.3);
    }
  }
});
test('short supports solid, horizontal halves, vertical halves and separate double stripes',()=>{
  const s=settings(),short=s['short-side'];short.enabled=true;
  assert(buildTrimBatches(s,['short'],getMask).every(b=>b.strokes.length===2));
  for(const mode of ['horizontal','vertical']){
    short.mode=mode;const batches=buildTrimBatches(s,['short'],getMask);assert.equal(batches.length,2);
    for(const {strokes,mask} of batches){assert.equal(strokes.length,4);assert.deepEqual(new Set(strokes.map(s=>s.color)),new Set(['#ffffff','#cfe64e']));
      if(mode==='horizontal'){assert(Math.abs(strokes[0].points.at(-1)[1]-strokes[1].points[0][1])<1e-8);}
      else assert(strokes.every(stroke=>stroke.points.at(-1)[1]-stroke.points[0][1]>mask.bounds.height*.98));
    }
  }
  short.style='double';assert(buildTrimBatches(s,['short'],getMask).every(b=>b.strokes.length===4));
});
test('each short leg has its own lower trim, without crossing the crotch',()=>{
  const s=settings();s['short-hem'].enabled=true;
  for(const {mask,strokes} of buildTrimBatches(s,['short'],getMask)){
    assert.equal(strokes.length,2);const b=mask.bounds;
    assert(strokes[0].points.at(-1)[0]<b.x+b.width*.53);assert(strokes[1].points[0][0]>b.x+b.width*.47);
    assert(strokes.every(s=>s.points.every(p=>p[1]>b.y+b.height*.78)));
  }
});
test('the 2x renderer uses logical geometry and clips with the full native mask',()=>{
  function mask(scale){const node={width:80*scale,height:100*scale},data=new Uint8ClampedArray(node.width*node.height*4);
    for(let y=5*scale;y<95*scale;y++)for(let x=8*scale;x<72*scale;x++)data[(y*node.width+x)*4+3]=255;
    return {node,data,bounds:{x:8,y:5,width:64,height:90}};}
  const a=trimProfile(mask(1)),b=trimProfile(mask(2),2);
  for(const key of ['top','bottom','left','right'])for(let i=0;i<a[key].length;i++)assert(Math.abs(a[key][i]-b[key][i])<=.26);
  const m=mask(2),calls=[],fake={setTransform(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},drawImage:(...args)=>calls.push(['mask',...args])};
  const surface={width:160,height:200,getContext:()=>fake};
  paintTrimBatches({drawImage:(...args)=>calls.push(['result',...args])},[{mask:m,strokes:[{points:[[8,5],[8,95]],color:'#fff',width:3}]}],surface,2);
  assert.deepEqual(calls[0],['mask',m.node,0,0]);assert.deepEqual(calls[1],['result',surface,0,0,80,100]);
});
test('browser preferences retain all trim choices when creating a new sketch',()=>{
  const blank={inputs:{'trim-sleeve-enabled':false},logos:{brand:[],crest:[]},layers:{},layerStyles:{},visibleLayers:{}};
  const chosen={...blank,inputs:{'trim-sleeve-enabled':true,'trim-sleeve-style':'triple','trim-short-side-color2':'#ff0000'}};
  const prefs=preferenceSnapshot(chosen,[]),next=withPreferences(blank,prefs);
  for(const [id,value] of Object.entries(chosen.inputs))assert.equal(next.inputs[id],value);
  assert.equal(blank.inputs['trim-sleeve-enabled'],false);
});
test('old custom curves retain their own view without changing the source and reset restores defaults',()=>{
  const s=settings();s['shirt-side'].enabled=true;
  const before=buildTrimBatches(s,['shirt'],getMask),chosen=before[0].strokes[0],key=chosen.key;
  const nodes=transformNodes(curveFromPolyline(chosen.points),([x,y])=>[x+20,y-7]);
  const original={[key]:encodeCurve(nodes,before[0].mask.bounds)},saved=structuredClone(original),edits=migrateTrimEdits(original,before),after=buildTrimBatches(s,['shirt'],getMask,1,edits);
  assert.deepEqual(original,saved);assert.equal(edits.linkedVersion,3);
  const decoded=decodeTrimCurve(edits[chosen.editKey],{...before[0],stroke:chosen});
  for(let i=0;i<nodes.length;i++)assert(Math.hypot(...nodes[i].p.map((v,k)=>v-decoded[i].p[k]))<1e-8);
  assert.deepEqual(after[0].strokes[1].points,before[0].strokes[1].points);assert.deepEqual(after[1].strokes[0].points,before[1].strokes[0].points);
  delete edits[chosen.editKey];assert.deepEqual(buildTrimBatches(s,['shirt'],getMask,1,edits),before);
});
test('saved preferences clone node curves without sharing mutable edits between sketches',()=>{
  const chosen={inputs:{},logos:{brand:[],crest:[]},layers:{},layerStyles:{},visibleLayers:{},trimEdits:{test:encodeCurve(curveFromPolyline([[1,2],[3,4]]),{x:0,y:0,width:10,height:10})}};
  const preferences=preferenceSnapshot(chosen,[]),next=withPreferences({...chosen,trimEdits:{}},preferences);
  next.trimEdits.test.nodes[0].p[0]=8;assert.notEqual(preferences.trimEdits.test.nodes[0].p[0],8);assert.notEqual(chosen.trimEdits.test.nodes[0].p[0],8);
});
