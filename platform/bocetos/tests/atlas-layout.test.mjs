import test from 'node:test';
import assert from 'node:assert/strict';
import {compactAtlas,validCompactAtlas} from '../public/atlas-layout.js';
import {patternBounds,sleevePatternFrame} from '../public/pattern-geometry.js';
import {readRgbaPng} from './png-fixture.mjs';

function measuredPatterns(){
  const read=name=>readRgbaPng(new URL(`../public/assets/psd-kit/${name}.png`,import.meta.url));
  const bounds=name=>{const m=read(name);return patternBounds(m.data,m.width,m.height);};
  const front=bounds('front-photoDesignShirtBody'),back=bounds('back-photoDesignShirtBody'),short=bounds('front-photoShort');
  const whole=bounds('front-photoDesignShirt'),cuffs=read('photoCuffs'),patterns={front,back};
  for(const piece of ['right','left']){
    const m=read('front-photoDesignShirtSleeves'),split=Math.round(whole.x+whole.width/2);
    for(let y=0;y<m.height;y++)for(let x=0;x<m.width;x++)if(piece==='right'?x>=split:x<split)m.data[(y*m.width+x)*4+3]=0;
    const b=patternBounds(m.data,m.width,m.height);
    patterns[piece]=sleevePatternFrame(m.data,cuffs.data,m.width,m.height,b).bounds;
  }
  return {...patterns,short};
}
test('all 31 selections of the real PSD pieces pack without overlap, rotation or loss of existing pixel density',()=>{
  const patterns=measuredPatterns(),pieces=Object.keys(patterns),before=structuredClone(patterns);
  for(let bits=1;bits<32;bits++){
    const tiles=pieces.filter((_,i)=>bits&(1<<i)),layout=compactAtlas(tiles,patterns);
    assert(validCompactAtlas(layout),tiles.join(','));
    assert.deepEqual(layout.tiles,tiles);
    const oldDensity=Math.min(...tiles.map(piece=>480/Math.max(patterns[piece].width,patterns[piece].height)));
    assert(layout.pixelsPerUnit>=oldDensity-.005,`${tiles}: density must not regress`);
    assert.deepEqual(layout.rectangles.map(r=>r.pattern),tiles.map(piece=>patterns[piece]));
  }
  assert.deepEqual(patterns,before,'packing never rewrites the measured patterns');
});
test('compact layout validation rejects overlaps, lost green gutters and independent piece scale changes',()=>{
  const patterns={front:{width:300,height:500},back:{width:300,height:500},right:{width:90,height:150}};
  const layout=compactAtlas(Object.keys(patterns),patterns);assert(validCompactAtlas(layout));
  for(const mutate of [l=>l.rectangles[0].x=0,l=>l.rectangles[1].x=l.rectangles[0].x,
    l=>l.rectangles[0].width+=10,l=>l.gutter=0,l=>l.packing='unknown']){
    const invalid=structuredClone(layout);mutate(invalid);assert.equal(validCompactAtlas(invalid),false);
  }
  assert.throws(()=>compactAtlas([],patterns));
  assert.throws(()=>compactAtlas(['front','front'],patterns));
  assert.throws(()=>compactAtlas(['missing'],patterns));
});
