import test from 'node:test';
import assert from 'node:assert/strict';
import {LabStore} from '../../core/bocetos/store.mjs';
import {createLabService} from '../../core/bocetos/service.mjs';
import {createTrackedOpenAIFetch} from '../../core/bocetos/openai.mjs';

async function fixture(){
  const store=new LabStore(),lab=createLabService({store,clock:()=>Date.parse('2026-10-19T12:00:00Z')});
  const {token:admin}=await lab.setup({username:'admin.qa',password:'Admin-prueba-123'});
  const users=[];
  for(const name of ['primera','segunda']){
    const company=await lab.createCompany(admin,{name,username:name,password:'Empresa-prueba-123',expiresOn:'2026-11-19',credits:2},name);
    const {token}=await lab.login({username:name,password:'Empresa-prueba-123'});
    users.push({company,token});
  }
  return {store,lab,admin,users};
}
const endpoint='https://api.openai.com/v1/images/edits';
const response=(body,status=200,id='req-fixture')=>new Response(JSON.stringify(body),{status,headers:{'x-request-id':id,'content-type':'application/json'}});

test('cada llamada queda en su empresa aunque ambas compartan clave; no persiste secretos ni imágenes',async()=>{
  const {store,lab,admin,users}=await fixture();
  for(const [index,user] of users.entries()){
    const op=await lab.beginOperation(user.token,'generation','misma-clave',{tenantId:users[1-index].company.id});
    const fetchImpl=createTrackedOpenAIFetch({service:lab,operation:op,primaryKey:'fake-shared-secret',fetchImpl:async(_url,options)=>{
      assert.equal(new Headers(options.headers).get('authorization'),'Bearer fake-shared-secret');
      return response({usage:{input_tokens:10,output_tokens:20+index,total_tokens:30+index,input_tokens_details:{image_tokens:8,text_tokens:2}}});
    }});
    await fetchImpl(endpoint,{method:'POST',body:new URLSearchParams({model:'test-image',prompt:'private-prompt',image:'private-image'})});
    await lab.finishOperation(op.id,{state:'succeeded',usage:{total_tokens:999}});
    const history=await lab.companyUsage(admin,user.company.id);
    assert.equal(history.total,1);assert.equal(history.data[0].tenantId,user.company.id);
    assert.equal(history.data[0].operationId,op.id);assert.equal(history.data[0].actorId,op.actorId);
    assert.equal(history.data[0].keySlot,'primary');assert.equal(history.data[0].usage.total_tokens,30+index);
    assert.equal(history.data[0].providerRequestId,'req-fixture');assert.equal(history.data[0].model,'test-image');
    await assert.rejects(lab.companyUsage(user.token,user.company.id),{code:'permission_denied'});
  }
  const companies=await lab.companies(admin);assert.deepEqual(companies.map(c=>c.tokens),[30,31]);
  assert.deepEqual(companies.map(c=>c.apiCalls),[1,1]);
  const saved=JSON.stringify(await store.read());for(const secret of ['fake-shared-secret','private-prompt','private-image'])assert.ok(!saved.includes(secret));
});

test('rechazo de cuota usa respaldo una vez: dos llamadas, una generación; replay no reenvía',async()=>{
  const {lab,admin,users:[user]}=await fixture();const op=await lab.beginOperation(user.token,'generation','respaldo',{});
  const keys=[];const send=createTrackedOpenAIFetch({service:lab,operation:op,primaryKey:'primary-fixture',fallbackKey:'fallback-fixture',fetchImpl:async(_url,options)=>{
    keys.push(new Headers(options.headers).get('authorization'));
    return keys.length===1?response({error:{code:'insufficient_quota'}},429,'req-rejected'):response({usage:{total_tokens:57}},200,'req-ok');
  }});
  assert.equal((await send(endpoint,{body:new URLSearchParams({model:'test'})})).status,200);
  await lab.finishOperation(op.id,{state:'succeeded',usage:{total_tokens:57}});
  assert.deepEqual(keys,['Bearer primary-fixture','Bearer fallback-fixture']);
  const company=(await lab.session(user.token)).company;
  assert.equal(company.used,1);assert.equal(company.remaining,1);assert.equal(company.tokens,57);assert.equal(company.apiCalls,2);
  const history=await lab.companyUsage(admin,user.company.id);
  assert.deepEqual(history.data.map(c=>c.keySlot).sort(),['fallback','primary']);
  assert.equal((await lab.beginOperation(user.token,'generation','respaldo',{})).replayed,true);
  await assert.rejects(send(endpoint,{body:new URLSearchParams({model:'test'})}),{code:'invalid_operation'});
  assert.equal(keys.length,2);
});

test('corte de conexión no reintenta con respaldo y conserva consumo desconocido',async()=>{
  const {lab,admin,users:[user]}=await fixture();const op=await lab.beginOperation(user.token,'generation','corte',{});let count=0;
  const send=createTrackedOpenAIFetch({service:lab,operation:op,primaryKey:'primary',fallbackKey:'fallback',fetchImpl:async()=>{count++;throw new TypeError('fetch failed');}});
  await assert.rejects(send(endpoint,{body:new URLSearchParams({model:'test'})}));
  await lab.finishOperation(op.id,{state:'unknown'});
  const company=(await lab.session(user.token)).company;assert.equal(count,1);assert.equal(company.tokens,null);assert.equal(company.reserved,1);
  const {data:[call]}=await lab.companyUsage(admin,user.company.id);assert.equal(call.outcome,'unknown');assert.equal(call.usage,null);
});

test('rechazos ajenos a credenciales/cuota y claves iguales no activan respaldo',async()=>{
  for(const [status,primaryKey,fallbackKey] of [[400,'one','two'],[403,'one','two'],[429,'one','one'],[500,'one','two']]){
    const {lab,users:[user]}=await fixture();const op=await lab.beginOperation(user.token,'analysis','fallo',{});let count=0;
    const send=createTrackedOpenAIFetch({service:lab,operation:op,primaryKey,fallbackKey,fetchImpl:async()=>{count++;return response({error:{code:'fixture'}},status);}});
    await send(endpoint,{body:new URLSearchParams({model:'test'})});assert.equal(count,1);
  }
});
