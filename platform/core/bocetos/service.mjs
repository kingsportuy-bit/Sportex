import {randomUUID,randomBytes,createHash,scrypt as scryptCallback,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(scryptCallback),day=86400000;
const hash=value=>createHash('sha256').update(value).digest('hex');
export class LabError extends Error{constructor(code,message,status=400){super(message);this.code=code;this.status=status;}}
const fail=(code,message,status=400)=>{throw new LabError(code,message,status);};
const clean=(value,max=120)=>typeof value==='string'?value.trim().slice(0,max):'';
function username(value){const name=clean(value,60).toLowerCase();if(!/^[a-z0-9][a-z0-9._-]{2,59}$/.test(name))fail('invalid_username','El usuario debe tener de 3 a 60 letras, números, puntos o guiones.');return name;}
function password(value){if(typeof value!=='string'||value.length<10||value.length>200)fail('invalid_password','Usá una contraseña de 10 a 200 caracteres.');return value;}
async function encodePassword(value){const salt=randomBytes(16).toString('hex');return `${salt}:${Buffer.from(await scrypt(password(value),salt,64)).toString('hex')}`;}
async function verifyPassword(value,encoded){const [salt,digest]=encoded.split(':');const actual=await scrypt(String(value||'').slice(0,200),salt,64);return timingSafeEqual(Buffer.from(digest,'hex'),actual);}
function expiration(value){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))fail('invalid_expiration','Elegí una fecha de vencimiento válida.');
  const date=new Date(`${value}T00:00:00Z`);if(!Number.isFinite(+date)||date.toISOString().slice(0,10)!==value)fail('invalid_expiration','La fecha no existe.');
  return +date+day+3*3600000; // Inclusive calendar day in America/Montevideo.
}
function credits(value){if(!Number.isInteger(value)||value<0||value>1000000)fail('invalid_credits','Las generaciones deben ser un número entero entre 0 y 1.000.000.');return value;}
function decimalUnits(value){const s=typeof value==='number'?value.toFixed(12):String(value);if(!/^\d+(\.\d{1,12})?$/.test(s))fail('invalid_cost','Importe de costo inválido.');const [a,b='']=s.split('.');return BigInt(a)*1000000000000n+BigInt(b.padEnd(12,'0'));}
function decimalString(value){return `${value/1000000000000n}.${String(value%1000000000000n).padStart(12,'0')}`.replace(/0+$/,'').replace(/\.$/,'');}
function tokenCount(usage){if(!usage)return null;const total=usage.total_tokens??(Number.isFinite(usage.input_tokens)&&Number.isFinite(usage.output_tokens)?usage.input_tokens+usage.output_tokens:null);return Number.isFinite(total)&&total>=0?total:null;}
// Usage contains counters only. Never copy provider error bodies or request contents.
function safeUsage(value,depth=0){
  if(!value||typeof value!=='object'||Array.isArray(value)||depth>3)return null;
  const result={};for(const [key,item] of Object.entries(value).slice(0,40)){
    if(!/^[a-z_]{1,60}$/.test(key))continue;
    if(Number.isFinite(item)&&item>=0)result[key]=item;
    else if(item&&typeof item==='object'){const nested=safeUsage(item,depth+1);if(nested)result[key]=nested;}
  }return Object.keys(result).length?result:null;
}
function inspectAsset(input){
  const match=/^data:([a-zA-Z0-9/+.-]+);base64,([A-Za-z0-9+/]+={0,2})$/.exec(input.data||'');
  if(!match||input.data.length>21000000)fail('invalid_asset','Subí una imagen o fuente válida dentro del límite.');
  const bytes=Buffer.from(match[2],'base64');let mime;
  if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))mime='image/png';
  else if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)mime='image/jpeg';
  else if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')mime='image/webp';
  else if(bytes.toString('ascii',0,4)==='OTTO')mime='font/otf';
  else if(bytes.subarray(0,4).equals(Buffer.from([0,1,0,0])))mime='font/ttf';
  const font=input.kind==='font';
  if(!mime||font!==mime.startsWith('font/')||bytes.length>(font?10:15)*1024*1024)fail('invalid_asset','Formato inválido. Imágenes PNG/JPG/WebP hasta 15 MB; fuentes TTF/OTF hasta 10 MB.');
  if(!['brand','brand2','background','font'].includes(input.kind))fail('invalid_asset','El tipo de recurso no está permitido.');
  const name=clean(input.name,120);if(!name)fail('invalid_asset','Poné un nombre al recurso.');
  return {bytes,mime,name};
}

export function createLabService({store,clock=Date.now}){
  const audit=(db,actor,action,tenantId)=>{db.audit.push({id:randomUUID(),at:clock(),actor,action,tenantId});if(db.audit.length>2000)db.audit.splice(0,db.audit.length-2000);};
  function context(db,token,{admin=false,allowBlocked=false}={}){
    const session=db.sessions.find(s=>s.hash===hash(String(token||''))&&s.expiresAt>clock());
    const actor=session&&db.users.find(u=>u.id===session.actorId);
    if(!actor)fail('authentication_required','Iniciá sesión para continuar.',401);
    if(admin&&!actor.admin)fail('permission_denied','Este acceso es solo para administración.',403);
    const company=actor.tenantId?db.companies.find(c=>c.id===actor.tenantId):null;
    if(!actor.admin&&!company)fail('authentication_required','La empresa no está disponible.',401);
    if(company&&!allowBlocked){
      if(company.suspended)fail('company_suspended','El acceso está suspendido. Contactá a administración.',403);
      if(company.expiresAt<=clock())fail('subscription_expired','El acceso venció. Contactá a administración para renovar.',403);
    }
    return {actor,company};
  }
  function project(db,c){
    const ops=db.operations.filter(o=>o.tenantId===c.id),generations=ops.filter(o=>o.kind==='generation');
    const used=generations.filter(o=>o.state==='succeeded').length,reserved=generations.filter(o=>['processing','unknown'].includes(o.state)).length;
    const calls=ops.flatMap(o=>o.calls||[]),legacy=ops.filter(o=>!o.calls?.length);
    const known=[...calls,...legacy].map(o=>tokenCount(o.usage)).filter(n=>n!==null);
    const {providerKeyName,providerApiKeyId,providerKeyIds,costSyncedAt,...company}=c;
    return {...company,state:c.suspended?'suspended':c.expiresAt<=clock()?'expired':'active',daysRemaining:Math.max(0,Math.ceil((c.expiresAt-clock())/day)),used,reserved,remaining:Math.max(0,c.credits-used-reserved),tokens:known.length?known.reduce((a,b)=>a+b,0):null,apiCalls:calls.length,
      tokensPending:calls.filter(o=>tokenCount(o.usage)===null).length+legacy.filter(o=>['succeeded','unknown'].includes(o.state)&&tokenCount(o.usage)===null).length,
      assets:db.assets.filter(a=>a.tenantId===c.id).map(({blobId,...asset})=>asset)};
  }
  async function newSession(db,actor,remember){
    const token=randomBytes(32).toString('base64url');db.sessions=db.sessions.filter(s=>s.expiresAt>clock());
    db.sessions.push({hash:hash(token),actorId:actor.id,expiresAt:clock()+(remember?30*day:12*3600000)});
    return {token,admin:actor.admin,expiresIn:remember?30*day/1000:null};
  }
  const api={
    async setupNeeded(){return !(await store.read()).users.some(u=>u.admin);},
    async setup(input){const user=username(input.username),encoded=await encodePassword(input.password);return store.transaction(async db=>{
      if(db.users.some(u=>u.admin))fail('setup_completed','La administración ya está configurada.',409);
      const actor={id:randomUUID(),username:user,passwordHash:encoded,admin:true,tenantId:null};db.users.push(actor);audit(db,actor.id,'setup',null);return newSession(db,actor,true);
    });},
    async login(input){
      const name=clean(input.username,60).toLowerCase(),db=await store.read(),actor=db.users.find(u=>u.username===name);
      const valid=await verifyPassword(input.password,actor?.passwordHash||`0000000000000000:${'00'.repeat(64)}`);
      if(!actor||!valid||(input.audience==='admin'&&!actor.admin)||(input.audience==='company'&&actor.admin))fail('invalid_credentials','Usuario o contraseña incorrectos.',401);
      return store.transaction(async next=>{
        const current=next.users.find(u=>u.id===actor.id);if(current?.passwordHash!==actor.passwordHash)fail('invalid_credentials','Usuario o contraseña incorrectos.',401);
        const session=await newSession(next,current,Boolean(input.remember));context(next,session.token);audit(next,actor.id,'login',actor.tenantId);return session;
      });
    },
    async logout(token){return store.transaction(db=>{db.sessions=db.sessions.filter(s=>s.hash!==hash(String(token||'')));return {ok:true};});},
    async session(token,options={}){const db=await store.read(),ctx=context(db,token,options);return {admin:ctx.actor.admin,username:ctx.actor.username,company:ctx.company?project(db,ctx.company):null};},
    async companies(token){const db=await store.read();context(db,token,{admin:true});return db.companies.map(c=>project(db,c));},
    async createCompany(token,input,key){
      const name=clean(input.name),user=username(input.username),expiresAt=expiration(input.expiresOn),amount=credits(input.credits);
      if(name.length<2||!key||key.length>120)fail('invalid_company','Completá empresa, usuario, vencimiento y generaciones.');
      const encoded=await encodePassword(input.password),fingerprint=hash(JSON.stringify(input));
      return store.transaction(db=>{
        const {actor}=context(db,token,{admin:true});const previous=db.idempotency.find(r=>r.actorId===actor.id&&r.key===key);
        if(previous){if(previous.fingerprint!==fingerprint)fail('idempotency_conflict','Ese envío ya se usó con otros datos.',409);return project(db,db.companies.find(c=>c.id===previous.companyId));}
        if(db.users.some(u=>u.username===user))fail('username_exists','Ese usuario ya está en uso.',409);
        const c={id:randomUUID(),name,username:user,expiresOn:input.expiresOn,expiresAt,credits:amount,suspended:false,settings:{},version:1,createdAt:clock()};
        db.companies.push(c);db.users.push({id:randomUUID(),username:user,passwordHash:encoded,admin:false,tenantId:c.id});
        db.idempotency.push({actorId:actor.id,key,fingerprint,companyId:c.id});audit(db,actor.id,'company.created',c.id);return project(db,c);
      });
    },
    async updateCompany(token,id,input){
      const encoded=input.password?await encodePassword(input.password):null;
      return store.transaction(db=>{
        const {actor}=context(db,token,{admin:true}),c=db.companies.find(c=>c.id===id);if(!c)fail('not_found','La empresa no existe.',404);
        if(input.version!==c.version)fail('version_conflict','La empresa cambió. Actualizá el panel y volvé a intentar.',409);
        if(input.name!==undefined){if(clean(input.name).length<2)fail('invalid_company','El nombre debe tener al menos 2 caracteres.');c.name=clean(input.name);}
        if(input.expiresOn!==undefined){c.expiresAt=expiration(input.expiresOn);c.expiresOn=input.expiresOn;}
        if(input.addCredits!==undefined)c.credits+=credits(input.addCredits);
        if(input.suspended!==undefined){if(typeof input.suspended!=='boolean')fail('invalid_company','Estado inválido.');c.suspended=input.suspended;}
        if(input.settings!==undefined){
          if(!input.settings||typeof input.settings!=='object'||Array.isArray(input.settings)||JSON.stringify(input.settings).length>200000)fail('invalid_settings','La configuración no es válida.');
          c.settings=structuredClone(input.settings);
        }
        if(encoded){const user=db.users.find(u=>u.tenantId===id);user.passwordHash=encoded;db.sessions=db.sessions.filter(s=>s.actorId!==user.id);}
        c.version++;audit(db,actor.id,'company.updated',id);return project(db,c);
      });
    },
    async saveAsset(token,tenantId,input){
      const db=await store.read();context(db,token,{admin:true});if(!db.companies.some(c=>c.id===tenantId))fail('not_found','La empresa no existe.',404);
      const {bytes,mime,name}=inspectAsset(input),id=randomUUID();await store.putBlob(id,bytes);
      return store.transaction(next=>{
        const {actor}=context(next,token,{admin:true});const asset={id,tenantId,kind:input.kind,name,mime,size:bytes.length,checksum:hash(bytes),blobId:id};
        if(input.kind!=='font')next.assets=next.assets.filter(a=>a.tenantId!==tenantId||a.kind!==input.kind);
        if(next.assets.filter(a=>a.tenantId===tenantId&&a.kind==='font').length>=30&&input.kind==='font')fail('asset_limit','Podés guardar hasta 30 fuentes por empresa.');
        next.assets.push(asset);audit(next,actor.id,'asset.saved',tenantId);return {...asset,blobId:undefined};
      });
    },
    async asset(token,id){const db=await store.read(),{actor}=context(db,token),asset=db.assets.find(a=>a.id===id&&(actor.admin||a.tenantId===actor.tenantId));if(!asset)fail('not_found','El archivo no existe.',404);return {...asset,bytes:await store.getBlob(asset.blobId)};},
    async beginOperation(token,kind,key,payload){
      if(!['generation','analysis'].includes(kind)||typeof key!=='string'||!key||key.length>120)fail('idempotency_required','Falta identificar la solicitud.');
      const fingerprint=hash(JSON.stringify(payload));return store.transaction(db=>{
        const {actor,company}=context(db,token);if(!company)fail('permission_denied','Entrá con el acceso de una empresa.',403);
        const previous=db.operations.find(o=>o.tenantId===company.id&&o.key===key&&o.kind===kind);
        if(previous){if(previous.fingerprint!==fingerprint)fail('idempotency_conflict','La solicitud tiene otros datos.',409);return {...previous,replayed:true};}
        if(kind==='generation'&&project(db,company).remaining<1)fail('quota_exhausted','No quedan generaciones. Contactá a administración.',409);
        if(db.operations.some(o=>o.tenantId===company.id&&o.state==='processing'))fail('operation_busy','Esperá a que termine la solicitud actual.',409);
        if(kind==='analysis'&&db.operations.filter(o=>o.tenantId===company.id&&o.kind===kind&&o.at>clock()-3600000).length>=30)fail('analysis_limit','Llegaste al límite de análisis por hora. Intentá más tarde.',429);
        const op={id:randomUUID(),tenantId:company.id,actorId:actor.id,kind,key,fingerprint,state:'processing',at:clock(),usage:null,resultRef:null,calls:[]};
        db.operations.push(op);audit(db,actor.id,'operation.started',company.id);return op;
      });
    },
    async beginProviderCall(operationId,{keySlot,model,endpoint}){
      return store.transaction(db=>{
        const op=db.operations.find(o=>o.id===operationId);
        if(!op||op.state!=='processing'||!['primary','fallback'].includes(keySlot)||!['/v1/images/edits','/v1/responses'].includes(endpoint))fail('invalid_operation','La solicitud no admite otra llamada.',409);
        const call={id:randomUUID(),operationId:op.id,tenantId:op.tenantId,actorId:op.actorId,kind:op.kind,at:clock(),keySlot,model:clean(model,100)||null,endpoint,outcome:'processing',usage:null,providerRequestId:null,status:null};
        (op.calls??=[]).push(call);return call;
      });
    },
    async finishProviderCall(operationId,callId,{outcome,status=null,usage=null,providerRequestId=null}){
      return store.transaction(db=>{
        const call=db.operations.find(o=>o.id===operationId)?.calls?.find(c=>c.id===callId);
        if(!call||!['succeeded','rejected','unknown'].includes(outcome))fail('invalid_operation','Llamada inválida.',409);
        if(call.outcome!=='processing')return call;
        Object.assign(call,{outcome,status:Number.isInteger(status)?status:null,usage:safeUsage(usage),providerRequestId:clean(providerRequestId,160)||null,finishedAt:clock()});return call;
      });
    },
    async companyUsage(token,tenantId){
      const db=await store.read();context(db,token,{admin:true});
      if(!db.companies.some(c=>c.id===tenantId))fail('not_found','La empresa no existe.',404);
      const calls=db.operations.filter(o=>o.tenantId===tenantId).flatMap(o=>o.calls||[]).reverse();
      return {total:calls.length,data:calls.slice(0,100)};
    },
    async finishOperation(id,{state,usage=null,result=null}){
      if(!['succeeded','failed','unknown'].includes(state))fail('invalid_operation','Estado de operación inválido.');
      const resultRef=result?randomUUID():null;if(resultRef)await store.putBlob(resultRef,Buffer.from(JSON.stringify(result)));
      return store.transaction(db=>{const op=db.operations.find(o=>o.id===id);if(!op)fail('not_found','La solicitud no existe.',404);if(!['processing','unknown'].includes(op.state))return op;op.state=state;op.usage=safeUsage(usage);op.resultRef=resultRef;op.finishedAt=clock();audit(db,op.actorId,`operation.${state}`,op.tenantId);return op;});
    },
    async operationResult(token,id){const db=await store.read(),{company}=context(db,token),op=db.operations.find(o=>o.id===id&&o.tenantId===company?.id);if(!op?.resultRef)fail('operation_pending','La solicitud está pendiente de verificar. No se volvió a enviar.',409);return JSON.parse((await store.getBlob(op.resultRef)).toString('utf8'));},
    async recordCosts(buckets,{start,end,keyIds=[]}={}){
      return store.transaction(db=>{
        if(keyIds.length)db.costs=db.costs.filter(b=>keyIds.includes(b.keyId));
        if(start!==undefined&&end!==undefined)db.costs=db.costs.filter(b=>b.start<start||b.start>=end);
        for(const bucket of buckets){
          if(!Number.isInteger(bucket.start)||!Number.isInteger(bucket.end)||bucket.end<=bucket.start||bucket.currency!=='usd')fail('invalid_cost','Reporte de costos inválido.');
          const item={...bucket,tenantId:null,value:decimalString(decimalUnits(bucket.value))};
          const key=b=>`${b.start}:${b.end}:${b.keyId}:${b.lineItem||''}:${b.currency}`;db.costs=db.costs.filter(b=>key(b)!==key(item));db.costs.push(item);
        }
        db.costReport={syncedAt:clock(),start:start??null,end:end??null,scope:keyIds.length?'shared_keys':'organization',keyIds};return {ok:true};
      });
    },
    async costSummary(token){const db=await store.read();context(db,token,{admin:true});return {...(db.costReport||{}),reportedCost:db.costReport?decimalString(db.costs.reduce((sum,b)=>sum+decimalUnits(b.value),0n)):null,currency:'usd'};},
  };
  return api;
}
