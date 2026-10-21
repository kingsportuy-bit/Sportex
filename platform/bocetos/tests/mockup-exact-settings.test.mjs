import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import vm from 'node:vm';
import {makeElementModel,initialParameterSketch,graphicAspect,replacementImageSize} from '../public/element-layout.js';
import {companyMockupParameters} from '../public/mockup-config.js';
import {createEditorServer} from '../server.mjs';
import {createLabService} from '../../core/bocetos/service.mjs';
import {SqliteLabStore} from '../../core/bocetos/sqlite-store.mjs';
const factory=JSON.parse(readFileSync(new URL('../public/initial-parameters.json',import.meta.url),'utf8'));
const keys=Object.keys(factory.layers);
const type=key=>['brand','short-brand'].includes(key)?'brand':['crest','short-crest'].includes(key)?'crest':'brand2';
function sketch(){return {
  mockRevision:2,positionRevision:3,inputs:{...factory.inputs,'brand-select':'brand','brand2-select':'brand2','crest-select':'crest','number-font':'club-river-plate-22-23','name-font':'club-adidas-2018','include-socks':false,'trim-shirt-side-enabled':true},
  logos:{brand:[{id:'brand',name:'Privado.png',image:{width:40,height:120,src:'private-brand-bytes'}}],brand2:[{id:'brand2',name:'Privado2.png',image:{width:440,height:50,src:'private-brand2-bytes'}}],crest:[{id:'crest',name:'Escudo.png',image:{width:80,height:100,src:'private-crest-bytes'}}]},
  layers:Object.fromEntries(keys.map((key,i)=>[key,{x:173+i*71.25,y:301+i*29.3,size:54+i*11.35,scaleX:.71+i*.11,scaleY:1.34-i*.05,rotation:i*2.5,letterSpacing:-2+i*.2}])),
  visibleLayers:Object.fromEntries(keys.map((key,i)=>[key,i%3!==0])),texts:[],sponsors:[],trimEdits:{linkedVersion:3},layerStyles:{brand:{enabled:true,color:'#ff8040',width:2}},documentPalette:['#ff8040'],backgroundMode:'none',designVariants:[]
};}
const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const boundsSource=app.slice(app.indexOf('function layerBounds('),app.indexOf('const placementTargets='));
function dims(layer,image){
  const c=vm.createContext({state:{layers:{brand:layer}},imageForLayer:()=>image,graphicAspect});
  vm.runInContext(boundsSource,c);const b=c.layerBounds('brand');return {width:b.width,height:b.height};
}
function placeholders(model){const logos={};for(const key of ['brand','brand2','crest'])logos[key]=[{id:`sample-${key}`,name:'Muestra',image:{width:180,height:100,mockupAspect:model.layers[key].imageAspect}}];return logos;}

test('guardar modelo incluye aspecto sin bytes y reabrir con muestras conserva medidas exactas',()=>{
  const original=sketch(),model=makeElementModel(original,keys),logos=placeholders(model),empty={...original,logos,inputs:{...original.inputs}};
  for(const key of ['brand','brand2','crest']){model.inputs[`${key}-select`]=`sample-${key}`;model.logoFiles[key]='Muestra';}
  const reopened=initialParameterSketch(empty,model);
  for(const key of keys){
    assert.equal(reopened.layers[key].x,original.layers[key].x);assert.equal(reopened.layers[key].y,original.layers[key].y);
    if(!key.includes('number')&&key!=='back-name')assert.deepEqual(dims(reopened.layers[key],logos[type(key)][0].image),dims(original.layers[key],original.logos[type(key)][0].image));
    else assert.deepEqual(reopened.layers[key],original.layers[key]);
  }
  assert.equal(reopened.inputs['number-font'],original.inputs['number-font']);assert.equal(reopened.inputs['name-font'],original.inputs['name-font']);
  assert.ok(!JSON.stringify(model).includes('private-'));assert.deepEqual(reopened.layerStyles,original.layerStyles);assert.deepEqual(reopened.visibleLayers,original.visibleLayers);
});
test('otro logo conserva altura base y proporcion natural sin alterar el modelo guardado',()=>{
  const original=sketch(),model=makeElementModel(original,keys),before=structuredClone(model),newImage={width:350,height:70};
  const fresh=initialParameterSketch({...original,logos:{brand:[],brand2:[],crest:[]}},model,{logos:{brand:[{id:'new-brand',name:'Nuevo.png',image:newImage}]}});
  const expected=dims(original.layers.brand,original.logos.brand[0].image),actual=dims(fresh.layers.brand,newImage);
  assert.ok(Math.abs(actual.height-expected.height)<1e-8);assert.equal(fresh.layers.brand.scaleX,original.layers.brand.scaleX);assert.equal(fresh.layers.brand.scaleY,original.layers.brand.scaleY);assert.deepEqual(model,before);
});

test('la primera carga de un logo respeta la altura configurada aunque la base no guarda imagenes',async()=>{
  const state={logos:{brand:[]},layers:{brand:{x:200,y:300,size:100,imageAspect:2},'short-brand':{x:240,y:900,size:60,imageAspect:2}},visibleLayers:{}},fields={};
  const image={width:80,height:100},c=vm.createContext({state,activeSketchId:1,assetUploadVersions:{brand:0},graphicAspect,replacementImageSize,
    $:id=>fields[id]??={value:''},loadImage:async()=>image,fileData:async()=>'',recordHistory(){},useLogoAsset(){},selectLayer(){},rememberPreferences(){},scheduleWorkspaceSave(){},notice(){},Date,Math});
  vm.runInContext(app.slice(app.indexOf('async function loadLogoFile('),app.indexOf('function graphicReplacementTarget(')),c);
  await c.loadLogoFile('brand',{name:'Nuevo.png',size:100});
  assert.equal(dims(state.layers.brand,image).height,50);assert.equal(dims(state.layers['short-brand'],image).height,30);
  assert.equal(state.layers.brand.x,200);assert.equal(state.layers.brand.y,300);assert.equal(state.layers.brand.imageAspect,.8);
});
test('HTTP guardar, reinicio SQLite y publicar conservan geometria, fuentes y opciones sin imagenes',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'sportex-exact-'));let store,server;
  try{
    const path=join(dir,'lab.sqlite');store=new SqliteLabStore(path);let lab=createLabService({store,mockupDefaults:factory});
    const {token}=await lab.setup({username:'admin.fixture',password:'Fixture-pass-123'}),parameters=makeElementModel(sketch(),keys),before=structuredClone(parameters);
    server=createEditorServer({lab});server.listen(0,'127.0.0.1');await once(server,'listening');const url=`http://127.0.0.1:${server.address().port}`;
    const draft=await lab.mockupDraft(token,'football-basic');
    const response=await fetch(url+'/api/lab/admin/mockups/football-basic',{method:'POST',headers:{cookie:`sportex_lab_admin=${token}`,origin:url,'content-type':'application/json'},body:JSON.stringify({version:draft.version,...draft.draft,parameters})});
    assert.equal(response.status,200);const saved=(await response.json()).data;
    assert.deepEqual(saved.draft.parameters.layers,before.layers);assert.equal(saved.draft.parameters.inputs['number-font'],before.inputs['number-font']);
    assert.deepEqual(saved.draft.parameters.logoFiles,{brand:null,brand2:null,crest:null});assert.deepEqual(saved.draft.parameters.sponsors,[]);
    await new Promise(resolve=>server.close(resolve));server=null;await store.close();store=new SqliteLabStore(path);lab=createLabService({store,mockupDefaults:factory});
    const reopened=await lab.mockupDraft(token,'football-basic');assert.deepEqual(reopened.draft,saved.draft);
    const published=await lab.publishMockup(token,'football-basic',{version:reopened.version});
    const company=companyMockupParameters(published.published,factory,{numberFont:'club-sc-internacional-2023',nameFont:'club-real-madrid-font-2024-2025'});
    assert.equal(company.inputs['number-font'],before.inputs['number-font']);assert.equal(company.inputs['name-font'],before.inputs['name-font']);assert.deepEqual(company.layers,before.layers);
    assert.equal(company.inputs['include-socks'],false);assert.equal(company.inputs['trim-shirt-side-enabled'],true);
    assert.ok(!JSON.stringify(published).includes('private-'));
  }finally{if(server)await new Promise(resolve=>server.close(resolve));await store?.close();await rm(dir,{recursive:true,force:true});}
});
