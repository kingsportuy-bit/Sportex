// Browser integration fixture. Appended to app.js only by the local test server.
state.sponsors=state.sponsors.filter(s=>!['sponsor-demo-sleeve','sponsor-placement-test'].includes(s.id));
async function testPieceMapping() {
  const results = [];
  function testLayout(tiles,columns=1,rows=1){return {columns,rows,tiles,rectangles:tiles.map((piece,i)=>({piece,x:i%columns*512,y:Math.floor(i/columns)*512,width:512,height:512})),bleed:.10};}
  const fitted=generationLayout(designPieceKeys);
  for(const r of fitted.rectangles){const b=pieceRectangle(r.piece);if(Math.abs(r.width/r.height-b.width/b.height)>.015)throw Error('Wrong rectangle ratio '+r.piece);}
  const calls=[];const fake={save(){},restore(){},beginPath(){},rect(){},clip(){},drawImage(...args){calls.push(args);}};
  drawPieceTexture(fake,{width:100,height:200},0,0,200,400);
  if(Math.abs(calls[0][3]-220)>.001 || Math.abs(calls[0][4]-440)>.001 || Math.abs(calls[0][1]+10)>.001 || Math.abs(calls[0][2]+20)>.001)throw Error('Wrong 10 percent overscan');
  results.push('PROPORTIONS: piece rectangles preserve aspect; uniform 10% overscan / 5% each edge');

  const colors = {front:'#e52937',back:'#255bea',left:'#29be64',right:'#f9a924'};
  const atlas=document.createElement('canvas'); atlas.width=1024;atlas.height=1024;
  const ac=atlas.getContext('2d');
  ['front','back','left','right'].forEach((piece,i)=>{ac.fillStyle=colors[piece];ac.fillRect(i%2*512,Math.floor(i/2)*512,512,512);});
  const layout=testLayout(['front','back','left','right'],2,2);
  function pixels(image){const c=makeCanvas();const cc=c.getContext('2d');cc.drawImage(image,0,0);return cc.getImageData(0,0,W,H).data;}
  function check(image, maskName, expected, screenLeft=null) {
    const actual=pixels(image), mask=state.assets[maskName], mp=pixels(mask);
    const side=maskName.startsWith('front')?'front':'back',bounds=maskBounds(`${side}-photoDesignShirt`), split=bounds.x+bounds.width/2;
    const rgb=expected.match(/[a-f0-9]{2}/gi).map(v=>parseInt(v,16)); let checked=0;
    for(let y=0;y<H;y+=3)for(let x=0;x<W;x+=3){
      const i=(y*W+x)*4;if(mp[i+3]<254 || screenLeft!==null && (screenLeft?x>=split:x<split))continue;
      if(actual[i+3]<250 || rgb.some((v,ch)=>Math.abs(v-actual[i+ch])>2))throw Error(`Color mismatch ${maskName} ${x},${y}`);
      checked++;
    }
    if(checked<20)throw Error('Empty mask '+maskName);return checked;
  }
  for(const raglan of [false,true]) {
    const suffix=raglan?'Raglan':'';
    const body=await applyShirtPieces(atlas,layout,raglan,false,'#ffffff');
    for(const side of ['front','back']) check(body,`${side}-photoDesignShirtBody${suffix}`,colors[side]);
    const sleeves=await applyShirtPieces(atlas,layout,raglan,true,'#ffffff');
    for(const side of ['front','back']) for(const piece of ['left','right']) check(sleeves,`${side}-photoDesignShirtSleeves${suffix}`,colors[piece],side==='front'?piece==='right':piece==='left');
    const replacement=document.createElement('canvas');replacement.width=512;replacement.height=512;const rc=replacement.getContext('2d');rc.fillStyle='#b143d2';rc.fillRect(0,0,512,512);
    const next=await applyShirtPieces(replacement,testLayout(['front']),raglan,false,'#fff',body);
    check(next,`front-photoDesignShirtBody${suffix}`,'#b143d2');check(next,`back-photoDesignShirtBody${suffix}`,colors.back);
    const nextSleeves=await applyShirtPieces(replacement,testLayout(['right']),raglan,true,'#fff',sleeves);
    for(const side of ['front','back'])for(const piece of ['left','right'])check(nextSleeves,`${side}-photoDesignShirtSleeves${suffix}`,piece==='right'?'#b143d2':colors.left,side==='front'?piece==='right':piece==='left');
    results.push(`${raglan?'RAGLAN':'NORMAL'}: front/back and anatomical sleeves mapped; unselected pieces preserved`);
  }
  const el=document.createElement('pre');el.id='piece-test-result';el.textContent='PASS\n'+results.join('\n');document.body.prepend(el);
}
try { await testPieceMapping(); } catch(error){const el=document.createElement('pre');el.id='piece-test-result';el.textContent='FAIL '+error.stack;document.body.prepend(el);}

// Crop and persistence regression: independent per-piece source regions.
try {
  const reference=document.createElement('canvas');reference.width=200;reference.height=100;
  const c=reference.getContext('2d');c.fillStyle='#ee1020';c.fillRect(0,0,100,100);c.fillStyle='#1040ee';c.fillRect(100,0,100,100);
  const regions={front:{x:0,y:0,width:.5,height:1},back:{x:.5,y:0,width:.5,height:1}};
  const crops=await croppedReferences(reference.toDataURL('image/png'),regions,['front','back']);
  for(const piece of ['front','back']){const image=await loadImage(crops[piece]);if(image.width!==100||image.height!==100)throw Error('Bad crop dimensions');const out=document.createElement('canvas');out.width=100;out.height=100;const cc=out.getContext('2d');cc.drawImage(image,0,0);const pixel=cc.getImageData(50,50,1,1).data;if(piece==='front'?pixel[0]<200||pixel[2]>60:pixel[2]<200||pixel[0]>60)throw Error('Mixed piece sources');}
  const before=state.referenceRegions;state.referenceRegions=regions;
  const saved=captureSketch();if(saved.referenceRegions.front.width!==.5)throw Error('Crop state lost');
  state.referenceRegions=before;
  $('piece-test-result').textContent+='\nREFERENCE CROPS: separate front/back pixels and saved per sketch PASS';
} catch(error){$('piece-test-result').textContent+='\nFAIL '+error.stack;}

try {
  const previousVariants=state.designVariants,previousActive=state.activeVariant;
  const image=document.createElement('canvas');image.width=100;image.height=200;const cc=image.getContext('2d');cc.fillStyle='#101010';cc.fillRect(0,0,100,200);cc.fillStyle='#ff1020';cc.fillRect(45,0,10,200);
  const clip={src:image.toDataURL('image/png'),x:0,y:0,scale:1,bleed:.10};
  const variant={parts:{},clips:{front:clip}};await prepareClips(variant);state.designVariants=[variant];state.activeVariant=0;
  const mask=powerClipMask('front','front'),b=mask.bounds;
  function draw(){const out=makeCanvas(),c=out.getContext('2d');drawPowerClips(c,['shirt']);return c.getImageData(0,0,W,H).data;}
  let actual=draw();const midX=Math.round(b.x+b.width/2),midY=Math.round(b.y+b.height/2),i=(midY*W+midX)*4;
  if(actual[i]<240 || actual[i+1]>40)throw Error('Center stripe not at piece center');
  const alphaBefore=actual.filter((v,i)=>i%4===3);
  clip.x=.2;clip.scale=1.25;actual=draw();
  for(let px=0;px<W*H;px++)if(mask.data[px*4+3]===0 && actual[px*4+3]!==0)throw Error('Texture leaked beyond fixed clip');
  const sameMask=powerClipMask('front','front');if(sameMask!==mask)throw Error('Mask moved with content');
  const snapshot=captureSketch();clip.x=.4;if(snapshot.designVariants[0].clips.front.x!==.2)throw Error('Clip offsets shared across snapshots');
  state.designVariants=previousVariants;state.activeVariant=previousActive;
  $('piece-test-result').textContent+='\nPOWERCLIP: center stripe at piece center; content translates/scales, fixed mask preserved; independent saved offsets PASS';
} catch(error){$('piece-test-result').textContent+='\nFAIL '+error.stack;}

if(new URLSearchParams(location.search).has('demo')){
  const clips={};
  for(const [piece,color] of Object.entries({front:'#245bea',back:'#ab3447',left:'#1e9b65',right:'#c88c22'})){
    const bounds=pieceRectangle(piece),image=document.createElement('canvas');image.width=Math.round(bounds.width*2);image.height=Math.round(bounds.height*2);
    const c=image.getContext('2d');c.fillStyle=color;c.fillRect(0,0,image.width,image.height);c.fillStyle='#fff';c.fillRect(image.width*.47,0,image.width*.06,image.height);
    clips[piece]={src:image.toDataURL('image/png'),x:0,y:0,scale:1,bleed:.10};
  }
  const empty=await loadImage(makeCanvas().toDataURL('image/png')),variant={parts:{shirt:empty},clips};await prepareClips(variant);
  state.designVariants=[variant];state.activeVariant=0;state.generatedParts=variant.parts;state.view='design';$('apply-sleeves').checked=true;
  $('piece-test-result').hidden=true;updateViewButtons();notice('Prueba técnica: franja blanca centrada en cada pieza independiente.');
}

try {
 const image=document.createElement('canvas');image.width=512;image.height=512;const c=image.getContext('2d');c.fillStyle='#b8b8b8';c.fillRect(0,0,512,512);c.fillStyle='#102030';c.fillRect(136,22,240,468);
 const layout={columns:1,rows:1,tiles:['left'],rectangles:[{piece:'left',x:146,y:16,width:220,height:480}]};
 const tile=atlasTile(image,layout,'left');if(tile.width!==240||tile.height!==468)throw Error('Sleeve actual rectangle not detected');
 const px=tile.getContext('2d').getImageData(0,0,1,1).data;if(px[0]!==16||px[1]!==32||px[2]!==48)throw Error('Gray sheet margin leaked into sleeve');
 $('piece-test-result').textContent+='\nSLEEVE CROP: shifted artwork rectangle detected, neutral sheet margin excluded PASS';
} catch(error){$('piece-test-result').textContent+='\nFAIL '+error.stack;}

try {
 const body=powerClipMask('front','front').bounds;
 for(const raglan of [false,true]){
  const previous=$('raglan-enabled').checked;$('raglan-enabled').checked=raglan;
  for(const piece of ['left','right'])for(const side of ['front','back']){const b=powerClipMask(piece,side).bounds;if(b.height>body.height*.55)throw Error('Sleeve includes torso/hem remnants');}
  $('raglan-enabled').checked=previous;
 }
 $('piece-test-result').textContent+='\nSLEEVE MASKS: original ARM masks, no torso sides or hem in either view PASS';
} catch(error){$('piece-test-result').textContent+='\nFAIL '+error.stack;}

try {
 const clip={x:.1,y:.2,scale:1};
 const front=clipTransform(clip,'left','front',true);front.x=.35;front.scale=1.6;
 const back=clipTransform(clip,'left','back',true);
 if(back.x!==.1||back.scale!==1)throw Error('Sleeve view transforms linked');
 back.y=-.2;if(front.y!==.2)throw Error('Back view changed front sleeve');
 const other={x:0,y:0,scale:1};clipTransform(other,'right','front',true).x=-.3;if(front.x!==.35)throw Error('Left/right sleeves linked');
 $('piece-test-result').textContent+='\nSLEEVE INDEPENDENCE: left/right and front/back movement/scale isolated PASS';
} catch(error){$('piece-test-result').textContent+='\nFAIL '+error.stack;}

try {
 const image=await loadImage('/actual-response.png'),layout=generationLayout(['front','back','right','left']);
 const expected={front:[43,13,427,549],back:[554,13,427,549],right:[142,592,239,415],left:[643,592,239,415]};
 for(const piece of layout.tiles){const r=artworkRectangle(image,layout,layout.rectangles.find(r=>r.piece===piece)),e=expected[piece];if([r.x,r.y,r.width,r.height].some((v,i)=>Math.abs(v-e[i])>1))throw Error('Real response rectangle mismatch '+piece);
  const tile=atlasTile(image,layout,piece);if((piece==='left'||piece==='right')&&(tile.width!==239||tile.height!==415))throw Error('Wrong sleeve source size');
 }
 $('piece-test-result').textContent+='\nREAL RESPONSE: four actual rectangles detected across shifted rows; both sleeves crop to 239 × 415, without gray margin PASS';
 if(new URLSearchParams(location.search).get('demo')==='real'){
  const variant={parts:{},rawImage: image.src,layout};
  // Retain the image data rather than the fixture URL for the local variant.
  const source=document.createElement('canvas');source.width=image.width;source.height=image.height;source.getContext('2d').drawImage(image,0,0);variant.rawImage=source.toDataURL('image/png');
  await prepareClips(variant);state.designVariants=[variant];state.activeVariant=0;state.generatedParts={shirt:await loadImage(makeCanvas().toDataURL('image/png'))};variant.parts=state.generatedParts;state.view='design';$('apply-sleeves').checked=true;updateViewButtons();notice('Respuesta real de IA: mangas recuperadas sin incluir el fondo gris.');
 }
} catch(error){$('piece-test-result').textContent+='\nFAIL '+error.stack;}

try {
 const b={x:10,y:20,width:100,height:200};
 for(const [dx,dy] of [[100,200],[-100,200],[100,-200],[-100,-200]]){
  const anchorX=dx>0?10:110,anchorY=dy>0?20:220,r={bounds:b,dx,dy,anchorX,anchorY,initialScale:1};
  const result=anchoredTextureTransform(r,{x:anchorX+dx*1.5,y:anchorY+dy*1.5});
  const cx=b.x+b.width/2+result.x*b.width,cy=b.y+b.height/2+result.y*b.height;
  const fixedX=cx-Math.sign(dx)*b.width*result.scale/2,fixedY=cy-Math.sign(dy)*b.height*result.scale/2;
  if(Math.abs(fixedX-anchorX)>1e-8||Math.abs(fixedY-anchorY)>1e-8||Math.abs(result.scale-1.5)>1e-8)throw Error('Opposite corner moved');
 }
 $('piece-test-result').textContent+='\nANCHORED RESIZE: all four opposite corners remain fixed while scaling uniformly PASS';
} catch(error){$('piece-test-result').textContent+='\nFAIL '+error.stack;}

try {
 const bounds={x:0,y:0,width:100,height:200},base={bounds,width:100,height:200,initialScaleX:1,initialScaleY:1,initialScale:1};
 const horizontal=anchoredTextureTransform({...base,hx:1,hy:0,anchorX:0,anchorY:100,centerX:50,centerY:100,dx:100,dy:0},{x:150,y:180});
 if(horizontal.scaleX!==1.5||horizontal.scaleY!==1||horizontal.y!==0)throw Error('Horizontal edge also resized vertically');
 const vertical=anchoredTextureTransform({...base,hx:0,hy:1,anchorX:50,anchorY:0,centerX:50,centerY:100,dx:0,dy:200},{x:190,y:300});
 if(vertical.scaleY!==1.5||vertical.scaleX!==1||vertical.x!==0)throw Error('Vertical edge also resized horizontally');
 $('piece-test-result').textContent+='\nEDGE HANDLES: horizontal and vertical dimensions resize independently, opposite edge fixed PASS';
} catch(error){$('piece-test-result').textContent+='\nFAIL '+error.stack;}

try {
 const variant=state.designVariants[state.activeVariant];
 if(variant?.clips?.front&&variant.clips.back){
  const original=structuredClone(variant.clips);
  textureEditSnapshot={variant,clips:structuredClone(original)};editingTexture=true;pieceEditing=false;updateTextureMode();
  beginPieceEdit('front','front');variant.clips.front.x=.25;finishPieceEdit(false);
  if(!editingTexture||pieceEditing||!$('texture-apply-footer').hidden||$('apply-adjustment-footer').hidden)throw Error('Piece confirmation closed window or retained piece controls');
  beginPieceEdit('back','back');const oldBack=pieceEditSnapshot.clip.x;variant.clips.back.x=.4;finishPieceEdit(true);
  if(variant.clips.back.x!==oldBack||variant.clips.front.x!==.25||!editingTexture)throw Error('Piece cancellation changed another piece or closed window');
  finishTextureAdjustment(true);
  if(JSON.stringify(variant.clips)!==JSON.stringify(original)||editingTexture)throw Error('Window cancellation did not restore entry snapshot');
  textureEditSnapshot={variant,clips:structuredClone(original)};editingTexture=true;beginPieceEdit('front','front');variant.clips.front.x=.3;applyTextureAdjustment();
  if(editingTexture||pieceEditing||variant.clips.front.x!==.3)throw Error('Window application lost current piece');
  variant.clips=original;state.garmentCache=null;render();
  $('piece-test-result').textContent+='\nPIECE SESSION: confirm/cancel keeps window open, cancellation isolates piece, window apply/cancel preserves transaction PASS';
 }
} catch(error){$('piece-test-result').textContent+='\nFAIL '+error.stack;}

try {
 const saved=structuredClone(state.layers),visibility={...state.visibleLayers},number=$('player-number').value;
 $('player-number').value='10';state.visibleLayers['front-number']=true;editingTexture=false;state.layers['front-number'].scaleX=state.layers['front-number'].scaleY=1;
 const key='front-number',b=layerBounds(key),r={key,bounds:{x:b.x-b.width/2,y:b.y-b.height/2,width:b.width,height:b.height},width:b.width,height:b.height,initialScaleX:1,initialScaleY:1,anchorX:b.x-b.width/2,anchorY:b.y,hx:1,hy:0,dx:b.width,dy:0,centerX:b.x,centerY:b.y};
 Object.assign(state.layers[key],resizedElement(r,{x:r.anchorX+b.width*1.5,y:b.y}));
 const wide=layerBounds(key);
 if(Math.abs(wide.width/b.width-1.5)>.001||Math.abs(wide.height-b.height)>.001||Math.abs(wide.x-wide.width/2-r.anchorX)>.001)throw Error('Text width resize moved opposite edge or changed height');
 if(JSON.stringify(state.layers['back-number'])!==JSON.stringify(saved['back-number']))throw Error('Other number resized');
 const snapshot=captureSketch();if(snapshot.layers[key].scaleX!==1.5)throw Error('Stretch missing from saved sketch');
 state.layers=saved;state.visibleLayers=visibility;$('player-number').value=number;
 $('piece-test-result').textContent+='\nELEMENT RESIZE: text width stretches independently, opposite edge fixed, other numbers unchanged, saved snapshot retains stretch PASS';
 if(new URLSearchParams(location.search).has('demo')){state.visibleLayers['front-number']=true;$('show-front-number').checked=true;$('player-number').value='10';$('front-number-color').value='#ffffff';}
 render();
} catch(error){$('piece-test-result').textContent+='\nFAIL '+error.stack;}

try {
 const key='front-number',previous=$('front-number-color').value,back=$('back-number-color').value,short=$('short-number-color').value;
 state.visibleLayers[key]=true;selectLayer(key);
 if($('selected-text-color').hidden||$('selected-text-color').dataset.field!=='front-number-color')throw Error('Selected number color selector missing');
 $('selected-text-color-input').value='#123456';$('selected-text-color-input').dispatchEvent(new Event('change',{bubbles:true}));
 if($('front-number-color').value!=='#123456'||$('back-number-color').value!==back||$('short-number-color').value!==short)throw Error('Floating color changed another number');
 $('front-number-color').value=previous;selectLayer(null);
 if(!$('selected-text-color').hidden)throw Error('Color selector remained after deselection');
 $('piece-test-result').textContent+='\nFLOATING COLOR: selector follows selected number, updates its existing color only, hides on deselection PASS';
} catch(error){$('piece-test-result').textContent+='\nFAIL '+error.stack;}

try {
 selectLayer('front-number');const original=$('front-number-color').value;
 $('front-number-color').value='#2ad3ee';render(true,textStyleRegion(['front-number']));
 const optimized=ctx.getImageData(0,0,W,H).data;render();const full=ctx.getImageData(0,0,W,H).data;
 let changed=0;for(let i=0;i<full.length;i++)if(full[i]!==optimized[i])changed++;
 if(changed)throw Error('Partial lighting differs from full render: '+changed+' channels');
 $('outline-enabled').checked=true;$('outline-color').value='#f45a25';$('outline-width').value='10';updateOutlinePreview(true);
 const outlined=ctx.getImageData(0,0,W,H).data;render();const fullOutlined=ctx.getImageData(0,0,W,H).data;
 for(let i=0;i<fullOutlined.length;i++)if(fullOutlined[i]!==outlined[i])throw Error('Partial contour lighting differs from full render');
 const samples=[];for(let i=0;i<3;i++){const t=performance.now();render(true,textStyleRegion(['front-number']));samples.push(performance.now()-t);}
 const t=performance.now();render();const fullMs=performance.now()-t;
 $('front-number-color').value=original;state.layerStyles['front-number']={enabled:false,color:'#ffffff',width:2};selectLayer(null);
 $('piece-test-result').textContent+='\nSTYLE PERFORMANCE: color/contour partial rendering matches full scene byte-for-byte; partial '+Math.round(samples.reduce((a,b)=>a+b)/samples.length)+'ms, full '+Math.round(fullMs)+'ms PASS';
} catch(error){$('piece-test-result').textContent+='\nFAIL '+error.stack;}

try {
 const source=document.createElement('canvas');source.width=source.height=16;const c=source.getContext('2d');c.fillStyle='#f05131';c.fillRect(3,3,10,10);c.clearRect(6,6,4,4);c.globalAlpha=.5;c.fillRect(0,0,2,2);
 const before=c.getImageData(0,0,16,16).data;
 $('brand-color-enabled').checked=true;$('brand-color').value='#42ed78';const tinted=coloredBrandImage(source),after=tinted.getContext('2d').getImageData(0,0,16,16).data;
 for(let i=0;i<before.length;i+=4){if(before[i+3]!==after[i+3])throw Error('Brand alpha changed');if(before[i+3]===255&&(after[i]!==66||after[i+1]!==237||after[i+2]!==120))throw Error('Brand not colored');}
 if(coloredBrandImage(source)!==tinted)throw Error('Brand mask cache not reused');
 $('brand-color-enabled').checked=false;if(coloredBrandImage(source)!==source)throw Error('Original brand not restored');
 if(!Object.hasOwn(captureSketch().inputs,'brand-color-enabled'))throw Error('Brand overlay missing from persistence');
 $('piece-test-result').textContent+='\nBRAND COLOR: alpha and transparent holes preserved, opaque pixels tinted, cache reused, original restored, overlay saved PASS';
 if(new URLSearchParams(location.search).has('demo')){
  const image=await loadImage('/assets/sportex-logo.png');state.logos.brand.push({id:'demo-brand-overlay',name:'SPORTEX · prueba de color',image});$('brand-select').add(new Option('SPORTEX · prueba de color','demo-brand-overlay'));$('brand-select').value='demo-brand-overlay';
  state.visibleLayers.brand=state.visibleLayers['short-brand']=true;$('show-brand').checked=$('show-short-brand').checked=true;$('brand-color-enabled').checked=true;
  state.layers.brand.size=120;state.layers['short-brand'].size=100;render();
 }
} catch(error){$('piece-test-result').textContent+='\nFAIL '+error.stack;}

try {
 const source=document.createElement('canvas');source.width=80;source.height=40;const c=source.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,80,40);
 $('brand-color-enabled').checked=$('short-brand-color-enabled').checked=true;$('brand-color').value='#ff0000';$('short-brand-color').value='#0000ff';
 const shirt=coloredBrandImage(source,'brand').getContext('2d').getImageData(10,10,1,1).data,short=coloredBrandImage(source,'short-brand').getContext('2d').getImageData(10,10,1,1).data;
 if(shirt[0]!==255||shirt[2]!==0||short[2]!==255||short[0]!==0)throw Error('Brand colors still linked');
 const saved=captureSketch();if(saved.inputs['brand-color']===saved.inputs['short-brand-color'])throw Error('Independent colors not captured');
 const image=await loadImage(source.toDataURL()),key='sponsor-placement-test';state.sponsors.push({id:key,name:'Sponsor de prueba',image,visible:true});
 const target={piece:'right',side:'front'},b=powerClipMask('right','front').bounds;state.layers[key]={x:b.x+b.width/2,y:b.y+b.height/2,size:150,rotation:28,attachment:target};
 const instances=layerInstances(key);if(instances.length!==2||instances[1].attachment.side!=='back'||instances[1].attachment.piece!=='right')throw Error('Sleeve counterpart missing or on wrong anatomical arm');
 for(const scale of [1,2]){
  outputScale=scale;const node=makeCanvas(),c=node.getContext('2d');c.setTransform(scale,0,0,scale,0,0);drawLayer(c,key,false);
  const result=c.getImageData(0,0,node.width,node.height).data,masks=layerInstances(key).map(x=>attachmentMask(x.attachment).data);let visible=0;
  for(let i=3;i<result.length;i+=4)if(result[i]){visible++;if(!masks.some(m=>m[i]))throw Error('Sponsor escaped sleeve mask at scale '+scale);}
  if(!visible)throw Error('Clipped sponsor disappeared');
 }
 outputScale=1;
 const copy=layerInstances(key)[1];adoptInstance(copy);const adopted=layerInstances(key)[0];if(Math.abs(adopted.x-copy.x)>.001||Math.abs(adopted.y-copy.y)>.001)throw Error('Selecting back copy jumps');
 const old={x:state.layers[key].x,y:state.layers[key].y};moveAttachedLayer(key,200,1500);if(state.layers[key].x!==old.x||state.layers[key].y!==old.y)throw Error('Sponsor allowed on socks');
 const shortBounds=powerClipMask('short','front').bounds;state.layers[key].attachment={piece:'short',side:'front'};state.layers[key].x=shortBounds.x+shortBounds.width*.25;state.layers[key].y=shortBounds.y+shortBounds.height*.6;state.layers[key].size=500;
 const clipped=makeCanvas(),cc=clipped.getContext('2d');drawLayer(cc,key,false);const pixels=cc.getImageData(0,0,W,H).data,mask=powerClipMask('short','front').data;
 for(let i=3;i<pixels.length;i+=4)if(pixels[i]&&!mask[i])throw Error('Sponsor escaped short');
 state.sponsors=state.sponsors.filter(x=>x.id!==key);delete state.layers[key];
 $('piece-test-result').textContent+='\nPLACEMENT: independent brand colors; rotated sleeve sponsor clipped in both anatomical views at preview/export scales; counterpart selectable; socks rejected; short clipping PASS';
 if(new URLSearchParams(location.search).has('demo')){
  const demo=document.createElement('canvas');demo.width=240;demo.height=80;const dc=demo.getContext('2d');dc.fillStyle='#fff';dc.font='bold 48px sans-serif';dc.textAlign='center';dc.fillText('SPONSOR',120,56);const logo=await loadImage(demo.toDataURL());
  const b=powerClipMask('right','front').bounds,id='sponsor-demo-sleeve';state.sponsors.push({id,name:'Sponsor manga derecha',image:logo,visible:true});state.layers[id]={x:b.x+b.width*.45,y:b.y+b.height*.55,size:70,rotation:-12,attachment:{piece:'right',side:'front'}};updateSponsorList();selectLayer(id);
 }
 render();
} catch(error){outputScale=1;$('piece-test-result').textContent+='\nFAIL '+error.stack;}

try {
 const originalCrests=[...state.logos.crest],oldSelect=$('crest-select').value,oldLayers=structuredClone({crest:state.layers.crest,short:state.layers['short-crest']});
 const image=await loadImage('/assets/sportex-logo.png');state.logos.crest.push({id:'test-crest-clip',name:'Test',image});$('crest-select').add(new Option('Test','test-crest-clip'));$('crest-select').value='test-crest-clip';
 for(const key of ['crest','short-crest']){
  state.layers[key].size=900;state.layers[key].rotation=53;
  const node=makeCanvas(),c=node.getContext('2d');drawLayer(c,key,false);const pixels=c.getImageData(0,0,W,H).data,mask=attachmentMask(attachmentFor(key)).data;
  for(let i=3;i<pixels.length;i+=4)if(pixels[i]&&!mask[i])throw Error('Rotated crest escaped garment');
 }
 state.logos.crest=originalCrests;$('crest-select').value=oldSelect;state.layers.crest=oldLayers.crest;state.layers['short-crest']=oldLayers.short;
 const bounds={x:100,y:200,width:80,height:40},rotation=Math.PI/3,cx=140,cy=220,anchor={x:100,y:200},fixed=rotatePoint(anchor,cx,cy,rotation),r={bounds,width:80,height:40,rotation,initialScaleX:1,initialScaleY:1,hx:1,hy:1,anchorX:100,anchorY:200,dx:80,dy:40};
 const moved=rotatePoint({x:220,y:260},cx,cy,rotation),next=resizedElement(r,moved),nextFixed=rotatePoint({x:next.x-80*next.scaleX/2,y:next.y-40*next.scaleY/2},next.x,next.y,rotation);
 if(Math.hypot(nextFixed.x-fixed.x,nextFixed.y-fixed.y)>.001)throw Error('Rotated resize moved opposite anchor');
 $('piece-test-result').textContent+='\nCREST/ROTATION: rotated shirt and short crests clipped exactly; rotated resize retains fixed opposite corner PASS';render();
} catch(error){$('piece-test-result').textContent+='\nFAIL '+error.stack;}

try {
 const previous=$('cuffs-enabled').checked,sleeve=$('sleeve-color').value,cuff=$('cuff-color').value;
 $('sleeve-color').value='#ff0000';$('cuff-color').value='#0000ff';
 const mask=maskPixels('photoCuffs');let sample=-1;for(let i=3;i<mask.length;i+=4)if(mask[i]===255){sample=(i-3)/4;break;}
 const x=sample%W,y=Math.floor(sample/W);
 for(const enabled of [true,false]){$('cuffs-enabled').checked=enabled;const node=makeCanvas(),c=node.getContext('2d');drawPhotoshopParts(c,['shirt']);const pixel=c.getImageData(x,y,1,1).data;if(pixel[enabled?2:0]!==255||pixel[enabled?0:2]!==0)throw Error('Cuff toggle did not switch independent/inherited sleeve color');}
 $('cuffs-enabled').checked=previous;$('sleeve-color').value=sleeve;$('cuff-color').value=cuff;
 if(!captureSketch().inputs.hasOwnProperty('cuffs-enabled'))throw Error('Cuff toggle not saved');
 if(!$('generate').textContent.includes('(1 crédito)'))throw Error('Credit label missing');
 $('piece-test-result').textContent+='\nCUFFS/CREDITS: independent cuff color on, sleeve color inherited off, choice saved, 1 credit shown PASS';
 if(new URLSearchParams(location.search).get('demo')==='raglan'){
  $('raglan-enabled').checked=true;$('sleeve-color').value='#e5f31b';$('neck-color').value='#e5f31b';$('shirt-color').value='#171d20';state.view='base';state.sponsors=[];state.visibleLayers['front-number']=false;state.visibleLayers['back-number']=false;state.visibleLayers['short-number']=false;state.visibleLayers['back-name']=false;selectLayer(null);invalidateGarment();updateViewButtons();
 }
} catch(error){$('piece-test-result').textContent+='\nFAIL '+error.stack;}

try {
 const enabled=$('cuffs-enabled').checked,raglan=$('raglan-enabled').checked;
 for(const r of [false,true]){
  $('raglan-enabled').checked=r;$('cuffs-enabled').checked=true;const normal=powerClipMask('right','front').data;
  $('cuffs-enabled').checked=false;const extended=powerClipMask('right','front').data,cuffs=maskPixels('photoCuffs');let gained=0;
  for(let i=3;i<extended.length;i+=4)if(extended[i]>normal[i]&&cuffs[i])gained++;
  if(!gained)throw Error('Disabled cuff did not become part of sleeve design');
 }
 $('cuffs-enabled').checked=enabled;$('raglan-enabled').checked=raglan;
 $('piece-test-result').textContent+='\nCUFF DESIGN: disabling cuff extends sleeve clipping through the hem, normal and raglan PASS';invalidateGarment();
} catch(error){$('piece-test-result').textContent+='\nFAIL '+error.stack;}
