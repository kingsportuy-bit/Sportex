import {mockupOptionInputs} from './mockup-config.js';
const labels={shorts:'Short',socks:'Medias',raglan:'Manga ranglán',cuffs:'Puños',sleeveTrim:'Vivo de manga',shoulderTrim:'Vivo de hombros',shirtTrim:'Laterales de camiseta',shortTrim:'Laterales de short',shortHem:'Vivo inferior de short'};
export async function bootstrapMockupEditor(id){
  async function request(path,body){
    const response=await fetch(path,{...(body?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{})});
    const result=await response.json();if(!response.ok){if(response.status===401)location.assign('/admin');throw new Error(result.error||'No se pudo abrir el mockup.');}return result.data;
  }
  let record=await request('/api/lab/admin/mockups/'+id);
  const preview=new URLSearchParams(location.search).has('preview');
  return {managed:false,mockupEditor:true,record,preview,key:key=>`sportex-mockup-${id}-${key}`,
    fetch(){throw new Error('Las pruebas de mockups no consumen IA.');},
    installEditor({read,reset,confirm}){
      document.body.classList.add('mockup-editor-mode');
      const bar=document.createElement('section');bar.className='mockup-setup-bar';bar.setAttribute('aria-label','Configuración del mockup');
      const heading=document.createElement('h1');heading.textContent=preview?'Probar configuración inicial':'Configurar mockup';
      const name=document.createElement('input');name.value=record.draft.name;name.maxLength=80;name.setAttribute('aria-label','Nombre del mockup');name.disabled=preview;
      const help=document.createElement('p');help.textContent=preview?'Boceto de prueba. Los cambios de esta prueba no se guardan.':'Ajustá el lienzo y las opciones. Guardar conserva el borrador; publicar se hace desde el panel.';
      const options=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent='Opciones disponibles en el laboratorio';options.append(legend);options.disabled=preview;
      const checks={};
      for(const [key,label] of Object.entries(labels)){
        const row=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=record.draft.options[key];checks[key]=input;row.append(input,document.createTextNode(label));options.append(row);
      }
      const status=document.createElement('p');status.className='mockup-save-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.hidden=true;
      const actions=document.createElement('div');actions.className='mockup-setup-actions';
      const back=document.createElement('a');back.href='/admin#mockups';back.className='secondary-button';back.textContent='Volver a Mockups';
      const save=document.createElement('button');save.type='button';save.className='primary-button';save.textContent='Guardar configuración inicial';save.hidden=preview;
      let saving=false,lastSaved=null;
      const signature=()=>JSON.stringify({name:name.value,options:Object.fromEntries(Object.entries(checks).map(([key,input])=>[key,input.checked])),parameters:read()});
      const changed=()=>lastSaved!==null&&signature()!==lastSaved;
      back.addEventListener('click',async event=>{if(!preview&&changed()){event.preventDefault();if(await confirm('Salir de la configuración','Los cambios sin guardar se perderán. El borrador guardado se conserva.','Salir sin guardar')){lastSaved=signature();location.assign(back.href);}}});
      window.addEventListener('beforeunload',event=>{if(!preview&&changed()){event.preventDefault();event.returnValue='';}});
      save.addEventListener('click',async()=>{
        if(saving)return;saving=true;save.disabled=true;status.hidden=false;status.classList.remove('error');status.textContent='Guardando configuración…';
        try{
          const parameters=read();
          for(const [key,ids] of Object.entries(mockupOptionInputs))if(!checks[key].checked)for(const field of ids)parameters.inputs[field]=false;
          record=await request('/api/lab/admin/mockups/'+id,{version:record.version,name:name.value,options:Object.fromEntries(Object.entries(checks).map(([key,input])=>[key,input.checked])),parameters});
          status.textContent='Borrador guardado. Ya podés probarlo o publicarlo desde Mockups.';lastSaved=signature();
        }catch(error){status.textContent=error.message;status.classList.add('error');}
        finally{saving=false;save.disabled=false;}
      });
      const test=document.createElement('a');test.href=location.pathname+'?preview=1';test.target='_blank';test.rel='noopener';test.className='secondary-button';test.textContent='Probar borrador guardado';test.hidden=preview;
      actions.append(back,test,save);bar.append(heading,name,help,options,actions,status);document.querySelector('.topbar').after(bar);
      if(preview){const restart=document.createElement('button');restart.type='button';restart.className='secondary-button';restart.textContent='Restaurar prueba';restart.addEventListener('click',reset);actions.append(restart);}
      for(const id of ['generation-balance','new-sketch','copy-reference-colors'])document.getElementById(id).hidden=true;
      document.getElementById('generate').closest('details').hidden=true;
      document.querySelector('label[for="background-file"]').hidden=true;
      document.getElementById('sponsor-file').closest('details').hidden=true;
      document.getElementById('mold-select').disabled=true;
      document.querySelector('.panel-heading h1').textContent=preview?'Boceto de prueba':'Configuración inicial';
      document.querySelector('.panel-heading p').textContent='Los logos de muestra sirven para ajustar posiciones y tamaños. Sus imágenes no se guardan en la base.';
      lastSaved=signature();
    }
  };
}
