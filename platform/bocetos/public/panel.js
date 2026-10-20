const $=id=>document.getElementById(id),adminSurface=location.pathname==='/admin';
import {installMockupPanel} from './mockup-panel.js';
document.body.classList.toggle('lab-company-access',!adminSurface);
if(!adminSurface)$('login-view').setAttribute('aria-labelledby','surface-label');
let companies=[],current=null,publicConfig=null,dirty=false,loading=false,initialParameters=null,createKey=null;
let usageCompany=null,usageSequence=0;
let deleteTarget=null,deleting=false;
const fonts=[['club-sc-internacional-2023','SC Internacional 2023'],['club-real-madrid-font-2024-2025','Real Madrid 2024–2025']];
const number=new Intl.NumberFormat('es-UY'),money=new Intl.NumberFormat('es-UY',{minimumFractionDigits:4,maximumFractionDigits:6});
const date=value=>new Intl.DateTimeFormat('es-UY',{timeZone:'America/Montevideo',dateStyle:'short'}).format(new Date(value));
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(path,{body,key}={}){
  const response=await fetch(path,{credentials:'same-origin',headers:{...(body?{'content-type':'application/json'}:{}),...(key?{'idempotency-key':key}:{})},...(body?{method:'POST',body:JSON.stringify(body)}:{})});
  const result=await response.json();if(!response.ok){const error=new Error(result.error||'No se pudo completar la operación.');error.status=response.status;error.code=result.code;throw error;}return result;
}
function feedback(message,error=false){$('panel-status').textContent=message;$('panel-status').classList.toggle('error',error);}
const mockupPanel=installMockupPanel({api});
function showAdminArea(mockups=false){
  $('admin-nav').hidden=false;$('admin-view').hidden=mockups;$('mockups-view').hidden=!mockups;
  for(const [id,active] of [['nav-companies',!mockups],['nav-mockups',mockups]]){if(active)$(id).setAttribute('aria-current','page');else $(id).removeAttribute('aria-current');}
  if(mockups)void mockupPanel.show();
}
$('nav-companies').addEventListener('click',()=>{history.replaceState(null,'','#companies');showAdminArea();});
$('nav-mockups').addEventListener('click',()=>{history.replaceState(null,'','#mockups');showAdminArea(true);});
function formValid(form,error){
  for(const control of form.querySelectorAll('input,select')){control.removeAttribute('aria-invalid');control.removeAttribute('aria-describedby');}
  const invalid=[...form.elements].find(control=>control.willValidate&&!control.validity.valid);
  if(!invalid)return true;
  invalid.setAttribute('aria-invalid','true');invalid.setAttribute('aria-describedby',error.id);
  error.textContent=invalid.validity.valueMissing?'Completá los campos obligatorios.':invalid.type==='password'?'La contraseña debe tener al menos 10 caracteres.':'Revisá el valor del campo indicado.';invalid.focus();return false;
}
function loginView(setup=false,message=''){
  $('admin-nav').hidden=true;$('mockups-view').hidden=true;
  $('login-view').hidden=false;$('admin-view').hidden=true;$('logout').hidden=true;
  $('login-title').textContent=setup?'Crear acceso de administración':adminSurface?'Entrar a administración':'Entrar al laboratorio';
  $('login-description').textContent=setup?'Elegí tu usuario y contraseña para administrar las empresas.':adminSurface?'Ingresá con tu cuenta de administración.':'Ingresá con el usuario y la contraseña de tu empresa.';
  $('login-submit').textContent=setup?'Crear administración':'Entrar';$('remember-label').hidden=setup;
  $('login-password').minLength=setup?10:1;$('login-password').autocomplete=setup?'new-password':'current-password';$('login-error').textContent=message;
}
async function refresh(){
  if(loading)return;loading=true;$('refresh-companies').disabled=true;feedback('Cargando empresas…');
  try{
    companies=(await api('/api/lab/admin/companies')).data;renderCompanies();feedback('');
    try{const cost=await api('/api/lab/admin/costs');$('cost-summary').textContent=cost.reportedCost===null?'Gasto oficial: todavía sin reporte.':`Gasto oficial acumulado · ${cost.scope==='shared_keys'?'claves compartidas':'toda la organización OpenAI'}: USD ${money.format(Number(cost.reportedCost))}. Actualizado ${date(cost.syncedAt)}.`;}
    catch{$('cost-summary').textContent='El reporte oficial no está disponible. Podés volver a actualizarlo.';}
  }
  catch(error){feedback(error.message,true);if(error.status===401)loginView(false,'Tu sesión terminó. Volvé a entrar.');}
  finally{loading=false;$('refresh-companies').disabled=false;}
}
function renderCompanies(){
  const query=$('company-search').value.trim().toLocaleLowerCase('es-UY'),list=companies.filter(c=>`${c.name} ${c.username}`.toLocaleLowerCase('es-UY').includes(query));
  $('clear-search').hidden=!query;$('company-count').textContent=`${list.length} ${list.length===1?'empresa':'empresas'}`;
  $('company-rows').innerHTML=list.map(c=>`<tr><td><strong>${escape(c.name)}</strong><small>${escape(c.username)}</small></td><td><span class="lab-badge ${c.state}">${{active:'Activa',expired:'Vencida',suspended:'Suspendida'}[c.state]}</span></td><td>${escape(c.expiresOn.split('-').reverse().join('/'))}<small>${c.daysRemaining} días restantes</small></td><td>${number.format(c.used)} usadas · ${number.format(c.remaining)} disponibles${c.reserved?`<small>${c.reserved} en proceso / por verificar</small>`:''}</td><td>${number.format(c.apiCalls)}</td><td>${c.tokens===null?'—':number.format(c.tokens)}${c.tokensPending?'<small>'+c.tokensPending+' llamadas sin consumo informado</small>':''}</td><td><div class="lab-row-actions"><button type="button" class="tool-button" data-usage="${c.id}" aria-label="Ver consumo de ${escape(c.name)}">Ver consumo</button><button type="button" class="tool-button" data-edit="${c.id}" aria-label="Configurar ${escape(c.name)}">Configurar</button><button type="button" class="tool-button" data-renew="${c.id}" aria-label="Renovar ${escape(c.name)}">Renovar</button><button type="button" class="tool-button" data-copy="${c.id}" aria-label="Copiar acceso de ${escape(c.name)}">Copiar acceso</button><button type="button" class="tool-button lab-danger-text" data-delete="${c.id}" aria-label="Eliminar ${escape(c.name)}">Eliminar</button></div></td></tr>`).join('');
  $('company-empty').hidden=list.length>0;$('company-empty').querySelector('h2').textContent=query?'Sin coincidencias':'Todavía no hay empresas';$('company-empty').querySelector('p').textContent=query?'Probá con otro nombre o limpiá la búsqueda.':'Creá la primera para darle acceso al laboratorio.';
}
async function showUsage(company,focus=true){
  usageCompany=company;const sequence=++usageSequence;
  $('usage-section').hidden=false;$('usage-title').textContent=`Consumo · ${company.name}`;
  $('usage-status').textContent='Cargando llamadas…';$('usage-rows').replaceChildren();$('refresh-usage').disabled=true;
  if(focus)$('usage-title').focus();
  try{
    const result=await api(`/api/lab/admin/companies/${company.id}/usage`);if(sequence!==usageSequence)return;
    $('usage-status').textContent=result.total?`${number.format(result.total)} llamadas registradas. Mostrando las últimas ${result.data.length}.`:'Todavía no hay llamadas a OpenAI de esta empresa.';
    const count=value=>Number.isFinite(value)?number.format(value):'—';
    $('usage-rows').innerHTML=result.data.map(call=>`<tr><td>${escape(new Date(call.at).toLocaleString('es-UY',{timeZone:'America/Montevideo'}))}<small>${call.kind==='generation'?'Generación':'Análisis'} · ${escape(call.operationId)}</small></td><td>${escape(call.model||'Sin modelo informado')}<small>${call.keySlot==='fallback'?'Respaldo':'Principal'}</small></td><td>${{processing:'En proceso',succeeded:'Respondida',rejected:'Rechazada',unknown:'Por verificar'}[call.outcome]||'Por verificar'}<small>${call.status?`HTTP ${call.status}`:'Sin respuesta confirmada'}</small></td><td>${count(call.usage?.total_tokens??(Number.isFinite(call.usage?.input_tokens)&&Number.isFinite(call.usage?.output_tokens)?call.usage.input_tokens+call.usage.output_tokens:null))}<small>Entrada: ${count(call.usage?.input_tokens)} · Salida: ${count(call.usage?.output_tokens)}</small>${call.usage?`<details><summary>Desglose</summary><pre>${escape(JSON.stringify(call.usage,null,2))}</pre></details>`:'<small>OpenAI no informó el consumo.</small>'}</td><td class="lab-request-id">${escape(call.providerRequestId||'No disponible')}</td></tr>`).join('');
  }catch(error){if(sequence===usageSequence)$('usage-status').textContent=error.message;}
  finally{if(sequence===usageSequence)$('refresh-usage').disabled=false;}
}
function fontOptions(company,preserve=false){
  const options=[...fonts,...(company?.assets||[]).filter(a=>a.kind==='font').map(a=>[`tenant-${a.id}`,a.name])];
  for(const [id,defaultValue] of [['default-number-font',fonts[0][0]],['default-name-font',fonts[1][0]]]){
    const select=$(id),previous=select.value;select.replaceChildren(...options.map(([key,label])=>new Option(label,key)));
    select.value=(preserve?previous:null)||company?.settings?.[id==='default-number-font'?'numberFont':'nameFont']||defaultValue;
    if(select.selectedIndex<0)select.value=defaultValue;
  }
}
function resourceList(){
  for(const kind of ['brand','brand2','background','font']){
    const assets=(current?.assets||[]).filter(a=>a.kind===kind),node=$(`asset-${kind}`);node.replaceChildren();
    for(const asset of assets){if(kind!=='font'){const img=new Image();img.src=`/api/lab/admin/assets/${asset.id}`;img.alt=asset.name;node.append(img);}const text=document.createElement('span');text.textContent=asset.name;node.append(text);}
    if(!assets.length)node.textContent='Sin archivo';
  }
}
function openCompany(company=null,renew=false){
  current=company?structuredClone(company):null;createKey=crypto.randomUUID();initialParameters=company?.settings?.initialParameters||null;dirty=false;
  $('company-form').reset();$('company-title').textContent=company?company.name:'Nueva empresa';$('company-user').readOnly=Boolean(company);
  $('company-name').value=company?.name||'';$('company-user').value=company?.username||'';$('company-expires').value=company?.expiresOn||new Date(Date.now()+30*86400000).toISOString().slice(0,10);
  $('company-credits').value=company?0:100;$('company-credits-label').textContent=company?'Agregar generaciones':'Generaciones iniciales';
  $('credit-summary').textContent=company?`${company.remaining} disponibles · ${company.used} usadas. La renovación conserva el historial.`:'';
  $('company-password-label').textContent=company?'Nueva contraseña (opcional)':'Contraseña inicial';$('company-password').required=!company;$('company-password').type='password';
  $('company-suspended').checked=company?.suspended||false;
  $('save-company').textContent=company?'Guardar cambios':'Crear empresa';$('company-resources').hidden=!company;$('company-error').textContent='';
  $('initial-parameters-status').textContent=initialParameters?'Configuración inicial personalizada.':'Se usa la base actual del laboratorio.';
  fontOptions(company);resourceList();$('company-dialog').showModal();(renew?$('company-expires'):$('company-name')).focus();
}
function requestClose(){if($('save-company').disabled)return;if(dirty)$('confirm-dialog').showModal();else $('company-dialog').close();}
async function copyAccess(company){
  const text=`Laboratorio SPORTEX\n${publicConfig.labUrl||`${location.origin}/`}\nUsuario: ${company.username}`;
  try{await navigator.clipboard.writeText(text);feedback(`Acceso de ${company.name} copiado.`);}
  catch{$('access-text').value=text;$('access-dialog').showModal();$('access-text').select();}
}
function openDeletion(company){
  deleteTarget=structuredClone(company);$('delete-company-form').reset();$('delete-company-error').textContent='';
  $('delete-company-name').textContent=company.name;$('delete-company-user').textContent=company.username;
  $('delete-company-confirmation').removeAttribute('aria-invalid');$('confirm-delete-company').disabled=true;
  $('delete-company-dialog').showModal();$('cancel-delete-company').focus();
}
function closeDeletion(){if(!deleting)$('delete-company-dialog').close();}
$('delete-company-confirmation').addEventListener('input',()=>{
  $('confirm-delete-company').disabled=deleting||$('delete-company-confirmation').value!==deleteTarget?.username;
  $('delete-company-confirmation').removeAttribute('aria-invalid');$('delete-company-error').textContent='';
});
$('cancel-delete-company').addEventListener('click',closeDeletion);
$('delete-company-dialog').addEventListener('cancel',event=>{event.preventDefault();closeDeletion();});
$('delete-company-dialog').addEventListener('close',()=>{deleteTarget=null;});
$('delete-company-form').addEventListener('submit',async event=>{
  event.preventDefault();if(deleting||!deleteTarget||$('delete-company-confirmation').value!==deleteTarget.username)return;
  const target=deleteTarget;deleting=true;$('delete-company-error').textContent='';
  $('confirm-delete-company').disabled=true;$('confirm-delete-company').textContent='Eliminando…';$('cancel-delete-company').disabled=true;$('delete-company-confirmation').disabled=true;
  try{
    await api(`/api/lab/admin/companies/${target.id}/delete`,{body:{version:target.version,confirmation:$('delete-company-confirmation').value}});
    companies=companies.filter(c=>c.id!==target.id);if(current?.id===target.id)current=null;
    if(usageCompany?.id===target.id){usageCompany=null;usageSequence++;$('usage-section').hidden=true;$('usage-rows').replaceChildren();$('usage-title').textContent='Consumo de la empresa';$('usage-status').textContent='';}
    renderCompanies();$('delete-company-dialog').close();$('new-company').focus();feedback(`${target.name}: empresa y datos activos eliminados.`);
  }catch(error){$('delete-company-error').textContent=error.code==='version_conflict'?'La empresa cambió. Cancelá, actualizá el panel y volvé a intentar.':error.message;}
  finally{deleting=false;$('confirm-delete-company').textContent='Eliminar empresa';$('cancel-delete-company').disabled=false;$('delete-company-confirmation').disabled=false;$('confirm-delete-company').disabled=!deleteTarget||$('delete-company-confirmation').value!==deleteTarget.username;}
});
async function uploadFile(file,kind){
  if(file.size>(kind==='font'?10:15)*1024*1024)throw new Error(kind==='font'?'La fuente supera 10 MB.':'La imagen supera 15 MB.');
  if(kind==='font')return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('No se pudo leer la fuente.'));reader.readAsDataURL(file);});
  if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Usá una imagen PNG, JPG o WebP.');
  const image=await createImageBitmap(file);try{const scale=Math.min(1,2048/Math.max(image.width,image.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/png');}finally{image.close();}
}

$('show-password').addEventListener('change',()=>{$('login-password').type=$('show-password').checked?'text':'password';});
$('show-company-password').addEventListener('change',()=>{$('company-password').type=$('show-company-password').checked?'text':'password';});
$('login-form').addEventListener('submit',async event=>{
  event.preventDefault();if(!formValid(event.currentTarget,$('login-error')))return;
  const button=$('login-submit'),setup=publicConfig.setupNeeded&&adminSurface;button.disabled=true;$('login-error').textContent='';
  try{await api(setup?'/api/lab/setup':'/api/lab/login',{body:{username:$('login-user').value,password:$('login-password').value,remember:$('remember').checked,audience:adminSurface?'admin':'company'}});$('login-password').value='';if(adminSurface){publicConfig.setupNeeded=false;$('login-view').hidden=true;showAdminArea(location.hash==='#mockups');$('logout').hidden=false;await refresh();}else location.assign('/');}
  catch(error){$('login-error').textContent=error.message;}finally{button.disabled=false;}
});
$('logout').addEventListener('click',async()=>{try{await api('/api/lab/logout',{body:{audience:'admin'}});loginView();}catch(error){feedback(error.message,true);}});
$('new-company').addEventListener('click',()=>openCompany());$('refresh-companies').addEventListener('click',refresh);
$('company-search').addEventListener('input',renderCompanies);$('clear-search').addEventListener('click',()=>{$('company-search').value='';renderCompanies();$('company-search').focus();});
$('company-rows').addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;const company=companies.find(c=>c.id===(button.dataset.edit||button.dataset.renew||button.dataset.copy||button.dataset.usage||button.dataset.delete));if(!company)return;if(button.dataset.delete)openDeletion(company);else if(button.dataset.usage)showUsage(company);else if(button.dataset.copy)copyAccess(company);else openCompany(company,Boolean(button.dataset.renew));});
$('refresh-usage').addEventListener('click',()=>{if(usageCompany)showUsage(usageCompany,false);});
$('close-usage').addEventListener('click',()=>{const id=usageCompany?.id;usageCompany=null;usageSequence++;$('usage-section').hidden=true;document.querySelector(`[data-usage="${id}"]`)?.focus();});
$('company-form').addEventListener('input',()=>{dirty=true;});
$('close-company').addEventListener('click',requestClose);$('cancel-company').addEventListener('click',requestClose);
$('company-dialog').addEventListener('cancel',event=>{event.preventDefault();requestClose();});
$('keep-editing').addEventListener('click',()=>{$('confirm-dialog').close();});
$('discard-changes').addEventListener('click',()=>{$('confirm-dialog').close();$('company-dialog').close();});
$('close-access').addEventListener('click',()=>{$('access-dialog').close();});
$('company-form').addEventListener('submit',async event=>{
  event.preventDefault();$('company-error').textContent='';if(!formValid(event.currentTarget,$('company-error')))return;
  const button=$('save-company');button.disabled=true;
  const settings={...(current?.settings||{}),numberFont:$('default-number-font').value,nameFont:$('default-name-font').value,initialParameters};
  try{
    if(!current){
      current=(await api('/api/lab/admin/companies',{key:createKey,body:{name:$('company-name').value,username:$('company-user').value,password:$('company-password').value,expiresOn:$('company-expires').value,credits:Number($('company-credits').value)}})).data;
      // The user exists now; subsequent retries only update this company.
      $('company-password').value='';$('company-password').required=false;$('company-credits').value=0;
    }
    current=(await api(`/api/lab/admin/companies/${current.id}`,{body:{version:current.version,name:$('company-name').value,expiresOn:$('company-expires').value,addCredits:Number($('company-credits').value),suspended:$('company-suspended').checked,...($('company-password').value?{password:$('company-password').value}:{}),settings}})).data;
    dirty=false;$('company-dialog').close();await refresh();feedback(`${current.name}: acceso y configuración guardados.`);
  }catch(error){$('company-error').textContent=error.message;}
  finally{button.disabled=false;}
});
for(const input of document.querySelectorAll('[data-kind]'))input.addEventListener('change',async()=>{
  const file=input.files[0];if(!file||!current)return;input.disabled=true;$('save-company').disabled=true;$('company-error').textContent='Cargando recurso…';
  try{const data=await uploadFile(file,input.dataset.kind);await api(`/api/lab/admin/companies/${current.id}/assets`,{body:{kind:input.dataset.kind,name:file.name,data}});const list=(await api('/api/lab/admin/companies')).data;current=list.find(c=>c.id===current.id);companies=list;resourceList();fontOptions(current,true);renderCompanies();$('company-error').textContent='Recurso guardado.';}
  catch(error){$('company-error').textContent=error.message;}finally{input.value='';input.disabled=false;$('save-company').disabled=false;}
});
$('initial-parameters-file').addEventListener('change',async event=>{
  try{const file=event.target.files[0];if(!file)return;if(file.size>200000)throw new Error('El archivo de parámetros es demasiado grande.');const value=JSON.parse(await file.text());if(value.kind!=='sportex-initial-parameters'||!value.layers)throw new Error('Usá un JSON de parámetros iniciales del laboratorio.');initialParameters=value;dirty=true;$('initial-parameters-status').textContent=`Preparado: ${file.name}. Guardá los cambios para aplicarlo.`;}
  catch(error){$('company-error').textContent=error.message;}finally{event.target.value='';}
});
$('sync-costs').addEventListener('click',async()=>{
  const button=$('sync-costs');button.disabled=true;feedback('Consultando gasto reportado por OpenAI…');
  try{await api('/api/lab/admin/costs/sync',{body:{}});await refresh();feedback('Gasto actualizado desde OpenAI.');}catch(error){feedback(error.message,true);}finally{button.disabled=false;}
});
async function init(){
  try{
    publicConfig=await api('/api/lab/public');
    if(!adminSurface){
      document.title='SPORTEX · Acceso al laboratorio';const home=document.querySelector('.lab-header a');home.href='/';home.setAttribute('aria-label','SPORTEX, laboratorio de bocetos');
      try{await api('/api/lab/session');location.replace('/');}
      catch(error){loginView(false,error.status===401?'':error.message);}
      return;
    }
    $('surface-label').textContent='ADMINISTRACIÓN · BOCETOS';
    if(publicConfig.setupNeeded){loginView(true);return;}
    try{await api('/api/lab/session?audience=admin');showAdminArea(location.hash==='#mockups');$('logout').hidden=false;await refresh();}
    catch(error){loginView(false,error.status===401?'':error.message);}
  }catch(error){loginView(false,error.message);}
}
init();
