import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveTextureClips} from '../public/element-layout.js';

test('piece sources keep AI and custom texture transforms independent, with a reversible hidden state',()=>{
  const ai={front:{src:'ai-front',x:.1},back:{src:'ai-back',x:.2}},custom={front:{name:'propia.png',clip:{src:'custom-front',custom:true,x:.3}}};
  const visible=resolveTextureClips(ai,custom,{front:'custom',back:'none'});
  assert.deepEqual(Object.keys(visible),['front']);assert.equal(visible.front,custom.front.clip);
  visible.front.x=.5;assert.equal(ai.front.x,.1);assert.equal(custom.front.clip.x,.5);
  visible.front={src:'restored-custom',custom:true,x:.3};assert.equal(custom.front.clip.src,'restored-custom');
  assert.equal(resolveTextureClips(ai,custom,{front:'ai'}).front,ai.front);
  assert.equal(resolveTextureClips(ai,custom,{front:'none'}).front,undefined);
});

test('AI editing and cancellation write back to the selected variant without leaking custom uploads',()=>{
  const ai={right:{src:'ai-right',views:{front:{rotation:20}}}},custom={right:{clip:{src:'custom-right',custom:true}}};
  const clips=resolveTextureClips(ai,custom,{});clips.right={src:'restored-ai',rotation:0};
  assert.equal(ai.right.src,'restored-ai');assert.equal(custom.right.clip.src,'custom-right');
  const saved=structuredClone({customTextures:custom,textureModes:{right:'custom'}});
  assert.equal(resolveTextureClips(ai,saved.customTextures,saved.textureModes).right.src,'custom-right');
});
