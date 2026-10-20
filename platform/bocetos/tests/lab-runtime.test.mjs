import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {request as httpRequest} from 'node:http';
import {SqliteLabStore} from '../../core/bocetos/sqlite-store.mjs';
import {createLabService} from '../../core/bocetos/service.mjs';
import {createEditorServer} from '../server.mjs';

test('SQLite exclusivo conserva sesiones, blobs y reservas; backup restaura sin reenviar',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'sportex-sqlite-'));let store,restored;
  try{
    store=new SqliteLabStore(join(dir,'lab.sqlite'));const lab=createLabService({store});
    const {token:admin}=await lab.setup({username:'admin.test',password:'Fixture-admin-2026'});
    const company=await lab.createCompany(admin,{name:'Fixture',username:'empresa.test',password:'Fixture-empresa-2026',expiresOn:'2099-01-01',credits:1},'alta');
    const {token}=await lab.login({username:'empresa.test',password:'Fixture-empresa-2026'});
    const op=await lab.beginOperation(token,'generation','pending',{});
    await lab.beginProviderCall(op.id,{keySlot:'primary',model:'test',endpoint:'/v1/images/edits'});
    await assert.rejects(new SqliteLabStore(join(dir,'lab.sqlite')).read(),/locked/);
    const id='11111111-1111-4111-8111-111111111111';await store.putBlob(id,Buffer.from('fixture'));
    const backup=await store.snapshot(join(dir,'backups'));await store.close();
    restored=new SqliteLabStore(backup);const other=createLabService({store:restored});
    assert.equal((await other.session(token)).company.remaining,0);
    assert.equal((await other.beginOperation(token,'generation','pending',{})).state,'unknown');
    assert.equal((await other.companyUsage(admin,company.id)).data[0].outcome,'unknown');
    assert.equal((await restored.getBlob(id)).toString(),'fixture');
  }finally{await store?.close();await restored?.close();await rm(dir,{recursive:true,force:true});}
});

test('runtime HTTPS separa dominios y cookies, cierra setup y rechaza origen ajeno',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'sportex-https-')),store=new SqliteLabStore(join(dir,'lab.sqlite'));
  const lab=createLabService({store});await lab.setup({username:'admin.test',password:'Fixture-admin-2026'});
  const env={NODE_ENV:'production',SPORTEX_LAB_URL:'https://lab.example.test',SPORTEX_PANEL_URL:'https://panel.example.test',SPORTEX_RELEASE:'fixture'};
  const server=createEditorServer({lab,env});server.listen(0,'127.0.0.1');await once(server,'listening');const base=`http://127.0.0.1:${server.address().port}`;
  const request=(path,{host='panel.example.test',body,origin=`https://${host}`,cookie}={})=>new Promise((resolve,reject)=>{
    const req=httpRequest(base+path,{method:body?'POST':'GET',headers:{host,'x-forwarded-proto':'https',...(body?{origin,'content-type':'application/json'}:{}),...(cookie?{cookie}:{})}},res=>{
      const chunks=[];res.on('data',chunk=>chunks.push(chunk));res.on('end',()=>resolve(new Response(Buffer.concat(chunks),{status:res.statusCode,headers:res.headers})));
    });req.on('error',reject);req.end(body?JSON.stringify(body):undefined);
  });
  try{
    assert.equal((await request('/',{})).headers.get('location'),'/admin');
    assert.equal((await request('/admin',{host:'lab.example.test'})).status,404);
    assert.equal((await request('/api/lab/setup',{body:{username:'intruso',password:'Fixture-other-2026'}})).status,404);
    assert.equal((await request('/api/lab/session',{host:'evil.test'})).status,403);
    const credentials={username:'admin.test',password:'Fixture-admin-2026',audience:'admin',remember:true};
    assert.equal((await request('/api/lab/login',{origin:'https://evil.test',body:credentials})).status,403);
    const login=await request('/api/lab/login',{body:credentials});assert.equal(login.status,200);
    const cookie=login.headers.get('set-cookie');assert.match(cookie,/__Host-sportex_lab_admin=/);assert.match(cookie,/Secure/);assert.match(cookie,/HttpOnly/);assert.doesNotMatch(cookie,/Domain=/);
    assert.equal((await request('/api/lab/admin/companies',{cookie:cookie.split(';')[0]})).status,200);
    assert.equal((await request('/api/lab/admin/companies',{host:'lab.example.test',cookie:cookie.split(';')[0]})).status,404);
    assert.equal((await request('/ready',{host:'127.0.0.1'})).status,200);
  }finally{await new Promise(resolve=>server.close(resolve));await store.close();await rm(dir,{recursive:true,force:true});}
});
