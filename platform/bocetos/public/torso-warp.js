// The center stays fixed; shoulders and hem carry a stable neighboring side frame.
// Coordinates stay separate from source pixels and are reusable while dragging.
export function torsoEnvelope(mask,width,height,bounds){
  const x=Math.max(0,Math.floor(bounds.x)),y=Math.max(0,Math.floor(bounds.y));
  const w=Math.min(width-x,Math.ceil(bounds.x+bounds.width)-x),h=Math.min(height-y,Math.ceil(bounds.y+bounds.height)-y);
  const left=new Int32Array(h).fill(w),right=new Int32Array(h).fill(-1);
  for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)if(mask[((y+yy)*width+x+xx)*4+3]>=128){
    left[yy]=Math.min(left[yy],xx);right[yy]=Math.max(right[yy],xx);
  }
  const span=Math.max(1,w-1),anchor=span*.25,trusted=[];
  const contourLeft=new Float64Array(h),contourRight=new Float64Array(h);
  for(let yy=0;yy<h;yy++)if(left[yy]<anchor&&right[yy]>span-anchor){
    const l=left[yy],r=right[yy],alpha=xx=>xx<0||xx>=w?0:mask[((y+yy)*width+x+xx)*4+3];
    // Fractional alpha crossings avoid turning raster outline steps into print steps.
    contourLeft[yy]=Math.max(0,l-.5+(127.5-alpha(l-1))/Math.max(1,alpha(l)-alpha(l-1)));
    contourRight[yy]=Math.min(span,r+.5-(127.5-alpha(r+1))/Math.max(1,alpha(r)-alpha(r+1)));
    trusted.push(yy);
  }
  // Shoulder/hem fragments clip the artwork; they must not squeeze a whole row
  // into a tiny sliver. Extend the nearest complete side contour through them.
  let next=0;
  for(let yy=0;yy<h;yy++){
    if(!trusted.length){contourLeft[yy]=0;contourRight[yy]=span;continue;}
    while(next<trusted.length-1&&trusted[next]<yy)next++;
    if(trusted[next]===yy)continue;
    const a=trusted[Math.max(0,next-1)],b=trusted[next],t=Math.max(0,Math.min(1,(yy-a)/Math.max(1,b-a)));
    contourLeft[yy]=contourLeft[a]*(1-t)+contourLeft[b]*t;
    contourRight[yy]=contourRight[a]*(1-t)+contourRight[b]*t;
  }
  const smoothedLeft=new Float64Array(h),smoothedRight=new Float64Array(h),step=Math.max(1,Math.round(w/340)),kernel=[1,4,6,4,1];
  for(let yy=0;yy<h;yy++)for(let i=0;i<5;i++){
    const row=Math.max(0,Math.min(h-1,yy+(i-2)*step));
    smoothedLeft[yy]+=contourLeft[row]*kernel[i]/16;smoothedRight[yy]+=contourRight[row]*kernel[i]/16;
  }
  function sideCoordinate(position,inset){
    const edge=Math.max(0,Math.min(anchor-.001,inset)),t=Math.max(0,Math.min(1,(position-edge)/Math.max(.001,anchor-edge)));
    return position-edge*(1-t)**2;
  }
  const stableLeft=new Float64Array(h),stableRight=new Float64Array(h);
  for(let yy=0;yy<h;yy++){
    const v=yy/Math.max(1,h-1);
    // Hold the neighboring body registration at each construction edge, rather
    // than unwarping to the rectangle (which visibly widens the side stripes).
    let sample=v;
    if(v<=.1)sample=.2;
    else if(v<.3)sample=.2+(v-.1)**2/.4;
    else if(v>=.96)sample=.9;
    else if(v>.84)sample=.9-(.96-v)**2/.24;
    const row=sample*Math.max(0,h-1),a=Math.floor(row),b=Math.min(h-1,a+1),t=row-a;
    stableLeft[yy]=smoothedLeft[a]*(1-t)+smoothedLeft[b]*t;
    stableRight[yy]=smoothedRight[a]*(1-t)+smoothedRight[b]*t;
  }
  const u=new Float32Array(w*h),v=new Float32Array(w*h),indices=[];
  for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){
    if(!mask[((y+yy)*width+x+xx)*4+3])continue;
    const p=yy*w+xx;indices.push(p);
    let sourceX=xx;
    if(xx<anchor)sourceX=sideCoordinate(xx,stableLeft[yy]);
    else if(xx>span-anchor)sourceX=span-sideCoordinate(span-xx,span-stableRight[yy]);
    u[p]=Math.max(0,Math.min(1,sourceX/span));
    v[p]=yy/Math.max(1,h-1);
  }
  return {x,y,width:w,height:h,u,v,indices:new Int32Array(indices)};
}

export function warpTorsoPixels(source,envelope,geometry,fill=[255,255,255]){
  const {width,height,u,v,indices}=envelope,data=new Uint8ClampedArray(width*height*4),a=(geometry.rotation||0)*Math.PI/180,cos=Math.cos(a),sin=Math.sin(a);
  const sw=source.width,sh=source.height,src=source.data;
  for(const p of indices){
    const px=(u[p]-.5)*geometry.boundsWidth-(geometry.x||0),py=(v[p]-.5)*geometry.boundsHeight-(geometry.y||0);
    const sx=((px*cos+py*sin)/geometry.width+.5)*(sw-1),sy=((-px*sin+py*cos)/geometry.height+.5)*(sh-1),out=p*4;
    if(sx<-.001||sx>sw-1+.001||sy<-.001||sy>sh-1+.001){data[out]=fill[0];data[out+1]=fill[1];data[out+2]=fill[2];data[out+3]=255;continue;}
    const xx=Math.max(0,Math.min(sw-1,sx)),yy=Math.max(0,Math.min(sh-1,sy)),x0=Math.floor(xx),y0=Math.floor(yy),x1=Math.min(sw-1,x0+1),y1=Math.min(sh-1,y0+1),fx=xx-x0,fy=yy-y0;
    const p00=(y0*sw+x0)*4,p10=(y0*sw+x1)*4,p01=(y1*sw+x0)*4,p11=(y1*sw+x1)*4;
    const a00=src[p00+3]/255*(1-fx)*(1-fy),a10=src[p10+3]/255*fx*(1-fy),a01=src[p01+3]/255*(1-fx)*fy,a11=src[p11+3]/255*fx*fy,background=1-a00-a10-a01-a11;
    for(let c=0;c<3;c++){
      data[out+c]=Math.round(src[p00+c]*a00+src[p10+c]*a10+src[p01+c]*a01+src[p11+c]*a11+fill[c]*background);
    }
    data[out+3]=255;
  }
  return {data,width,height};
}
