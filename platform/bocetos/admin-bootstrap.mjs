import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createLabService} from '../core/bocetos/service.mjs';
import {SqliteLabStore} from '../core/bocetos/sqlite-store.mjs';
process.umask(0o077);
if(!process.env.SPORTEX_DATA_DIR||!process.env.SPORTEX_BOOTSTRAP_FILE)throw new Error('private_bootstrap_paths_required');
const store=new SqliteLabStore(join(process.env.SPORTEX_DATA_DIR,'lab.sqlite'));
try{
  const service=createLabService({store});
  if(!await service.setupNeeded())throw new Error('admin_already_exists');
  const input=JSON.parse(await readFile(process.env.SPORTEX_BOOTSTRAP_FILE,'utf8'));
  await service.setup(input);await store.snapshot(join(process.env.SPORTEX_DATA_DIR,'backups'));
  console.log('ADMIN_BOOTSTRAP=PASS');
}finally{await store.close();}
