import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createColorAnalyzer } from './reference-colors.mjs';
import { generationBleed, registrationVersion, registrationInstructions, silhouetteGuideVersion, rectangularOutputVersion, fittedRectangleVersion } from './public/artwork-registration.js';
import { validateDetailContext } from './reference-details.mjs';
import {extendedArtworkPrompt} from './extended-artwork-prompt.mjs';
import {silhouetteOutputVersion,validSilhouetteLayout} from './public/silhouette-atlas.js';
import {twoPassVersion} from './public/two-pass-atlas.js';
import {validCompactAtlas} from './public/atlas-layout.js';
import {createLabHttp,localLabService} from './lab-http.mjs';
import {labWebContext} from './web-context.mjs';

const host = '127.0.0.1';
const port = Number(process.env.PORT || 4318);
const upstreamPort = Number(process.env.GENERATOR_UPSTREAM_PORT || 0);
const publicDir = join(import.meta.dirname, 'public');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.wasm':'application/wasm', '.png': 'image/png', '.ttf': 'font/ttf', '.otf': 'font/otf' };
const routes = new Set(['/','/index.html','/app.js','/image-preview.js','/atlas-crop.js','/atlas-recovery.js','/silhouette-atlas.js','/reference-compare.js','/artwork-registration.js','/pattern-geometry.js','/editor-geometry.js','/stripe-scale.js','/style.css','/assets/sportex-logo.png','/assets/sportex-favicon.png','/assets/fondo-delta.png']);
let generating = false;
routes.add('/marked-atlas.js');
routes.add('/two-pass-atlas.js');
routes.add('/torso-warp.js');
routes.add('/atlas-layout.js');
routes.add('/garment-trims.js');
routes.add('/trim-path.js');
routes.add('/trim-editor.js');
routes.add('/trim-defaults.js');
routes.add('/element-layout.js');
routes.add('/element-selection.js');
routes.add('/initial-parameters.json');
routes.add('/texture-import.js');
for(const route of ['/panel.css','/panel.js','/lab-client.js'])routes.add(route);

function json(res, code, value) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(value));
}

async function readJson(req,limit=35_000_000) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new Error('El archivo es demasiado grande. Reducí las imágenes e intentá de nuevo.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function isImage(value) {
  return typeof value === 'string' && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value) && value.length < 22_000_000;
}

async function generate(req, res, {body:providedBody,apiKey=process.env.OPENAI_API_KEY,fetchImpl=fetch}={}) {
  let body=providedBody;
  try { body ||= await readJson(req); } catch (error) { return json(res, 400, { error: error.message || 'Solicitud inválida.' }); }
  if (Array.isArray(body?.parts)&&body.parts.includes('socks') || Array.isArray(body?.layout?.tiles)&&body.layout.tiles.includes('socks')) return json(res, 400, { error: 'Las medias se ajustan con colores lisos y no se generan con IA.' });
  if (!apiKey && upstreamPort&&!providedBody) return proxyGenerator(req, res, body);
  if (!apiKey) return json(res, 503, { error: 'Falta configurar OPENAI_API_KEY en el servidor local.' });
  if (generating) return json(res, 429, { error: 'Ya hay un boceto en generación. Esperá a que termine.' });
  if (!isImage(body.mock) || !isImage(body.reference) || !isImage(body.mask)) return json(res, 400, { error: 'Cargá una imagen de referencia válida.' });
  const width = Number(body.width), height = Number(body.height);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 512 || height < 512 || width > 2048 || height > 2048 || width % 16 || height % 16) return json(res, 400, { error: 'El tamaño del mock no es compatible con la generación.' });
  const notes = String(body.notes || '').slice(0, 700);
  const allowedParts = ['shirt', 'short'];
  const selectedParts = Array.isArray(body.parts) ? body.parts.filter(part => allowedParts.includes(part)) : ['shirt'];
  if (!selectedParts.length) return json(res, 400, { error: 'Elegí una prenda para generar.' });
  const pieceKeys = ['front','back','right','left','short'];
  const layout = body.layout;
  if (!layout || !Array.isArray(layout.tiles) || !layout.tiles.length || layout.tiles.length > 5 || new Set(layout.tiles).size !== layout.tiles.length || layout.tiles.some(key => !pieceKeys.includes(key))) return json(res, 400, { error: 'Elegí piezas válidas para generar.' });
  if(layout.packing!==undefined&&layout.packing!=='compact-v1')return json(res,400,{error:'La distribución compacta no es válida.'});
  const compact=layout.packing==='compact-v1';
  const phase=body.phase||'visible';
  if(body.phase!==undefined&&(layout.pipeline!==twoPassVersion||!['visible','continuation'].includes(phase)))return json(res,400,{error:'La etapa de generación no es válida.'});
  if(layout.pipeline!==undefined&&layout.pipeline!==twoPassVersion)return json(res,400,{error:'El proceso de generación no es válido.'});
  const columns = layout.tiles.length > 4 ? 3 : layout.tiles.length > 1 ? 2 : 1, rows = Math.ceil(layout.tiles.length / columns);
  if (layout.columns !== columns || layout.rows !== rows || width !== columns*512 || height !== rows*512) return json(res, 400, { error: 'La distribución de las piezas no es válida.' });
  // GPT Image requires at least 655,360 output pixels. One/two-piece guides
  // remain in their saved 512-unit grid; only output pixel density increases.
  const outputCell=Math.max(512,Math.ceil(Math.sqrt(655360/(columns*rows))/16)*16);
  if (layout.separator !== undefined && !['#00ff00','#ff00ff'].includes(layout.separator)) return json(res,400,{error:'El fondo de separación no es válido.'});
  if(layout.guide!==undefined&&(layout.guide!==silhouetteGuideVersion||layout.registration!==registrationVersion))return json(res,400,{error:'La guía de superficie visible no es válida.'});
  const fitted=layout.outputShape===fittedRectangleVersion;
  if (!Array.isArray(layout.rectangles) || layout.rectangles.length !== layout.tiles.length || !(fitted?layout.bleed===0:[.10,generationBleed].includes(layout.bleed))) return json(res,400,{error:'Faltan los rectángulos proporcionales de las piezas.'});
  if(layout.registration!==undefined&&(!['garment-window-v1','garment-window-v2','garment-window-v3',registrationVersion].includes(layout.registration)||layout.bleed!==(fitted?0:generationBleed)))return json(res,400,{error:'La guía de registro de las piezas no es válida.'});
  for (let i=0;i<layout.tiles.length;i++) {
    const r=layout.rectangles[i], cx=compact?0:(i%columns)*512, cy=compact?0:Math.floor(i/columns)*512;
    if (!r || r.piece!==layout.tiles[i] || ![r.x,r.y,r.width,r.height].every(Number.isInteger) || r.width<1 || r.height<1 || r.x<cx || r.y<cy || r.x+r.width>cx+(compact?width:512) || r.y+r.height>cy+(compact?height:512)) return json(res,400,{error:'El rectángulo de una pieza no es válido.'});
    if(layout.registration===registrationVersion){
      const p=r.pattern;
      if(!p||![p.x,p.y,p.width,p.height].every(Number.isFinite)||p.x<0||p.y<0||p.width<=0||p.height<=0||p.x+p.width>1080||p.y+p.height>1920||Math.abs(r.width-r.height*p.width/p.height)>1.5)return json(res,400,{error:'Las dimensiones del estampado no corresponden al patrón.'});
    }
  }
  if(compact&&(!fitted||!validCompactAtlas(layout)))return json(res,400,{error:'Las piezas deben conservar su escala y una separación verde de 16 píxeles.'});
  if(fitted){
    if(layout.registration!==registrationVersion||layout.guide||layout.pipeline||layout.cutline||layout.outerline)return json(res,400,{error:'La guía rectangular no es válida.'});
  }else if(layout.outputShape===rectangularOutputVersion){
    if(layout.guide!==silhouetteGuideVersion||!layout.separator||layout.cutline||layout.outerline||layout.rectangles.some(r=>!Array.isArray(r.landmarks)||r.landmarks.length<1||r.landmarks.length>5||r.landmarks.some(row=>!row||!Number.isInteger(row.y)||row.y<0||row.y>=r.height||!Array.isArray(row.spans)||!row.spans.length||row.spans.length%2||row.spans.length>16||row.spans.some((x,i)=>!Number.isInteger(x)||x<0||x>r.width||i>0&&x<=row.spans[i-1]))))return json(res,400,{error:'Las referencias de la máscara visible no son válidas.'});
  }else if(layout.outputShape!==undefined&&(layout.outputShape!==silhouetteOutputVersion||layout.guide!==silhouetteGuideVersion||!layout.separator||!validSilhouetteLayout(layout)))return json(res,400,{error:'La máscara de las piezas no es válida.'});
  if(layout.pipeline===twoPassVersion&&(layout.outputShape!==rectangularOutputVersion||layout.rectangles.some(r=>
    !Array.isArray(r.visibleRows)||r.visibleRows.length!==r.height||!r.visibleRows.some(row=>Array.isArray(row)&&row.length)||r.visibleRows.some(row=>
      !Array.isArray(row)||row.length%2||row.length>32||row.some((x,i)=>!Number.isInteger(x)||x<0||x>r.width||i>0&&x<=row[i-1])))))return json(res,400,{error:'La superficie visible de la pieza no es válida.'});
  if(layout.cutline!==undefined&&(layout.outputShape!==silhouetteOutputVersion||layout.cutline!==(layout.separator==='#ff00ff'?'#00ffff':'#ff00ff')||layout.outerline!==(layout.separator==='#ff00ff'?'#00ff00':'#00ffff')))return json(res,400,{error:'Las marcas de registro no son válidas.'});
  const referenceImages=phase==='continuation'?[{image_url:body.mock}]:[{image_url:body.mock},{image_url:body.reference}];
  const pieceImageNumbers={};
  for(const piece of phase==='continuation'?[]:layout.tiles){
    const crop=body.pieceReferences?.[piece];
    if(crop===undefined)continue;
    if(!isImage(crop))return json(res,400,{error:'El recorte de referencia no es válido.'});
    referenceImages.push({image_url:crop});pieceImageNumbers[piece]=referenceImages.length;
  }
  const labels = {front:'front-body fabric print',back:'back-body fabric print',left:'wearer-left sleeve fabric print',right:'wearer-right sleeve fabric print',short:'shorts fabric print',socks:'socks fabric print'};
  const assignments = layout.rectangles.map(r => {
    const specific=String(body.pieceNotes?.[r.piece] || '').slice(0,180);
    if(phase==='continuation')return `Rectangle x=${r.x}, y=${r.y}, width=${r.width}, height=${r.height}: ${labels[r.piece]}. Preserve its already completed center and continue its actual existing artwork into peach.`;
    return `Rectangle x=${r.x}, y=${r.y}, width=${r.width}, height=${r.height} pixels: ${labels[r.piece]}. ${pieceImageNumbers[r.piece] ? `Use IMAGE ${pieceImageNumbers[r.piece]} as the PRIMARY and EXCLUSIVE visual source for this piece; image 2 is context only.` : 'Locate the matching garment view in image 2; ignore presentation panels, enlarged logos and detail callouts.'} ${specific ? 'Pattern instructions: '+specific : 'Extract only the underlying fabric pattern appropriate to this piece.'}`;
  }).join('\n');
  const basePrompt = `OUTPUT RULE: RECTANGULAR PRINT ARTWORK ONLY. EXCLUDE ALL GARMENT CONSTRUCTION. In every body swatch, ERASE the reference neckline and all collar/neckband shapes, including contrasting V-shaped or round bands and the inner neck opening; reconstruct only the surrounding underlying torso fabric across those pixels. In every sleeve swatch, ERASE the cuff/hem band and ALL its contrasting trim stripes; continue the sleeve fabric pattern to the bottom edge. Do not draw sleeve hems, shoulder stitches, collar curves, outlines of garment panels, shadows, knitted ribbing or photorealistic folds. These construction parts are already supplied by independent mockup layers. Removing these trims must not erase intentional large printed color panels or their printed borders in the torso. TASK: HIGH-FIDELITY FLAT RECONSTRUCTION OF THE EXISTING FABRIC ARTWORK, NOT A REDESIGN. Preserve the exact visible composition, motif shapes, stroke angles, stripe widths, color values, and relative positions measured against the garment body. Match the occupied percentage and top/middle/bottom placement of every graphic. Preserve plain areas and asymmetry. Do not invent, enlarge, extend visible motifs, duplicate, recenter an off-center graphic, or mirror a graphic. In particular, never connect separated top and bottom graphics through a plain middle area; never turn a short accent into a full-height stripe. Do not transpose front graphics onto the back or sleeves. A large lightning bolt or abstract angular motif integrated into the fabric is part of the PATTERN and must be preserved; discrete chest emblems and team badges are OVERPRINTS and must be removed. These are different visual roles. Reconstruct the visible colors, shapes and texture faithfully inside the garment silhouette; infer their continuation ONLY in hidden fabric and bleed areas. Removing an overprint means reconstructing the local underlying color or pattern, without filling a deliberately plain area with new graphics.\nTASK: EXTRACT CLEAN FABRIC PATTERNS, REMOVING ALL OVERPRINTED ELEMENTS. Image 2 is a reference, NOT content to reproduce literally. It may contain team crests, manufacturer symbols, sponsor marks, crowns, stars, names, words, letters, numbers or badges: REMOVE EVERY ONE OF THESE, reconstructing the uninterrupted fabric graphics behind them. Discrete manufacturer symbols, monograms, emblems, ornamental crests and jersey numbers must be absent. Preserve large geometric or lightning motifs that belong to the background print. Never reproduce reference text, player names or numbers. The application adds all those as separate editable layers later.\nCreate ONE ${width} by ${height} pixel flat artwork sheet. Image 1 provides an exact layout guide: neutral gray surrounds the rectangular editable fabric areas. Fill ONLY those rectangular areas with clean, full-bleed, unlit 2D fabric artwork. These are rectangular swatches, NOT garment silhouettes or mockups. Exact pixel rectangles:\n${assignments}\n${registrationInstructions(layout)} Keep proportions of diagonal bands, circles and texture motifs natural; no vertical or horizontal stretching. Continue the pattern to every edge of each rectangle. Do not add seams, collars, cuffs, borders, labels, grids, folds, lighting, shadows or any object. Interpret graphic differences between front, back and sleeves when visible in the reference; otherwise match the same pattern language. Leave unused sheet space neutral gray. Pattern-only instructions from the designer: ${notes || 'none'}. Before finishing, ensure that EVERY rectangle matches the corresponding reference piece in composition and relative scale, contains only the underlying fabric artwork, and contains no player text, digits, logos, emblems, neck opening, V-neck, round collar, cuff band or cuff stripes. Neckbands, cuffs and editable sleeve inserts are separate color layers: do not move their trim graphics into a body or sleeve rectangle.`;

  const generationPrompt=fitted||layout.guide===silhouetteGuideVersion?extendedArtworkPrompt(layout,assignments,notes,phase):basePrompt;
  const prompt=layout.outputShape===silhouetteOutputVersion||layout.pipeline===twoPassVersion?generationPrompt:layout.separator
    ? generationPrompt.replaceAll('neutral gray', `the uniform fluorescent chroma-key color ${layout.separator}`)
      + ` SEPARATION CONTRACT: Outside every fabric rectangle and throughout every gutter, use EXACTLY solid opaque sRGB ${layout.separator}. Keep all four outer margins and every horizontal/vertical gutter connected, at least 16 pixels wide. Keep each specified rectangle solid and complete with straight horizontal/vertical edges. No borders, outlines, gradients, shadows or antialiasing halos in the separator. This separator is not garment artwork: never add it inside a fabric rectangle or recolor the reference design to match it. Do not bridge or touch adjacent rectangles. Preserve the exact supplied rectangle coordinates and sizes.`
    : generationPrompt;

  generating = true;
  try {
    const response = await fetchImpl('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2.5-sunburst', images: referenceImages, mask: { image_url: body.mask }, prompt, size: `${columns*outputCell}x${rows*outputCell}`, quality: 'medium', background: 'opaque', output_format: 'png', n: 1 }),
      signal: AbortSignal.timeout(180_000)
    });
    const result = await response.json();
    if (!response.ok) return json(res, response.status === 429 ? 429 : 502, { ...(response.status>=500?{code:'provider_outcome_unknown'}:{}),error: 'No se pudo generar el boceto. Revisá el estado del servicio e intentá más tarde.' });
    const encoded = result?.data?.[0]?.b64_json;
    if (!encoded) return json(res, 502, { error: 'La IA no devolvió una imagen.' });
    return json(res, 200, { image: `data:image/png;base64,${encoded}`, usage: result?.usage || null,providerRequestId:response.headers?.get('x-request-id')||null });
  } catch (error) {
    return json(res, 502, { code:'provider_outcome_unknown',error: error.name === 'TimeoutError' ? 'La generación tardó demasiado. El resultado debe verificarse antes de reenviarla.' : 'Se interrumpió la conexión con el servicio de imágenes.' });
  } finally { generating = false; }
}

async function proxyGenerator(req, res, body) {
  try {
    const response = await fetch(`http://127.0.0.1:${upstreamPort}/api/generate`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(190_000)
    });
    res.writeHead(response.status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    res.end(await response.text());
  } catch { json(res, 502, { error: 'No se pudo conectar con el generador local.' }); }
}

async function generatorStatus() {
  if (process.env.OPENAI_API_KEY) return { ready: true, model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2.5-sunburst' };
  if (upstreamPort) {
    try { const response = await fetch(`http://127.0.0.1:${upstreamPort}/api/status`, { signal: AbortSignal.timeout(3000) }); return await response.json(); }
    catch { /* Fall through to unavailable. */ }
  }
  return { ready: false, model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2.5-sunburst' };
}

export function createEditorServer({ analyzeColors = createColorAnalyzer({onDiagnostic:details=>console.warn('[reference-colors]',JSON.stringify(details))}),lab=localLabService(),imageFetch=fetch,env=process.env } = {}) {
const web=labWebContext(env);if(web&&!lab)throw new Error('managed_service_required');
const analyzers=new Map();
const labHandler=lab?createLabHttp({service:lab,readJson,env,fetchImpl:imageFetch,
  runGeneration:async(body,apiKey,{fetchImpl})=>{
    let status,result;const response={writeHead(code){status=code;},end(value){result=JSON.parse(value);}};
    await generate(null,response,{body,apiKey,fetchImpl});return {status,body:result};
  },onCompanyDeleted:tenantId=>{analyzers.delete(tenantId);},runAnalysis:async(body,apiKey,{fetchImpl,tenantId})=>{
    if(!isImage(body?.reference))return {status:400,body:{error:'Cargá una imagen de referencia válida.'}};
    let context=null;try{if(body.context!==undefined)context=validateDetailContext(body.context,isImage);}catch{return {status:400,body:{error:'Los elementos o las texturas no son válidos.'}};}
    let analyzer=analyzers.get(tenantId);if(!analyzer){analyzer=createColorAnalyzer({apiKey:()=>env.OPENAI_API_KEY,model:()=>env.OPENAI_COLOR_MODEL||'gpt-4.1-mini'});if(analyzers.size>=20)analyzers.delete(analyzers.keys().next().value);analyzers.set(tenantId,analyzer);}
    return analyzer(body.reference,context,{fetchImpl});
  }}):null;
const costTimer=labHandler&&env.OPENAI_ADMIN_KEY?setInterval(()=>labHandler.syncCosts().catch(()=>{}),3600000):null;
costTimer?.unref();
const server=createServer(async (req, res) => {
  const pathname = new URL(req.url, `http://${host}`).pathname;
  if(web){
    res.setHeader('x-content-type-options','nosniff');res.setHeader('referrer-policy','no-referrer');res.setHeader('x-frame-options','DENY');res.setHeader('strict-transport-security','max-age=31536000');
    res.setHeader('permissions-policy','camera=(), microphone=(), geolocation=()');
    res.setHeader('content-security-policy',"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; img-src 'self' data: blob:; font-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    if(req.method==='GET'&&['/health','/ready'].includes(pathname)){
      const ready=pathname==='/health'||!await lab.setupNeeded();return json(res,ready?200:503,{status:ready?'ok':'not_ready',release:env.SPORTEX_RELEASE||'unknown'});
    }
    if(![web.labHost,web.panelHost].includes(req.headers.host)||req.headers['x-forwarded-proto']!=='https')return json(res,403,{error:'Origen no permitido.'});
  }
  if(labHandler){
    if(!web&&!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host||'')){return json(res,403,{error:'El panel local solo acepta acceso desde esta computadora.'});}
    if(await labHandler(req,res,pathname))return;
  }
  if (req.method === 'GET' && pathname === '/api/status') return json(res, 200, await generatorStatus());
  if (req.method === 'POST' && pathname === '/api/generate') return generate(req, res);
  if (req.method === 'POST' && pathname === '/api/reference-colors') {
    let body;
    try { body = await readJson(req); } catch { return json(res, 400, { error: 'La referencia no es válida.' }); }
    if (!isImage(body?.reference)) return json(res, 400, { error: 'Cargá una imagen de referencia válida.' });
    let context=null;
    if(body.context!==undefined){try{context=validateDetailContext(body.context,isImage);}catch{return json(res,400,{error:'Los elementos o las texturas para analizar no son válidos.'});}}
    const result = await analyzeColors(body.reference,context);
    return json(res, result.status, result.body);
  }
  const hiresAsset = /^\/assets\/psd-kit\/hires\/(photo[A-Za-z]+)\.png$/.exec(pathname);
  const fontAsset = /^\/assets\/fonts\/[A-Za-z0-9-]+\.(ttf|otf)$/.test(pathname);
  const photoshopAsset = /^\/assets\/psd-kit\/[A-Za-z0-9-]+\.png$/.test(pathname);
  const pdfAsset=/^\/vendor\/pdfjs\/(build\/(?:pdf|pdf.worker)\.min\.mjs|(?:standard_fonts|cmaps|wasm)\/[A-Za-z0-9_.-]+\.(?:pfb|ttf|bcmap|wasm|js))$/.exec(pathname);
  if (req.method !== 'GET' || (!routes.has(pathname) && !photoshopAsset && !hiresAsset && !fontAsset && !pdfAsset)) return json(res, 404, { error: 'No encontrado.' });
  const file = pdfAsset?join(import.meta.dirname,'node_modules','pdfjs-dist',pdfAsset[1]):hiresAsset ? join(import.meta.dirname, 'moldes', 'psd-cuello-redondo', `kit-${hiresAsset[1]}.png`) : join(publicDir, pathname === '/' ? 'index.html' : pathname.slice(1));
  try {
    const data = await readFile(file);
    res.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream', 'cache-control': fontAsset||pdfAsset ? 'public, max-age=604800' : 'no-store' });
    res.end(data);
  } catch { json(res, 404, { error: 'Archivo no encontrado.' }); }
});
server.on('close',()=>{if(costTimer)clearInterval(costTimer);});
return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createEditorServer().listen(port, host, () => console.log(`SPORTEX · Laboratorio de bocetos: http://${host}:${port}`));
}
