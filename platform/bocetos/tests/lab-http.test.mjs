import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createEditorServer} from '../server.mjs';
import {LabStore} from '../../core/bocetos/store.mjs';
import {createLabService} from '../../core/bocetos/service.mjs';
import {fetchReportedCosts} from '../../core/bocetos/costs.mjs';

test('modo gestionado protege editor, datos y acciones administrativas con sesiones distintas',async()=>{
  let now=Date.parse('2026-10-19T12:00:00Z');
  const lab=createLabService({store:new LabStore(),clock:()=>now});
  const server=createEditorServer({lab});server.listen(0,'127.0.0.1');await once(server,'listening');
  const base=`http://127.0.0.1:${server.address().port}`;
  async function request(path,{cookie,body,origin=base,key='http-1'}={}){
    return fetch(base+path,{method:body?'POST':'GET',redirect:'manual',headers:{...(cookie?{cookie}:{}),...(body?{'content-type':'application/json',origin,'idempotency-key':key}:{})},...(body?{body:JSON.stringify(body)}:{})});
  }
  try{
    assert.equal((await request('/')).status,302);
    assert.equal((await request('/api/lab/session')).status,401);
    assert.equal((await request('/admin')).status,200);
    const setup=await request('/api/lab/setup',{body:{username:'admin.qa',password:'Admin-prueba-123'}});assert.equal(setup.status,200);
    const admin=setup.headers.get('set-cookie').split(';')[0];assert.match(setup.headers.get('set-cookie'),/HttpOnly/);
    assert.ok(!(await setup.text()).includes('token'));
    const added=await request('/api/lab/admin/companies',{cookie:admin,body:{name:'QA Empresa',username:'empresa.qa',password:'Empresa-prueba-123',expiresOn:'2026-10-19',credits:2}});
    assert.equal(added.status,201);const company=(await added.json()).data;
    assert.equal((await request('/api/lab/admin/companies',{cookie:admin,origin:'https://ajeno.example',body:{}})).status,403);
    const login=await request('/api/lab/login',{body:{username:'empresa.qa',password:'Empresa-prueba-123',remember:true,audience:'company'}});
    assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];assert.match(login.headers.get('set-cookie'),/Max-Age=2592000/);
    assert.equal((await request('/',{cookie})).status,200);
    assert.equal((await request('/api/lab/admin/companies',{cookie})).status,401);
    assert.equal((await request('/api/generate',{body:{}})).status,401);
    now=Date.parse('2026-10-20T03:00:00Z');
    const expired=await request('/api/lab/session',{cookie});assert.equal(expired.status,403);assert.equal((await expired.json()).code,'subscription_expired');
    const renewed=await request(`/api/lab/admin/companies/${company.id}`,{cookie:admin,body:{version:1,expiresOn:'2026-11-19',addCredits:0}});assert.equal(renewed.status,200);
    assert.equal((await request('/api/lab/session',{cookie})).status,200);
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test('Costs API pagina por clave y conserva importes pequeños sin duplicar la consulta',async()=>{
  const urls=[];const fetchImpl=async url=>{
    urls.push(String(url));const next=urls.length===1;
    return {ok:true,json:async()=>({data:[{start_time:100,end_time:200,results:[{api_key_id:next?'key-a':'key-b',amount:{currency:'usd',value:next?0.000123:0.02},line_item:'images'}]}],has_more:next,next_page:next?'pagina2':null})};
  };
  const result=await fetchReportedCosts({adminKey:'fake-admin',start:100,end:200,apiKeyIds:['key-a','key-b'],fetchImpl});
  assert.equal(result.length,2);assert.equal(result[0].value,'0.000123');
  assert.match(urls[0],/group_by=api_key_id/);assert.match(urls[1],/page=pagina2/);
  assert.deepEqual(new URL(urls[0]).searchParams.getAll('api_key_ids'),['key-a','key-b']);
  await assert.rejects(fetchReportedCosts({adminKey:null,start:100,end:200,fetchImpl}),/configurar/);
});
