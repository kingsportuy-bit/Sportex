import {DatabaseSync} from 'node:sqlite';
import {mkdir,chmod} from 'node:fs/promises';
import {dirname,join,isAbsolute} from 'node:path';
import {randomUUID} from 'node:crypto';

const empty=()=>({schemaVersion:1,users:[],companies:[],sessions:[],assets:[],operations:[],costs:[],audit:[],idempotency:[]});
// Single instance, SQLite FULL durability; exclusive lock also prevents a second server.
// State contains the existing tenant-aware Core aggregates. Blobs share the same backup.
export class SqliteLabStore{
  constructor(file){if(!isAbsolute(file))throw new Error('absolute_data_path_required');this.file=file;this.tail=Promise.resolve();this.db=null;this.initializing=null;this.closed=false;}
  async load(){
    if(this.closed)throw new Error('store_closed');if(this.db)return;
    this.initializing??=(async()=>{
      await mkdir(dirname(this.file),{recursive:true,mode:0o700});
      const db=new DatabaseSync(this.file);
      try{
        db.exec('PRAGMA busy_timeout=0; PRAGMA locking_mode=EXCLUSIVE; PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; BEGIN EXCLUSIVE; CREATE TABLE IF NOT EXISTS lab_state(id INTEGER PRIMARY KEY CHECK(id=1),data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS lab_blob(id TEXT PRIMARY KEY,data BLOB NOT NULL); COMMIT;');
        const row=db.prepare('SELECT data FROM lab_state WHERE id=1').get();const state=row?JSON.parse(row.data):empty();
        if(state.schemaVersion!==1||Object.keys(empty()).some(key=>key!=='schemaVersion'&&!Array.isArray(state[key])))throw new Error('invalid_lab_store');
        for(const op of state.operations){if(op.state==='processing')op.state='unknown';for(const call of op.calls||[])if(call.outcome==='processing')call.outcome='unknown';}
        db.prepare('INSERT OR REPLACE INTO lab_state(id,data) VALUES(1,?)').run(JSON.stringify(state));
        await chmod(this.file,0o600);this.state=state;this.db=db;
      }catch(error){db.close();throw error;}
    })();
    return this.initializing;
  }
  queue(fn){const task=this.tail.then(async()=>{await this.load();return fn();});this.tail=task.catch(()=>{});return task;}
  async read(){await this.tail;await this.load();return structuredClone(this.state);}
  transaction(fn){return this.queue(async()=>{
    const next=structuredClone(this.state),result=await fn(next);
    this.db.exec('BEGIN IMMEDIATE');try{this.db.prepare('UPDATE lab_state SET data=? WHERE id=1').run(JSON.stringify(next));this.db.exec('COMMIT');}catch(error){this.db.exec('ROLLBACK');throw error;}
    this.state=next;return structuredClone(result);
  });}
  putBlob(id,bytes){if(!/^[a-f0-9-]{36}$/.test(id))throw new Error('invalid_blob_id');return this.queue(()=>{this.db.prepare('INSERT INTO lab_blob(id,data) VALUES(?,?)').run(id,Buffer.from(bytes));});}
  async getBlob(id){if(!/^[a-f0-9-]{36}$/.test(id))throw new Error('invalid_blob_id');await this.tail;await this.load();const row=this.db.prepare('SELECT data FROM lab_blob WHERE id=?').get(id);if(!row)throw new Error('missing_blob');return Buffer.from(row.data);}
  snapshot(directory){return this.queue(async()=>{
    if(!isAbsolute(directory))throw new Error('absolute_backup_path_required');
    await mkdir(directory,{recursive:true,mode:0o700});const target=join(directory,`lab-${new Date().toISOString().replaceAll(':','-')}-${randomUUID()}.sqlite`);
    this.db.prepare('VACUUM INTO ?').run(target);await chmod(target,0o600);return target;
  });}
  async close(){await this.tail;this.db?.close();this.db=null;this.closed=true;}
}
