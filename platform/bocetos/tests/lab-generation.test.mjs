import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createEditorServer} from '../server.mjs';
import {LabStore} from '../../core/bocetos/store.mjs';
import {createLabService} from '../../core/bocetos/service.mjs';
import {compactAtlas} from '../public/atlas-layout.js';
import {registrationVersion,fittedRectangleVersion} from '../public/artwork-registration.js';

test('generación gestionada usa clave compartida, registra llamada por empresa y replay no repite proveedor',async()=>{
  const lab=createLabService({store:new LabStore(),clock:()=>Date.parse('2026-10-19T12:00:00Z')});
  const {token:admin}=await lab.setup({username:'admin.qa',password:'Admin-prueba-123'});
  const company=await lab.createCompany(admin,{name:'Prueba',username:'empresa.qa',password:'Empresa-prueba-123',expiresOn:'2026-11-19',credits:1},'alta');
  const {token}=await lab.login({username:'empresa.qa',password:'Empresa-prueba-123'});
  let calls=0;
  const server=createEditorServer({lab,env:{OPENAI_API_KEY:'fake-shared-key'},imageFetch:async(_url,options)=>{
    calls++;assert.equal(new Headers(options.headers).get('authorization'),'Bearer fake-shared-key');
    return new Response(JSON.stringify({data:[{b64_json:'eA=='}],usage:{total_tokens:123}}),{headers:{'x-request-id':'req-generation'}});
  }});
  server.listen(0,'127.0.0.1');await once(server,'listening');const base=`http://127.0.0.1:${server.address().port}`;
  const tiles=['front','back','right','left'],patterns=[{x:100,y:250,width:300,height:500},{x:600,y:250,width:310,height:510},{x:20,y:320,width:85,height:150},{x:450,y:320,width:90,height:145}];
  const packed=compactAtlas(tiles,Object.fromEntries(tiles.map((piece,i)=>[piece,patterns[i]])));
  const image='data:image/png;base64,eA==';
  const body={mock:image,reference:image,mask:image,width:1024,height:1024,parts:['shirt'],layout:{...packed,tiles,columns:2,rows:2,separator:'#00ff00',registration:registrationVersion,outputShape:fittedRectangleVersion,bleed:0}};
  const request=(key,payload=body)=>fetch(base+'/api/generate',{method:'POST',headers:{cookie:`sportex_lab=${token}`,origin:base,'idempotency-key':key,'content-type':'application/json'},body:JSON.stringify(payload)});
  try{
    const first=await request('generar-1');assert.equal(first.status,200,JSON.stringify(await first.clone().json()));assert.equal((await first.json()).remaining,0);
    const repeated=await request('generar-1');assert.equal(repeated.status,200);assert.equal(calls,1);
    const next=await request('generar-2');assert.equal(next.status,409);assert.equal((await next.json()).code,'quota_exhausted');assert.equal(calls,1);
    const [result]=await lab.companies(admin);assert.equal(result.used,1);assert.equal(result.tokens,123);assert.equal(result.apiCalls,1);
    const history=await fetch(base+`/api/lab/admin/companies/${company.id}/usage`,{headers:{cookie:`sportex_lab_admin=${admin}`}});
    assert.equal(history.status,200);assert.equal((await history.json()).data[0].providerRequestId,'req-generation');
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test('análisis con clave compartida mantiene caché por empresa y registra también resultados inválidos',async()=>{
  const lab=createLabService({store:new LabStore(),clock:()=>Date.parse('2026-10-19T12:00:00Z')});
  const {token:admin}=await lab.setup({username:'admin.qa',password:'Admin-prueba-123'});const users=[];
  for(const username of ['primera.qa','segunda.qa']){
    const company=await lab.createCompany(admin,{name:username,username,password:'Empresa-prueba-123',expiresOn:'2026-11-19',credits:2},username);
    const {token}=await lab.login({username,password:'Empresa-prueba-123'});users.push({company,token});
  }
  let calls=0;
  const colors=Object.fromEntries(['neck','cuffs','frontNumber','backNumber','shortNumber','name','brand','shortBrand','short','socks'].map(k=>[k,'#123456']));
  const server=createEditorServer({lab,env:{OPENAI_API_KEY:'fake-shared'},imageFetch:async()=>{
    calls++;return new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(calls===3?{invalid:true}:colors)}]}],usage:{input_tokens:11,output_tokens:4,total_tokens:15}}));
  }});
  server.listen(0,'127.0.0.1');await once(server,'listening');const base=`http://127.0.0.1:${server.address().port}`;
  const request=(user,key,reference='data:image/png;base64,eA==')=>fetch(base+'/api/reference-colors',{method:'POST',headers:{cookie:`sportex_lab=${user.token}`,origin:base,'idempotency-key':key,'content-type':'application/json'},body:JSON.stringify({reference,tenantId:users[1].company.id})});
  try{
    assert.equal((await request(users[0],'first')).status,200);
    const cached=await request(users[0],'cached');assert.equal((await cached.json()).cached,true);assert.equal(calls,1);
    assert.equal((await request(users[1],'other')).status,200);assert.equal(calls,2);
    assert.equal((await request(users[0],'invalid','data:image/png;base64,eQ==')).status,502);assert.equal(calls,3);
    const companies=await lab.companies(admin);assert.deepEqual(companies.map(c=>c.apiCalls),[2,1]);assert.deepEqual(companies.map(c=>c.tokens),[30,15]);
    const denied=await fetch(base+`/api/lab/admin/companies/${users[1].company.id}/usage`,{headers:{cookie:`sportex_lab_admin=${users[0].token}`}});assert.equal(denied.status,403);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
