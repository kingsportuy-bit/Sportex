import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,readFile,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {randomUUID} from 'node:crypto';
import {LabStore} from '../../core/bocetos/store.mjs';
import {SqliteLabStore} from '../../core/bocetos/sqlite-store.mjs';
import {createLabService} from '../../core/bocetos/service.mjs';
import {createEditorServer} from '../server.mjs';

const input={name:'Empresa a eliminar',username:'eliminar.fixture',password:'Fixture-empresa-2026',expiresOn:'2099-01-01',credits:4};
const image={kind:'brand',name:'marca.png',data:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg=='};
async function fixture(store=new LabStore()){
  const lab=createLabService({store}),{token:admin}=await lab.setup({username:'admin.fixture',password:'Fixture-admin-2026'});
  const company=await lab.createCompany(admin,input,'alta'),{token:user}=await lab.login(input);
  const confirmation={version:company.version,confirmation:company.username};
  return {store,lab,admin,user,company,confirmation};
}

for(const adapter of ['memory','json','sqlite'])test(`eliminar purga datos y archivos, revoca sesiones y conserva otra empresa / ${adapter}`,async()=>{
  const dir=await mkdtemp(join(tmpdir(),'sportex-delete-'));let store,reopened;
  try{
    store=adapter==='sqlite'?new SqliteLabStore(join(dir,'lab.sqlite')):new LabStore(adapter==='json'?join(dir,'state.json'):null);
    const {lab,admin,user,company,confirmation}=await fixture(store);
    const other=await lab.createCompany(admin,{...input,name:'Empresa conservada',username:'conservar.fixture'},'otra');
    const {token:otherUser}=await lab.login({...input,username:other.username});
    const otherAsset=await lab.saveAsset(admin,other.id,image);
    const otherOp=await lab.beginOperation(otherUser,'generation','generacion-otra',{});
    await lab.finishOperation(otherOp.id,{state:'succeeded',result:{image:'otra-imagen'}});
    const oldAsset=await lab.saveAsset(admin,company.id,image);
    const asset=await lab.saveAsset(admin,company.id,{...image,name:'marca-nueva.png'});
    await assert.rejects(store.getBlob(oldAsset.id)); // Replacement removes bytes as well as metadata.
    const font=await lab.saveAsset(admin,company.id,{kind:'font',name:'Fuente.otf',data:'data:font/otf;base64,T1RUTw=='});
    const op=await lab.beginOperation(user,'generation','generacion',{});
    const call=await lab.beginProviderCall(op.id,{keySlot:'primary',model:'fixture',endpoint:'/v1/images/edits'});
    await lab.finishProviderCall(op.id,call.id,{outcome:'succeeded',providerRequestId:'request-to-delete',usage:{total_tokens:123}});
    const finished=await lab.finishOperation(op.id,{state:'succeeded',result:{image:'imagen-a-borrar'}});
    await lab.updateCompany(admin,company.id,{version:1,settings:{nameFont:'fuente-privada'}});
    const bucket={start:100,end:200,keyId:'shared-key',currency:'usd',value:'0.02'};await lab.recordCosts([bucket]);
    await store.transaction(db=>{db.costs.push({...bucket,tenantId:company.id});});
    // Simulate an orphan left by a previous release, whose metadata no longer exists.
    const orphan=randomUUID();await store.putBlob(orphan,Buffer.from('old orphan'));
    const users=(await store.read()).users.filter(u=>u.tenantId===company.id).map(u=>u.id);
    const beforeOther=(await lab.companies(admin)).find(c=>c.id===other.id);
    let backup;
    if(adapter==='sqlite')backup=await store.snapshot(join(dir,'backups'));
    else{backup=join(dir,'backups-preserved.txt');await writeFile(backup,'previous backup');}
    const backupBytes=await readFile(backup);
    await lab.deleteCompany(admin,company.id,{...confirmation,version:2});
    assert.deepEqual(await lab.deleteCompany(admin,company.id,{...confirmation,version:2}),{ok:true}); // Safe retry after lost response.
    const after=await store.read(),serialized=JSON.stringify(after);
    for(const value of [company.id,company.username,company.name,asset.id,font.id,op.id,call.id,finished.resultRef,...users,'request-to-delete','fuente-privada'])assert.ok(!serialized.includes(value),`leftover: ${value}`);
    assert.equal(after.sessions.length,2);assert.equal(after.idempotency.length,1);
    for(const id of [asset.id,font.id,finished.resultRef,orphan])await assert.rejects(store.getBlob(id));
    await assert.rejects(lab.session(user),{code:'authentication_required'});
    await assert.rejects(lab.login(input),{code:'invalid_credentials'});
    await assert.rejects(lab.saveAsset(admin,company.id,image),{code:'not_found'});
    await assert.rejects(lab.finishOperation(op.id,{state:'succeeded',result:{image:'late'}}),{code:'not_found'});
    assert.deepEqual((await lab.companies(admin)).find(c=>c.id===other.id),beforeOther);
    assert.ok((await lab.asset(otherUser,otherAsset.id)).bytes.length);
    assert.deepEqual(await lab.operationResult(otherUser,otherOp.id),{image:'otra-imagen'});
    assert.equal((await lab.costSummary(admin)).reportedCost,'0.02');
    assert.deepEqual(await readFile(backup),backupBytes);
    const recreated=await lab.createCompany(admin,input,'alta');assert.notEqual(recreated.id,company.id);assert.deepEqual(recreated.assets,[]);assert.equal(recreated.used,0);
    await assert.rejects(lab.session(user),{code:'authentication_required'});
    if(adapter==='sqlite'){
      await store.close();reopened=new SqliteLabStore(join(dir,'lab.sqlite'));
      assert.equal((await reopened.read()).companies.length,2);await assert.rejects(reopened.getBlob(asset.id));await reopened.close();
      reopened=new SqliteLabStore(backup);assert.ok((await reopened.read()).companies.some(c=>c.id===company.id));assert.ok((await reopened.getBlob(asset.id)).length);
    }else if(adapter==='json'){
      reopened=new LabStore(join(dir,'state.json'));assert.equal((await reopened.read()).companies.length,2);
      const files=await readdir(join(dir,'assets'));assert.equal(files.length,2);assert.ok(!files.includes(asset.id));
    }
  }finally{await store?.close?.();await reopened?.close?.();await rm(dir,{recursive:true,force:true});}
});

test('eliminar exige administrador, usuario exacto y versión actual, sin efectos al rechazar',async()=>{
  const {store,lab,admin,user,company,confirmation}=await fixture();const before=await store.read();
  await assert.rejects(lab.deleteCompany('',company.id,confirmation),{code:'authentication_required'});
  await assert.rejects(lab.deleteCompany(user,company.id,confirmation),{code:'permission_denied'});
  await assert.rejects(lab.deleteCompany(admin,company.id,{...confirmation,confirmation:'otra.fixture'}),{code:'confirmation_required'});
  await assert.rejects(lab.deleteCompany(admin,company.id,{version:1}),{code:'confirmation_required'});
  await assert.rejects(lab.deleteCompany(admin,company.id,null),{code:'confirmation_required'});
  await assert.rejects(lab.deleteCompany(admin,company.id,{...confirmation,version:0}),{code:'version_conflict'});
  assert.deepEqual(await store.read(),before);
});

test('generación o llamada en curso impide borrar; desconocida terminada se puede purgar',async()=>{
  const {lab,admin,user,company,confirmation}=await fixture();
  const op=await lab.beginOperation(user,'generation','pendiente',{});
  const call=await lab.beginProviderCall(op.id,{keySlot:'primary',model:'fixture',endpoint:'/v1/images/edits'});
  await assert.rejects(lab.deleteCompany(admin,company.id,confirmation),{code:'operation_busy'});
  await lab.finishOperation(op.id,{state:'unknown'});
  await assert.rejects(lab.deleteCompany(admin,company.id,confirmation),{code:'operation_busy'});
  await lab.finishProviderCall(op.id,call.id,{outcome:'unknown'});
  assert.deepEqual(await lab.deleteCompany(admin,company.id,confirmation),{ok:true});
});

test('subida y finalización tardías no recrean blobs después de eliminar',async()=>{
  const {store,lab,admin,user,company,confirmation}=await fixture();
  const op=await lab.beginOperation(user,'analysis','incierta',{});await lab.finishOperation(op.id,{state:'unknown'});
  const results=await Promise.allSettled([lab.deleteCompany(admin,company.id,confirmation),lab.saveAsset(admin,company.id,image),lab.finishOperation(op.id,{state:'succeeded',result:{image:'late'}})]);
  assert.deepEqual(results.map(r=>r.status),['fulfilled','rejected','rejected']);assert.equal(store.blobs.size,0);
});

test('SQLite revierte metadatos y blobs juntos ante un fallo de borrado',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'sportex-delete-rollback-')),store=new SqliteLabStore(join(dir,'lab.sqlite'));
  try{
    const {lab,admin,user,company,confirmation}=await fixture(store),asset=await lab.saveAsset(admin,company.id,image),before=await store.read();
    store.db.exec("CREATE TRIGGER fail_delete BEFORE DELETE ON lab_blob BEGIN SELECT RAISE(ABORT,'fixture_failure'); END;");
    await assert.rejects(lab.deleteCompany(admin,company.id,confirmation),/fixture_failure/);
    assert.deepEqual(await store.read(),before);assert.ok((await lab.asset(user,asset.id)).bytes.length);
    store.db.exec('DROP TRIGGER fail_delete');await lab.deleteCompany(admin,company.id,confirmation);
    await assert.rejects(store.getBlob(asset.id));
  }finally{await store.close();await rm(dir,{recursive:true,force:true});}
});

test('HTTP protege eliminación por cookie admin y origen; revoca acceso y permite reintento',async()=>{
  const {lab,company,confirmation}=await fixture(),server=createEditorServer({lab,env:{NODE_ENV:'test'}});server.listen(0,'127.0.0.1');await once(server,'listening');
  const base=`http://127.0.0.1:${server.address().port}`;
  const request=(path,{body,cookie,origin=base}={})=>fetch(base+path,{method:body?'POST':'GET',headers:{...(cookie?{cookie}:{}),...(body?{origin,'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  try{
    const adminLogin=await request('/api/lab/login',{body:{username:'admin.fixture',password:'Fixture-admin-2026',audience:'admin'}}),admin=adminLogin.headers.get('set-cookie').split(';')[0];
    const login=await request('/api/lab/login',{body:{...input,audience:'company'}}),cookie=login.headers.get('set-cookie').split(';')[0],path=`/api/lab/admin/companies/${company.id}/delete`;
    assert.equal((await request(path,{body:confirmation})).status,401);
    assert.equal((await request(path,{body:confirmation,cookie})).status,401);
    assert.equal((await request(path,{body:confirmation,cookie:admin,origin:'https://evil.test'})).status,403);
    assert.equal((await request(path,{body:{...confirmation,confirmation:'incorrecta'},cookie:admin})).status,400);
    assert.equal((await request(path,{body:confirmation,cookie:admin})).status,200);
    assert.equal((await request(path,{body:confirmation,cookie:admin})).status,200);
    assert.equal((await request('/api/lab/session',{cookie})).status,401);
    assert.deepEqual((await (await request('/api/lab/admin/companies',{cookie:admin})).json()).data,[]);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
