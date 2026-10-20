import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {captureTextureTransforms,restoreTextureTransforms} from '../public/reference-compare.js';

test('texture comparison restores exact original transforms and view absence, leaving artwork and masks intact',()=>{
  const clips={right:{src:'immutable-artwork',bleed:.1,cropRevision:4,x:.1,scale:1,views:{front:{x:.2,rotation:23},back:{x:-.1,scaleX:.8}}}};
  const before=captureTextureTransforms(clips,['right','right']);
  clips.right.views.front.rotation=80;clips.right.views.back.x=.8;clips.right.scaleX=2;
  const after=captureTextureTransforms(clips,['right']);
  restoreTextureTransforms(clips,before);assert.equal(clips.right.views.front.rotation,23);assert.equal(clips.right.views.back.x,-.1);assert(!Object.hasOwn(clips.right,'scaleX'));
  restoreTextureTransforms(clips,after);assert.equal(clips.right.views.front.rotation,80);assert.equal(clips.right.views.back.x,.8);
  assert.equal(clips.right.src,'immutable-artwork');assert.equal(clips.right.bleed,.1);assert.equal(clips.right.cropRevision,4);
  assert(!JSON.stringify(before).includes('immutable-artwork'));
  const noViews={front:{src:'body',scale:1}};const original=captureTextureTransforms(noViews,['front']);noViews.front.views={front:{x:.9}};restoreTextureTransforms(noViews,original);assert(!Object.hasOwn(noViews.front,'views'));
});

test('automatic adjustment runs once after generation, or when its inactive sketch is opened; it does not auto-retry failures',()=>{
  const source=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
  const start=source.indexOf('function runPendingReferenceAdjustment()'),end=source.indexOf('const pieceLabels=',start);
  let calls=0;
  const context=vm.createContext({state:{pendingReferenceAdjustment:true,apiReady:true,assetsReady:true},generationBusy:true,referenceColorsBusy:false,editingTexture:false,copyReferenceColors(options){calls++;assert.equal(options.resetOptions,true);},scheduleWorkspaceSave(){}});
  vm.runInContext(source.slice(start,end),context);
  vm.runInContext('runPendingReferenceAdjustment()',context);assert.equal(calls,0);assert(context.state.pendingReferenceAdjustment);
  context.generationBusy=false;vm.runInContext('runPendingReferenceAdjustment();runPendingReferenceAdjustment()',context);assert.equal(calls,1);assert.equal(context.state.pendingReferenceAdjustment,false);
  assert(source.includes("sketch.pendingReferenceAdjustment=true"));
  assert(source.includes('renderSketchTabs();runPendingReferenceAdjustment();'));
});
