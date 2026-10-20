const lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
export function cubicPoint(a,b,t){
  const u=1-t;return [0,1].map(i=>u*u*u*a.p[i]+3*u*u*t*a.out[i]+3*u*t*t*b.in[i]+t*t*t*b.p[i]);
}
export function curveFromPolyline(points){
  const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths.at(-1)+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
  const length=lengths.at(-1),count=points.length<=2?2:Math.min(8,Math.max(4,Math.ceil(length/90)+1));
  const knots=Array.from({length:count},(_,i)=>{
    const at=length*i/(count-1);let j=1;while(j<lengths.length-1&&lengths[j]<at)j++;
    return lerp(points[Math.max(0,j-1)],points[Math.min(j,points.length-1)],(at-lengths[j-1])/(lengths[j]-lengths[j-1]||1));
  });
  return knots.map((p,i)=>{const prev=knots[Math.max(0,i-1)],next=knots[Math.min(knots.length-1,i+1)],d=next.map((v,k)=>(v-prev[k])/(i===0||i===knots.length-1?3:6));
    return {p:[...p],in:p.map((v,k)=>v-d[k]),out:p.map((v,k)=>v+d[k]),smooth:true};});
}
export function sampleCurve(nodes,steps=20){
  const points=[];for(let i=0;i<nodes.length-1;i++)for(let j=0;j<steps;j++)points.push(cubicPoint(nodes[i],nodes[i+1],j/steps));
  points.push([...nodes.at(-1).p]);return points;
}
export function splitCurve(nodes,segment,t=.5){
  const copy=structuredClone(nodes),a=copy[segment],b=copy[segment+1];if(!a||!b||copy.length>=32)return copy;
  const q0=lerp(a.p,a.out,t),q1=lerp(a.out,b.in,t),q2=lerp(b.in,b.p,t),r0=lerp(q0,q1,t),r1=lerp(q1,q2,t),p=lerp(r0,r1,t);
  a.out=q0;b.in=q2;copy.splice(segment+1,0,{p,in:r0,out:r1,smooth:true});return copy;
}
export function transformNodes(nodes,transform){return nodes.map(n=>({...n,p:transform(n.p),in:transform(n.in),out:transform(n.out)}));}
export function encodeCurve(nodes,bounds){
  return {version:1,nodes:transformNodes(nodes,([x,y])=>[(x-bounds.x)/bounds.width,(y-bounds.y)/bounds.height])};
}
export function decodeCurve(edit,bounds){
  if(edit?.version!==1||!Array.isArray(edit.nodes)||edit.nodes.length<2||edit.nodes.length>32)return null;
  if(!edit.nodes.every(n=>n&&['p','in','out'].every(key=>Array.isArray(n[key])&&n[key].length===2&&n[key].every(v=>Number.isFinite(v)&&Math.abs(v)<100))))return null;
  return transformNodes(edit.nodes,([x,y])=>[bounds.x+x*bounds.width,bounds.y+y*bounds.height]);
}
export function curvePath(nodes){
  return `M ${nodes[0].p.join(' ')} `+nodes.slice(1).map((n,i)=>`C ${nodes[i].out.join(' ')} ${n.in.join(' ')} ${n.p.join(' ')}`).join(' ');
}
export function nodeBounds(nodes){
  const points=sampleCurve(nodes),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
  return {x:(left+right)/2-Math.max(24,right-left)/2,y:(top+bottom)/2-Math.max(24,bottom-top)/2,width:Math.max(24,right-left),height:Math.max(24,bottom-top)};
}
