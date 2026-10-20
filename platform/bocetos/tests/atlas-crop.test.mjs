import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseAtlasSeparator, detectAtlasRectangles } from '../public/atlas-crop.js';

const rgba = color => [...color.matchAll(/[0-9a-f]{2}/gi)].map(m => parseInt(m[0], 16));
function sheet(width, height, color) {
  const data = new Uint8ClampedArray(width * height * 4), rgb = rgba(color);
  for (let i = 0; i < data.length; i += 4) data.set([...rgb, 255], i);
  return { data, width, height, rect(x, y, w, h, color) { const rgb = rgba(color); for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) data.set([...rgb, 255], (yy * width + xx) * 4); } };
}
const layout = (separator, rectangles = [{ piece: 'front', x: 96, y: 16, width: 320, height: 480 }]) => ({ columns: 1, rows: 1, tiles: rectangles.map(r => r.piece), rectangles, ...(separator ? { separator } : {}) });

test('striped off-white/navy artwork stays one complete rectangle on fluorescent and old gray sheets', () => {
  for (const key of ['#00ff00', '#ff00ff', undefined]) {
    const image = sheet(512, 512, key || '#b8b8b8'); image.rect(86, 22, 340, 468, '#e4e4e4');
    for (let x = 110; x < 420; x += 70) image.rect(x, 22, 35, 468, '#142640');
    // Gray pattern details and isolated spots are not the exterior sheet.
    image.rect(140, 160, 80, 150, '#b8b8b8');
    assert.deepEqual(detectAtlasRectangles(image.data, 512, 512, layout(key)), [{ piece: 'front', x: 86, y: 22, width: 340, height: 468 }]);
  }
});

test('green/magenta choice avoids reference color; enclosed chroma details stay intact', () => {
  const image = sheet(512, 512, '#00ff00'); image.rect(96, 16, 320, 480, '#777777');
  image.rect(150, 100, 60, 60, '#00ff00');
  assert.equal(chooseAtlasSeparator(sheet(30, 30, '#00ff00').data), '#ff00ff');
  assert.equal(chooseAtlasSeparator(sheet(30, 30, '#ff00ff').data), '#00ff00');
  assert.deepEqual(detectAtlasRectangles(image.data, 512, 512, layout('#00ff00'))[0], layout().rectangles[0]);
  // Detection reads pixels, it never deletes chroma-colored artwork.
  assert.deepEqual([...image.data.slice((110 * 512 + 160) * 4, (110 * 512 + 160) * 4 + 4)], [0, 255, 0, 255]);
});
test('compact pieces crossing old cell boundaries crop by their own positions at native density',()=>{
  const rectangles=[{piece:'front',x:16,y:16,width:430,height:720},{piece:'back',x:462,y:16,width:430,height:720},
    {piece:'right',x:16,y:752,width:140,height:240},{piece:'left',x:172,y:752,width:140,height:240}];
  const spec={columns:2,rows:2,packing:'compact-v1',gutter:16,tiles:rectangles.map(r=>r.piece),rectangles,separator:'#00ff00'};
  for(const scale of [1,2]){
    const image=sheet(1024*scale,1024*scale,'#00ff00');
    for(const r of rectangles)image.rect((r.x+2)*scale,(r.y+1)*scale,r.width*scale,r.height*scale,'#142640');
    const found=detectAtlasRectangles(image.data,image.width,image.height,spec);
    assert.deepEqual(found,rectangles.map(r=>({...r,x:r.x+2,y:r.y+1})));
  }
  const merged=sheet(1024,1024,'#00ff00');
  for(const r of rectangles)merged.rect(r.x,r.y,r.width,r.height,'#142640');
  merged.rect(446,16,16,720,'#142640');
  assert.throws(()=>detectAtlasRectangles(merged.data,1024,1024,spec),/rectángulo completo/,'joined neighbors must not be assigned to the wrong garment');
});

test('four pieces remain separate when body artwork extends beyond the nominal row boundary; arbitrary output resolution', () => {
  const image = sheet(1024, 1024, '#ff00ff');
  const rectangles = [{ piece: 'front', x: 80, y: 16, width: 352, height: 480 }, { piece: 'back', x: 592, y: 16, width: 352, height: 480 }, { piece: 'right', x: 146, y: 528, width: 220, height: 480 }, { piece: 'left', x: 658, y: 528, width: 220, height: 480 }];
  const actual = [[43, 13, 427, 549], [554, 13, 427, 549], [142, 592, 239, 415], [643, 592, 239, 415]];
  actual.forEach(([x, y, w, h]) => image.rect(x, y, w, h, '#d2d2d2'));
  const spec = { columns: 2, rows: 2, tiles: rectangles.map(r => r.piece), rectangles, separator: '#ff00ff' };
  const found = detectAtlasRectangles(image.data, 1024, 1024, spec);
  found.forEach((r, i) => assert.deepEqual([r.x, r.y, r.width, r.height], actual[i]));
  const larger = sheet(2048, 2048, '#ff00ff'); actual.forEach(([x, y, w, h]) => larger.rect(x * 2, y * 2, w * 2, h * 2, '#d2d2d2'));
  assert.deepEqual(detectAtlasRectangles(larger.data, 2048, 2048, spec), found);
});

test('missing separator, fragments, missing pieces, overlapping rectangles and ambiguous candidates fail instead of cropping a stripe', () => {
  assert.throws(() => detectAtlasRectangles(sheet(512, 512, '#333333').data, 512, 512, layout('#00ff00')), /fondo flúor/);
  const fragment = sheet(512, 512, '#00ff00'); fragment.rect(240, 16, 40, 480, '#151f30');
  assert.throws(() => detectAtlasRectangles(fragment.data, 512, 512, layout('#00ff00')), /rectángulo completo/);
  const missing = sheet(1024, 512, '#00ff00'); missing.rect(96, 16, 320, 480, '#333333');
  const spec = { columns: 2, rows: 1, tiles: ['front', 'back'], separator: '#00ff00', rectangles: [layout().rectangles[0], { piece: 'back', x: 608, y: 16, width: 320, height: 480 }] };
  assert.throws(() => detectAtlasRectangles(missing.data, 1024, 512, spec), /back/);
  missing.rect(410, 16, 518, 480, '#333333');
  assert.throws(() => detectAtlasRectangles(missing.data, 1024, 512, spec), /rectángulo completo/);
  const duplicate = sheet(512, 512, '#00ff00'); duplicate.rect(70, 16, 150, 480, '#333333'); duplicate.rect(260, 16, 150, 480, '#333333');
  assert.throws(() => detectAtlasRectangles(duplicate.data, 512, 512, layout('#00ff00', [{ piece: 'front', x: 146, y: 16, width: 220, height: 480 }])), /rectángulo completo/);
});
