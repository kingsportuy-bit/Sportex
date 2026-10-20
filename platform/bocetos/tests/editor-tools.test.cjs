const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('public/app.js','utf8');
function extract(start,end){return source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));}
const elements=new Map();const $=id=>{if(!elements.has(id))elements.set(id,{disabled:false,checked:false,style:{},value:'',addEventListener(){},setAttribute(){},closest(){return null;}});return elements.get(id);};
const context=vm.createContext({console,structuredClone,JSON,Map,Math,Number,Boolean,Set,innerHeight:900,$,setTimeout:()=>1,clearTimeout(){},cancelAnimationFrame(){},document:{addEventListener(){}},window:{addEventListener(){}},state:{selected:null,texts:[],layers:{},visibleLayers:{},layerStyles:{},sponsors:[]},persistenceReady:true,generationBusy:false,editingTexture:false,inlineEdit:null,activeSketchId:1,textStyleFrame:0,pendingTextStyleKeys:new Set(),snapshot:{inputs:{color:'#fff'},logos:{brand:[],crest:[]},sponsors:[],generatedParts:{},designVariants:[],layers:{},referenceData:'data:large-source',referencePreview:'data:large-source'},captureSketch(){return structuredClone(context.snapshot);},restoreSketch(s){context.snapshot=structuredClone(s);},scheduleWorkspaceSave(){},layerBounds(){return null;},selectLayer(key){context.state.selected=key;},openInlineText(){},powerClipMask(){return {bounds:{x:10,y:20,width:100,height:200}};},recordHistory:()=>{},imageForLayer:()=>null,textFor:()=>'',layerTextColor:()=>'',notice(){}});
context.trimEditor=null;
context.outlinePanelOpen=false;
context.multiSelectMode=false;context.layerKeys=()=>Object.keys(context.state.layers).filter(key=>context.state.visibleLayers[key]!==false);context.layerBounds=key=>context.state.layers[key]?{...context.state.layers[key],width:40,height:20}:null;
context.graphicReplacementBusy=false;context.selectedReplacementTarget=()=>null;
vm.runInContext(extract('function selectedLayerKeys(', 'function setElementSelection('),context);
vm.runInContext(extract('const editHistories=new Map();','function imageSource(image)'),context);
vm.runInContext(`recordHistory();snapshot.inputs.color='#f00';recordHistory();stepHistory(-1);if(snapshot.inputs.color!=='#fff')throw Error('Undo failed');stepHistory(1);if(snapshot.inputs.color!=='#f00')throw Error('Redo failed');stepHistory(-1);snapshot.inputs.color='#00f';recordHistory();if(!$('action-redo').disabled)throw Error('Redo branch survived new edit');activeSketchId=2;snapshot.inputs.color='#aaa';recordHistory();snapshot.inputs.color='#bbb';recordHistory();stepHistory(-1);if(snapshot.inputs.color!=='#aaa')throw Error('Second sketch history failed');activeSketchId=1;restoreSketch(editHistories.get(1).entries[editHistories.get(1).index].snapshot);stepHistory(-1);if(snapshot.inputs.color!=='#fff')throw Error('Histories crossed sketches');`,context);
vm.runInContext(`activeSketchId=3;recordHistory();snapshot.inputs.color='#123456';recordHistory();snapshot.elementModel={inputs:{color:'#123456'}};recordHistory();stepHistory(-1);if(snapshot.inputs.color!=='#fff')throw Error('General parameter autosave inserted an empty undo step');stepHistory(1);if(snapshot.inputs.color!=='#123456')throw Error('General parameter autosave broke redo');activeSketchId=1;`,context);
vm.runInContext(`$('name-font').value='club-test';addCanvasText();if(state.texts.length!==1||!state.layers[state.texts[0].id])throw Error('Text addition failed');deleteSelected();if(state.texts.length)throw Error('Text removal failed');`,context);
vm.runInContext(extract('function anchoredTextureTransform(', 'function drawPhotoshopGarment('),context);
vm.runInContext(extract('function rotatePoint(', 'function hitRotationHandle('),context);
vm.runInContext(extract('function rotatedTextureTransform(', 'function anchoredTextureTransform('),context);
vm.runInContext(extract('function clipTransform(', 'function activeClips('),context);
vm.runInContext(`const bounds={x:100,y:200,width:80,height:40},angle=Math.PI/3,cx=140,cy=220;const r={bounds,width:80,height:40,rotation:angle,initialScaleX:1,initialScaleY:1,hx:1,hy:1,anchorX:100,anchorY:200,dx:80,dy:40,centerX:cx,centerY:cy};const fixed=rotatePoint({x:100,y:200},cx,cy,angle),p=rotatePoint({x:220,y:260},cx,cy,angle),t=rotatedTextureTransform(r,p);const nextCenter={x:140+t.x*80,y:220+t.y*40},anchor=rotatePoint({x:nextCenter.x-80*t.scaleX/2,y:nextCenter.y-40*t.scaleY/2},nextCenter.x,nextCenter.y,angle);if(Math.hypot(anchor.x-fixed.x,anchor.y-fixed.y)>.001)throw Error('Rotated texture anchor drifted');const clip={rotation:27};const front=clipTransform(clip,'right','front',true);front.rotation=58;const back=clipTransform(clip,'right','back',true);if(back.rotation!==27||clip.rotation!==27)throw Error('Sleeve rotations linked');`,context);
const cropCalls=[];context.document.createElement=()=>({getContext:()=>({drawImage:(...args)=>cropCalls.push(args)})});vm.runInContext(extract('function croppedReferenceCanvas(',"$('crop-reference-image').addEventListener"),context);vm.runInContext(`const cropped=croppedReferenceCanvas({width:1000,height:800},{x:.2,y:.25,width:.5,height:.5});if(cropped.width!==500||cropped.height!==400)throw Error('Crop size incorrect');`,context);assert.deepEqual(cropCalls[0].slice(1),[200,200,500,400,0,0,500,400]);
assert(source.includes("piece==='__image'"));assert(source.includes("state.referenceRegions={}"));
const html=fs.readFileSync('public/index.html','utf8'),section=html.slice(html.indexOf('<summary><h2>Nombre en espalda'));
assert(section.indexOf('show-back-name')<section.indexOf('player-name'));
console.log('PASS: undo/redo, separate sketch histories, redo branch reset, custom text creation/deletion, rotated texture resize anchor, independent sleeve rotation, crop wiring, name visibility order');

context.state.documentPalette=[];context.state.texts=[];context.state.selected=null;
context.document.querySelectorAll=()=>[{id:'shirt-color',value:'#112233'},{id:'ink-color',value:'#ffffff'},{id:'palette-add-color',value:'#000000'}];
context.document.createElement=()=>({style:{},setAttribute(){},addEventListener(){}});
$('document-palette-swatches').replaceChildren=()=>{};$('document-palette-swatches').append=()=>{};
context.queueTextStylePreview=()=>{};
vm.runInContext(`updateDocumentPalette();rememberDocumentColor('#ABCDEF');rememberDocumentColor('#abcdef');if(state.documentPalette.filter(c=>c==='#abcdef').length!==1||!state.documentPalette.includes('#112233'))throw Error('Palette lost initial color or duplicated additions');state.selected='short-brand';if(paletteTarget().field!=='short-brand-color')throw Error('Brand palette target linked');state.selected='text-palette-test';state.texts=[{id:state.selected,color:'#fff'}];applyPaletteColor('#123456');if(state.texts[0].color!=='#123456')throw Error('Palette did not recolor selected custom text');`,context);
assert(html.indexOf('id="canvas-actions"')>html.indexOf('id="design-quick-actions"'));
console.log('PASS: palette retains initial colors, deduplicates additions, targets independent short brand, recolors selected custom text');

const css=fs.readFileSync('public/style.css','utf8');assert(css.includes('.step-body>.name-visibility-toggle{margin-bottom:16px}'));assert(css.includes('#apply-adjustment{background:var(--accent)'));
console.log('PASS: name spacing and Sportex apply color; high-resolution preview has separate asynchronous tests');


context.layerBounds=key=>({...context.state.layers[key],width:40,height:20});context.rotatableLayer=()=>true;context.attachmentFor=key=>context.state.layers[key].attachment;context.attachmentMask=a=>({bounds:a.side==='front'?{x:0,y:0,width:100,height:100}:{x:500,y:0,width:100,height:100}});
context.W=1080;context.H=1920;context.outputScale=1;vm.runInContext(extract('function sleeveHem(', 'function moveAttachedLayer('),context);
vm.runInContext(`for(const piece of ['right','left'])for(const rotation of [-90,-32,0,28,90]){const key='sponsor-twin';state.layers[key]={x:30,y:40,rotation,attachment:{piece,side:'front'}};const views=layerInstances(key);if(views[1].rotation!==-rotation)throw Error('Twin rotation not opposite');adoptInstance(views[1]);if(state.layers[key].rotation!==-rotation)throw Error('Adopting back copy changed its rotation');const reversed=layerInstances(key);if(reversed[1].rotation!==rotation)throw Error('Front rotation changed after adopting twin');}`,context);
assert(!html.includes('neck-stripe-count'));assert(!source.includes('drawTrimStripes'));
console.log('PASS: left/right sleeve twins rotate oppositely, selecting either copy preserves its angle and original twin; trim stripes removed');

context.frontPositions={crest:{x:348,y:387,size:64}};context.recordHistory=()=>{};
vm.runInContext(extract('function rememberElementOrigin(', 'function addCanvasText('),context);
vm.runInContext(`state.layers['sponsor-reset']={x:60,y:80,size:90,attachment:{piece:'right',side:'front'}};rememberElementOrigin('sponsor-reset');state.layers['sponsor-reset'].x=99;state.layers['sponsor-reset'].rotation=43;state.layers['sponsor-reset'].scaleX=1.6;state.selected='sponsor-reset';restoreSelectedElement();if(state.layers['sponsor-reset'].x!==60||state.layers['sponsor-reset'].rotation!==0||state.layers['sponsor-reset'].scaleX!==1)throw Error('Restore did not recover sponsor initial transform');state.layers.crest={x:500,y:700,size:150,rotation:30};state.selected='crest';restoreSelectedElement();if(state.layers.crest.x!==348||state.layers.crest.size!==64||state.layers.crest.rotation!==0)throw Error('Fixed element did not restore approved default');`,context);
context.W=800;context.H=300;
const sourceData=new Uint8ClampedArray(800*300*4),targetData=new Uint8ClampedArray(800*300*4);for(let y=20;y<160;y++)for(let x=10;x<110;x++)sourceData[(y*800+x)*4+3]=255;for(let y=10;y<180;y++)for(let x=500;x<580;x++)targetData[(y*800+x)*4+3]=255;
context.attachmentMask=a=>a.side==='front'?{bounds:{x:10,y:20,width:100,height:140},data:sourceData}:{bounds:{x:500,y:10,width:80,height:170},data:targetData};
vm.runInContext(`state.layers['sponsor-hem']={x:40,y:140,width:40,height:20,rotation:25,attachment:{piece:'right',side:'front'}};const hemViews=layerInstances('sponsor-hem');if(Math.abs((180-hemViews[1].y)-(160-hemViews[0].y)*.8)>.001)throw Error('Twin not aligned from local sleeve hem');if(hemViews[1].height!==16||hemViews[1].rotation!==-25)throw Error('Twin scale or angle changed');`,context);
assert(source.includes('restoreSketch(history.entries[next].snapshot,{preserveViewport:true})'));assert(source.includes('viewport.scrollLeft=savedViewport.left;viewport.scrollTop=savedViewport.top'));assert(html.includes('action-restore'));
console.log('PASS: restore sponsor/default transforms; twin height aligned to local hem with opposite angle; undo restores zoom and scroll');

const viewClips={left:{src:'left'},right:{src:'right'},front:{src:'front'}};
const viewContext=vm.createContext({state:{designVariants:[{clips:viewClips}],activeVariant:0},activeClips:()=>viewClips,textureImages:new Map([['left',{id:'left'}],['right',{id:'right'}],['front',{id:'front'}]])});
vm.runInContext(extract('function textureImageForView(', 'function drawPowerClips('),viewContext);
assert.equal(vm.runInContext("textureImageForView(activeClips().right,'right','front').id",viewContext),'right');
assert.equal(vm.runInContext("textureImageForView(activeClips().right,'right','back').id",viewContext),'left');
assert.equal(vm.runInContext("textureImageForView(activeClips().left,'left','back').id",viewContext),'right');
assert.equal(vm.runInContext("textureImageForView(activeClips().front,'front','front').id",viewContext),'front');
console.log('PASS: rear sleeve swatches exchange sides; front stays unchanged');
