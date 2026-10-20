import test from 'node:test';
import assert from 'node:assert/strict';
import {curveFromPolyline,sampleCurve,splitCurve,transformNodes,encodeCurve,decodeCurve,cubicPoint} from '../public/trim-path.js';
test('adding a Bezier node preserves the curve exactly',()=>{
  const nodes=curveFromPolyline([[0,0],[20,40],[45,60],[80,0]]),split=splitCurve(nodes,0,.5);
  for(let i=0;i<=100;i++){const t=i/100,a=cubicPoint(nodes[0],nodes[1],t),b=t<=.5?cubicPoint(split[0],split[1],t*2):cubicPoint(split[1],split[2],(t-.5)*2);
    assert(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-8);}
  assert.equal(split.length,nodes.length+1);assert.notEqual(split,nodes);
});
test('moving/stretching/rotating changes points and both handles without changing the source',()=>{
  const nodes=curveFromPolyline([[5,10],[20,45],[35,80]]),before=structuredClone(nodes);
  const shifted=transformNodes(nodes,([x,y])=>[x*2+20,y*.5-3]);
  for(let i=0;i<nodes.length;i++)for(const key of ['p','in','out'])assert.deepEqual(shifted[i][key],[nodes[i][key][0]*2+20,nodes[i][key][1]*.5-3]);
  assert.deepEqual(nodes,before);assert(sampleCurve(shifted).length>30);
  const rotated=transformNodes(nodes,([x,y])=>[-y,x]);assert.deepEqual(rotated[0].p,[-nodes[0].p[1],nodes[0].p[0]]);
});
test('saved node coordinates survive preview/export mask scaling and reject malformed data',()=>{
  const b={x:100,y:200,width:300,height:500},nodes=curveFromPolyline([[102,240],[111,450],[130,690]]);
  const saved=encodeCurve(nodes,b);assert.deepEqual(decodeCurve(saved,b),nodes);
  const other=decodeCurve(saved,{x:200,y:400,width:600,height:1000});
  for(let i=0;i<nodes.length;i++)for(const key of ['p','in','out'])assert.deepEqual(other[i][key],nodes[i][key].map(n=>n*2));
  assert.equal(decodeCurve({version:1,nodes:[{p:[NaN,2]}]},b),null);assert.equal(decodeCurve({},b),null);
});
