export function assertBlobId(id){if(!/^[a-f0-9-]{36}$/.test(id))throw new Error('invalid_blob_id');}

export function blobChanges(){
  return {writes:new Map(),collect:false,
    putBlob(id,bytes){assertBlobId(id);this.writes.set(id,Buffer.from(bytes));},
    collectOrphanBlobs(){this.collect=true;}
  };
}

// Old releases could leave replaced assets without metadata. Only references in
// committed tenant aggregates keep a blob alive; Core writes use the same transaction.
export function referencedBlobs(state){
  return new Set([...state.assets.map(a=>a.blobId),...state.operations.map(o=>o.resultRef)].filter(Boolean));
}
