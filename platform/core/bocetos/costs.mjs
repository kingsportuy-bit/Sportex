export async function fetchReportedCosts({adminKey,start,end,apiKeyIds=[],fetchImpl=fetch}){
  if(!adminKey)throw new Error('Falta configurar la clave administrativa de OpenAI.');
  const result=[],seen=new Set();let page=null;
  do{
    const url=new URL('https://api.openai.com/v1/organization/costs');
    url.searchParams.set('start_time',String(start));url.searchParams.set('end_time',String(end));
    url.searchParams.set('bucket_width','1d');url.searchParams.append('group_by','api_key_id');url.searchParams.append('group_by','line_item');
    for(const id of apiKeyIds)url.searchParams.append('api_key_ids',id);
    if(page)url.searchParams.set('page',page);
    const response=await fetchImpl(url,{headers:{authorization:`Bearer ${adminKey}`},signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw new Error('No se pudo consultar el gasto. Revisá los permisos de la clave administrativa de OpenAI.');
    const body=await response.json();if(!Array.isArray(body.data))throw new Error('OpenAI devolvió un reporte de costos inválido.');
    for(const bucket of body.data){
      if(!Array.isArray(bucket.results))throw new Error('OpenAI devolvió un reporte de costos incompleto.');
      for(const item of bucket.results){
        if(!item.amount||!Number.isFinite(item.amount.value)||item.amount.currency!=='usd')throw new Error('El reporte contiene importes no disponibles o una moneda diferente de USD.');
        result.push({start:bucket.start_time,end:bucket.end_time,keyId:item.api_key_id||null,lineItem:item.line_item||null,currency:'usd',value:item.amount.value.toFixed(12).replace(/0+$/,'').replace(/\.$/,'')});
      }
    }
    page=body.has_more?body.next_page:null;
    if(body.has_more&&(!page||seen.has(page)))throw new Error('No se pudo completar la paginación del reporte.');
    if(page)seen.add(page);
  }while(page);
  return result;
}
