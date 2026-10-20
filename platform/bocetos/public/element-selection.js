export function toggleElement(keys,key){return keys.includes(key)?keys.filter(value=>value!==key):[...keys,key];}
export function colorableElements(keys){return keys.filter(key=>['brand','brand2','short-brand','front-number','back-number','short-number','back-name'].includes(key)||key.startsWith('text-'));}
function edges(item){
  const angle=(item.rotation||0)*Math.PI/180,w=Math.abs(item.width*Math.cos(angle))+Math.abs(item.height*Math.sin(angle)),h=Math.abs(item.width*Math.sin(angle))+Math.abs(item.height*Math.cos(angle));
  return {left:item.x-w/2,right:item.x+w/2,top:item.y-h/2,bottom:item.y+h/2};
}
export function marqueeElements(instances,rect){
  return [...new Set(instances.filter(item=>{const b=edges(item);return b.right>=rect.x&&b.left<=rect.x+rect.width&&b.bottom>=rect.y&&b.top<=rect.y+rect.height;}).map(item=>item.key))];
}
export function alignElements(items,mode,shirtMask){
  if(!items.length)return [];
  const bounds=items.map(edges),x=(Math.min(...bounds.map(b=>b.left))+Math.max(...bounds.map(b=>b.right)))/2,y=(Math.min(...bounds.map(b=>b.top))+Math.max(...bounds.map(b=>b.bottom)))/2;
  return items.map(item=>{const mask=mode==='shirt'?shirtMask(item):null;return {key:item.key,x:mode==='shirt'?mask.x+mask.width/2:mode==='vertical'?x:item.x,y:mode==='horizontal'?y:item.y};});
}
