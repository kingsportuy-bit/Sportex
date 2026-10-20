import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {createBasicCollarRenderer,basicAnchorSchema,basicLayerNames,basicIdentity} from './basic-renderer.js';
import {defaults} from './renderer.js';
import {approvedAnchorSourceSha256} from './basic-front-defaults.js';
const require=createRequire(import.meta.url),canvasModule=process.argv[2];
if(!canvasModule)throw Error('Indicá la ruta de @napi-rs/canvas para ejecutar la verificación local.');
const {createCanvas,loadImage}=require(canvasModule),root=new URL('./',import.meta.url),images={};
for(const type of ['v','polo'])images[type]=await loadImage(fileURLToPath(new URL(`assets/collar-${type}.png`,root)));
for(const side of ['front','back'])for(const name of basicLayerNames)images[`${side}-${name}`]=await loadImage(fileURLToPath(new URL(`../../public/assets/psd-kit/${side}-${name}.png`,root)));
const renderer=createBasicCollarRenderer(createCanvas),start=performance.now();renderer.load(images);const prepareMs=Math.round(performance.now()-start);
const profile=basicAnchorSchema.defaultAnchorProfile(renderer.materials);basicAnchorSchema.validateAnchorProfile(JSON.parse(JSON.stringify(profile)));
const proof=createCanvas(1800,720),ctx=proof.getContext('2d');ctx.fillStyle='#e6ebe6';ctx.fillRect(0,0,1800,720);ctx.fillStyle='#19261e';ctx.font='bold 28px Arial';ctx.fillText('SPORTEX · Fútbol básico / prueba de cuellos',30,42);
let column=0;const checks=[],timings=[];
const approvedSource=await readFile(new URL('approved-anchors.json',root));
assert.equal(createHash('sha256').update(approvedSource).digest('hex'),approvedAnchorSourceSha256);
const approved=basicAnchorSchema.validateAnchorProfile(JSON.parse(approvedSource));
for(const type of ['round','v','polo'])assert.deepEqual(profile.anchors[type].front,approved.anchors[type].front);
checks.push('front: los tres defaults coinciden exactamente con el JSON entregado por Fito');
for(const type of ['round','v','polo']){
  const pair=createCanvas(600,570),start=performance.now();renderer.drawPair(pair,{...defaults,anchors:profile,collar:type});timings.push(Math.round(performance.now()-start));ctx.drawImage(pair,column*600,60);ctx.fillStyle='#19261e';ctx.font='25px Arial';ctx.fillText({round:'Redondo original',v:'En V',polo:'Polo'}[type],column*600+200,680);column++;
  const neck=createCanvas(1000,650);renderer.drawPair(neck,{...defaults,pattern:'solid',anchors:profile,collar:type},'front');await writeFile(new URL(`basic-${type}-neck.png`,root),neck.toBuffer('image/png'));
}
for(const side of ['front','back']){
  const body=renderer.materials.body[side],round=renderer.placement('round',side,profile),source=renderer.materials.round[side].sourceBounds;
  if(side==='back'){
    assert.equal(round.width,source.width);assert.equal(round.height,source.height);
    assert.ok(Math.abs(round.x+body.sourceBounds.x-source.x)<1e-8);assert.equal(round.y+body.sourceBounds.y,source.y);
    checks.push('back: cuello redondo registrado en la máscara original');
  }
  const views=['round','v','polo'].map(type=>renderer.renderView(type,side,{...defaults,anchors:profile}));
  const arrays=views.map(v=>v.getContext('2d').getImageData(0,0,v.width,v.height).data),cutoff=Math.ceil(body.height*.34)+64;
  for(let p=cutoff*views[0].width*4;p<arrays[0].length;p++)assert.equal(arrays[1][p],arrays[0][p]);
  for(let p=cutoff*views[0].width*4;p<arrays[0].length;p++)assert.equal(arrays[2][p],arrays[0][p]);
  checks.push(`${side}: el cuerpo inferior conserva píxeles exactos entre los tres cuellos`);
  const changed=basicAnchorSchema.withAnchor(profile,'v',side,{...profile.anchors.v[side],centerX:profile.anchors.v[side].centerX+.01});
  assert.deepEqual(changed.anchors.v[side==='front'?'back':'front'],profile.anchors.v[side==='front'?'back':'front']);
  const moved=renderer.renderView('v',side,{...defaults,anchors:changed}),movedData=moved.getContext('2d').getImageData(0,0,moved.width,moved.height).data;
  if(side==='front')assert.ok(movedData.some((value,p)=>value!==arrays[1][p]));
  else{
    assert.deepEqual(arrays[1],arrays[0]);assert.deepEqual(arrays[2],arrays[0]);
    const roundChanged=basicAnchorSchema.withAnchor(changed,'round','back',{...changed.anchors.round.back,top:.1,width:.6,height:.1});
    const unchanged=renderer.renderView('polo','back',{...defaults,anchors:roundChanged});
    assert.deepEqual(unchanged.getContext('2d').getImageData(0,0,unchanged.width,unchanged.height).data,arrays[0]);
    assert.deepEqual(movedData,arrays[0]);
  }
  for(let p=cutoff*views[0].width*4;p<arrays[0].length;p++)assert.equal(movedData[p],arrays[1][p]);
  checks.push(side==='front'?'front: mover el anclaje conserva la otra vista y el resto de la prenda':'back: cuello original idéntico entre variantes e inmune a anclajes guardados');
}
await writeFile(new URL('basic-comparison.jpg',root),proof.toBuffer('image/jpeg'));
await writeFile(new URL('basic-anchors.json',root),JSON.stringify(profile,null,2)+'\n');
const result={result:'PASS',model:basicIdentity,checks,prepareMs,pairRenderMs:timings,browserVisualQA:'PENDIENTE',paidCalls:0};
await writeFile(new URL('basic-verification.json',root),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
