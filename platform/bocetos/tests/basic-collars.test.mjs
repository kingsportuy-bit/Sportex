import test from 'node:test';
import assert from 'node:assert/strict';
import {basicAnchorSchema,basicIdentity,psdLight} from '../prototypes/football-own-v1/basic-renderer.js';
import {defaultAnchorProfile} from '../prototypes/football-own-v1/anchors.js';
const body={width:454,height:534,neckAnchors:{round:{centerX:.5055,top:0,width:137/454,height:55/534}}},neck={width:137,height:55};
const materials={body:{front:body,back:body},round:{front:neck,back:neck},v:{front:neck,back:neck},polo:{front:neck,back:neck}};
test('Fútbol básico usa su registro original y no acepta anclajes de otro cuerpo',()=>{
  const profile=basicAnchorSchema.defaultAnchorProfile(materials);
  assert.equal(profile.model,basicIdentity.model);assert.equal(profile.anchors.round.front.width,137/454);
  assert.deepEqual(basicAnchorSchema.validateAnchorProfile(JSON.parse(JSON.stringify(profile))),profile);
  assert.throws(()=>basicAnchorSchema.validateAnchorProfile(defaultAnchorProfile(materials)),/versión/);
  const moved=basicAnchorSchema.withAnchor(profile,'round','back',{...profile.anchors.round.back,centerX:.52});
  assert.deepEqual(moved.anchors.round.front,profile.anchors.round.front);assert.equal(moved.anchors.round.back.centerX,.52);
});
test('la luz del kit respeta linear burn y screen, con alfa independiente',()=>{
  assert.deepEqual(psdLight([200,100,50],[255,255,255,0],[255,255,255,0]),[200,100,50]);
  assert.deepEqual(psdLight([200,100,50],[100,200,255,255],[0,0,0,255]),[45,45,50]);
  assert.deepEqual(psdLight([0,0,0],[255,255,255,255],[255,255,255,255]),[255,255,255]);
});
