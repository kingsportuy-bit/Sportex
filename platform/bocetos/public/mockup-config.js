export const mockupOptionInputs={shorts:['include-shorts','gen-short'],socks:['include-socks'],raglan:['raglan-enabled'],cuffs:['cuffs-enabled'],sleeveTrim:['trim-sleeve-enabled'],shoulderTrim:['trim-shoulder-enabled'],shirtTrim:['trim-shirt-side-enabled'],shortTrim:['trim-short-side-enabled'],shortHem:['trim-short-hem-enabled']};
export function mockupParameters(mockup,fallback){
  const model=structuredClone(mockup?.parameters||fallback);
  if(!model)return null;
  for(const [key,ids] of Object.entries(mockupOptionInputs))if(mockup?.options?.[key]===false)for(const id of ids)model.inputs[id]=false;
  return model;
}
export function mockupSnapshot(mockup,fallback){
  return {id:mockup.id,name:mockup.name,kitId:mockup.kitId,revision:mockup.revision,options:structuredClone(mockup.options),parameters:mockupParameters(mockup,fallback)};
}
export function companyMockupParameters(mockup,fallback,settings={},assets=[]){
  let model=mockupParameters(mockup,fallback);
  const inheritsCompanyDefaults=!mockup||mockup.id==='football-basic'&&mockup.revision===1;
  if(settings.initialParameters?.kind==='sportex-initial-parameters'&&inheritsCompanyDefaults)model=structuredClone(settings.initialParameters);
  if(inheritsCompanyDefaults)Object.assign(model.inputs,...[settings.numberFont?{'number-font':settings.numberFont}:{},settings.nameFont?{'name-font':settings.nameFont}:{}]);
  for(const asset of assets){
    if(['brand','brand2'].includes(asset.kind))model.logoFiles={...model.logoFiles,[asset.kind]:asset.name};
    if(asset.kind==='background'){model.backgroundMode='custom';model.inputs['background-select']='custom';}
  }
  return model;
}
