import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFile,mkdir,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {createPrototypeRenderer,collarTypes,defaults} from './renderer.js';
import {paintMaterial,bodyPiece} from './material.js';
import {assetFiles} from './assets.js';
import {bodyRevision,defaultAnchorProfile,withAnchor} from './anchors.js';

// Dependencia solo para exportar/comprobar sin controlar un navegador.
// Uso: node verify.mjs <ruta absoluta al paquete @napi-rs/canvas/index.js>
const require=createRequire(import.meta.url);
let native;
try {native=require(process.argv[2]||'@napi-rs/canvas');}
catch {throw new Error('Para esta comprobación indicar @napi-rs/canvas instalado; el visor no necesita esa dependencia.');}
const {createCanvas,loadImage}=native,root=new URL('./',import.meta.url),r=createPrototypeRenderer(createCanvas);
const images={};
for(const [key,file]of Object.entries(assetFiles))images[key]=await loadImage(fileURLToPath(new URL(`assets/${file}.png`,root)));
const started=performance.now();r.load(images);const prepareMs=performance.now()-started;
const checks=[],manifest={schemaVersion:1,id:'football-own-v1',bodyRevision,status:'PROTOTIPO_LOCAL_NO_INTEGRADO',createdAt:'2026-10-20',defaultAnchors:defaultAnchorProfile(r.materials),views:{},generation:{tool:'imagegen integrado',calls:5,prompts:'prompts.json',usesExternalApiKey:false},limits:['Costuras de mangas aproximadas; necesitan aprobación.','Iluminación reconstruida a partir de gris; no pases físicos 3D.','QA visual de la página pendiente por navegador deshabilitado.']};
await mkdir(new URL('layers/',root),{recursive:true});
for(const side of ['front','back']){
  const body=r.materials.body[side];
  assert.equal(body.holes.reduce((a,b)=>a+b,0),0);
  let count=0;for(let y=0;y<body.height;y++)for(let x=0;x<body.width;x++)if(body.alpha[y*body.width+x]){assert.ok(['body','left','right'].includes(bodyPiece(x,y,body.width,body.height)));count++;}
  assert.ok(count>200000);checks.push(`${side}: máscara continua de prenda y reparto de piezas válido`);
  const views=collarTypes.map(key=>r.renderView(key,side,defaults)),pixels=views.map(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data);
  const limit=Math.ceil(Math.max(...collarTypes.map(key=>{const p=r.placement(key,side);return p.y+p.height;}))+80);
  for(let y=limit;y<views[0].height;y++)for(let x=0;x<views[0].width;x++){
    const i=(y*views[0].width+x)*4;
    for(let k=0;k<4;k++){assert.equal(pixels[0][i+k],pixels[1][i+k]);assert.equal(pixels[0][i+k],pixels[2][i+k]);}
  }
  checks.push(`${side}: cuerpo y franjas idénticos por píxel fuera de la zona del cuello`);
  const colors=['#f4f5f3','#151a17'].map(color=>paintMaterial(body,{color,sleeve:color,pattern:'solid'}));
  const stats=colors.map(({data})=>{let n=0,sum=0,squares=0;for(let p=0;p<data.length;p+=4)if(data[p+3]>230){const g=(data[p]+data[p+1]+data[p+2])/3;n++;sum+=g;squares+=g*g;}const mean=sum/n;return {mean,sd:Math.sqrt(squares/n-mean*mean)};});
  assert.ok(stats[0].mean-stats[1].mean>120);assert.ok(stats[0].sd>5);assert.ok(stats[1].mean<50);
  checks.push(`${side}: blanco y negro conservan contraste de iluminación`);
  manifest.views[side]={width:body.width,height:body.height,sourceBounds:body.sourceBounds,body:{},collars:{}};
  for(const [name,mode,piece]of [['body-mask','mask','body'],['sleeve-left-mask','mask','left'],['sleeve-right-mask','mask','right'],['coverage','mask',null],['shadow','shadow',null],['highlight','highlight',null]]){
    const file=`layers/${side}-${name}.png`,c=r.exportLayer('body',side,mode,piece);await writeFile(new URL(file,root),c.toBuffer('image/png'));manifest.views[side].body[name]=file;
  }
  for(const key of collarTypes){
    const m=r.materials[key][side],p=r.placement(key,side);
    assert.ok(Math.abs(p.width/p.height-m.width/m.height)<1e-10);
    assert.ok(side==='front'?m.holes.reduce((a,b)=>a+b,0)>10000:m.holes.reduce((a,b)=>a+b,0)===0);
    const collar={sourceBounds:m.sourceBounds,width:m.width,height:m.height,placement:p};
    for(const mode of ['mask','shadow','highlight']){
      const file=`layers/${side}-${key}-${mode}.png`,c=r.exportLayer(key,side,mode);await writeFile(new URL(file,root),c.toBuffer('image/png'));collar[mode]=file;
    }
    manifest.views[side].collars[key]=collar;
  }
  checks.push(`${side}: escala uniforme y abertura independientes para los tres cuellos`);
  const profile=defaultAnchorProfile(r.materials),altered=withAnchor(profile,'round',side,{...profile.anchors.round[side],centerX:.53,top:.03,width:.34,height:.15,keepRatio:false});
  const before=r.renderView('round',side,{...defaults,anchors:profile}),after=r.renderView('round',side,{...defaults,anchors:altered});
  const a=before.getContext('2d').getImageData(0,0,before.width,before.height).data,b=after.getContext('2d').getImageData(0,0,after.width,after.height).data;
  let changed=0;for(let p=0;p<a.length;p+=4)if(a[p]!==b[p]||a[p+1]!==b[p+1]||a[p+2]!==b[p+2]||a[p+3]!==b[p+3]){changed++;assert.ok(Math.floor(p/4/before.width)<body.height*.32+64);}
  assert.ok(changed>500);checks.push(`${side}: anclaje manual modifica el cuello y conserva el resto de la camiseta`);
}
const pair=createCanvas(1600,1000),timings=[];
for(const color of ['#f4f5f3','#151a17','#cf2c2c']){const t=performance.now();r.drawPair(pair,{...defaults,color,sleeve:color,pattern:'solid'});timings.push(performance.now()-t);}
for(const collar of collarTypes){const t=performance.now();r.drawPair(pair,{...defaults,collar});timings.push(performance.now()-t);}
const fileStats=[];
for(const stem of Object.values(assetFiles)){const file=stem+'.png',b=await readFile(new URL('assets/'+file,root));fileStats.push({file:'assets/'+file,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});}
manifest.assets=fileStats;
const report={result:'PASS',checks,prepareMs:Math.round(prepareMs),pairRenderMs:timings.map(t=>Math.round(t)),browserVisualQA:'PENDIENTE',nativeCanvas:true};
await writeFile(new URL('manifest.json',root),JSON.stringify(manifest,null,2)+'\n');
await writeFile(new URL('verification.json',root),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
