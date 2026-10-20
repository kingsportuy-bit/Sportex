import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {initialParameterSketch,replacementImageSize} from '../public/element-layout.js';

const base=JSON.parse(readFileSync(new URL('../public/initial-parameters.json',import.meta.url),'utf8'));
const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');

test('la base de altas conserva el modelo aprobado, sin archivos de identidad',()=>{
  const fresh=initialParameterSketch({inputs:{},layers:{},logos:{brand:[],brand2:[],crest:[]}},base);
  assert.equal(fresh.inputs['number-font'],'club-sc-internacional-2023');
  assert.equal(fresh.inputs['name-font'],'club-real-madrid-font-2024-2025');
  assert.equal(fresh.layers.brand.x,187);assert.equal(fresh.layers.brand.y,384);assert.equal(fresh.layers.brand.size,48);
  assert.equal(fresh.layers['back-number'].size,324);assert.equal(fresh.layers['back-number'].scaleY,0.7573772305983204);
  assert.equal(fresh.inputs['include-shorts'],true);assert.equal(fresh.inputs['include-socks'],true);assert.equal(fresh.inputs['cuffs-enabled'],false);
  assert.deepEqual(fresh.trimEdits,base.trimEdits);assert.deepEqual(fresh.layerStyles,base.layerStyles);
  assert.equal(fresh.backgroundMode,'none');assert.equal(fresh.customBackground,null);
  for(const type of ['brand','brand2','crest']){assert.deepEqual(fresh.logos[type],[]);assert.equal(fresh.inputs[type+'-select'],'');assert.equal(base.logoFiles[type],null);}
  assert(!/DELTA|Danubio|data:image/.test(JSON.stringify(base)));
});

function uploads(){
  const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',checked:false,options:[],replaceChildren(...options){this.options=options;},querySelector(){return {disabled:true};}});return nodes.get(id);};
  const old={width:200,height:100,src:'old'},image={width:100,height:200,src:'new'},oldLogo={id:'selected',name:'old.png',image:old};
  const state={logos:{brand:[oldLogo,{id:'obsolete',name:'unused.png',image:old}],brand2:[],crest:[]},layers:{brand:{x:187,y:384,size:100},'short-brand':{x:397,y:921,size:60}},visibleLayers:{brand:true},customBackground:old,backgroundMode:'custom'};
  node('brand-select').value='selected';
  const oldBlank={logos:{brand:[oldLogo],brand2:[],crest:[]},customBackground:old},other={logos:{brand:[oldLogo]},customBackground:old};
  const c=vm.createContext({state,activeSketchId:1,initialParameters:structuredClone(base),blankSketch:oldBlank,preferencesDirty:false,replacementImageSize,
    Option:function(textContent,value){this.textContent=textContent;this.value=value;},$:node,loadImage:async()=>image,fileData:async()=>'',recordHistory(){},selectLayer(){},rememberPreferences(){},render(){},scheduleWorkspaceSave(){},notice(){}});
  vm.runInContext(app.slice(app.indexOf('const assetUploadVersions='),app.indexOf('function graphicReplacementTarget(')),c);
  vm.runInContext(app.slice(app.indexOf('async function loadBackground('),app.indexOf('const sketchInputIds =')),c);
  return {c,state,node,oldBlank,other,old,image};
}

test('subir una marca reemplaza la biblioteca, conserva alto y actualiza cache/base sin tocar otro boceto',async()=>{
  const h=uploads();await h.c.loadLogoFile('brand',{name:'new.png',size:100,type:'image/png'});
  assert.equal(h.state.logos.brand.length,1);assert.equal(h.state.logos.brand[0].image,h.image);assert.equal(h.node('brand-select').options.length,2);
  assert.equal(h.state.layers.brand.size,50);assert.equal(h.state.layers.brand.x,187);assert.equal(h.state.layers['short-brand'].size,30);
  assert.equal(h.c.blankSketch.logos.brand.length,1);assert.equal(h.c.blankSketch.logos.brand[0].image,h.image);
  assert.equal(h.c.initialParameters.logoFiles.brand,'new.png');assert.equal(h.c.initialParameters.inputs['brand-select'],'selected');
  assert.equal(h.other.logos.brand[0].image,h.old);assert.equal(h.oldBlank.logos.brand[0].image,h.old);
  await h.c.loadLogoFile('brand',{name:'latest.png',size:100});assert.equal(h.state.logos.brand.length,1);assert.equal(h.node('brand-select').options.length,2);
});

test('un fondo reemplaza al anterior tambien para nuevos bocetos; un archivo fallido conserva el actual',async()=>{
  const h=uploads();await h.c.loadBackground({name:'new.png',size:100});
  assert.equal(h.state.customBackground,h.image);assert.equal(h.c.blankSketch.customBackground,h.image);assert.equal(h.other.customBackground,h.old);
  assert.equal(h.c.initialParameters.backgroundMode,'custom');assert.equal(h.c.initialParameters.inputs['background-select'],'custom');
  h.c.loadImage=async()=>{throw new Error('invalid');};await h.c.loadBackground({name:'bad.png',size:100});assert.equal(h.state.customBackground,h.image);
});

test('una carga demorada no se aplica al cambiar de boceto ni pisa una carga mas nueva',async()=>{
  for(const background of [false,true]){
    const h=uploads(),pending=[];h.c.loadImage=()=>new Promise(resolve=>pending.push(resolve));
    const load=file=>background?h.c.loadBackground(file):h.c.loadLogoFile('brand',file);
    const first=load({name:'first.png',size:100});await new Promise(resolve=>setImmediate(resolve));
    const second=load({name:'last.png',size:100});await new Promise(resolve=>setImmediate(resolve));
    pending[1](h.image);await second;pending[0](h.old);await first;
    assert.equal(background?h.state.customBackground:h.state.logos.brand[0].image,h.image);
    const third=load({name:'other.png',size:100});await new Promise(resolve=>setImmediate(resolve));h.c.activeSketchId=2;pending[2](h.old);await third;
    assert.equal(background?h.state.customBackground:h.state.logos.brand[0].image,h.image);
  }
});

test('la cache del historial libera archivos sin referencias y conserva los necesarios para deshacer',()=>{
  const old={src:'old'},current={src:'current'},closed={src:'closed'},historySourceIds=new Map([[old,1],[current,2],[closed,3],['unused-data-url',4]]);
  const editHistories=new Map([[1,{entries:[{snapshot:{logos:{brand:[{image:old}]} }},{snapshot:{customBackground:current}}]}]]);
  const c=vm.createContext({historySourceIds,editHistories,Set});
  vm.runInContext(app.slice(app.indexOf('function pruneHistorySources('),app.indexOf('function historyKey(')),c);
  c.pruneHistorySources();assert.equal(historySourceIds.size,2);assert(historySourceIds.has(old));assert(historySourceIds.has(current));
  editHistories.get(1).entries.shift();c.pruneHistorySources();assert.equal(historySourceIds.size,1);assert(historySourceIds.has(current));
});
