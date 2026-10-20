// Standalone keeps existing storage; managed sessions get a company namespace.
export async function bootstrapLab(){
  const response=await fetch('/api/lab/public');
  if(response.status===404)return {managed:false,key:key=>key,fetch:(...args)=>fetch(...args)};
  if(!response.ok)throw new Error('No se pudo validar el acceso al laboratorio.');
  const sessionResponse=await fetch('/api/lab/session');
  if(!sessionResponse.ok){location.assign('/login');throw new Error('Acceso al laboratorio requerido.');}
  const session=await sessionResponse.json();
  const lab={managed:true,company:session.company,remaining:session.company.remaining,onBalance:null,key:key=>`sportex-local-${session.company.id}-${key}`};
  let blocked=false;
  function block(message){
    if(blocked)return;blocked=true;
    const dialog=document.createElement('dialog');dialog.className='lab-access-block';dialog.setAttribute('aria-labelledby','lab-access-title');
    const title=document.createElement('h2');title.id='lab-access-title';title.textContent='Acceso al laboratorio';
    const text=document.createElement('p');text.textContent=message;
    const button=document.createElement('button');button.type='button';button.className='primary-button';button.textContent='Volver a entrar';button.addEventListener('click',()=>location.assign('/login'));
    dialog.append(title,text,button);dialog.addEventListener('cancel',event=>event.preventDefault());document.body.append(dialog);dialog.showModal();
  }
  lab.refresh=async()=>{
    try{const result=await fetch('/api/lab/session');const value=await result.json();
      if(!result.ok){if([401,403].includes(result.status))block(value.error||'El acceso no está disponible.');return;}
      lab.remaining=value.company.remaining;lab.onBalance?.(lab.remaining);
    }catch{/* A connectivity error does not erase a valid session or draft. */}
  };
  lab.fetch=async(url,options={})=>{
    const result=await fetch(url,{...options,headers:{...options.headers,'idempotency-key':crypto.randomUUID()}});
    const value=await result.clone().json().catch(()=>null);
    if([401,403].includes(result.status))block(value?.error||'Volvé a iniciar sesión.');
    if(Number.isInteger(value?.remaining)){lab.remaining=value.remaining;lab.onBalance?.(lab.remaining);}
    return result;
  };
  lab.install=()=>{
    const button=document.createElement('button');button.type='button';button.className='top-export';button.textContent='Cerrar sesión';
    button.addEventListener('click',async()=>{button.disabled=true;try{await fetch('/api/lab/logout',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});location.assign('/login');}catch{button.disabled=false;}});
    document.querySelector('.top-actions').append(button);
    const label=document.querySelector('.brand-product-label');if(label)label.textContent=lab.company.name;
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)lab.refresh();});window.addEventListener('focus',lab.refresh);setInterval(lab.refresh,60000);
  };
  return lab;
}
