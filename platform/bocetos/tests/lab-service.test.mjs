import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {LabStore} from '../../core/bocetos/store.mjs';
import {createLabService} from '../../core/bocetos/service.mjs';

const input={name:'Empresa de prueba',username:'prueba.uno',password:'Clave-ficticia-123',expiresOn:'2026-10-19',credits:1};
async function fixture(store=new LabStore()){
  let now=Date.parse('2026-10-19T12:00:00Z');
  const lab=createLabService({store,clock:()=>now});
  const admin=await lab.setup({username:'admin.prueba',password:'Admin-ficticio-123'});
  const company=await lab.createCompany(admin.token,input,'alta-1');
  const user=await lab.login({...input,audience:'company',remember:true});
  return {lab,admin:admin.token,user:user.token,company,setTime:value=>{now=Date.parse(value);}};
}

test('alta y sesiones separan permisos y no exponen contraseñas',async()=>{
  const {lab,admin,user,company}=await fixture();
  assert.equal((await lab.session(user)).company.id,company.id);
  assert.equal((await lab.companies(admin)).length,1);
  await assert.rejects(lab.companies(user),{code:'permission_denied'});
  await assert.rejects(lab.setup({username:'otro',password:'Otra-ficticia-123'}),{code:'setup_completed'});
  await assert.rejects(lab.login({username:'inexistente',password:input.password}),{code:'invalid_credentials'});
  assert.ok(!JSON.stringify(await lab.companies(admin)).includes(input.password));
  const again=await lab.createCompany(admin,input,'alta-1');
  assert.equal(again.id,company.id);
  await assert.rejects(lab.createCompany(admin,{...input,name:'Otro'},'alta-1'),{code:'idempotency_conflict'});
});

test('vencimiento inclusivo de Montevideo bloquea sesión recordada y renovar recupera',async()=>{
  const {lab,admin,user,company,setTime}=await fixture();
  setTime('2026-10-20T02:59:59Z');
  assert.equal((await lab.session(user)).company.state,'active');
  setTime('2026-10-20T03:00:00Z');
  await assert.rejects(lab.session(user),{code:'subscription_expired'});
  const renewed=await lab.updateCompany(admin,company.id,{version:1,expiresOn:'2026-11-19',addCredits:0});
  assert.equal(renewed.remaining,1);
  assert.equal((await lab.session(user)).company.state,'active');
  await lab.updateCompany(admin,company.id,{version:renewed.version,suspended:true});
  await assert.rejects(lab.session(user),{code:'company_suspended'});
});

test('último crédito se reserva una vez entre solicitudes concurrentes',async()=>{
  const {lab,user}=await fixture();
  const result=await Promise.allSettled([lab.beginOperation(user,'generation','req-uno',{a:1}),lab.beginOperation(user,'generation','req-dos',{a:1})]);
  assert.equal(result.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(result.filter(r=>r.status==='rejected')[0].reason.code,'quota_exhausted');
  const operation=result.find(r=>r.status==='fulfilled').value;
  await assert.rejects(lab.beginOperation(user,'generation',operation.key,{a:2}),{code:'idempotency_conflict'});
  assert.equal((await lab.beginOperation(user,'generation',operation.key,{a:1})).id,operation.id);
  await lab.finishOperation(operation.id,{state:'succeeded',usage:{input_tokens:23,output_tokens:8}});
  const company=(await lab.session(user)).company;
  assert.equal(company.used,1);assert.equal(company.remaining,0);assert.equal(company.tokens,31);
});

test('fallo confirmado devuelve crédito; resultado ambiguo mantiene reserva',async()=>{
  const {lab,user}=await fixture();
  const failed=await lab.beginOperation(user,'generation','fallida',{});
  await lab.finishOperation(failed.id,{state:'failed'});
  assert.equal((await lab.session(user)).company.remaining,1);
  const uncertain=await lab.beginOperation(user,'generation','incierta',{});
  await lab.finishOperation(uncertain.id,{state:'unknown'});
  assert.equal((await lab.session(user)).company.remaining,0);
  assert.equal((await lab.beginOperation(user,'generation','incierta',{})).state,'unknown');
});

test('recursos y configuración son privados por empresa, y versión obsoleta rechaza',async()=>{
  const {lab,admin,user,company}=await fixture();
  const second=await lab.createCompany(admin,{...input,name:'Segunda',username:'prueba.dos'},'alta-2');
  const other=await lab.login({...input,username:'prueba.dos'});
  const asset=await lab.saveAsset(admin,company.id,{kind:'brand',name:'marca.png',data:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg=='});
  assert.equal((await lab.asset(user,asset.id)).mime,'image/png');
  await assert.rejects(lab.asset(other.token,asset.id),{code:'not_found'});
  await assert.rejects(lab.updateCompany(admin,second.id,{version:9,name:'Cambio'}),{code:'version_conflict'});
  await assert.rejects(lab.saveAsset(admin,company.id,{kind:'font',name:'mal.ttf',data:'data:font/ttf;base64,YWJjZA=='}),{code:'invalid_asset'});
});

test('reinicio conserva empresas, sesiones y recursos; contraseña se guarda como hash',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'sportex-lab-'));
  try{
    const file=join(dir,'state.json');const {lab,admin,user}=await fixture(new LabStore(file));
    const disk=await readFile(file,'utf8');assert.ok(!disk.includes(input.password));assert.ok(!disk.includes(admin));
    const restarted=createLabService({store:new LabStore(file),clock:()=>Date.parse('2026-10-19T12:00:00Z')});
    assert.equal((await restarted.session(user)).company.username,input.username);
    const [company]=await restarted.companies(admin);
    await restarted.updateCompany(admin,company.id,{version:1,password:'Nueva-ficticia-123'});
    await assert.rejects(restarted.session(user),{code:'authentication_required'});
  }finally{await rm(dir,{recursive:true,force:true});}
});

test('cargo oficial es global con claves compartidas; sincronizar reemplaza buckets repetidos',async()=>{
  const {lab,admin}=await fixture();
  assert.equal((await lab.costSummary(admin)).reportedCost,null);
  const bucket={start:1792368000,end:1792454400,keyId:'key-prueba-uno',lineItem:'images',currency:'usd',value:'0.000123'};
  await lab.recordCosts([bucket]);await lab.recordCosts([bucket]);
  assert.equal((await lab.costSummary(admin)).reportedCost,'0.000123');
  assert.equal((await lab.companies(admin))[0].reportedCost,undefined);
  await lab.recordCosts([{...bucket,value:'0.012345'}]);
  assert.equal((await lab.costSummary(admin)).reportedCost,'0.012345');
});

test('reinicio conserva llamadas pendientes como desconocidas sin reenviarlas',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'sportex-calls-'));
  try{
    const file=join(dir,'state.json'),{lab,admin,user,company}=await fixture(new LabStore(file));
    const op=await lab.beginOperation(user,'generation','interrumpida',{});
    await lab.beginProviderCall(op.id,{keySlot:'primary',model:'test-image',endpoint:'/v1/images/edits'});
    const restarted=createLabService({store:new LabStore(file),clock:()=>Date.parse('2026-10-19T12:00:00Z')});
    const replay=await restarted.beginOperation(user,'generation','interrumpida',{});
    assert.equal(replay.replayed,true);assert.equal(replay.state,'unknown');
    const {total,data:[call]}=await restarted.companyUsage(admin,company.id);
    assert.equal(total,1);assert.equal(call.outcome,'unknown');assert.equal(call.usage,null);
    assert.equal((await restarted.session(user)).company.reserved,1);
  }finally{await rm(dir,{recursive:true,force:true});}
});
