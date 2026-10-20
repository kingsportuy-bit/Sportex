import {readFile,writeFile,mkdir,rename,unlink,readdir} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {assertBlobId,blobChanges,referencedBlobs} from './blob-changes.mjs';

const empty=()=>({schemaVersion:1,users:[],companies:[],sessions:[],assets:[],operations:[],costs:[],audit:[],idempotency:[]});

// Local adapter: one process, serialized copy-on-write transactions and private blobs.
export class LabStore {
  constructor(file=null){this.file=file;this.state=null;this.tail=Promise.resolve();this.blobs=new Map();}
  async load(){
    if(this.state)return;
    if(!this.file){this.state=empty();return;}
    try{
      const value=JSON.parse(await readFile(this.file,'utf8'));
      if(value.schemaVersion!==1||Object.keys(empty()).some(key=>key!=='schemaVersion'&&!Array.isArray(value[key])))throw new Error('invalid_lab_store');
      for(const op of value.operations){if(op.state==='processing')op.state='unknown';for(const call of op.calls||[])if(call.outcome==='processing')call.outcome='unknown';}
      this.state=value;
    }catch(error){if(error.code==='ENOENT')this.state=empty();else throw error;}
  }
  async read(){await this.tail;await this.load();return structuredClone(this.state);}
  transaction(fn){
    const task=this.tail.then(async()=>{
      await this.load();const next=structuredClone(this.state),blobs=blobChanges();const result=await fn(next,blobs);
      if(this.file){
        await mkdir(dirname(this.file),{recursive:true});const temp=`${this.file}.${randomUUID()}.tmp`,dir=join(dirname(this.file),'assets'),written=[];
        try{
          if(blobs.writes.size)await mkdir(dir,{recursive:true});
          for(const [id,bytes] of blobs.writes){await writeFile(join(dir,id),bytes,{mode:0o600,flag:'wx'});written.push(id);}
          await writeFile(temp,JSON.stringify(next),{mode:0o600});await rename(temp,this.file);
        }catch(error){await unlink(temp).catch(()=>{});for(const id of written)await unlink(join(dir,id)).catch(()=>{});throw error;}
        this.state=next;
        // Metadata commits first. A failed cleanup is reported and retrying the
        // idempotent delete repeats it; backups live in a different directory.
        if(blobs.collect){const keep=referencedBlobs(next);for(const id of await readdir(dir).catch(error=>{if(error.code==='ENOENT')return [];throw error;}))if(/^[a-f0-9-]{36}$/.test(id)&&!keep.has(id))await unlink(join(dir,id));}
      }else{
        for(const [id,bytes] of blobs.writes)this.blobs.set(id,bytes);
        if(blobs.collect){const keep=referencedBlobs(next);for(const id of this.blobs.keys())if(!keep.has(id))this.blobs.delete(id);}
      }
      this.state=next;return structuredClone(result);
    });
    this.tail=task.catch(()=>{});return task;
  }
  putBlob(id,bytes){assertBlobId(id);return this.transaction((state,blobs)=>{blobs.putBlob(id,bytes);});}
  async getBlob(id){
    await this.tail;
    if(!/^[a-f0-9-]{36}$/.test(id))throw new Error('invalid_blob_id');
    if(!this.file){const bytes=this.blobs.get(id);if(!bytes)throw new Error('missing_blob');return bytes;}
    return readFile(join(dirname(this.file),'assets',id));
  }
}
