import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareMaterial,largestComponent,paintMaterial,materialPixel,parseColor} from '../prototypes/football-own-v1/material.js';

test('elimina residuos separados y conserva la silueta principal',()=>{
  // La mota se separa por una fila y una columna completas.
  const wide=new Uint8Array(49);for(const p of [8,9,10,15,16,17,22,23,24,48])wide[p]=1;
  const selected=largestComponent(wide,7,7);
  assert.equal(selected.reduce((a,b)=>a+b,0),9);assert.equal(selected[48],0);
});

test('detecta la abertura cerrada del cuello sin convertirla en tela',()=>{
  const w=11,h=11,data=new Uint8ClampedArray(w*h*4);
  for(let y=2;y<9;y++)for(let x=2;x<9;x++)if(x<4||x>6||y<4||y>6)data.set([170,170,170,255],(y*w+x)*4);
  const m=prepareMaterial(data,w,h,'collar');
  assert.equal(m.width,7);assert.equal(m.height,7);
  assert.ok(m.holes[3*m.width+3]);
});

test('la iluminación conserva el tono base y produce blancos y negros diferentes',()=>{
  assert.deepEqual(materialPixel([200,90,30],180,180),[200,90,30]);
  const white=materialPixel([245,245,245],120,180),black=materialPixel([20,20,20],120,180);
  assert.ok(white[0]>black[0]+100);assert.ok(white[0]<245);
  assert.throws(()=>parseColor('red'),/inválido/);
});

test('las franjas no cambian la cobertura ni la iluminación de las mangas',()=>{
  const w=20,h=20,alpha=new Uint8Array(w*h).fill(255),gray=new Uint8Array(w*h).fill(180);
  const m={kind:'body',width:w,height:h,alpha,gray,reference:180};
  const settings={color:'#eeeeee',second:'#101010',sleeve:'#c03030'};
  const solid=paintMaterial(m,{...settings,pattern:'solid'}).data,stripes=paintMaterial(m,{...settings,pattern:'stripes'}).data;
  assert.deepEqual([...stripes.slice(0,4)],[192,48,48,255]);
  for(let p=0;p<w*h;p++)assert.equal(solid[p*4+3],stripes[p*4+3]);
  assert.notDeepEqual([...solid.slice((15*w+10)*4,(15*w+10)*4+3)],[...stripes.slice((15*w+10)*4,(15*w+10)*4+3)]);
});
