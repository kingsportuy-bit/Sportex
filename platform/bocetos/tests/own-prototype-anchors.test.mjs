import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultAnchorProfile,validateAnchorProfile,withAnchor,anchorPlacement,dragAnchor,changeAnchorField,canvasPoint,anchorScreenRect,hitAnchor,bodyRevision} from '../prototypes/football-own-v1/anchors.js';

const body={width:800,height:900},neck={width:500,height:220};
const materials={body:{front:body,back:body},round:{front:neck,back:neck},v:{front:neck,back:neck},polo:{front:neck,back:neck}};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);

test('los seis anclajes se guardan sin compartir estado y recuperan sus valores',()=>{
  const initial=defaultAnchorProfile(materials),changed=withAnchor(initial,'v','back',{...initial.anchors.v.back,centerX:.55,top:.015});
  assert.equal(initial.anchors.v.back.centerX,.5);
  assert.equal(changed.anchors.v.front.centerX,.5);
  assert.equal(changed.anchors.round.back.centerX,.5);
  assert.deepEqual(validateAnchorProfile(JSON.parse(JSON.stringify(changed))),changed);
});
test('rechaza revisiones ajenas, tamaños inválidos y JSON incompleto',()=>{
  const initial=defaultAnchorProfile(materials);
  assert.throws(()=>validateAnchorProfile({...initial,bodyRevision:'otra'}),/versión/);
  assert.throws(()=>validateAnchorProfile({...initial,anchors:{round:initial.anchors.round}}),/tres cuellos/);
  const bad=structuredClone(initial);bad.anchors.v.front.width=NaN;
  assert.throws(()=>validateAnchorProfile(bad),/rango/);
  bad.anchors.v.front.width=.7;bad.anchors.v.front.centerX=.1;
  assert.throws(()=>validateAnchorProfile(bad),/fuera del ancho/);
});
test('mover un anclaje conserva su tamaño y traslada según los píxeles del molde',()=>{
  const a=defaultAnchorProfile(materials).anchors.round.front,b=dragAnchor(a,'move',16,18,body);
  near(b.centerX,a.centerX+.02);near(b.top,a.top+.02);near(b.width,a.width);near(b.height,a.height);
});
test('un vértice con proporción conserva el vértice opuesto y la relación de aspecto',()=>{
  const a=defaultAnchorProfile(materials).anchors.round.front,r=anchorPlacement(a,body);
  const resized=anchorPlacement(dragAnchor(a,'nw',-20,-15,body),body);
  near(resized.x+resized.width,r.x+r.width);near(resized.y+resized.height,r.y+r.height);
  near(resized.width/resized.height,r.width/r.height);
  for(const amount of [-10000,10000]){
    const limited=dragAnchor(a,'se',amount,amount,body);
    near(limited.width/limited.height,a.width/a.height);
  }
});
test('desbloquear permite ancho y alto independientes',()=>{
  const a={...defaultAnchorProfile(materials).anchors.round.front,keepRatio:false};
  const resized=dragAnchor(a,'e',30,0,body);near(resized.height,a.height);near(resized.width,a.width+30/body.width);
  const input=changeAnchorField(a,'height',.2);near(input.width,a.width);near(input.height,.2);
});
test('el campo de tamaño vinculado cambia sin desplazar el centro',()=>{
  const a=defaultAnchorProfile(materials).anchors.round.front,b=changeAnchorField(a,'width',a.width*1.2);
  near(b.height,a.height*1.2);near(b.centerX,a.centerX);near(b.top,a.top);
  for(const field of ['width','height'])for(const value of [-10,10]){
    const limited=changeAnchorField(a,field,value);near(limited.width/limited.height,a.width/a.height);
  }
});
test('el puntero descuenta bandas por object-fit y los tiradores funcionan en zoom',()=>{
  const p=canvasPoint({x:160,y:250},{left:100,top:100,width:600,height:300},{width:1600,height:1000});
  near(p.x,0);near(p.y,500);near(p.scale,.3);
  const rect=anchorScreenRect({x:-100,y:-50,scale:2,pad:64},{x:200,y:20,width:250,height:100});
  assert.equal(hitAnchor({x:rect.x,y:rect.y},rect,9),'nw');
  assert.equal(hitAnchor({x:rect.x+rect.width/2,y:rect.y+rect.height/2},rect,9),'move');
  assert.equal(hitAnchor({x:0,y:0},rect,9),null);
});
