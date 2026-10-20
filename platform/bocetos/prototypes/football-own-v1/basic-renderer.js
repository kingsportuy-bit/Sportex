import {createPrototypeRenderer} from './renderer.js';
import {largestComponent,parseColor} from './material.js';
import {createAnchorSchema} from './anchors.js';
import {approvedFrontAnchors} from './basic-front-defaults.js';

export const basicIdentity={model:'football-basic-v1',bodyRevision:'original-psd-collars-v1'};
export const basicAnchorSchema=createAnchorSchema(basicIdentity);
export const basicLayerNames=['photoBody','photoSleeveLeft','photoSleeveRight','photoCuffs','photoCollar','photoBackNeck','photoBurnShirt','photoScreenShirt'];
const sides=['front','back'];

function bounds(alpha,width,height){
  let left=width,top=height,right=0,bottom=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(alpha[y*width+x]>24){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);}
  if(right<=left||bottom<=top)throw new Error('La pieza del mockup no tiene máscara.');
  return {x:left,y:top,width:right-left,height:bottom-top};
}
export function psdLight(color,burn,screen){
  return color.map((value,k)=>{
    const shadow=value+(Math.max(0,value+burn[k]-255)-value)*burn[3]/255;
    return Math.round(shadow+(255-(255-shadow)*(255-screen[k])/255-shadow)*screen[3]/255);
  });
}
function topology(alpha,width,height){
  const outside=new Uint8Array(alpha.length),queue=new Int32Array(alpha.length),envelope=new Int16Array(width);envelope.fill(-1);let head=0,tail=0;
  const add=(x,y)=>{const p=y*width+x;if(alpha[p]<128&&!outside[p]){outside[p]=1;queue[tail++]=p;}};
  for(let x=0;x<width;x++){add(x,0);add(x,height-1);for(let y=0;y<height;y++)if(alpha[y*width+x]>160){envelope[x]=y;break;}}
  for(let y=0;y<height;y++){add(0,y);add(width-1,y);}
  while(head<tail){const p=queue[head++],x=p%width,y=Math.floor(p/width);if(x)add(x-1,y);if(x<width-1)add(x+1,y);if(y)add(x,y-1);if(y<height-1)add(x,y+1);}
  return {envelope,holes:largestComponent(Uint8Array.from(alpha,(a,p)=>a<128&&!outside[p]?1:0),width,height)};
}

export function createBasicCollarRenderer(makeCanvas){
  const renderer=createPrototypeRenderer(makeCanvas,{fixedBack:true});
  function read(image){const c=makeCanvas(image.width,image.height),ctx=c.getContext('2d');ctx.drawImage(image,0,0);return ctx.getImageData(0,0,c.width,c.height).data;}
  function load(images){
    const prepared={body:{},round:{}};
    for(const side of sides){
      const layers=Object.fromEntries(basicLayerNames.map(name=>[name,read(images[`${side}-${name}`])]));
      const source=images[`${side}-photoBody`],w=source.width,h=source.height;
      const coverage=new Uint8Array(w*h),collarAlpha=new Uint8Array(w*h);
      for(let p=0;p<coverage.length;p++){
        const j=p*4;for(const name of basicLayerNames.slice(0,6))coverage[p]=Math.max(coverage[p],layers[name][j+3]);
        collarAlpha[p]=layers.photoCollar[j+3];
      }
      const area=bounds(coverage,w,h),neck=bounds(collarAlpha,w,h);
      function material(region,mask,kind){
        const alpha=new Uint8Array(region.width*region.height),gray=new Uint8Array(alpha.length),burn=new Uint8Array(alpha.length*4),screen=new Uint8Array(alpha.length*4),pieces=new Uint8Array(alpha.length),repair=new Uint8Array(alpha.length);
        for(let y=0;y<region.height;y++)for(let x=0;x<region.width;x++){
          const p=y*region.width+x,j=((y+region.y)*w+x+region.x)*4;alpha[p]=mask[j/4];
          // Only the removable original band/interior need replacement fabric.
          // The rest uses the original PSD lighting and masks without resampling.
          const replace=kind==='body'&&side==='front'&&(layers.photoCollar[j+3]>0||layers.photoBackNeck[j+3]>0);
          const lightIndex=replace?(Math.min(h-1,neck.y+neck.height+8)*w+x+region.x)*4:j;
          burn.set(layers.photoBurnShirt.subarray(lightIndex,lightIndex+4),p*4);screen.set(layers.photoScreenShirt.subarray(lightIndex,lightIndex+4),p*4);
          gray[p]=psdLight([180,180,180],burn.subarray(p*4,p*4+4),screen.subarray(p*4,p*4+4))[0];
          pieces[p]=Math.max(layers.photoSleeveLeft[j+3],layers.photoSleeveRight[j+3],layers.photoCuffs[j+3])>128?1:0;repair[p]=replace?1:0;
        }
        const result={width:region.width,height:region.height,alpha,gray,reference:180,kind,sourceBounds:region,...topology(alpha,region.width,region.height)};
        result.paint=settings=>{
          const body=parseColor(settings.color),second=parseColor(settings.second||settings.color),sleeve=parseColor(settings.sleeve||settings.color),data=new Uint8ClampedArray(alpha.length*4);
          for(let p=0;p<alpha.length;p++)if(alpha[p]){
            const x=p%region.width,part=pieces[p];let color=kind==='body'&&part?sleeve:settings.pattern==='stripes'&&Math.floor(x/(region.width*.135))%2?second:body;
            if(settings.showPieces&&kind==='body')color=part?[92,190,125]:[72,156,208];
            data.set([...psdLight(color,burn.subarray(p*4,p*4+4),screen.subarray(p*4,p*4+4)),alpha[p]],p*4);
          }
          return {width:region.width,height:region.height,data};
        };
        result.repairedNeck=repair;return result;
      }
      prepared.body[side]=material(area,coverage,'body');prepared.round[side]=material(neck,collarAlpha,'collar');
      const body=prepared.body[side],centerX=(neck.x+neck.width/2-area.x)/area.width,top=(neck.y-area.y)/area.height;
      body.neckAnchors={round:{centerX,top,width:neck.width/area.width,height:neck.height/area.height}};
    }
    renderer.load(images,prepared);
    for(const side of sides){
      const body=renderer.materials.body[side],round=body.neckAnchors.round;
      for(const type of ['v','polo']){const neck=renderer.materials[type][side],width=round.width*(type==='polo'?1.16:1);body.neckAnchors[type]={centerX:round.centerX,top:round.top,width,height:width*body.width*neck.height/neck.width/body.height};}
    }
    for(const type of ['round','v','polo'])renderer.materials.body.front.neckAnchors[type]={...approvedFrontAnchors[type]};
  }
  return {...renderer,load};
}
