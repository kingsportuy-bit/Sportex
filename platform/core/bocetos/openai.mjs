// Each outbound attempt belongs to an operation whose tenant was resolved by Core.
export function createTrackedOpenAIFetch({service,operation,primaryKey,fallbackKey,fetchImpl=fetch}){
  return async function trackedFetch(url,options={}){
    const target=new URL(url);
    if(target.origin!=='https://api.openai.com'||!['/v1/images/edits','/v1/responses'].includes(target.pathname))throw new Error('unsupported_provider_endpoint');
    const model=typeof options.body==='string'?JSON.parse(options.body).model:options.body?.get?.('model');
    const keys=[{slot:'primary',value:primaryKey}];
    if(fallbackKey&&fallbackKey!==primaryKey)keys.push({slot:'fallback',value:fallbackKey});
    for(const [index,key] of keys.entries()){
      // Persist before sending. A process interruption leaves an auditable unknown call.
      const call=await service.beginProviderCall(operation.id,{keySlot:key.slot,model,endpoint:target.pathname});
      const headers=new Headers(options.headers);headers.set('authorization',`Bearer ${key.value}`);
      let response,body;
      try{
        response=await fetchImpl(url,{...options,headers});
        body=await response.clone().json();
      }catch(error){
        await service.finishProviderCall(operation.id,call.id,{outcome:'unknown',status:response?.status,providerRequestId:response?.headers?.get('x-request-id')});
        throw error;
      }
      await service.finishProviderCall(operation.id,call.id,{outcome:response.ok?'succeeded':response.status>=500?'unknown':'rejected',status:response.status,usage:body.usage,providerRequestId:response.headers.get('x-request-id')});
      // Authentication/quota rejection is confirmed. Never replay ambiguous network/5xx outcomes.
      if(index===0&&keys.length>1&&[401,429].includes(response.status)&&!options.signal?.aborted)continue;
      return response;
    }
  };
}
