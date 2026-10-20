// Documents are rendered once. Only the bounded raster enters the live canvas.
export const textureMaxEdge=2048, textureDocumentLimit=50_000_000;
export function textureFileKind(file){
  const ext=String(file?.name||'').split('.').pop().toLowerCase();
  if(ext==='pdf')return ext;
  return ['image/png','image/jpeg','image/webp'].includes(file?.type)?'image':null;
}
export function validateTextureFile(file){
  const kind=textureFileKind(file);
  if(!kind)throw new Error('Usá una imagen PNG, JPG o WebP, o un PDF.');
  if(!file.size||file.size>(kind==='image'?15_000_000:textureDocumentLimit))throw new Error(kind==='image'?'La imagen debe pesar hasta 15 MB.':'El PDF debe pesar hasta 50 MB.');
  return kind;
}
export function textureRasterSize(width,height){
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw new Error('La página no tiene dimensiones válidas.');
  const scale=Math.min(1,textureMaxEdge/Math.max(width,height));
  return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
}
const dataUrl=blob=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('No se pudo leer la textura.'));reader.readAsDataURL(blob);});
const canvasBlob=canvas=>new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('No se pudo preparar la textura.')),'image/png'));
export async function optimizedTextureImage(file){
  const bitmap=await createImageBitmap(file);
  try{
    const size=textureRasterSize(bitmap.width,bitmap.height);
    if(size.width===bitmap.width&&size.height===bitmap.height)return {src:await dataUrl(file),...size};
    const canvas=document.createElement('canvas');Object.assign(canvas,size);
    try{const c=canvas.getContext('2d');c.imageSmoothingQuality='high';c.drawImage(bitmap,0,0,size.width,size.height);return {src:await dataUrl(await canvasBlob(canvas)),...size};}
    finally{canvas.width=canvas.height=1;}
  }finally{bitmap.close();}
}

export function installTextureImport(dialog){
  const $=id=>dialog.querySelector('#'+id),canvas=$('texture-import-preview'),pageSelect=$('texture-import-page'),status=$('texture-import-status'),accept=$('texture-import-accept');
  let session=null,pdfModule=null;
  function fitPreview(){const frame=canvas.parentElement,scale=Math.min(frame.clientWidth/canvas.width,frame.clientHeight/canvas.height);canvas.style.width=(canvas.width*scale)+'px';canvas.style.height=(canvas.height*scale)+'px';}
  new ResizeObserver(fitPreview).observe(canvas.parentElement);
  function busy(value,message){accept.disabled=value;pageSelect.disabled=value;dialog.setAttribute('aria-busy',String(value));status.textContent=message;status.classList.remove('error');}
  function failed(message){busy(true,message);dialog.setAttribute('aria-busy','false');status.classList.add('error');}
  function cancel(){dialog.close('cancel');}
  $('texture-import-cancel').addEventListener('click',cancel);
  dialog.addEventListener('close',()=>{const s=session;if(!s)return;session=null;s.render?.cancel();s.task?.destroy().catch(()=>{});canvas.width=canvas.height=1;pageSelect.replaceChildren();s.resolve(null);});
  async function renderPage(s){
    busy(true,'Preparando página…');s.result=null;
    try{
      const page=await s.doc.getPage(Number(pageSelect.value));if(session!==s)return;
      const viewport=page.getViewport({scale:1}),scale=textureMaxEdge/Math.max(viewport.width,viewport.height),view=page.getViewport({scale});
      canvas.width=Math.ceil(view.width);canvas.height=Math.ceil(view.height);
      fitPreview();
      s.render=page.render({canvasContext:canvas.getContext('2d'),viewport:view});await s.render.promise;s.render=null;
      const blob=await canvasBlob(canvas);if(session!==s)return;
      s.result={src:await dataUrl(blob),width:canvas.width,height:canvas.height,page:Number(pageSelect.value),pages:s.doc.numPages};
      if(session===s)busy(false,`Página ${pageSelect.value} de ${s.doc.numPages} · ${canvas.width} × ${canvas.height} px. Lista para usar.`);
      page.cleanup();
    }catch(error){if(session===s){failed('No se pudo preparar esta página. Probá otra o exportala nuevamente como PDF.');pageSelect.disabled=false;}}
  }
  pageSelect.addEventListener('change',()=>{if(session?.doc)renderPage(session);});
  accept.addEventListener('click',()=>{const s=session;if(!s?.result)return;s.resolve(s.result);dialog.close('accept');});
  return async function importTexture(file){
    const kind=validateTextureFile(file);if(kind==='image')return optimizedTextureImage(file);
    if(session)throw new Error('Terminá la importación abierta antes de cargar otra textura.');
    const focus=document.activeElement;
    return new Promise(resolve=>{
      let settled=false;const settle=result=>{if(settled)return;settled=true;resolve(result);focus?.focus();};
      const s={resolve:settle,task:null,render:null,result:null};session=s;
      $('texture-import-file').textContent=file.name;canvas.width=canvas.height=1;pageSelect.replaceChildren();busy(true,'Abriendo PDF…');dialog.showModal();$('texture-import-cancel').focus();
      (async()=>{
        try{
          const bytes=await file.arrayBuffer();
          if(session!==s)return;
          pdfModule??=import('/vendor/pdfjs/build/pdf.min.mjs');const pdf=await pdfModule;if(session!==s)return;
          pdf.GlobalWorkerOptions.workerSrc='/vendor/pdfjs/build/pdf.worker.min.mjs';
          s.task=pdf.getDocument({data:new Uint8Array(bytes),isEvalSupported:false,enableXfa:false,canvasMaxAreaInBytes:16_777_216,standardFontDataUrl:'/vendor/pdfjs/standard_fonts/',cMapUrl:'/vendor/pdfjs/cmaps/',cMapPacked:true,wasmUrl:'/vendor/pdfjs/wasm/'});
          s.task.onPassword=()=>{if(session===s){s.errorMessage='El PDF tiene contraseña. Guardá una copia sin protección y volvé a cargarla.';s.task.destroy().catch(()=>{});failed(s.errorMessage);}};
          s.doc=await s.task.promise;if(session!==s)return;
          if(s.doc.numPages>200){s.errorMessage='Usá un documento de hasta 200 páginas o exportá solo la página de la textura.';throw new Error(s.errorMessage);}
          for(let i=1;i<=s.doc.numPages;i++)pageSelect.add(new Option('Página '+i,String(i)));
          await renderPage(s);
        }catch(error){if(session===s){failed(s.errorMessage||(error?.name==='InvalidPDFException'?'El PDF está dañado o no es válido. Exportalo nuevamente y volvé a cargarlo.':'No se pudo abrir el documento. Exportalo como PDF y volvé a intentar.'));s.task?.destroy().catch(()=>{});}}
      })();
    });
  };
}
