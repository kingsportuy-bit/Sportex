import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { generationBleed, registrationVersion, registrationInstructions, silhouetteGuideVersion,rectangularOutputVersion,fittedRectangleVersion } from '../public/artwork-registration.js';
import {twoPassVersion} from '../public/two-pass-atlas.js';
import {extendedArtworkPrompt} from '../extended-artwork-prompt.mjs';
import {silhouetteOutputVersion,validSilhouetteLayout} from '../public/silhouette-atlas.js';

const app = fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const prepareCode = app.slice(app.indexOf('async function prepareClips('), app.indexOf('function powerClipMask('));

test('saved crops recover atomically without resetting independent sleeve transforms or inherited pieces', async () => {
  const textures = new Map(); let valid = true;
  const context = vm.createContext({ atlasCropRevision: 4, structuredClone, textureImages: textures,
    loadImage: async src => ({ src }), atlasRectangles() { if (!valid) throw Error('ambiguous'); },
    atlasTile: (_image, _layout, piece) => ({ toDataURL: () => `crop:${piece}` }) });
  vm.runInContext(prepareCode, context);
  const right = { src: 'old:right', cropRevision: 3, x: .2, scaleX: 1.3, rotation: 24, views: { front: { x: .3, scaleY: .8 }, back: { x: -.4, rotation: -40 } } };
  const variant = { rawImage: 'original', layout: { tiles: ['right'], rectangles: [{}] }, clips: { right: structuredClone(right), short: { src: 'earlier:short', cropRevision: 4 } } };
  context.variant = variant; await vm.runInContext('prepareClips(variant)', context);
  assert.deepEqual(structuredClone(variant.clips.right), { ...right, src: 'crop:right', cropRevision: 4 });
  assert.equal(variant.clips.short.src, 'earlier:short'); assert(textures.has('crop:right'));
  valid = false;
  const failed = { rawImage: 'original', layout: { tiles: ['right', 'left'], rectangles: [{}] }, clips: { right: structuredClone(right) } };
  context.variant = failed; await vm.runInContext('prepareClips(variant)', context);
  assert.equal(failed.cropError, 'ambiguous'); assert.deepEqual(failed.clips, { right });
});

test('generator sends one opaque image request with fluorescent separator contract', async () => {
  const server = fs.readFileSync(new URL('../server.mjs', import.meta.url), 'utf8');
  const code = server.slice(server.indexOf('async function generate('), server.indexOf('async function proxyGenerator('));
  let calls = 0, result;
  const image = 'data:image/png;base64,eA==';
  const body = { mock: image, reference: image, mask: image, width: 512, height: 512, parts: ['shirt'], layout: { columns: 1, rows: 1, tiles: ['front'], bleed: .10, separator: '#ff00ff', rectangles: [{ piece: 'front', x: 96, y: 16, width: 320, height: 480 }] } };
  const context = vm.createContext({ process: { env: { OPENAI_API_KEY: 'test-only' } }, upstreamPort: 0, generating: false, generationBleed, registrationVersion, registrationInstructions, silhouetteGuideVersion, rectangularOutputVersion,fittedRectangleVersion,twoPassVersion,extendedArtworkPrompt, silhouetteOutputVersion,validSilhouetteLayout, Number, String, Array, Set, Object, JSON, AbortSignal,
    readJson: async () => body, isImage: value => value === image, json: (_res, status, value) => { result = { status, value }; },
    fetch: async (url, options) => {
      calls++; assert.equal(url, 'https://api.openai.com/v1/images/edits');
      const request = JSON.parse(options.body);
      assert.equal(request.n, 1); assert.equal(request.background, 'opaque'); assert.equal(request.output_format, 'png');
      assert(request.prompt.includes('EXACTLY solid opaque sRGB #ff00ff')); assert(!request.prompt.includes('neutral gray'));
      assert(request.prompt.includes('ERASE the reference neckline'));assert(request.prompt.includes('ALL its contrasting trim stripes'));
      assert.equal(request.images.length, 2); assert(request.prompt.includes('x=96, y=16, width=320, height=480'));
      if(body.layout.guide===silhouetteGuideVersion){
        assert(request.prompt.startsWith('TASK: RECONSTRUCT AND OUTPAINT'));
        assert(request.prompt.includes('NEW DRAWING AROUND THE ORIGINAL COMPOSITION'));
        assert(request.prompt.includes('10% more on the left'));assert(request.prompt.includes('120% of the visible width'));
        assert(!request.prompt.includes('Do not invent, enlarge, extend visible motifs'));
        assert(request.prompt.includes('NEW horizontal continuation 26.67 px per side'));
      }
      return { ok: true, json: async () => ({ data: [{ b64_json: 'eA==' }] }) };
    } });
  vm.runInContext(code, context); await vm.runInContext('generate({}, {})', context);
  assert.equal(calls, 1); assert.equal(result.status, 200);
  body.layout.bleed=generationBleed;body.layout.registration=registrationVersion;body.layout.rectangles[0].pattern={x:100,y:200,width:320,height:480};
  await vm.runInContext('generate({}, {})', context);assert.equal(result.status,200);assert.equal(calls,2);
  body.layout.rectangles[0].pattern.width=500;await vm.runInContext('generate({}, {})', context);assert.equal(result.status,400);assert.equal(calls,2);
  body.layout.rectangles[0].pattern.width=320;
  body.layout.guide=silhouetteGuideVersion;
  await vm.runInContext('generate({}, {})',context);assert.equal(result.status,200);assert.equal(calls,3);
  body.layout.guide='invalid';await vm.runInContext('generate({}, {})',context);assert.equal(result.status,400);assert.equal(calls,3);delete body.layout.guide;
  body.layout.separator = '#000000'; await vm.runInContext('generate({}, {})', context);
  assert.equal(result.status, 400); assert.equal(calls, 3);
});

test('saved failed generation is recovered locally and leaves uncertain sleeve margins editable',async()=>{
  const textures=new Map();const context=vm.createContext({atlasCropRevision:4,structuredClone,textureImages:textures,
    loadImage:async src=>({src}),atlasRectangles(){},atlasTile:(_image,_layout,piece)=>({contentWindow:piece==='right'?{x:0,y:0,width:1,height:1,reviewRequired:true}:{x:.08,y:.08,width:.84,height:.84},toDataURL:()=>`crop:${piece}`})});
  vm.runInContext(prepareCode,context);
  const variant={rawImage:'original',layout:{tiles:['front','right'],rectangles:[{},{}]},clips:{},cropError:'previous coverage rejection'};
  context.variant=variant;await vm.runInContext('prepareClips(variant)',context);
  assert.equal(variant.cropError,undefined);assert.equal(variant.clips.right.contentWindow.reviewRequired,true);
  assert.deepEqual([...variant.registrationWarnings],['Manga derecha']);assert(textures.has('crop:right'));
  assert.equal(variant.rawImage,'original');
});
