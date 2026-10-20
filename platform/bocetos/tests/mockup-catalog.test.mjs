import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {LabStore} from '../../core/bocetos/store.mjs';
import {createLabService} from '../../core/bocetos/service.mjs';
import {createEditorServer} from '../server.mjs';
import {initialParameterSketch} from '../public/element-layout.js';
import {mockupParameters,mockupSnapshot,companyMockupParameters} from '../public/mockup-config.js';
import {SqliteLabStore} from '../../core/bocetos/sqlite-store.mjs';
const factory=JSON.parse(readFileSync(new URL('../public/initial-parameters.json',import.meta.url),'utf8'));
async function fixture(file){
  const service=createLabService({store:new LabStore(file),clock:()=>Date.parse('2026-10-20T12:00:00Z'),mockupDefaults:factory});
  const {token:admin}=await service.setup({username:'admin.qa',password:'Admin-prueba-123'});
  await service.createCompany(admin,{name:'Prueba',username:'empresa.qa',password:'Empresa-prueba-123',expiresOn:'2026-11-20',credits:1},'create');
  const {token:company}=await service.login({username:'empresa.qa',password:'Empresa-prueba-123'});
  return {service,admin,company};
}
test('draft is isolated; publish is versioned and old sketches retain their own base',async()=>{
  const {service,admin,company}=await fixture();
  const [before]=await service.mockups(company),old=mockupSnapshot(before,factory);
  const draft=await service.mockupDraft(admin,'football-basic');
  const parameters=structuredClone(draft.draft.parameters);parameters.layers['back-name'].y=350;parameters.inputs['cuffs-enabled']=true;parameters.inputs['trim-shirt-side-enabled']=true;
  const saved=await service.saveMockup(admin,draft.id,{version:draft.version,...draft.draft,parameters});
  assert.equal((await service.mockups(company))[0].parameters.layers['back-name'].y,377.1402248768759);
  await assert.rejects(service.saveMockup(admin,draft.id,{version:draft.version,...draft.draft}),e=>e.code==='version_conflict');
  await assert.rejects(service.publishMockup(company,draft.id,{version:saved.version}),e=>e.code==='permission_denied');
  await service.publishMockup(admin,draft.id,{version:saved.version});
  const [published]=await service.mockups(company);
  assert.equal(published.revision,2);assert.equal(published.parameters.layers['back-name'].y,350);
  const blank={inputs:{},layers:{},logos:{brand:[],brand2:[],crest:[]},visibleLayers:{},sponsors:[]};
  const fresh=initialParameterSketch(blank,mockupParameters(published,factory));
  assert.equal(fresh.layers['back-name'].y,350);assert.equal(fresh.inputs['cuffs-enabled'],true);assert.equal(fresh.inputs['trim-shirt-side-enabled'],true);
  assert.equal(old.revision,1);assert.equal(old.parameters.layers['back-name'].y,377.1402248768759);
});
test('new configurations remain drafts and survive restarting the JSON store',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'sportex-mockups-'));
  try{
    const file=join(dir,'state.json'),{service,admin,company}=await fixture(file);
    const created=await service.createMockup(admin,{name:'Solo camiseta',sourceId:'football-basic'});
    assert.equal((await service.mockups(company)).length,1);
    const options={...created.draft.options,shorts:false,socks:false};
    const saved=await service.saveMockup(admin,created.id,{version:created.version,...created.draft,options});
    await service.publishMockup(admin,created.id,{version:saved.version});
    const restarted=createLabService({store:new LabStore(file),mockupDefaults:factory});
    const list=await restarted.mockups(company),model=list.find(m=>m.id===created.id);
    assert.equal(list.length,2);assert.equal(model.name,'Solo camiseta');
    const parameters=mockupParameters(model,factory);assert.equal(parameters.inputs['include-shorts'],false);assert.equal(parameters.inputs['include-socks'],false);
    assert.equal(factory.inputs['include-shorts'],true);
    await assert.rejects(service.mockupDraft(company,created.id),e=>e.code==='permission_denied');
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('invalid geometry, embedded files and unsupported fonts cannot become global defaults',async()=>{
  const {service,admin}=await fixture(),draft=await service.mockupDraft(admin,'football-basic');
  for(const patch of [p=>p.layers.brand.size=-1,p=>p.layers.brand.scaleX=0,p=>p.inputs['number-font']='custom-private-font',p=>p.inputs['api-token']='secret',p=>p.logoFiles.brand='data:image/png;base64,abcd']){
    const parameters=structuredClone(factory);patch(parameters);
    await assert.rejects(service.saveMockup(admin,draft.id,{version:draft.version,...draft.draft,parameters}),e=>['invalid_mockup','invalid_mockup_font'].includes(e.code));
  }
  const parameters=structuredClone(factory);parameters.logoFiles.brand='company-file';parameters.inputs['brand-select']='company-id';
  const saved=await service.saveMockup(admin,draft.id,{version:draft.version,...draft.draft,parameters});
  assert.equal(saved.draft.parameters.logoFiles.brand,null);assert.equal(saved.draft.parameters.inputs['brand-select'],'');
});
test('HTTP protects draft editor and mutations; company sees only published configurations',async()=>{
  const {service,admin,company}=await fixture();
  const server=createEditorServer({lab:service});server.listen(0,'127.0.0.1');await once(server,'listening');
  const base=`http://127.0.0.1:${server.address().port}`;
  const request=(path,cookie,body,origin=base)=>fetch(base+path,{headers:{cookie,...(body?{origin,'content-type':'application/json'}:{})},...(body?{method:'POST',body:JSON.stringify(body)}:{}),redirect:'manual'});
  try{
    assert.equal((await request('/admin/mockups/football-basic/editor','')).status,401);
    assert.equal((await request('/admin/mockups/football-basic/editor',`sportex_lab=${company}`)).status,401);
    const editor=await request('/admin/mockups/football-basic/editor',`sportex_lab_admin=${admin}`);assert.equal(editor.status,200);assert((await editor.text()).includes('/app.js'));
    const draft=await request('/api/lab/admin/mockups',`sportex_lab=${company}`);assert.equal(draft.status,401);
    const published=await request('/api/lab/mockups',`sportex_lab=${company}`);assert.equal(published.status,200);assert.equal((await published.json()).data[0].revision,1);
    const csrf=await request('/api/lab/admin/mockups',`sportex_lab_admin=${admin}`,{name:'Ajeno'},'https://bad.example');assert.equal(csrf.status,403);
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test('SQLite backup retains catalog revisions and company configuration stays separate',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'sportex-mockup-db-'));let store,restored;
  try{
    store=new SqliteLabStore(join(dir,'lab.sqlite'));const service=createLabService({store,mockupDefaults:factory});
    const {token:admin}=await service.setup({username:'admin.qa',password:'Admin-prueba-123'});
    const draft=await service.mockupDraft(admin,'football-basic');
    const parameters=structuredClone(factory);parameters.layers.brand.x=202;
    const saved=await service.saveMockup(admin,draft.id,{version:1,...draft.draft,parameters});
    await service.publishMockup(admin,draft.id,{version:saved.version});
    const backup=await store.snapshot(join(dir,'backups'));await store.close();
    restored=new SqliteLabStore(backup);const restarted=createLabService({store:restored,mockupDefaults:factory});
    const record=await restarted.mockupDraft(admin,draft.id);assert.equal(record.published.revision,2);assert.equal(record.published.parameters.layers.brand.x,202);assert.equal(record.revisions[0].revision,1);
    const settings={numberFont:'club-fixture-font',initialParameters:{...factory,layers:{...factory.layers,brand:{x:999,y:333,size:30}}}};
    const company=companyMockupParameters(record.published,factory,settings,[{kind:'brand',name:'Empresa.png'}]);
    assert.equal(company.layers.brand.x,202);assert.equal(company.inputs['number-font'],'club-fixture-font');assert.equal(company.logoFiles.brand,'Empresa.png');
    assert.equal(record.published.parameters.logoFiles.brand,null);
  }finally{await store?.close();await restored?.close();await rm(dir,{recursive:true,force:true});}
});
