// Conservative repair for older independently enlarged swatches. Only periodic
// stripes with matching palettes qualify; unique motifs retain their size.
export function stripePeriod({data,width,height}, window={x:0,y:0,width:1,height:1}) {
  const start=Math.floor(window.x*width),end=Math.ceil((window.x+window.width)*width);
  const top=Math.floor((window.y+window.height*.15)*height),bottom=Math.ceil((window.y+window.height*.85)*height);
  const profile=[],palette=[0,0,0];
  for(let x=start;x<end;x++){
    const rgb=[0,0,0];let count=0;
    for(let y=top;y<bottom;y+=2){const i=(y*width+x)*4;if(data[i+3]<128)continue;for(let c=0;c<3;c++)rgb[c]+=data[i+c];count++;}
    if(!count)return null;
    for(let c=0;c<3;c++){rgb[c]/=count;palette[c]+=rgb[c];}profile.push(rgb);
  }
  const n=profile.length;if(n<32)return null;
  palette.forEach((v,c)=>palette[c]=v/n);
  let best=null;
  for(let lag=6;lag<=n/3;lag++){
    let dot=0,aa=0,bb=0,error=0;
    for(let x=0;x<n-lag;x++)for(let c=0;c<3;c++){
      const a=profile[x][c]-palette[c],b=profile[x+lag][c]-palette[c];dot+=a*b;aa+=a*a;bb+=b*b;error+=(a-b)**2;
    }
    const variance=aa/((n-lag)*3),score=dot/Math.max(1,Math.sqrt(aa*bb));
    if(variance<10||score<.93||error/Math.max(1,aa+bb)>.08)continue;
    // Reject adjacent pixels of a smooth gradient; a stripe must have a trough
    // between the initial sample and its repeated peak.
    const half=Math.max(1,Math.floor(lag/2));let halfDot=0,halfAA=0,halfBB=0;
    for(let x=0;x<n-half;x++)for(let c=0;c<3;c++){const a=profile[x][c]-palette[c],b=profile[x+half][c]-palette[c];halfDot+=a*b;halfAA+=a*a;halfBB+=b*b;}
    if(halfDot/Math.max(1,Math.sqrt(halfAA*halfBB))>.35)continue;
    if(!best||score>best.score+.015)best={pixels:lag,score,palette};
  }
  if(best)return best;
  // Generated repeats often vary by a few pixels, which destroys strict
  // autocorrelation. Measure the spacing of broad bands after removing fabric
  // grain and thin accent lines, and require at least four regular repeats.
  const variances=palette.map((m,c)=>profile.reduce((s,p)=>s+(p[c]-m)**2,0)/n);
  const channel=variances.indexOf(Math.max(...variances));if(variances[channel]<10)return null;
  const radius=Math.max(2,Math.round(n*.012)),smooth=profile.map((_,x)=>{
    const a=Math.max(0,x-radius),b=Math.min(n-1,x+radius);let total=0;
    for(let k=a;k<=b;k++)total+=profile[k][channel];return total/(b-a+1);
  });
  const threshold=palette[channel]+Math.sqrt(variances[channel])*.15,peaks=[];
  for(let x=0;x<n;x++)if(smooth[x]>threshold){const first=x;while(x+1<n&&smooth[x+1]>threshold)x++;
    if(first>0&&x<n-1&&x-first>=radius)peaks.push((first+x)/2);
  }
  if(peaks.length<4||peaks.at(-1)-peaks[0]<n*.55)return null;
  const gaps=peaks.slice(1).map((p,i)=>p-peaks[i]).sort((a,b)=>a-b),median=gaps[Math.floor(gaps.length/2)];
  if(median<8||gaps.some(g=>Math.abs(g-median)>median*.25))return null;
  return {pixels:median,score:1-Math.max(...gaps.map(g=>Math.abs(g-median)))/median,palette};
}

export function sharedStripeScale(body,sleeve,bodyPixelsPerUnit,sleevePixelsPerUnit){
  if(!body||!sleeve||!bodyPixelsPerUnit||!sleevePixelsPerUnit)return 1;
  if(Math.max(...body.palette.map((c,i)=>Math.abs(c-sleeve.palette[i])))>28)return 1;
  const factor=(body.pixels/bodyPixelsPerUnit)/(sleeve.pixels/sleevePixelsPerUnit);
  return factor>=.5&&factor<=4&&Math.abs(factor-1)>.12?factor:1;
}
