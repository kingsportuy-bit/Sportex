import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {once} from 'node:events';
import {createEditorServer} from '../server.mjs';
import {LabStore} from '../../core/bocetos/store.mjs';
import {createLabService} from '../../core/bocetos/service.mjs';

const reference='data:image/png;base64,eA==',mock='data:image/png;base64,eQ==';
const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');

// Exercise the actual browser packet builder. Only canvas/image availability
// is supplied here; all fixed IDs come from the editor itself.
function editorContext(){
  const fixed=app.match(/const fixedLayerKeys = [^;]+;/)[0];
  const build=app.slice(app.indexOf('function buildReferenceDetailContext('),app.indexOf('function validateReferenceExtras('));
  const scope=vm.createContext({
    state:{view:'plain',sponsors:[],visibleLayers:{},layerStyles:{},layers:{}},
    $:()=>({checked:true}),layerBounds:()=>({width:40,height:40}),
    attachmentFor:id=>({side:id.startsWith('back-')||id==='brand2'?'back':'front',piece:id.startsWith('short-')?'short':'shirt'}),
    referenceStructure:()=>'',referenceVariantId:()=>null,render(){},
    referenceThumbnail:()=>mock,canvas:{}
  });
  vm.runInContext(`${fixed}\nfor(const id of fixedLayerKeys)state.layers[id]={size:48};\n${build}`,scope);
  return JSON.parse(JSON.stringify(vm.runInContext('buildReferenceDetailContext().context',scope)));
}

test('the editor packet with Logo2 reaches vision using the uploaded reference and returns usable colors',async()=>{
  const lab=createLabService({store:new LabStore(),clock:()=>Date.parse('2026-10-20T12:00:00Z')});
  const {token:admin}=await lab.setup({username:'admin.qa',password:'Admin-prueba-123'});
  await lab.createCompany(admin,{name:'Prueba',username:'empresa.qa',password:'Empresa-prueba-123',expiresOn:'2026-11-20',credits:1},'alta');
  const {token}=await lab.login({username:'empresa.qa',password:'Empresa-prueba-123'});
  const context=editorContext();
  assert(context.elements.some(e=>e.id==='brand2'&&e.side==='back'));
  let calls=0;
  const server=createEditorServer({lab,env:{OPENAI_API_KEY:'fake-shared'},imageFetch:async(_url,options)=>{
    calls++;
    const request=JSON.parse(options.body),images=request.input[0].content.filter(c=>c.type==='input_image');
    assert.deepEqual(images.map(i=>i.image_url),[reference,mock]);
    assert(request.input[0].content.some(c=>c.text?.includes('CURRENT MOCK')));
    const colors={neck:'#123456',cuffs:null,frontNumber:null,backNumber:null,shortNumber:null,name:'#aabbcc',brand:'#abcdef',shortBrand:null,short:null,socks:null};
    const outlines=Object.fromEntries(context.elements.map(({id})=>[id,id==='brand2'?null:{enabled:false,color:'#000000',width:2,certainty:'observed'}]));
    outlines.brand={enabled:true,color:'#102030',width:3,certainty:'observed'};
    return new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({colors,outlines,textures:{}})}]}],usage:{input_tokens:11,output_tokens:4,total_tokens:15}}));
  }});
  server.listen(0,'127.0.0.1');await once(server,'listening');
  const base=`http://127.0.0.1:${server.address().port}`;
  const request=(key,detail=context)=>fetch(base+'/api/reference-colors',{method:'POST',headers:{cookie:`sportex_lab=${token}`,origin:base,'idempotency-key':key,'content-type':'application/json'},body:JSON.stringify({reference,context:detail})});
  try{
    const response=await request('logo2'),result=await response.json();
    assert.equal(response.status,200,JSON.stringify(result));
    assert.equal(result.colors.name,'#aabbcc');assert.equal(result.colors.brand,'#abcdef');
    assert.deepEqual(result.outlines.brand2,{enabled:true,color:'#102030',width:3,certainty:'inferred'});
    assert.equal(calls,1);
    const scope=vm.createContext({referenceColorFields:{neck:[],cuffs:[],frontNumber:[],backNumber:[],shortNumber:[],name:[],brand:[],shortBrand:[],short:[],socks:[]},result,context});
    vm.runInContext(app.slice(app.indexOf('function validateReferenceExtras('),app.indexOf('function applyReferenceExtras(')),scope);
    vm.runInContext('validateReferenceExtras(result,context)',scope);
    const denied=await request('unknown',{...context,elements:[{id:'not-an-editor-element',side:'front',piece:'front',size:48}]});
    assert.equal(denied.status,400);assert.equal(calls,1);
    const [company]=await lab.companies(admin);assert.equal(company.apiCalls,1);assert.equal(company.tokens,15);assert.equal(company.used,0);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
