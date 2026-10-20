import {readFile} from 'node:fs/promises';
import {join,isAbsolute} from 'node:path';
import {createLabService} from '../core/bocetos/service.mjs';
import {SqliteLabStore} from '../core/bocetos/sqlite-store.mjs';
import {createEditorServer} from './server.mjs';
import {labWebContext} from './web-context.mjs';

process.umask(0o077);
if(process.env.NODE_ENV!=='production')throw new Error('production_environment_required');
labWebContext(process.env);
const directory=process.env.SPORTEX_DATA_DIR;
if(!directory||!isAbsolute(directory))throw new Error('persistent_data_directory_required');
for(const name of ['OPENAI_API_KEY','OPENAI_API_KEY_FALLBACK','OPENAI_ADMIN_KEY']){
  if(process.env[name+'_FILE'])process.env[name]=(await readFile(process.env[name+'_FILE'],'utf8')).trim();
}
if(!process.env.OPENAI_API_KEY)throw new Error('openai_primary_required');
const store=new SqliteLabStore(join(directory,'lab.sqlite'));
const lab=createLabService({store,mockupDefaults:JSON.parse(await readFile(new URL('./public/initial-parameters.json',import.meta.url),'utf8'))});
if(await lab.setupNeeded())throw new Error('private_admin_bootstrap_required');
await store.snapshot(join(directory,'backups'));
const backups=setInterval(()=>store.snapshot(join(directory,'backups')).catch(()=>console.error('lab_backup_failed')),24*3600000);backups.unref();
const server=createEditorServer({lab});
server.requestTimeout=240000;server.headersTimeout=15000;
server.listen(Number(process.env.PORT||4319),'0.0.0.0',()=>console.log(JSON.stringify({event:'lab.started',release:process.env.SPORTEX_RELEASE})));
let stopping=false;
async function shutdown(){
  if(stopping)return;stopping=true;clearInterval(backups);
  server.close(async()=>{await store.snapshot(join(directory,'backups'));await store.close();process.exit(0);});
  setTimeout(()=>process.exit(1),210000).unref();
}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
