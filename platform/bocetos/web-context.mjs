export function labWebContext(env){
  if(env.NODE_ENV!=='production')return null;
  const urls=[env.SPORTEX_LAB_URL,env.SPORTEX_PANEL_URL].map(value=>{
    const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new Error('https_origin_required');return url;
  });
  if(urls[0].host===urls[1].host)throw new Error('separate_panel_origin_required');
  return {lab:urls[0].origin,panel:urls[1].origin,labHost:urls[0].host,panelHost:urls[1].host};
}
