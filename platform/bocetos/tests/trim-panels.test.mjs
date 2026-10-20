import test from 'node:test';
import assert from 'node:assert/strict';
import * as trims from '../public/garment-trims.js';
import {curveFromPolyline,transformNodes,sampleCurve} from '../public/trim-path.js';
const mask={node:{width:1080,height:1920},data:new Uint8ClampedArray(1080*1920*4),bounds:{x:100,y:200,width:300,height:500},frame:{angle:8,bounds:{x:100,y:200,width:300,height:500}}};
for(let y=200;y<700;y++)for(let x=100;x<400;x++)mask.data[(y*1080+x)*4+3]=255;
const settings=()=>Object.fromEntries(trims.trimGroups.map(g=>[g,{enabled:true,width:g==='short-side'?12:4,style:'triple',mode:'solid',color:'#ff0000',color2:'#ffff00'}]));
const getMask=()=>mask;
test('manga has one band, rear shoulders are absent and the single front shoulder follows sleeve width',()=>{
  const s=settings();s.shoulder.style='single';
  const batches=trims.buildTrimBatches(s,['shirt'],getMask),sleeves=batches.filter(b=>b.group==='sleeve'),shoulders=batches.filter(b=>b.group==='shoulder');
  assert(sleeves.every(b=>b.strokes.length===1));assert.equal(shoulders.length,1);assert.equal(shoulders[0].side,'front');
  assert(shoulders[0].strokes.every(stroke=>stroke.width===sleeves[0].strokes[0].width));
});
test('solid short and both bicolor modes occupy exactly the envelope of its two stripes',()=>{
  const s=settings();s['short-side'].style='double';
  const pair=trims.buildTrimBatches(s,['short'],getMask).find(b=>b.group==='short-side').strokes.slice(0,2);
  const span=strokes=>[Math.min(...strokes.map(p=>p.points[0][0]-p.width/2)),Math.max(...strokes.map(p=>p.points[0][0]+p.width/2))];
  const expected=span(pair);
  for(const mode of ['solid','vertical','horizontal']){
    s['short-side'].style='single';s['short-side'].mode=mode;
    const strokes=trims.buildTrimBatches(s,['short'],getMask).find(b=>b.group==='short-side').strokes;
    const actual=span(strokes.slice(0,mode==='solid'?1:2));
    for(let i=0;i<2;i++)assert(Math.abs(expected[i]-actual[i])<1e-8,mode);
  }
});
test('shirt side is a filled panel to the actual outside, with no bottom gap',()=>{
  const panels=trims.buildTrimBatches(settings(),['shirt'],getMask).filter(b=>b.group==='shirt-side');
  for(const b of panels)for(const s of b.strokes){assert(['left','right'].includes(s.fillToEdge));
    const polygon=trims.trimPanelPolygon(s,b.mask.bounds);assert(polygon.some(p=>p[1]>700));
    assert(polygon.some(p=>s.fillToEdge==='left'?p[0]<100:p[0]>400));
  }
});
test('editing an interior panel boundary changes only the chosen side and view',()=>{
  const s=settings(),base=trims.buildTrimBatches(s,['shirt'],getMask),panels=base.filter(b=>b.group==='shirt-side');
  const entry={...panels[0],stroke:panels[0].strokes[0]},nodes=transformNodes(curveFromPolyline(entry.stroke.points),([x,y])=>[x+12,y]);
  const edits={linkedVersion:3,[entry.stroke.editKey]:trims.encodeTrimCurve(nodes,entry)};
  const result=trims.buildTrimBatches(s,['shirt'],getMask,1,edits).filter(b=>b.group==='shirt-side');
  const [left,right]=result[0].strokes;assert.notEqual(left.editKey,right.editKey);
  const expected=sampleCurve(nodes);for(let i=0;i<left.points.length;i++)assert(Math.hypot(...left.points[i].map((v,k)=>v-expected[i][k]))<1e-8);
  assert.deepEqual(right,panels[0].strokes[1]);assert.deepEqual(result[1],panels[1]);
});
test('unlinking freezes existing shared shapes for every view and then separates all edits',()=>{
  const s=settings(),base=trims.buildTrimBatches(s,['shirt','short'],getMask),panel=base.find(b=>b.group==='shirt-side'),entry={...panel,stroke:panel.strokes[0]};
  const nodes=curveFromPolyline(entry.stroke.points),source={linkedVersion:2,[entry.stroke.sharedKey]:{...trims.encodeTrimCurve(nodes,entry),widthScale:1.5}},original=structuredClone(source);
  const independent=trims.migrateTrimEdits(source,base);assert.equal(independent.linkedVersion,3);assert.deepEqual(source,original);
  const entries=base.filter(b=>b.group==='shirt-side').flatMap(b=>b.strokes.map(stroke=>({...b,stroke})));
  for(const e of entries){assert.deepEqual(independent[e.stroke.editKey],source[e.stroke.sharedKey]);assert.notEqual(independent[e.stroke.editKey],source[e.stroke.sharedKey]);
    const a=trims.decodeTrimCurve(source[e.stroke.sharedKey],e),b=trims.decodeTrimCurve(independent[e.stroke.editKey],e);assert.deepEqual(a,b);
  }
  const before=trims.buildTrimBatches(s,['shirt','short'],getMask,1,independent),moved=transformNodes(nodes,([x,y])=>[x+10,y]);
  independent[entry.stroke.editKey]=trims.encodeTrimCurve(moved,entry);
  const after=trims.buildTrimBatches(s,['shirt','short'],getMask,1,independent),others=entries.slice(1);
  for(const e of others){const find=list=>list.flatMap(b=>b.strokes).find(p=>p.key===e.stroke.key);assert.deepEqual(find(before),find(after));}
});
