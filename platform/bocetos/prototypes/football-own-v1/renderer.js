import {prepareMaterial,paintMaterial} from './material.js';

export const collarTypes=['round','v','polo'];
export const collarLabels={round:'Redondo',v:'En V',polo:'Polo'};
export const defaults={collar:'round',color:'#e6e8e7',second:'#202923',sleeve:'#e6e8e7',neckColor:'#1f2d25',pattern:'stripes',showPieces:false};

export function createPrototypeRenderer(makeCanvas) {
  const materials={body:{},round:{},v:{},polo:{}};
  const paintCache=new WeakMap();
  const surface=(w,h)=>makeCanvas(w,h);
  function extract(image,side,kind){
    const half=Math.floor(image.width/2), c=surface(half,image.height),ctx=c.getContext('2d');
    ctx.drawImage(image,side==='front'?0:half,0,half,image.height,0,0,half,image.height);
    return prepareMaterial(ctx.getImageData(0,0,half,image.height).data,half,image.height,kind);
  }
  function load(images){
    for(const key of ['body',...collarTypes])for(const side of ['front','back'])materials[key][side]=extract(images[key],side,key==='body'?'body':'collar');
  }
  function painted(material,settings){
    const key=JSON.stringify(settings);let cache=paintCache.get(material);
    if(!cache){cache=new Map();paintCache.set(material,cache);}if(cache.has(key))return cache.get(key);
    const result=paintMaterial(material,settings),c=surface(result.width,result.height),ctx=c.getContext('2d');
    const data=ctx.createImageData(result.width,result.height);data.data.set(result.data);ctx.putImageData(data,0,0);
    if(cache.size>=2)cache.delete(cache.keys().next().value);cache.set(key,c);return c;
  }
  function placement(type,side){
    const body=materials.body[side],neck=materials[type][side];
    const width=body.width*(type==='polo'?.36:.30),height=width*neck.height/neck.width;
    return {x:(body.width-width)/2,y:-body.height*.006,width,height};
  }
  function renderView(type,side,settings={}){
    const s={...defaults,...settings,collar:type},body=materials.body[side],neck=materials[type][side];
    if(!body||!neck)throw new Error('El mockup todavía está cargando.');
    const pad=22,c=surface(body.width+pad*2,body.height+pad*2),ctx=c.getContext('2d');
    const p=placement(type,side),band=painted(neck,{color:s.neckColor});
    ctx.save();ctx.translate(pad,pad);ctx.drawImage(painted(body,{color:s.color,second:s.second,sleeve:s.sleeve,pattern:s.pattern,showPieces:s.showPieces}),0,0);
    // La abertura sigue la silueta superior real del cuello, por columna.
    // Solo cambia esta zona: el cuerpo y el muestreo del estampado son comunes.
    ctx.save();ctx.globalCompositeOperation='destination-out';ctx.fillStyle='#000';
    const scale=p.width/neck.width;
    ctx.beginPath();ctx.moveTo(p.x,-pad);
    for(let x=0;x<neck.width;x++)if(neck.envelope[x]>=0){
      const upper=p.y+neck.envelope[x]*scale+.35;
      // Los extremos laterales de la banda frontal apoyan sobre los hombros.
      // Su descenso no es una abertura: solo se retira la pequeña tapa superior.
      ctx.lineTo(p.x+x*scale,side==='front'?Math.min(upper,body.height*.012):upper);
    }
    ctx.lineTo(p.x+p.width,-pad);ctx.closePath();ctx.fill();
    ctx.restore();
    if(side==='front'){
      const hole=surface(neck.width,neck.height),hc=hole.getContext('2d'),im=hc.createImageData(neck.width,neck.height);
      for(let y=0;y<neck.height;y++)for(let x=0;x<neck.width;x++){
        const i=y*neck.width+x;if(!neck.holes[i])continue;
        const bx=Math.min(body.width-1,Math.floor(body.width*.35+x/neck.width*body.width*.3));
        const by=Math.min(body.height-1,Math.floor(body.height*.2+y/neck.height*body.height*.15));
        const g=Math.round((88+Math.min(1,y/neck.height)*36)*body.gray[by*body.width+bx]/body.reference);
        im.data.set([g,g+3,g+1,255],i*4);
      }
      hc.putImageData(im,0,0);ctx.drawImage(hole,p.x,p.y,p.width,p.height);
    }
    ctx.save();ctx.shadowColor='rgba(0,0,0,.28)';ctx.shadowBlur=2.5;ctx.shadowOffsetY=1.5;
    ctx.drawImage(band,p.x,p.y,p.width,p.height);ctx.restore();ctx.restore();
    return c;
  }
  function drawPair(target,settings={}){
    const s={...defaults,...settings},ctx=target.getContext('2d');ctx.clearRect(0,0,target.width,target.height);
    const views=['front','back'].map(side=>renderView(s.collar,side,s));
    const scale=Math.min((target.width-84)/(views[0].width+views[1].width),(target.height-44)/Math.max(...views.map(v=>v.height)));
    let x=(target.width-(views[0].width+views[1].width)*scale-30)/2;
    for(const view of views){ctx.drawImage(view,x,(target.height-view.height*scale)/2,view.width*scale,view.height*scale);x+=view.width*scale+30;}
  }
  function exportLayer(key,side,mode='mask',piece=null){
    const m=materials[key][side],c=surface(m.width,m.height),ctx=c.getContext('2d'),out=ctx.createImageData(m.width,m.height);
    for(let y=0;y<m.height;y++)for(let x=0;x<m.width;x++){
      const i=y*m.width+x,j=i*4;if(!m.alpha[i])continue;
      if(piece&&key==='body'){
        // Mismo reparto usado al pintar; las piezas suman exactamente la máscara.
        const u=x/m.width,v=y/m.height,seam=.155+Math.min(v/.45,1)*.08;
        const actual=v<.46&&u<seam?'left':v<.46&&u>1-seam?'right':'body';
        if(actual!==piece)continue;
      }
      const g=mode==='shadow'?Math.round(255*Math.min(1,m.gray[i]/m.reference)):mode==='highlight'?Math.round(255*Math.max(0,(m.gray[i]-m.reference)/Math.max(1,255-m.reference))*.32):255;
      out.data.set([g,g,g,m.alpha[i]],j);
    }
    ctx.putImageData(out,0,0);return c;
  }
  return {load,materials,placement,renderView,drawPair,exportLayer};
}
