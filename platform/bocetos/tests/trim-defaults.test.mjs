import test from 'node:test';
import assert from 'node:assert/strict';
import {approvedTrimModel,trimModelRevision,withApprovedTrimModel} from '../public/trim-defaults.js';
import {trimSettingsForMold,trimGroups} from '../public/garment-trims.js';
test('approved Fito model retains exact widths and independent control points',()=>{
  for(const [group,value] of Object.entries({sleeve:'8',shoulder:'5','shirt-side':'7','short-side':'12','short-hem':'14'}))assert.equal(approvedTrimModel.inputs[`trim-${group}-width`],value);
  assert.equal(approvedTrimModel.trimEdits.linkedVersion,3);assert.equal(Object.keys(approvedTrimModel.trimEdits).filter(k=>k.startsWith('individual:')).length,32);
  assert.equal(approvedTrimModel.trimEdits['individual:sleeve:left:front:single:0'].widthScale,1);
});
test('adopting the final base once preserves toggles, mold and unrelated sketch content',()=>{
  const sketch={inputs:{'raglan-enabled':true,'trim-sleeve-enabled':false,'trim-shirt-side-enabled':true,'player-name':'FITO'},referenceData:'original-image',layers:{crest:{x:321}},trimEdits:{linkedVersion:3}};
  const next=withApprovedTrimModel(sketch);assert.equal(next.trimModelRevision,trimModelRevision);assert.equal(next.inputs['trim-sleeve-width'],'8');
  assert.equal(next.inputs['trim-sleeve-enabled'],false);assert.equal(next.inputs['trim-shirt-side-enabled'],true);assert.equal(next.inputs['trim-shoulder-enabled'],false);
  assert.equal(next.inputs['raglan-enabled'],true);assert.equal(next.inputs['player-name'],'FITO');assert.equal(next.referenceData,sketch.referenceData);assert.deepEqual(next.layers,sketch.layers);
  next.trimEdits['individual:sleeve:left:front:single:0'].nodes[0].p[0]=8;assert.notEqual(approvedTrimModel.trimEdits['individual:sleeve:left:front:single:0'].nodes[0].p[0],8);
});
test('subsequent manual refinements survive reload instead of resetting to the preset',()=>{
  const refined=withApprovedTrimModel({inputs:{}});refined.inputs['trim-sleeve-width']='10';refined.trimEdits['individual:sleeve:left:front:single:0'].widthScale=1.7;
  assert.equal(withApprovedTrimModel(refined),refined);assert.equal(withApprovedTrimModel(refined).inputs['trim-sleeve-width'],'10');
});
test('raglan suppresses only sleeve and shoulder trims without discarding their choices',()=>{
  const settings=Object.fromEntries(trimGroups.map(group=>[group,{enabled:true,color:'#ffffff',width:8}])),copy=structuredClone(settings),limited=trimSettingsForMold(settings,true);
  assert.equal(limited.sleeve.enabled,false);assert.equal(limited.shoulder.enabled,false);
  for(const group of ['shirt-side','short-side','short-hem'])assert.equal(limited[group].enabled,true);
  assert.deepEqual(settings,copy);assert.deepEqual(trimSettingsForMold(settings,false),settings);
});
