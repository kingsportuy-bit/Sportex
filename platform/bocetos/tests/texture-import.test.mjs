import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {textureRasterSize,validateTextureFile,textureFileKind} from '../public/texture-import.js';
import {createEditorServer} from '../server.mjs';

test('document formats accept absent browser MIME and enforce real size limits',()=>{
  assert.equal(validateTextureFile({name:'estampado.PDF',type:'',size:49_000_000}),'pdf');
  assert.equal(textureFileKind({name:'frente.cdr',type:'application/vnd.corel-draw'}),null);
  assert.throws(()=>validateTextureFile({name:'frente.cdr',type:'',size:200}),/PNG.*PDF/);
  assert.equal(textureFileKind({name:'manga.png',type:'image/png'}),'image');
  assert.throws(()=>validateTextureFile({name:'manga.jpg',type:'image/jpeg',size:16_000_000}),/15 MB/);
  assert.throws(()=>validateTextureFile({name:'frente.pdf',size:51_000_000}),/50 MB/);
  assert.throws(()=>validateTextureFile({name:'frente.pdf',size:0}),/50 MB/);
  assert.throws(()=>validateTextureFile({name:'archivo.exe',size:20}),/PNG/);
});
test('working rasters preserve aspect, never upscale images and bound decoded working memory',()=>{
  assert.deepEqual(textureRasterSize(10000,20000),{width:1024,height:2048});
  assert.deepEqual(textureRasterSize(400,600),{width:400,height:600});
  for(const [w,h] of [[40000,40000],[1,80000],[5000,1600]]){const size=textureRasterSize(w,h);assert(size.width*size.height*4<=16_777_216);assert(Math.max(size.width,size.height)<=2048);}
  assert.throws(()=>textureRasterSize(Infinity,10));assert.throws(()=>textureRasterSize(0,10));
});
test('PDF.js is served locally and the removed native conversion endpoint stays unavailable',async t=>{
  const server=createEditorServer();server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>server.close());
  const base='http://127.0.0.1:'+server.address().port;
  let res=await fetch(base+'/api/texture-corel',{method:'POST',body:'fixture'});assert.equal(res.status,404);
  res=await fetch(base+'/vendor/pdfjs/build/pdf.min.mjs');assert.equal(res.status,200);assert.match(res.headers.get('content-type'),/javascript/);
  res=await fetch(base+'/vendor/pdfjs/../../server.mjs');assert.equal(res.status,404);
  res=await fetch(base+'/vendor/pdfjs/build/pdf.sandbox.min.mjs');assert.equal(res.status,404);
});
test('custom texture history signatures store identifiers instead of re-stringifying image data',()=>{
  const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');const code=app.slice(app.indexOf('const historySourceIds='),app.indexOf('function recordHistory('));const c=vm.createContext({});vm.runInContext(code,c);
  const snapshot={layers:{},logos:{},sponsors:[],generatedParts:{},designVariants:[],customTextures:{front:{name:'large.pdf',clip:{src:'x'.repeat(2_000_000),x:0}}}};
  const a=c.historyKey(snapshot);assert(a.length<500);assert.equal(c.historyKey(snapshot),a);snapshot.customTextures.front.clip.x=.1;assert.notEqual(c.historyKey(snapshot),a);snapshot.customTextures.front.clip.src='other-image';assert.notEqual(c.historyKey(snapshot),a);
});
