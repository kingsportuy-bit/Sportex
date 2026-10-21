import {randomUUID} from 'node:crypto';

export const mockupOptions=['shorts','socks','raglan','cuffs','sleeveTrim','shoulderTrim','shirtTrim','shortTrim','shortHem'];
const defaults=Object.fromEntries(mockupOptions.map(key=>[key,true]));
const fixed=['brand','brand2','crest','front-number','short-brand','short-crest','short-number','back-number','back-name'];
const plain=value=>value&&typeof value==='object'&&!Array.isArray(value);

// Templates contain geometry/settings only; company images and generated work
// never enter this global, administrator-owned catalog.
export function validateMockupParameters(value,fail){
  const invalid=()=>fail('invalid_mockup','La configuración del mockup no es válida. Volvé al lienzo y guardá de nuevo.');
  if(!plain(value)||value.kind!=='sportex-initial-parameters'||!plain(value.layers)||!plain(value.inputs)||JSON.stringify(value).length>200000)invalid();
  function tree(node,depth=0){
    if(depth>12)invalid();
    if(node===null||typeof node==='boolean')return;
    if(typeof node==='number'){if(!Number.isFinite(node)||Math.abs(node)>100000)invalid();return;}
    if(typeof node==='string'){if(node.length>500||/[<>]|(?:data:|https?:|javascript:)/i.test(node))invalid();return;}
    if(!node||typeof node!=='object'||Object.keys(node).length>300)invalid();
    for(const [key,item] of Object.entries(node)){if(['__proto__','constructor','prototype'].includes(key))invalid();tree(item,depth+1);}
  }
  tree(value);
  for(const key of fixed){const layer=value.layers[key];if(!plain(layer)||![layer.x,layer.y,layer.size].every(Number.isFinite)||layer.size<=0||layer.size>2000)invalid();}
  for(const [key,layer] of Object.entries(value.layers)){
    if(!fixed.includes(key)&&!/^text-[a-zA-Z0-9.-]{1,80}$/.test(key))invalid();
    if(!plain(layer)||![layer.x,layer.y,layer.size].every(Number.isFinite)||layer.size<=0||layer.size>2000)invalid();
    for(const field of ['scaleX','scaleY'])if(layer[field]!==undefined&&(!Number.isFinite(layer[field])||layer[field]<=0||layer[field]>100))invalid();
    if(layer.imageAspect!==undefined&&(!Number.isFinite(layer.imageAspect)||layer.imageAspect<.001||layer.imageAspect>1000))invalid();
    if(layer.attachment&&(!['front','back','shirt','short','left','right','socks'].includes(layer.attachment.piece)||!['front','back'].includes(layer.attachment.side)))invalid();
  }
  for(const [id,item] of Object.entries(value.inputs)){
    if(typeof item!=='boolean'&&typeof item!=='string'&&typeof item!=='number'||/notes|api|password|token/i.test(id))invalid();
    if(id.endsWith('-color')&&!/^#[a-f0-9]{6}$/i.test(item))invalid();
    if((id.endsWith('-enabled')||/^(?:include-|show-|gen-|reference-)/.test(id))&&typeof item!=='boolean')invalid();
  }
  if(value.visibleLayers&&(!plain(value.visibleLayers)||Object.entries(value.visibleLayers).some(([id,visible])=>!value.layers[id]||typeof visible!=='boolean')))invalid();
  if(value.layerStyles&&(!plain(value.layerStyles)||Object.entries(value.layerStyles).some(([id,s])=>!value.layers[id]||!plain(s)||typeof s.enabled!=='boolean'||!/^#[a-f0-9]{6}$/i.test(s.color)||!Number.isFinite(s.width)||s.width<0||s.width>30)))invalid();
  if(value.trimEdits){
    if(!plain(value.trimEdits))invalid();
    for(const [key,curve] of Object.entries(value.trimEdits))if(key!=='linkedVersion'){
      if(!key.startsWith('individual:')||!plain(curve)||!Array.isArray(curve.nodes)||curve.nodes.length<2||curve.nodes.length>100)invalid();
      for(const node of curve.nodes)for(const field of ['p','in','out'])if(!Array.isArray(node[field])||node[field].length!==2||node[field].some(n=>!Number.isFinite(n)||Math.abs(n)>100))invalid();
    }
  }
  for(const id of ['number-font','name-font'])if(value.inputs[id]&&!/^club-[a-z0-9-]+$/.test(value.inputs[id]))fail('invalid_mockup_font','Elegí una fuente del catálogo para la configuración del mockup.');
  if(value.texts&&(!Array.isArray(value.texts)||value.texts.length>30||value.texts.some(t=>!/^text-[a-zA-Z0-9.-]{1,80}$/.test(t.id)||!value.layers[t.id])))invalid();
  const result=structuredClone(value);
  // No user-selected file references can leak from the setup canvas.
  result.sponsors=[];result.logoFiles={brand:null,brand2:null,crest:null};result.texturePlacements={};
  result.backgroundMode=value.backgroundMode==='white'?'white':'none';result.inputs['background-select']=result.backgroundMode;
  for(const id of ['brand-select','brand2-select','crest-select'])result.inputs[id]='';
  for(const id of Object.keys(result.inputs))if(id.startsWith('piece-'))result.inputs[id]='';
  delete result.presetRevision;delete result.approvedAt;
  return result;
}

export function createMockupCatalog({store,context,audit,clock,fail,factory=null}){
  const seed=()=>({id:'football-basic',kitId:'football-basic-v1',version:1,
    draft:{name:'Fútbol básico',parameters:structuredClone(factory),options:{...defaults}},
    published:{id:'football-basic',name:'Fútbol básico',kitId:'football-basic-v1',revision:1,parameters:structuredClone(factory),options:{...defaults}},revisions:[]});
  const records=db=>{const list=structuredClone(db.mockups||[]);if(!list.some(m=>m.id==='football-basic'))list.unshift(seed());return list;};
  const find=(db,id)=>{const record=records(db).find(m=>m.id===id);if(!record)fail('mockup_not_found','El mockup no existe.',404);return record;};
  const version=(record,input)=>{if(record.version!==input.version)fail('version_conflict','El mockup cambió en otra ventana. Recargá antes de guardar.',409);};
  const persist=(db,record)=>{db.mockups=(db.mockups||[]).filter(m=>m.id!==record.id);db.mockups.push(record);return record;};
  return {
    async mockups(token,{admin=false}={}){const db=await store.read();context(db,token,{admin});return records(db).flatMap(m=>admin?[m]:m.published?[m.published]:[]);},
    async mockupDraft(token,id){const db=await store.read();context(db,token,{admin:true});return find(db,id);},
    async createMockup(token,input){return store.transaction(db=>{
      const {actor}=context(db,token,{admin:true});
      if(records(db).length>=30)fail('mockup_limit','El catálogo admite hasta 30 configuraciones.');
      const name=typeof input.name==='string'?input.name.trim():'';
      if(!name||name.length>80)fail('invalid_mockup_name','Escribí un nombre de hasta 80 caracteres.');
      const source=find(db,input.sourceId||'football-basic'),record={id:randomUUID(),kitId:source.kitId,version:1,draft:{...structuredClone(source.draft),name},published:null,revisions:[]};
      persist(db,record);audit(db,actor.id,'mockup.created',null);return record;
    });},
    async saveMockup(token,id,input){return store.transaction(db=>{
      const {actor}=context(db,token,{admin:true}),record=find(db,id);version(record,input);
      const name=typeof input.name==='string'?input.name.trim():'';
      if(!name||name.length>80)fail('invalid_mockup_name','Escribí un nombre de hasta 80 caracteres.');
      if(!plain(input.options)||Object.keys(input.options).length!==mockupOptions.length||mockupOptions.some(key=>typeof input.options[key]!=='boolean'))fail('invalid_mockup_options','Revisá las opciones disponibles del mockup.');
      record.draft={name,options:structuredClone(input.options),parameters:validateMockupParameters(input.parameters,fail)};record.version++;record.updatedAt=clock();
      persist(db,record);audit(db,actor.id,'mockup.saved',null);return record;
    });},
    async publishMockup(token,id,input){return store.transaction(db=>{
      const {actor}=context(db,token,{admin:true}),record=find(db,id);version(record,input);
      if(!record.draft.parameters)fail('mockup_not_ready','Abrí el lienzo y guardá la configuración antes de publicar.',409);
      const parameters=validateMockupParameters(record.draft.parameters,fail);
      record.draft.parameters=structuredClone(parameters);
      if(record.published)record.revisions.push(structuredClone(record.published));
      record.published={id,kitId:record.kitId,name:record.draft.name,revision:(record.published?.revision||0)+1,parameters,options:structuredClone(record.draft.options),publishedAt:clock()};
      record.version++;persist(db,record);audit(db,actor.id,'mockup.published',null);return record;
    });}
  };
}
