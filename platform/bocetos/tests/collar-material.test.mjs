import test from 'node:test';
import assert from 'node:assert/strict';
import {matchCollarMaterial} from '../prototypes/football-own-v1/collar-material.js';
import {psdLight} from '../prototypes/football-own-v1/basic-renderer.js';
function reference(){const alpha=new Uint8Array(36).fill(255),burn=new Uint8Array(144),screen=new Uint8Array(144);for(let p=0;p<36;p++)burn.set([255,255,255,255],p*4);return {width:6,height:6,alpha,psdLights:{burn,screen}};}
function shape(){return {width:80,height:60,kind:'collar',reference:180,alpha:new Uint8Array(4800).fill(255),gray:Uint8Array.from({length:4800},(_,p)=>(p%80+Math.floor(p/80))%2?120:240)};}
test('la trama generada no altera el tono base ni produce brillo blanco artificial',()=>{
  const target=shape();matchCollarMaterial(target,reference(),psdLight);
  for(const color of ['#000000','#ffffff','#cd302e']){
    const result=target.paint({color}),expected=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));let error=0;
    for(let p=0;p<target.alpha.length;p++)for(let c=0;c<3;c++)error+=Math.abs(result.data[p*4+c]-expected[c]);
    assert.ok(error/(target.alpha.length*3)<1,'La trama fina debe provenir del material del PSD');
  }
});
test('conserva todos los píxeles alfa, incluso bordes suaves y aberturas',()=>{
  const target=shape();for(let p=0;p<target.alpha.length;p++){if(p%80===0)target.alpha[p]=40;if(p>1500&&p<2300)target.alpha[p]=0;}
  const original=target.alpha.slice();matchCollarMaterial(target,reference(),psdLight);const result=target.paint({color:'#202020'});
  assert.deepEqual(target.alpha,original);assert.deepEqual(Uint8Array.from(original,(_,p)=>result.data[p*4+3]),original);
});
test('el cálculo de luz depende del tamaño del material original, no de cada píxel generado',()=>{
  const target=shape(),source=reference();let calls=0;matchCollarMaterial(target,source,(...args)=>{calls++;return psdLight(...args);});
  target.paint({color:'#cc3020'});assert.equal(calls,source.alpha.length);
});
