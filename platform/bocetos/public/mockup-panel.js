const $=id=>document.getElementById(id);
export function installMockupPanel({api}){
  let records=[],target=null,busy=false;
  const status=(message,error=false)=>{$('mockups-status').textContent=message;$('mockups-status').classList.toggle('error',error);};
  async function refresh(){
    $('refresh-mockups').disabled=true;status('Cargando mockups…');
    try{
      records=(await api('/api/lab/admin/mockups')).data;
      const rows=records.map(record=>{
        const row=document.createElement('tr');
        const name=document.createElement('td'),strong=document.createElement('strong'),small=document.createElement('small');strong.textContent=record.draft.name;small.textContent='Fútbol básico · cuello redondo';name.append(strong,small);
        const state=document.createElement('td');state.textContent=record.published?'Publicado · versión '+record.published.revision:'Borrador';
        const draft=document.createElement('td');draft.textContent=record.published&&JSON.stringify([record.draft.name,record.draft.parameters,record.draft.options])===JSON.stringify([record.published.name,record.published.parameters,record.published.options])?'Sin cambios pendientes':'Borrador disponible';
        const actions=document.createElement('td'),group=document.createElement('div');group.className='lab-row-actions';
        for(const [label,preview] of [['Configurar',false],['Probar borrador',true]]){const link=document.createElement('a');link.className='tool-button';link.textContent=label;link.href=`/admin/mockups/${record.id}/editor${preview?'?preview=1':''}`;link.target='_blank';link.rel='noopener';link.setAttribute('aria-label',`${label}: ${record.draft.name} (nueva pestaña)`);group.append(link);}
        const publish=document.createElement('button');publish.type='button';publish.className='tool-button';publish.textContent='Publicar';publish.addEventListener('click',()=>{
          target=record;$('publish-mockup-name').textContent=record.draft.name;$('publish-mockup-error').textContent='';$('publish-mockup-dialog').showModal();$('cancel-publish-mockup').focus();
        });group.append(publish);actions.append(group);row.append(name,state,draft,actions);return row;
      });
      $('mockup-rows').replaceChildren(...rows);status('');
      $('mockup-source').replaceChildren(...records.map(r=>new Option(r.draft.name,r.id)));
    }catch(error){status(error.message,true);}finally{$('refresh-mockups').disabled=false;}
  }
  $('refresh-mockups').addEventListener('click',refresh);
  $('new-mockup').addEventListener('click',()=>{$('new-mockup-form').reset();$('new-mockup-error').textContent='';$('new-mockup-dialog').showModal();$('mockup-name').focus();});
  $('cancel-new-mockup').addEventListener('click',()=>$('new-mockup-dialog').close());
  $('new-mockup-form').addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;busy=true;$('create-mockup').disabled=true;
    try{await api('/api/lab/admin/mockups',{body:{name:$('mockup-name').value,sourceId:$('mockup-source').value}});$('new-mockup-dialog').close();await refresh();status('Configuración creada en borrador. Abrí Configurar para ajustarla.');}
    catch(error){$('new-mockup-error').textContent=error.message;}finally{busy=false;$('create-mockup').disabled=false;}
  });
  $('cancel-publish-mockup').addEventListener('click',()=>{if(!busy)$('publish-mockup-dialog').close();});
  $('publish-mockup-dialog').addEventListener('cancel',event=>{if(busy)event.preventDefault();});
  $('confirm-publish-mockup').addEventListener('click',async()=>{
    if(busy||!target)return;busy=true;$('confirm-publish-mockup').disabled=true;
    try{await api(`/api/lab/admin/mockups/${target.id}/publish`,{body:{version:target.version}});$('publish-mockup-dialog').close();await refresh();status('Configuración publicada. Se usará en los nuevos bocetos.');}
    catch(error){$('publish-mockup-error').textContent=error.message;if(error.code==='version_conflict')await refresh();}
    finally{busy=false;$('confirm-publish-mockup').disabled=false;}
  });
  return {show:refresh};
}
