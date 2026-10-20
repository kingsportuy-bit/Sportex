import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDetailContext, validateDetails, detailSchema } from '../reference-details.mjs';
import { colorRoles, validateColors, createColorAnalyzer } from '../reference-colors.mjs';
const image='data:image/png;base64,eA==',isImage=value=>value===image;
const target=(piece,side)=>({id:`${piece}:${side}`,piece,side,width:100,height:200,baseWidth:110,baseHeight:220});
const context={extended:true,outlines:true,alignment:true,elements:[{id:'back-number',piece:'back',side:'back',size:324},{id:'short-number',piece:'short',side:'front',size:134}],sources:[{piece:'right',image}],targets:[target('right','front'),target('right','back')]};
const colors=Object.fromEntries(Object.keys(colorRoles).map(key=>[key,null]));
const payload=()=>({colors:{...colors,backNumber:'#FFFFFF',brand:'#ABCDEF'},outlines:{'back-number':{enabled:true,color:'#000000',width:2,certainty:'observed'},'short-number':null},textures:{'right:front':{x:.1,y:-.2,scale:1.4,rotation:32,certainty:'observed'},'right:back':null}});

test('analysis context and result reject unknown assets, locations, fields, oversized transforms and wrong colors',()=>{
  assert.deepEqual(validateDetailContext(context,isImage),context);
  for(const patch of [{sources:[{piece:'right',image:'https://example.com/private'}]},{elements:[{id:'arbitrary-code',piece:'front',side:'front',size:1}]},{targets:[{...target('front','back')}]},{targets:[{...target('right','front'),baseWidth:Infinity}]}])assert.throws(()=>validateDetailContext({...context,...patch},isImage));
  const schema=detailSchema({type:'object'},context);assert.equal(schema.additionalProperties,false);assert.equal(schema.properties.textures.additionalProperties,false);
  const bad=payload();bad.textures['right:front'].scale=8;assert.throws(()=>validateDetails(bad,context,validateColors));
  const badColor=payload();badColor.outlines['back-number'].color='black';assert.throws(()=>validateDetails(badColor,context,validateColors));
  assert.throws(()=>validateDetails({...payload(),extra:1},context,validateColors));
});

test('logical inference is marked, follows print families and reflects only the same sleeve, retaining observations',()=>{
  const result=validateDetails(payload(),context,validateColors);
  assert.equal(result.colors.frontNumber,'#ffffff');assert.equal(result.colors.name,'#ffffff');assert.equal(result.colors.shortBrand,'#abcdef');
  assert(result.inferred.includes('color:shortNumber'));assert(!result.inferred.includes('color:backNumber'));
  assert.equal(result.outlines['short-number'].enabled,true);assert.equal(result.outlines['short-number'].certainty,'inferred');
  assert.equal(result.outlines['back-number'].certainty,'observed');
  assert.deepEqual(result.textures['right:back'],{x:-.1,y:-.2,scale:1.4,rotation:-32,certainty:'inferred'});
  const missing=payload();missing.textures['right:front']=null;
  assert.deepEqual(validateDetails(missing,context,validateColors).textures['right:front'],{x:0,y:0,scale:1,rotation:0,certainty:'inferred'});
  const noStroke=payload();noStroke.outlines['back-number']={enabled:false,color:'#000000',width:2,certainty:'observed'};
  assert.equal(validateDetails(noStroke,context,validateColors).outlines['short-number'].enabled,false);
});

test('one vision call compares actual texture sources and reference; cache includes texture context',async()=>{
  let calls=0;
  const analyze=createColorAnalyzer({apiKey:()=> 'test-only',fetchImpl:async(_url,options)=>{
    calls++;const request=JSON.parse(options.body);assert.equal(request.input[0].content.filter(c=>c.type==='input_image').length,2);
    assert(request.input[0].content.some(c=>c.text?.includes('SOURCE TEXTURE for piece right')));
    assert(request.input[0].content.some(c=>c.text?.includes('CENTER OFFSETS')));
    assert(request.text.format.schema.properties.outlines.properties['back-number']);
    return {ok:true,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(payload())}]}]})};
  }});
  const result=await analyze(image,context);assert.equal(result.status,200);assert.equal(result.body.textures['right:front'].rotation,32);
  assert.equal((await analyze(image,context)).body.cached,true);assert.equal(calls,1);
  await analyze(image,{...context,targets:context.targets.map(t=>({...t,width:120}))});assert.equal(calls,2);
});
