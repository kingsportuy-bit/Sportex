import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {replacementImageSize} from '../public/element-layout.js';

const source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
function harness(){
  const oldImage={width:200,height:100,src:'original'},nextImage={width:100,height:200,src:'replacement'},events=[],messages=[];
  const nodes=new Map([['crest-select',{value:'crest-one',options:[{value:'crest-one',textContent:'old.png'}]}]]);
  const state={logos:{crest:[Object.freeze({id:'crest-one',name:'old.png',image:oldImage})]},sponsors:[Object.freeze({id:'sponsor-one',name:'old.png',visible:true,image:oldImage}),{id:'sponsor-copy',image:oldImage}],
    layers:{crest:{x:348,y:387,size:100,scaleX:1.1,scaleY:.9,rotation:22,attachment:{piece:'shirt',side:'front'}},'short-crest':{x:122,y:985,size:60},'sponsor-one':{x:40,y:480,size:120,rotation:-36,scaleX:1.3,scaleY:.8,attachment:{piece:'right',side:'back'}},'sponsor-copy':{x:500,y:500,size:80}},layerStyles:{crest:{enabled:true,width:2,color:'#ffffff'}}};
  const context=vm.createContext({state,activeSketchId:1,selection:['crest'],preferencesDirty:false,replacementImageSize,$:id=>nodes.get(id),selectedLayerKeys:()=>context.selection,
    fileData:async()=> 'encoded',loadImage:async()=>nextImage,recordHistory:()=>events.push({kind:'history',crest:state.logos.crest[0],sponsor:state.sponsors[0]}),
    selectLayer:key=>events.push({kind:'select',key}),scheduleWorkspaceSave:()=>events.push({kind:'save'}),notice:(message,error)=>messages.push({message,error})});
  vm.runInContext(source.slice(source.indexOf('function graphicReplacementTarget('),source.indexOf('function updateSponsorList(')),context);
  const target=key=>({...context.graphicReplacementTarget(key),sketchId:1});
  return {context,state,nodes,oldImage,nextImage,events,messages,target,file:{name:'new.png',size:1000,type:'image/png'}};
}

test('replacement keeps the visible height across portrait and landscape files without distorting their ratio',()=>{
  for(const previous of [{width:100,height:200},{width:200,height:100}])for(const next of [{width:400,height:100},{width:100,height:400}]){
    const beforeHeight=120/Math.max(1,previous.width/previous.height),size=replacementImageSize(120,previous,next);
    assert.equal(size/Math.max(1,next.width/next.height),beforeHeight);
  }
});

test('canvas replacement is available for one crest or sponsor and rejects other elements or a group',()=>{
  const h=harness();assert.equal(h.context.selectedReplacementTarget().type,'crest');
  h.context.selection=['sponsor-one'];assert.equal(h.context.selectedReplacementTarget().type,'sponsor');
  h.context.selection=['crest','short-crest'];assert.equal(h.context.selectedReplacementTarget(),null);
  assert.equal(h.context.graphicReplacementTarget('front-number'),null);
});

test('crest replacement updates both shared copies while preserving their heights, positions, styles and previous history asset',async()=>{
  const h=harness(),oldEntry=h.state.logos.crest[0],oldLayers=structuredClone(h.state.layers),oldStyles=structuredClone(h.state.layerStyles);
  await h.context.replaceGraphic(h.file,h.target('crest'));
  assert.equal(h.state.logos.crest[0].image,h.nextImage);assert.equal(h.state.logos.crest[0].name,'new.png');assert.equal(oldEntry.image,h.oldImage);assert.equal(oldEntry.name,'old.png');
  assert.equal(h.state.layers.crest.size,50);assert.equal(h.state.layers['short-crest'].size,30);
  assert.deepEqual(h.state.layers.crest,{...oldLayers.crest,size:50});assert.deepEqual(h.state.layers['short-crest'],{...oldLayers['short-crest'],size:30});
  assert.deepEqual(h.state.layerStyles,oldStyles);assert.equal(h.nodes.get('crest-select').options[0].textContent,'new.png');assert.equal(h.context.preferencesDirty,true);
  assert.equal(h.events[0].crest,oldEntry);assert.equal(h.events[2].crest.image,h.nextImage);assert.deepEqual(h.events.map(e=>e.kind),['history','select','history','save']);
});

test('sponsor replacement keeps its identity, attachment and opposite-angle sleeve behavior, leaving duplicates alone',async()=>{
  const h=harness(),original=h.state.sponsors[0],other=h.state.sponsors[1],layer=structuredClone(h.state.layers['sponsor-one']);
  await h.context.replaceGraphic({...h.file,type:'image/jpeg'},h.target('sponsor-one'));
  assert.equal(h.state.sponsors[0].id,original.id);assert.equal(h.state.sponsors[0].image,h.nextImage);assert.equal(original.image,h.oldImage);assert.equal(h.state.sponsors[1],other);assert.equal(other.image,h.oldImage);
  assert.deepEqual(h.state.layers['sponsor-one'],{...layer,size:60});assert.equal(h.state.logos.crest[0].image,h.oldImage);
});

test('cancelled, oversized, unsupported and unreadable uploads leave the original untouched',async()=>{
  const h=harness(),before=h.state.logos.crest[0],target=h.target('crest');
  await h.context.replaceGraphic(null,target);await h.context.replaceGraphic({...h.file,size:8_000_001},target);await h.context.replaceGraphic({...h.file,type:'image/svg+xml'},target);
  h.context.loadImage=async()=>{throw new Error('archivo inválido');};await h.context.replaceGraphic(h.file,target);
  assert.equal(h.state.logos.crest[0],before);assert.equal(h.state.layers.crest.size,100);assert.equal(h.events.length,0);assert.equal(h.messages.filter(m=>m.error).length,3);
});

test('a delayed upload cannot replace an image after switching sketches or changing the source',async()=>{
  for(const switchSketch of [true,false]){
    const h=harness();let resolveImage;const started=new Promise(ready=>{h.context.loadImage=()=>new Promise(resolve=>{resolveImage=resolve;ready();});});
    const task=h.context.replaceGraphic(h.file,h.target('crest'));await started;
    if(switchSketch)h.context.activeSketchId=2;else h.state.logos.crest=[{id:'crest-one',image:{width:40,height:40}}];
    const kept=h.state.logos.crest[0];resolveImage(h.nextImage);await task;
    assert.equal(h.state.logos.crest[0],kept);assert.equal(h.events.length,0);assert.equal(h.state.layers.crest.size,100);assert.equal(h.messages[0].error,true);
  }
});
