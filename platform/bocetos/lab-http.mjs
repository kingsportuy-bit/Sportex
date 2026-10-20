import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createLabService,LabError} from '../core/bocetos/service.mjs';
import {LabStore} from '../core/bocetos/store.mjs';
import {fetchReportedCosts} from '../core/bocetos/costs.mjs';
import {createTrackedOpenAIFetch} from '../core/bocetos/openai.mjs';
import {labWebContext} from './web-context.mjs';

export function localLabService(){
  if(process.env.SPORTEX_LAB_MANAGED!=='true')return null;
  if(process.env.NODE_ENV==='production')throw new Error('El adaptador local del panel no se habilita en producción.');
  return createLabService({store:new LabStore(join(import.meta.dirname,'private','panel','state.json'))});
}
function cookies(req){const values={};for(const item of String(req.headers.cookie||'').split(';')){const index=item.indexOf('=');if(index>0)values[item.slice(0,index).trim()]=item.slice(index+1).trim();}return values;}
const tokens=(req,secure)=>{const c=cookies(req),prefix=secure?'__Host-':'';return {admin:c[prefix+'sportex_lab_admin'],company:c[prefix+'sportex_lab']};};
function cookie(res,name,session,secure){res.setHeader('set-cookie',`${secure?'__Host-':''}${name}=${session.token||''}; Path=/; HttpOnly; SameSite=Strict${secure?'; Secure':''}${session.expiresIn!==null?`; Max-Age=${session.expiresIn??0}`:''}`);}
const json=(res,status,data)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data));};

export function createLabHttp({service,readJson,runGeneration,runAnalysis,env=process.env,fetchImpl=fetch}){
  const web=labWebContext(env);
  const attempts=new Map();let syncing=false;
  async function syncCosts(token,system=false){
    if(!system)await service.session(token,{admin:true});
    if(syncing)throw new LabError('costs_busy','Ya se está actualizando el gasto.',409);
    if(!env.OPENAI_ADMIN_KEY)throw new LabError('costs_not_configured','Falta configurar la clave administrativa de OpenAI para consultar los cargos.',503);
    syncing=true;
    try{const end=Math.floor(Date.now()/1000),start=Math.floor((end-7*86400)/86400)*86400;
      const keyIds=[env.OPENAI_API_KEY_ID,env.OPENAI_API_KEY_FALLBACK_ID].filter(Boolean);
      const buckets=await fetchReportedCosts({adminKey:env.OPENAI_ADMIN_KEY,start,end,apiKeyIds:keyIds,fetchImpl});
      return await service.recordCosts(buckets,{start,end,keyIds});
    }catch(error){throw new LabError('costs_unavailable',error.message,502);
    }finally{syncing=false;}
  }
  const handler=async function handle(req,res,path){
    const own=path.startsWith('/api/lab/'),managedApi=['/api/generate','/api/reference-colors','/api/status'].includes(path);
    const protectedPage=path==='/'||path==='/index.html';
    if(!own&&!managedApi&&!protectedPage&&path!=='/admin'&&path!=='/login')return false;
    res.setHeader('cache-control','no-store');res.setHeader('x-content-type-options','nosniff');res.setHeader('referrer-policy','no-referrer');
    const token=tokens(req,Boolean(web));
    try{
      const adminHost=web&&req.headers.host===web.panelHost;
      if(web){
        if(adminHost&&(protectedPage||path==='/login')){res.writeHead(302,{location:'/admin'});res.end();return true;}
        if(path==='/api/lab/setup'||(!adminHost&&(path==='/admin'||path.startsWith('/api/lab/admin/')))||(adminHost&&managedApi))throw new LabError('not_found','No encontrado.',404);
      }
      if(!['GET','HEAD'].includes(req.method)){
        const origin=web?(adminHost?web.panel:web.lab):`http://${req.headers.host}`;
        if(req.headers.origin!==origin)throw new LabError('origin_denied','No se permite enviar datos desde otro sitio.',403);
      }
      if(path==='/admin'||path==='/login'){
        if(req.method!=='GET')throw new LabError('not_found','No encontrado.',404);
        res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(await readFile(join(import.meta.dirname,'public','panel.html')));return true;
      }
      if(protectedPage){
        try{await service.session(token.company);}catch{
          res.writeHead(302,{location:'/login'});res.end();return true;
        }
        return false;
      }
      if(path==='/api/lab/public'&&req.method==='GET'){json(res,200,{managed:true,setupNeeded:web?false:await service.setupNeeded(),costsConfigured:Boolean(env.OPENAI_ADMIN_KEY),...(web?{labUrl:web.lab+'/'}:{})});return true;}
      if(['/api/lab/setup','/api/lab/login'].includes(path)&&req.method==='POST'){
        const input=await readJson(req,8192);let session;
        const address=web?String(req.headers['x-forwarded-for']||req.socket.remoteAddress).split(',').at(-1).trim():req.socket.remoteAddress;
        const id=`${address}:${String(input.username||'').trim().toLowerCase().slice(0,60)}`,entry=attempts.get(id)||{at:Date.now(),count:0};
        if(Date.now()-entry.at>15*60000){entry.at=Date.now();entry.count=0;}
        if(attempts.size>1000)attempts.clear();attempts.set(id,entry);if(++entry.count>20)throw new LabError('login_limit','Demasiados intentos. Esperá unos minutos.',429);
        if(web)input.audience=adminHost?'admin':'company';
        if(path.endsWith('/setup'))session=await service.setup(input);else session=await service.login(input);
        cookie(res,session.admin?'sportex_lab_admin':'sportex_lab',session,Boolean(web));json(res,200,{admin:session.admin});return true;
      }
      if(path==='/api/lab/logout'&&req.method==='POST'){
        const input=await readJson(req),admin=input.audience==='admin';await service.logout(admin?token.admin:token.company);
        cookie(res,admin?'sportex_lab_admin':'sportex_lab',{token:'',expiresIn:0},Boolean(web));json(res,200,{ok:true});return true;
      }
      if(path==='/api/lab/session'&&req.method==='GET'){
        const admin=new URL(req.url,'http://local').searchParams.get('audience')==='admin';
        json(res,200,await service.session(admin?token.admin:token.company,admin?{admin:true}:{}));return true;
      }
      if(path==='/api/lab/admin/companies'){
        if(req.method==='GET')json(res,200,{data:await service.companies(token.admin)});
        else if(req.method==='POST')json(res,201,{data:await service.createCompany(token.admin,await readJson(req),req.headers['idempotency-key'])});
        else throw new LabError('not_found','No encontrado.',404);
        return true;
      }
      const usage=/^\/api\/lab\/admin\/companies\/([a-f0-9-]{36})\/usage$/.exec(path);
      if(usage&&req.method==='GET'){json(res,200,await service.companyUsage(token.admin,usage[1]));return true;}
      if(path==='/api/lab/admin/costs'&&req.method==='GET'){json(res,200,await service.costSummary(token.admin));return true;}
      const company=/^\/api\/lab\/admin\/companies\/([a-f0-9-]{36})(\/assets)?$/.exec(path);
      if(company&&req.method==='POST'){
        const input=await readJson(req);json(res,200,{data:company[2]?await service.saveAsset(token.admin,company[1],input):await service.updateCompany(token.admin,company[1],input)});return true;
      }
      const asset=/^\/api\/lab\/(admin\/)?assets\/([a-f0-9-]{36})$/.exec(path);
      if(asset&&req.method==='GET'){
        const value=await service.asset(asset[1]?token.admin:token.company,asset[2]);
        res.writeHead(200,{'content-type':value.mime,'content-length':value.bytes.length,'cache-control':'private, no-store'});res.end(value.bytes);return true;
      }
      if(path==='/api/lab/admin/costs/sync'&&req.method==='POST'){json(res,200,await syncCosts(token.admin));return true;}
      if(managedApi){
        const session=await service.session(token.company),apiKey=env.OPENAI_API_KEY;
        if(path==='/api/status'&&req.method==='GET'){json(res,200,{ready:Boolean(apiKey),managed:true,remaining:session.company.remaining});return true;}
        if(req.method!=='POST')throw new LabError('not_found','No encontrado.',404);
        if(!apiKey)throw new LabError('provider_not_configured','La conexión compartida de OpenAI está pendiente de configurar.',503);
        const body=await readJson(req),kind=path==='/api/generate'?'generation':'analysis';
        const op=await service.beginOperation(token.company,kind,req.headers['idempotency-key'],body);
        if(op.replayed){
          if(op.state==='succeeded')json(res,200,{...await service.operationResult(token.company,op.id),remaining:session.company.remaining});
          else throw new LabError('operation_pending','Esta solicitud ya se recibió. Está en proceso o pendiente de verificar; no se volvió a enviar.',409);
          return true;
        }
        let result;
        const trackedFetch=createTrackedOpenAIFetch({service,operation:op,primaryKey:apiKey,fallbackKey:env.OPENAI_API_KEY_FALLBACK,fetchImpl});
        try{await service.session(token.company);result=await (kind==='generation'?runGeneration:runAnalysis)(body,apiKey,{fetchImpl:trackedFetch,tenantId:op.tenantId});}
        catch(error){await service.finishOperation(op.id,{state:error instanceof LabError?'failed':'unknown'});throw error;}
        const success=result.status>=200&&result.status<300,unknown=['provider_outcome_unknown','timeout','connection_error'].includes(result.body?.code);
        await service.finishOperation(op.id,{state:success?'succeeded':unknown?'unknown':'failed',usage:result.body?.cached?{total_tokens:0}:result.usage||result.body?.usage||null,result:success?result.body:null});
        json(res,result.status,{...result.body,remaining:(await service.session(token.company,{allowBlocked:true})).company.remaining});return true;
      }
      throw new LabError('not_found','No encontrado.',404);
    }catch(error){
      json(res,error instanceof LabError?error.status:500,{code:error instanceof LabError?error.code:'lab_unavailable',error:error instanceof LabError?error.message:'No se pudo completar la operación. Volvé a intentar.',...(error instanceof LabError?{}:{})});return true;
    }
  };
  handler.syncCosts=()=>syncCosts(null,true);
  return handler;
}
