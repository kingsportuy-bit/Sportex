const W = 1080, H = 1920, API_W = 1024, API_H = 1024, POSITION_SCALE = W / 936;
import { installImagePreview } from './image-preview.js';
import { atlasCropRevision, chooseAtlasSeparator, detectAtlasRectangles, validateManualRectangles, exteriorMask } from './atlas-crop.js';
import {silhouetteOutputVersion,silhouetteGuide} from './silhouette-atlas.js';
import {paintCutline,isCutline,warpMarkedTile} from './marked-atlas.js';
import {installAtlasRecovery,recoveredVariant} from './atlas-recovery.js';
import { generationBleed, registrationVersion, registrationWindow, croppedContentWindow, textureBaseGeometry, normalizedPatternTile, normalizedPatternVersion, silhouetteGuideVersion, patternGuidePixels, rectangularOutputVersion, visibleGuideLandmarks, fittedRectangleVersion } from './artwork-registration.js';
import { captureTextureTransforms, restoreTextureTransforms } from './reference-compare.js';
import { patternGeometryVersion, patternBounds, clipPatternBounds, resetPatternPlacement, sleevePatternFrame } from './pattern-geometry.js';
import {torsoEnvelope,warpTorsoPixels} from './torso-warp.js';
import {compactAtlas} from './atlas-layout.js';
import {trimGroups,trimInputIds,readTrimSettings,trimSettingsForMold,buildTrimBatches,paintTrimBatches,migrateTrimEdits} from './garment-trims.js';
import {installTrimEditor} from './trim-editor.js';
import {withApprovedTrimModel} from './trim-defaults.js';
import {fitTextInk,proportionalResize,makeElementModel,replacementImageSize,trackedGlyphLayout,compositionTransform,initialParameterSketch,resolveTextureClips} from './element-layout.js';
import {toggleElement,marqueeElements,alignElements,colorableElements} from './element-selection.js';
import {installTextureImport} from './texture-import.js';
import {bootstrapLab} from './lab-client.js';
const lab=await bootstrapLab();
import {twoPassVersion,guideVisibleRows,visibleOnlyGuide,registerVisibleAtlas,continuationInput,composeContinuation} from './two-pass-atlas.js';

import {stripePeriod,sharedStripeScale} from './stripe-scale.js';
import {nextAvailableSketchId, unionRegion, rotatedBounds, textureActionPositions, preferredFontDefaults, preferenceSnapshot, withPreferences} from './editor-geometry.js';

const $ = id => document.getElementById(id);
installImagePreview($('enlarged-image-dialog'), $('enlarged-image-viewport'), $('enlarged-image'));
const generationBalanceKey = lab.key('sportex-generation-balance-v1');
function readGenerationBalance() {
  if(lab.managed)return lab.remaining;
  try {
    const stored = localStorage.getItem(generationBalanceKey);
    const value = stored === null ? 100 : Number(stored);
    return Number.isInteger(value) && value >= 0 && value <= 100 ? value : 100;
  } catch { return 100; }
}
let generationsRemaining = readGenerationBalance();
function updateGenerationBalance() {
  $('generation-count').textContent = generationsRemaining;
  $('generation-balance').classList.toggle('empty', generationsRemaining === 0);
}
function consumeGeneration(remaining) {
  if(lab.managed){if(Number.isInteger(remaining))lab.remaining=remaining;generationsRemaining=lab.remaining;updateGenerationBalance();return;}
  generationsRemaining = Math.max(0, readGenerationBalance() - 1);
  try { localStorage.setItem(generationBalanceKey, String(generationsRemaining)); }
  catch { notice('No se pudo guardar el contador en este navegador.', true); }
  updateGenerationBalance();
}
updateGenerationBalance();
if(lab.managed)lab.onBalance=remaining=>{generationsRemaining=remaining;updateGenerationBalance();updateGenerate();};
window.addEventListener('storage', event => {
  if (event.key !== generationBalanceKey) return;
  generationsRemaining = readGenerationBalance(); updateGenerationBalance(); updateGenerate();
});

const canvas = $('mock-canvas'), sceneCanvas = document.createElement('canvas');
sceneCanvas.width = W; sceneCanvas.height = H;
const ctx = sceneCanvas.getContext('2d', { willReadFrequently: true });
function frameWidth() { return 1440; }
function updateFrame(resetZoom=true) {
  $('design-format').value='3:4';
  canvas.width = frameWidth() * outputScale; canvas.height = H * outputScale;
  $('canvas-shell').style.setProperty('--canvas-ratio', `${frameWidth()} / ${H}`);
  canvas.setAttribute('aria-label', `Boceto editable de frente y espalda, proporción ${$('design-format').value}`);
  document.querySelectorAll('[data-format]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.format === $('design-format').value)));
  $('background-format').textContent = $('design-format').value;
  $('export').textContent = `Descargar PNG ${$('design-format').value} ↗`;
  $('export-dimensions').textContent = `El archivo exportado mide ${frameWidth()*2} × ${H*2} px. Sin fondo conserva transparencia.`;
  updateEditorZoom(resetZoom?1:editorZoom);
}
const frontPositions = {
  crest: { x: 348, y: 387, size: 64 },
  brand: { x: 187, y: 384, size: 48 },
  brand2: { x: 801, y: 320, size: 48 },
  'front-number': { x: 269, y: 478, size: 120 },
  'back-name': { x: 801, y: 386, size: 66 },
  'back-number': { x: 801, y: 518, size: 324 },
  'short-crest': { x: 122, y: 985, size: 64 },
  'short-number': { x: 398, y: 992, size: 134 },
  'short-brand': { x: 397, y: 921, size: 36 }
};
const positionRevision = 3;
const fixedLayerKeys = ['brand','brand2', 'crest', 'front-number', 'short-brand', 'short-crest', 'short-number', 'back-number', 'back-name'];
const numberColorIds = ['front-number-color', 'back-number-color', 'short-number-color'];
const state = {
  assets: {}, assetsReady: false,
  referenceData: null, referenceRegions: {}, pendingPrintGeneration:null, backgroundMode: 'white', customBackground: null,
  customTextures:{},textureModes:{},logos: { brand: [],brand2:[], crest: [] }, sponsors: [], texts:[], documentPalette:[],elementModel:null,
  generatedParts: { shirt: null, shirtSleeves: null, short: null, socks: null }, designVariants: [], activeVariant: -1, view: 'base', apiReady: false, selected: null,selectedElements:[],
  layers: structuredClone(frontPositions), garmentCache: null,
  visibleLayers: Object.fromEntries(fixedLayerKeys.map(key => [key, true])), layerStyles: {},
  dragging: null,trimEdits:{},trimModelRevision:null
};
let trimEditor=null;
let multiSelectMode=false,selectionMarquee=null,marqueeFrame=0;
let pendingGraphicReplacement=null,graphicReplacementBusy=false;
const colorIds = ['shirt-color', 'sleeve-color', 'neck-color', 'cuff-color', 'short-color', 'sock-color'];
const parts = ['shirt', 'short', 'socks'];
let outputScale = 1, exportAssets = null;
let editorZoom = 1;
function updateEditorZoom(next = editorZoom, anchor = null) {
  if(!$('inline-text-editor').hidden)$('inline-text-editor').blur();
  editorZoom = Math.max(1, Math.min(5, next));
  const viewport = $('canvas-viewport'), shell = $('canvas-shell');
  const baseWidth = Math.min(viewport.clientWidth, viewport.clientHeight * frameWidth() / H);
  const oldWidth = shell.getBoundingClientRect().width || baseWidth;
  const rect = viewport.getBoundingClientRect(), oldRect = shell.getBoundingClientRect();
  const px = anchor ? anchor.clientX - rect.left : viewport.clientWidth / 2;
  const py = anchor ? anchor.clientY - rect.top : viewport.clientHeight / 2;
  const centerX = (rect.left + px - oldRect.left) / oldWidth;
  const centerY = (rect.top + py - oldRect.top) / (oldWidth * H / frameWidth());
  shell.style.width = `${baseWidth * editorZoom}px`;
  viewport.scrollLeft = Math.max(0, (viewport.clientWidth - baseWidth * editorZoom) / 2) + centerX * baseWidth * editorZoom - px;
  viewport.scrollTop = centerY * baseWidth * editorZoom * H / frameWidth() - py;
  $('zoom-value').textContent = `${Math.round(editorZoom * 100)}%`;
  $('zoom-out').disabled = editorZoom === 1; $('zoom-in').disabled = editorZoom === 5;
  $('resize-popover').hidden = true;
  requestAnimationFrame(()=>{if(state.assetsReady)presentScene();});
}
$('zoom-in').addEventListener('click', () => updateEditorZoom(editorZoom + .5));
$('zoom-out').addEventListener('click', () => updateEditorZoom(editorZoom - .5));
$('zoom-fit').addEventListener('click', () => updateEditorZoom(1));
new ResizeObserver(() => updateEditorZoom()).observe($('canvas-viewport'));
let panGesture = null, spacePressed = false;
$('canvas-viewport').addEventListener('wheel', event => {
  event.preventDefault(); updateEditorZoom(editorZoom * Math.exp(-event.deltaY * .0015), event);
}, { passive: false });
document.addEventListener('keydown', event => {
  if (event.code !== 'Space' || event.target.closest('input,textarea,select,button')) return;
  event.preventDefault(); spacePressed = true; canvas.style.cursor = 'grab';
});
document.addEventListener('keyup', event => { if (event.code === 'Space') { spacePressed = false; canvas.style.cursor = 'default'; } });
window.addEventListener('blur', () => { spacePressed = false; stopDrag(); });

function notice(message,error=false){$('notice').textContent=message;$('notice').classList.toggle('error',error);$('notice').hidden=!error||!message;}
function makeCanvas() { const c = document.createElement('canvas'); c.width = W * outputScale; c.height = H * outputScale; return c; }
function loadImage(src) { return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('No se pudo abrir la imagen.')); image.src = src; }); }
function fileData(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('No se pudo leer el archivo.')); reader.readAsDataURL(file); }); }
function invalidateGarment() { state.garmentCache = null; render(); }
function hasDesign() { return state.designVariants.length > 0; }
function changeGarmentStructure() {
  if (!hasDesign()) state.view = 'base';
  updateViewButtons();
  notice('Prendas actualizadas en la misma posición. Los diseños de las otras prendas se conservan.');
}
function visibleParts() { return ['shirt', ...($('include-shorts').checked ? ['short'] : []), ...($('include-socks').checked ? ['socks'] : [])]; }
const designPieceKeys = ['front','back','right','left','short'];
function selectedParts() { return designPieceKeys.filter(piece => $(`gen-${piece}`).checked); }
function flatMaskName(part) {
  return { shirt: 'photoDesignShirt', short: 'photoShort', socks: 'photoSocks' }[part];
}
function resolvedMask(name) {
  return $('raglan-enabled').checked && ['photoSleeveLeft', 'photoSleeveRight'].includes(name) ? name + 'Raglan' : name;
}
function maskPixels(name) {
  name = resolvedMask(name);
  if (!state.maskPixels) state.maskPixels = {};
  const cacheKey = `${name}:${outputScale}`;
  if (!state.maskPixels[cacheKey]) {
    const node = makeCanvas(), c = node.getContext('2d', { willReadFrequently: true });
    c.drawImage(exportAssets?.[name] || state.assets[name], 0, 0, W * outputScale, H * outputScale);
    state.maskPixels[cacheKey] = c.getImageData(0, 0, W * outputScale, H * outputScale).data;
  }
  return state.maskPixels[cacheKey];
}
function maskBounds(name) {
  if (!state.maskBounds) state.maskBounds = {};
  if (!state.maskBounds[name]) {
    const data = maskPixels(name);
    let left = W, top = H, right = 0, bottom = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] <= 24) continue;
      left = Math.min(left, x); top = Math.min(top, y);
      right = Math.max(right, x + 1); bottom = Math.max(bottom, y + 1);
    }
    state.maskBounds[name] = { x: left, y: top, width: right - left, height: bottom - top };
  }
  return state.maskBounds[name];
}
function tintedMask(name, color) {
  name = resolvedMask(name);
  const key = `${name}:${color}:${outputScale}`;
  if (!state.tintCache) state.tintCache = new Map();
  if (!state.tintCache.has(key)) {
    const node = makeCanvas(), c = node.getContext('2d');
    c.drawImage(exportAssets?.[name] || state.assets[name], 0, 0, W * outputScale, H * outputScale);
    c.globalCompositeOperation = 'source-in'; c.fillStyle = color; c.fillRect(0, 0, W * outputScale, H * outputScale);
    if (state.tintCache.size > 12) state.tintCache.clear();
    state.tintCache.set(key, node);
  }
  return state.tintCache.get(key);
}
function drawPhotoshopParts(c, included) {
  if (included.includes('shirt')) {
    for (const [mask, color] of [
      ['photoBackNeck', '#c6c9cd'], ['photoBody', 'shirt-color'],
      ['photoSleeveLeft', 'sleeve-color'], ['photoSleeveRight', 'sleeve-color'],
      ['photoCuffs', $('cuffs-enabled').checked?'cuff-color':'sleeve-color'], ['photoCollar', 'neck-color']
    ]) c.drawImage(tintedMask(mask, color.startsWith('#') ? color : $(color).value), 0, 0, W, H);
  }
  if (included.includes('short')) c.drawImage(tintedMask('photoShort', $('short-color').value), 0, 0, W, H);
  if (included.includes('socks')) c.drawImage(tintedMask('photoSocks', $('sock-color').value), 0, 0, W, H);
}
function blendChannel(base, layer, mode) {
  if (mode === 'normal') return layer;
  if (mode === 'multiply') return base * layer / 255;
  if (mode === 'screen') return 255 - (255 - base) * (255 - layer) / 255;
  if (mode === 'overlay') return base < 128 ? 2 * base * layer / 255 : 255 - 2 * (255 - base) * (255 - layer) / 255;
  return Math.max(0, base + layer - 255); // Photoshop Linear Burn / Subexposición lineal.
}
function photoCoverage(part) {
  if (!state.photoCoverage) state.photoCoverage = {};
  const coverageKey = `${part}:${outputScale}`, cw = W * outputScale, ch = H * outputScale;
  if (!state.photoCoverage[coverageKey]) {
    const names = part === 'shirt'
      ? ['photoBody', 'photoSleeveLeft', 'photoSleeveRight', 'photoCollar', 'photoCuffs', 'photoBackNeck']
      : part === 'short' ? ['photoShort'] : ['photoSocks', 'photoShoes'];
    const masks = names.map(maskPixels), alpha = new Uint8Array(cw * ch);
    let left = cw, top = ch, right = 0, bottom = 0;
    for (let pixel = 0; pixel < alpha.length; pixel++) {
      const i = pixel * 4;
      for (const mask of masks) alpha[pixel] = Math.max(alpha[pixel], mask[i + 3]);
      if (!alpha[pixel]) continue;
      const x = pixel % cw, y = Math.floor(pixel / cw);
      left = Math.min(left, x); top = Math.min(top, y);
      right = Math.max(right, x + 1); bottom = Math.max(bottom, y + 1);
    }
    state.photoCoverage[coverageKey] = { alpha, left, top, right, bottom };
  }
  return state.photoCoverage[coverageKey];
}
function applyPhotoshopLights(c, included, region=null) {
  // Final stack: PARTS, SMARTS, marks and text, Layer 3, UNIFORM HIGHLIGHTS.
  const shadowMode = $('shadows-blend').value, highlightMode = $('highlights-blend').value;
  const shadowOpacity = Number($('shadows-opacity').value) / 100;
  const highlightOpacity = Number($('highlights-opacity').value) / 100;
  if (!shadowOpacity && !highlightOpacity) return;
  const cw = W * outputScale, ch = H * outputScale;
  const {x:rx,y:ry,width:rw,height:rh}=region||{x:0,y:0,width:cw,height:ch};
  const result = c.getImageData(rx, ry, rw, rh), dst = result.data;
  for (const part of included) {
    const name = { shirt: 'Shirt', short: 'Short', socks: 'Socks' }[part];
    const raglan=part==='shirt'&&$('raglan-enabled').checked;
    const burn = maskPixels(`photoBurn${name}`), screen = maskPixels(`photoScreen${name}`);
    const sleeveMask=raglan?maskPixels('photoDesignShirtSleevesRaglan'):null;
    const sleeveBurn=raglan?maskPixels('photoBurnShirtRaglan'):null,sleeveScreen=raglan?maskPixels('photoScreenShirtRaglan'):null;
    const coverage = photoCoverage(part);
    for (let y = Math.max(coverage.top,ry); y < Math.min(coverage.bottom,ry+rh); y++) for (let x = Math.max(coverage.left,rx); x < Math.min(coverage.right,rx+rw); x++) {
      const pixel = y * cw + x, j=pixel*4, i = ((y-ry)*rw+x-rx)*4;
      if (!coverage.alpha[pixel] || !dst[i + 3]) continue;
      const b=sleeveMask?.[j+3]>=128?sleeveBurn:burn,s=sleeveMask?.[j+3]>=128?sleeveScreen:screen;
      const shadowMix = b[j + 3] / 255 * shadowOpacity;
      const highlightMix = s[j + 3] / 255 * highlightOpacity;
      if (!shadowMix && !highlightMix) continue;
      for (let channel = 0; channel < 3; channel++) {
        let color = dst[i + channel];
        if (shadowMix) color += (blendChannel(color, b[j + channel], shadowMode) - color) * shadowMix;
        if (highlightMix) color += (blendChannel(color, s[j + channel], highlightMode) - color) * highlightMix;
        dst[i + channel] = color;
      }
    }
  }
  c.putImageData(result, rx, ry);
}
// Each print stays separate from its fixed mask, like a PowerClip.
const textureImages=new Map(), powerClipMasks=new Map(), clippedTextureCache=new Map();
const importTexture=installTextureImport($('texture-import-dialog'));
let loadingTexturePiece=null;
const textureGhostCanvas=makeCanvas(),textureHoverCanvas=makeCanvas();let textureHoverMask=null;
let textureRotation=null, textureResize=null, textureDrag=null, editingTexture=false, textureSide='front', textureEditSnapshot=null, hoveredTexture=null, pieceEditing=false, pieceEditSnapshot=null;
function textureSelection(){if(pieceEditing&&pieceEditSnapshot)return {piece:pieceEditSnapshot.piece,side:pieceEditSnapshot.side};const [piece,side]=$('texture-piece').value.split(':');return {piece,side:side||((piece==='front'||piece==='back')?piece:textureSide)};}
function clipTransform(clip,piece,side,write=false){
  if(piece!=='left'&&piece!=='right')return clip;
  if(write){clip.views??={};clip.views[side]??={x:clip.x||0,y:clip.y||0,scale:clip.scale||1,scaleX:clip.scaleX??clip.scale??1,scaleY:clip.scaleY??clip.scale??1,rotation:clip.rotation||0};}
  return clip.views?.[side]||clip;
}
function activeClips(){return resolveTextureClips(state.designVariants[state.activeVariant]?.clips,state.customTextures,state.textureModes);}
function updateTextureLibrary(){
  const ai=state.designVariants[state.activeVariant]?.clips||{},current=activeClips();
  for(const piece of designPieceKeys){
    const mode=state.textureModes[piece]||'ai',custom=state.customTextures[piece];
    $(`texture-ai-${piece}`).checked=mode==='ai'&&Boolean(ai[piece]);$(`texture-ai-${piece}`).disabled=editingTexture||!ai[piece];
    $(`texture-custom-control-${piece}`).hidden=!custom;$(`texture-custom-${piece}`).checked=mode==='custom';$(`texture-custom-${piece}`).disabled=editingTexture;
    $(`texture-name-${piece}`).hidden=!custom;$(`texture-name-${piece}`).textContent=custom?.name||'';
    $(`texture-file-${piece}`).disabled=editingTexture||Boolean(loadingTexturePiece);
    $(`texture-upload-${piece}`).disabled=editingTexture||Boolean(loadingTexturePiece);
    $(`texture-status-${piece}`).textContent=loadingTexturePiece===piece?'Preparando textura…':ai[piece]?'Diseño IA disponible.':'Sin diseño IA.';
  }
  $('adjust-textures').disabled=!Object.keys(current).length||editingTexture;
}
function chooseTextureSource(piece,mode){
  if(editingTexture)return;recordHistory();state.textureModes[piece]=mode;state.view='design';invalidateGarment();updateViewButtons();recordHistory();scheduleWorkspaceSave();
}
async function loadPieceTexture(piece,file){
  if(!file||editingTexture||loadingTexturePiece)return;
  const sketchId=activeSketchId,input=$(`texture-file-${piece}`);loadingTexturePiece=piece;updateTextureLibrary();
  try{
    const result=await importTexture(file);if(!result||sketchId!==activeSketchId||editingTexture)return;
    const {src}=result,image=await loadImage(src);if(sketchId!==activeSketchId||editingTexture)return;
    const name=file.name+(result.pages>1?` · página ${result.page}`:'');
    recordHistory();textureImages.set(src,image);state.customTextures[piece]={name,width:result.width,height:result.height,clip:{src,x:0,y:0,scale:1,scaleX:1,scaleY:1,rotation:0,custom:true,patternGeometry:patternGeometryVersion}};
    state.textureModes[piece]='custom';state.view='design';invalidateGarment();updateViewButtons();recordHistory();scheduleWorkspaceSave();
  }catch(error){notice('No se pudo cargar la textura: '+error.message,true);}
  finally{input.value='';loadingTexturePiece=null;updateTextureLibrary();}
}
for(const piece of designPieceKeys){
  $(`texture-ai-${piece}`).addEventListener('change',event=>chooseTextureSource(piece,event.target.checked?'ai':'none'));
  $(`texture-custom-${piece}`).addEventListener('change',event=>chooseTextureSource(piece,event.target.checked?'custom':'none'));
  $(`texture-file-${piece}`).addEventListener('change',event=>loadPieceTexture(piece,event.target.files[0]));
  $(`texture-upload-${piece}`).addEventListener('click',()=>$(`texture-file-${piece}`).click());
}
async function prepareClips(variant){
  if(!variant)return;
  if(variant.rawImage && variant.layout?.rectangles && variant.layout.tiles.some(piece=>variant.clips?.[piece]?.cropRevision!==atlasCropRevision)){
    try {
      const atlas=await loadImage(variant.rawImage),next=structuredClone(variant.clips||{});
      // Validate every rectangle before replacing any saved crop or transform.
      atlasRectangles(atlas,variant.layout);
      for(const piece of variant.layout.tiles){
        const clip=next[piece];if(clip?.cropRevision===atlasCropRevision)continue;
        const tile=atlasTile(atlas,variant.layout,piece);
        next[piece]={...(clip||{x:0,y:0,scale:1,bleed:variant.layout.bleed||.10}),...(tile.contentWindow?{contentWindow:tile.contentWindow}:{}),...(tile.patternAspectRevision?{patternAspectRevision:tile.patternAspectRevision}:{}),...(tile.patternGeometry?{patternGeometry:tile.patternGeometry}:{}),src:tile.toDataURL('image/png'),cropRevision:atlasCropRevision};
      }
      variant.clips=next;delete variant.cropError;
    } catch(error) { variant.cropError=error.message; }
  }
  variant.registrationWarnings=Object.entries(variant.clips||{}).filter(([,clip])=>clip.contentWindow?.reviewRequired).map(([piece])=>({front:'Frente',back:'Espalda',right:'Manga derecha',left:'Manga izquierda',short:'Short',socks:'Medias'})[piece]||piece);
  await Promise.all(Object.values(variant.clips||{}).map(async clip=>{if(!textureImages.has(clip.src))textureImages.set(clip.src,await loadImage(clip.src));}));
}
function registrationReviewMessage(variant){return variant?.registrationWarnings?.length?`Revisar en Ajustar estampado: ${variant.registrationWarnings.join(', ')}. No se pudo verificar el margen completo de estas piezas; no se agregó margen mediante zoom.`:'';}
function powerClipMask(piece,side){
  const sleeves=piece==='left'||piece==='right',raglan=sleeves&&$('raglan-enabled').checked;
  const key=`${piece}:${side}:${raglan}:${outputScale}`;
  if(powerClipMasks.has(key))return powerClipMasks.get(key);
  const name=piece==='short'||piece==='socks'?flatMaskName(piece):`photoDesignShirt${sleeves?'Sleeves':'Body'}${raglan?'Raglan':''}`;
  const node=makeCanvas(),c=node.getContext('2d',{willReadFrequently:true});
  c.drawImage(exportAssets?.[name]||state.assets[name],0,0,node.width,node.height);
  if(sleeves)c.drawImage(exportAssets?.photoCuffs||state.assets.photoCuffs,0,0,node.width,node.height);
  const sideLeft=side==='front';c.clearRect(sideLeft?W/2*outputScale:0,0,W/2*outputScale,H*outputScale);
  if(sleeves){const whole=maskBounds(`${side}-photoDesignShirt`),split=Math.round((whole.x+whole.width/2)*outputScale),screenLeft=side==='front'?piece==='right':piece==='left';c.clearRect(screenLeft?split:0,0,screenLeft?node.width-split:split,node.height);}
  const data=c.getImageData(0,0,node.width,node.height).data;let left=node.width,top=node.height,right=0,bottom=0;
  for(let y=0;y<node.height;y++)for(let x=0;x<node.width;x++)if(data[(y*node.width+x)*4+3]>24){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);}
  const result={node,data,bounds:patternBounds(data,node.width,node.height,outputScale),legacyBounds:{x:left/outputScale,y:top/outputScale,width:(right-left)/outputScale,height:(bottom-top)/outputScale}};
  if(sleeves)result.frame=sleevePatternFrame(data,maskPixels('photoCuffs'),node.width,node.height,result.bounds,outputScale);
  powerClipMasks.set(key,result);return result;
}
// Rear sleeves use the opposite atlas swatch: the viewing direction reverses sides.
function textureImageForView(clip,piece,side){
  const opposite=piece==='right'?'left':piece==='left'?'right':null;
  const sources=state.designVariants[state.activeVariant]?.clips||activeClips();
  const other=side==='back'&&opposite&&!clip.custom?sources[opposite]:null;
  const source=other&&!other.custom?other:clip;
  return source&&textureImages.get(source.src);
}
const torsoEnvelopes=new WeakMap(),torsoSourcePixels=new WeakMap();
function drawTorsoTexture(c,image,mask,b,clip,placement,color){
  const density=mask.node.width/W;
  let envelope=torsoEnvelopes.get(mask);
  if(!envelope){envelope=torsoEnvelope(mask.data,mask.node.width,mask.node.height,{x:mask.bounds.x*density,y:mask.bounds.y*density,width:mask.bounds.width*density,height:mask.bounds.height*density});torsoEnvelopes.set(mask,envelope);}
  let source=torsoSourcePixels.get(image);
  if(!source){const node=document.createElement('canvas');node.width=image.width;node.height=image.height;const dc=node.getContext('2d',{willReadFrequently:true});dc.drawImage(image,0,0);source=dc.getImageData(0,0,node.width,node.height);torsoSourcePixels.set(image,source);}
  // The complete rectangle becomes the envelope, including older saved crops.
  // Historical bleed windows must not cut its edges away before deformation.
  const base={width:b.width,height:b.height,offsetX:0,offsetY:0},sx=placement.scaleX??placement.scale??1,sy=placement.scaleY??placement.scale??1;
  const pixels=warpTorsoPixels(source,envelope,{boundsWidth:b.width,boundsHeight:b.height,width:base.width*sx,height:base.height*sy,x:(placement.x||0)*b.width+base.offsetX*sx,y:(placement.y||0)*b.height+base.offsetY*sy,rotation:placement.rotation||0},[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)));
  const node=document.createElement('canvas');node.width=pixels.width;node.height=pixels.height;const dc=node.getContext('2d'),output=dc.createImageData(node.width,node.height);output.data.set(pixels.data);dc.putImageData(output,0,0);
  c.drawImage(node,envelope.x/density,envelope.y/density,envelope.width/density,envelope.height/density);
}
function drawPowerClips(c,included,stage='all'){
  const entries=Object.entries(activeClips()).sort(([a],[b])=>Number(a==='left'||a==='right')-Number(b==='left'||b==='right'));
  for(const [piece,clip] of entries){
    const sleeve=piece==='left'||piece==='right';
    if(stage==='body'&&sleeve||stage==='sleeves'&&!sleeve)continue;
    const part=['short','socks'].includes(piece)?piece:'shirt';
    if(!included.includes(part)||(piece==='left'||piece==='right')&&!$('apply-sleeves').checked)continue;
    for(const side of piece==='front'||piece==='back'?[piece]:['front','back']){
      const image=textureImageForView(clip,piece,side);if(!image)continue;
      const mask=powerClipMask(piece,side),deformSides=!clip.custom&&['front','back','short'].includes(piece),b=deformSides?mask.bounds:clipPatternBounds(mask,clip);if(b.width<=0||b.height<=0)continue;
      const placement=clipTransform(clip,piece,side),color=$(part==='shirt'?(piece==='left'||piece==='right'?'sleeve-color':'shirt-color'):part==='short'?'short-color':'sock-color').value;
      const key=`${piece}:${side}:${outputScale}`,signature=JSON.stringify([Boolean(clip.custom),placement.x,placement.y,placement.scale,placement.scaleX,placement.scaleY,placement.rotation,clip.contentWindow,clip.patternGeometry,clip.sleeveRegistration,color,b]);
      let cached=clippedTextureCache.get(key);
      if(!cached||cached.src!==image.src||cached.mask!==mask||cached.signature!==signature){
        const box=mask.legacyBounds,x=Math.floor(box.x)-2,y=Math.floor(box.y)-2,width=Math.ceil(box.width)+4,height=Math.ceil(box.height)+4;
        const layer=cached?.node||document.createElement('canvas');layer.width=width*outputScale;layer.height=height*outputScale;
        const lc=layer.getContext('2d');lc.setTransform(outputScale,0,0,outputScale,-x*outputScale,-y*outputScale);
        lc.fillStyle=color;lc.fillRect(x,y,width,height);
        if(deformSides)drawTorsoTexture(lc,image,mask,b,clip,placement,color);
        else{
          const base=textureBaseGeometry(clip,image,b),sx=placement.scaleX??placement.scale??1,sy=placement.scaleY??placement.scale??1,w=base.width*sx,h=base.height*sy;
          lc.save();lc.translate(b.x+b.width/2+(placement.x||0)*b.width+base.offsetX*sx,b.y+b.height/2+(placement.y||0)*b.height+base.offsetY*sy);lc.rotate((placement.rotation||0)*Math.PI/180);lc.drawImage(image,-w/2,-h/2,w,h);lc.restore();
        }
        // Apply the matching crop in local pixel coordinates. A transformed
        // full-size mask can leave the small cache canvas partly unmasked.
        lc.setTransform(1,0,0,1,0,0);lc.globalCompositeOperation='destination-in';
        lc.drawImage(mask.node,x*outputScale,y*outputScale,width*outputScale,height*outputScale,0,0,layer.width,layer.height);
        cached={node:layer,src:image.src,mask,signature,x,y,width,height};clippedTextureCache.set(key,cached);
      }
      c.drawImage(cached.node,cached.x,cached.y,cached.width,cached.height);
    }
  }
}
function updateTextureEditor(){
  const keys=Object.keys(activeClips()), select=$('texture-piece'),previous=select.value;
  $('texture-editor').hidden=false;select.replaceChildren();
  $('edit-texture').disabled=!keys.length;updateTextureLibrary();
  for(const key of keys){if(key==='left'||key==='right'){for(const side of ['front','back'])select.add(new Option(`${pieceLabels[key]} · ${side==='front'?'frente':'espalda'}`,`${key}:${side}`));}else select.add(new Option(pieceLabels[key],key));}
  if([...select.options].some(option=>option.value===previous))select.value=previous;
  updateTextureMode();
  updateTextureScale();
}
function updateTextureScale(){const {piece,side}=textureSelection(),clip=activeClips()[piece],p=clip&&clipTransform(clip,piece,side),sx=Math.round((p?.scaleX??p?.scale??1)*100),sy=Math.round((p?.scaleY??p?.scale??1)*100);$('texture-scale').value=sx;$('texture-rotation').value=Math.round(p?.rotation||0);$('texture-scale-value').textContent=sx===sy?`${sx}%`:`${sx}% × ${sy}%`;}
function hitTexture(x,y,includeRectangle=true){
  if(state.view!=='design'||!editingTexture)return null;
  for(const piece of Object.keys(activeClips())){
    if(pieceEditing&&piece!==pieceEditSnapshot.piece)continue;
    if((piece==='left'||piece==='right')&&!$('apply-sleeves').checked||piece==='short'&&!$('include-shorts').checked||piece==='socks'&&!$('include-socks').checked)continue;
    for(const side of piece==='front'||piece==='back'?[piece]:['front','back']){
      if(pieceEditing&&side!==pieceEditSnapshot.side)continue;
      const m=powerClipMask(piece,side),px=Math.floor(x*outputScale),py=Math.floor(y*outputScale);
      if(px>=0&&py>=0&&px<W*outputScale&&py<H*outputScale&&m.data[(py*W*outputScale+px)*4+3]>24)return {piece,side,bounds:['front','back','short'].includes(piece)?m.bounds:clipPatternBounds(m,activeClips()[piece])};
    }
  }
  const {piece,side}=textureSelection(),p=texturePlacement(piece,side);
  const local=p?rotatePoint({x,y},p.x+p.width/2,p.y+p.height/2,-p.rotation*Math.PI/180):null;
  if(includeRectangle&&pieceEditing&&p&&local.x>=p.x&&local.x<=p.x+p.width&&local.y>=p.y&&local.y<=p.y+p.height)return {piece,side,bounds:p.bounds};
  return null;
}
function setExpanded(expanded){
  document.querySelector('.preview-section').classList.toggle('is-expanded',expanded);
  document.body.classList.toggle('design-expanded',expanded);
  $('expand-design').textContent=expanded?'×':'⛶';$('expand-design').setAttribute('aria-label',expanded?'Cerrar vista ampliada':'Ampliar boceto');$('expand-design').setAttribute('aria-expanded',String(expanded));$('expand-design').title=expanded?'Cerrar vista ampliada':'Ampliar boceto';
  requestAnimationFrame(()=>updateEditorZoom(1));
}
function updateTextureMode(){
  $('texture-piece').disabled=pieceEditing;$('texture-editor-tools').hidden=!editingTexture;$('texture-rotation').disabled=!pieceEditing;$('apply-adjustment-footer').hidden=!editingTexture;$('apply-texture').hidden=!pieceEditing;$('texture-apply-footer').hidden=!pieceEditing;$('texture-center-action').hidden=!pieceEditing;$('edit-texture').hidden=editingTexture;
  document.querySelector('.preview-section').classList.toggle('is-adjusting',editingTexture);
  $('adjustment-current-design').hidden=!editingTexture;$('adjustment-current-design').textContent=(hasDesign()?`Diseño IA ${state.activeVariant+1}`:'Texturas propias');
  if(!editingTexture)hoveredTexture=null;
  updateTextureLibrary();
}
function positionTextureActions(){
  if(!editingTexture||!pieceEditing)return;
  const {piece,side}=textureSelection(),p=texturePlacement(piece,side);if(!p)return;
  const r=canvas.getBoundingClientRect(),v=$('canvas-viewport').getBoundingClientRect(),scale=r.width/frameWidth(),t=transform(),point=framePoint(p.x,p.y);
  const center=$('texture-center-action'),confirm=$('texture-apply-footer');
  const positions=textureActionPositions({x:r.left+point.x*scale,y:r.top+point.y*scale,width:p.width*scale*t.scale,height:p.height*scale*t.scale,rotation:p.rotation},
    {x:v.left,y:v.top,width:v.width,height:v.height},{width:center.offsetWidth||90,height:center.offsetHeight||36},{width:confirm.offsetWidth||84,height:confirm.offsetHeight||36});
  for(const [element,position] of [[center,positions.center],[confirm,positions.confirm]]){element.style.left=`${position.x}px`;element.style.top=`${position.y}px`;}
}
$('canvas-viewport').addEventListener('scroll',positionTextureActions);
function focusTexture(){
  if(!editingTexture)return;
  const {piece,side}=textureSelection();if(!activeClips()[piece])return;textureSide=side;
  requestAnimationFrame(()=>{updateEditorZoom(2);const b=powerClipMask(piece,textureSide).bounds,v=$('canvas-viewport'),s=$('canvas-shell').getBoundingClientRect().width/frameWidth(),point=framePoint(b.x+b.width/2,b.y+b.height/2);v.scrollLeft=Math.max(0,point.x*s-v.clientWidth/2);v.scrollTop=Math.max(0,point.y*s-v.clientHeight/2);render();});
}
function beginPieceEdit(piece,side){
  if(!editingTexture)return;
  if(pieceEditing&&pieceEditSnapshot?.piece===piece&&pieceEditSnapshot?.side===side)return;
  if(pieceEditing)return;
  pieceEditSnapshot={piece,side,clip:structuredClone(activeClips()[piece])};pieceEditing=true;hoveredTexture=null;textureSide=side;
  $('texture-piece').value=(piece==='left'||piece==='right')?`${piece}:${side}`:piece;updateTextureScale();updateTextureMode();presentScene();
}
function finishPieceEdit(cancel=false){
  if(cancel&&pieceEditSnapshot)activeClips()[pieceEditSnapshot.piece]=structuredClone(pieceEditSnapshot.clip);
  pieceEditing=false;pieceEditSnapshot=null;textureDrag=null;textureResize=null;textureRotation=null;hoveredTexture=null;
  updateTextureMode();state.garmentCache=null;scheduleWorkspaceSave();render();
}
function finishTextureAdjustment(cancel=false){
  if(cancel&&textureEditSnapshot){if(textureEditSnapshot.variant)textureEditSnapshot.variant.clips=structuredClone(textureEditSnapshot.clips);if(textureEditSnapshot.customTextures)state.customTextures=structuredClone(textureEditSnapshot.customTextures);}
  pieceEditing=false;pieceEditSnapshot=null;textureEditSnapshot=null;editingTexture=false;textureDrag=null;textureResize=null;textureRotation=null;hoveredTexture=null;updateTextureMode();setExpanded(false);state.garmentCache=null;scheduleWorkspaceSave();render();
  if(!cancel)recordHistory();
}
function applyTextureAdjustment(){finishTextureAdjustment(false);}
function openTextureAdjustment(){
  if(!Object.keys(activeClips()).length)return;recordHistory();state.view='design';textureEditSnapshot={variant:state.designVariants[state.activeVariant],clips:structuredClone(state.designVariants[state.activeVariant]?.clips||{}),customTextures:structuredClone(state.customTextures)};editingTexture=true;pieceEditing=false;pieceEditSnapshot=null;updateViewButtons();selectLayer(null);setExpanded(true);focusTexture();
}
$('edit-texture').addEventListener('click',openTextureAdjustment);
$('adjust-textures').addEventListener('click',openTextureAdjustment);
$('apply-texture').addEventListener('click',()=>finishPieceEdit(false));
$('cancel-texture').addEventListener('click',()=>finishPieceEdit(true));
$('apply-adjustment').addEventListener('click',applyTextureAdjustment);
function openEnlargedImage(){
  if(inlineEdit)$('inline-text-editor').blur();
  $('expand-design').disabled=true;
  return highResolutionSnapshot().then(src=>{$('enlarged-image').src=src;$('enlarged-image-dialog').showModal();})
    .catch(error=>notice('No se pudo ampliar la imagen: '+error.message,true))
    .finally(()=>$('expand-design').disabled=false);
}
$('close-enlarged-image').addEventListener('click',()=>$('enlarged-image-dialog').close());
$('enlarged-image-dialog').addEventListener('click',event=>{if(event.target===$('enlarged-image-dialog'))$('enlarged-image-dialog').close();});
$('enlarged-image-dialog').addEventListener('close',()=>$('enlarged-image').removeAttribute('src'));
$('expand-design').addEventListener('click',()=>{if(editingTexture)finishTextureAdjustment(true);else openEnlargedImage();});
document.addEventListener('keydown',event=>{if(trimEditor?.active||$('editor-confirm-dialog').open||$('texture-import-dialog').open||event.target.closest('input,select,textarea'))return;if(event.key==='Escape'&&!$('enlarged-image-dialog').open&&!$('raw-ai-dialog').open&&!$('reference-crop-dialog').open){if(editingTexture)finishTextureAdjustment(true);else if(document.querySelector('.preview-section').classList.contains('is-expanded'))setExpanded(false);}});
$('texture-piece').addEventListener('change',()=>{const {piece,side}=textureSelection();beginPieceEdit(piece,side);focusTexture();});
$('texture-rotation').addEventListener('input',()=>{if(!pieceEditing)return;const {piece,side}=textureSelection();clipTransform(activeClips()[piece],piece,side,true).rotation=Number($('texture-rotation').value)||0;invalidateGarment();});
$('texture-scale').addEventListener('input',()=>{const {piece,side}=textureSelection(),clip=activeClips()[piece];if(!clip)return;const p=clipTransform(clip,piece,side,true);p.scaleX=p.scaleY=p.scale=Number($('texture-scale').value)/100;updateTextureScale();invalidateGarment();});
$('center-texture').addEventListener('click',()=>{const {piece,side}=textureSelection(),clip=activeClips()[piece];if(!clip)return;const placement=clipTransform(clip,piece,side,true);placement.x=0;placement.y=0;updateTextureScale();invalidateGarment();});
function texturePlacement(piece,side){
  const clip=activeClips()[piece],image=clip&&textureImageForView(clip,piece,side);if(!image)return null;
  const mask=powerClipMask(piece,side),deformSides=!clip.custom&&['front','back','short'].includes(piece),b=deformSides?mask.bounds:clipPatternBounds(mask,clip);if(b.width<=0||b.height<=0)return null;
  const placement=clipTransform(clip,piece,side),base=deformSides?{width:b.width,height:b.height,offsetX:0,offsetY:0}:textureBaseGeometry(clip,image,b),sx=placement.scaleX??placement.scale??1,sy=placement.scaleY??placement.scale??1,width=base.width*sx,height=base.height*sy;
  return {image,bounds:b,x:b.x+(b.width-width)/2+(placement.x||0)*b.width+base.offsetX*sx,y:b.y+(b.height-height)/2+(placement.y||0)*b.height+base.offsetY*sy,width,height,rotation:placement.rotation||0};
}
function textureHandles(p){return [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]].map(([hx,hy])=>({hx,hy,x:p.x+(hx+1)*p.width/2,y:p.y+(hy+1)*p.height/2}));}
function paintTextureRectangle(c,p){c.save();c.translate(p.x+p.width/2,p.y+p.height/2);c.rotate(p.rotation*Math.PI/180);c.drawImage(p.image,-p.width/2,-p.height/2,p.width,p.height);c.restore();}
function drawTextureAdjustment(c){
  if(!editingTexture||state.view!=='design')return;
  if(!pieceEditing&&hoveredTexture){const m=powerClipMask(hoveredTexture.piece,hoveredTexture.side),h=textureHoverCanvas,hc=h.getContext('2d');if(textureHoverMask!==m){hc.globalCompositeOperation='source-over';hc.clearRect(0,0,W,H);hc.drawImage(m.node,0,0);hc.globalCompositeOperation='source-in';hc.fillStyle='#42ed78';hc.fillRect(0,0,W,H);textureHoverMask=m;}c.save();c.globalAlpha=.26;c.drawImage(h,0,0,W,H);c.restore();}
  if(!pieceEditing)return;
  const {piece,side}=textureSelection(),p=texturePlacement(piece,side);if(!p)return;
  const ghost=textureGhostCanvas,gc=ghost.getContext('2d');gc.globalCompositeOperation='source-over';gc.clearRect(0,0,W,H);paintTextureRectangle(gc,p);gc.globalCompositeOperation='destination-out';gc.drawImage(powerClipMask(piece,side).node,0,0);
  c.save();c.globalAlpha=.25;c.drawImage(ghost,0,0,W,H);c.globalAlpha=1;
  const unit=screenUnit(),cx=p.x+p.width/2,cy=p.y+p.height/2;
  c.save();c.translate(cx,cy);c.rotate(p.rotation*Math.PI/180);c.translate(-cx,-cy);c.strokeStyle='#42ed78';c.lineWidth=2;c.setLineDash([8,6]);c.strokeRect(p.x,p.y,p.width,p.height);
  c.beginPath();c.moveTo(cx,p.y);c.lineTo(cx,p.y+p.height);c.moveTo(p.x,cy);c.lineTo(p.x+p.width,cy);c.stroke();c.setLineDash([]);
  const handle=9*unit;c.fillStyle='#42ed78';c.strokeStyle='#172014';for(const h of textureHandles(p)){c.fillRect(h.x-handle/2,h.y-handle/2,handle,handle);c.strokeRect(h.x-handle/2,h.y-handle/2,handle,handle);}
  c.strokeStyle='#42ed78';c.beginPath();c.moveTo(cx,p.y);c.lineTo(cx,p.y-26*unit);c.stroke();c.beginPath();c.arc(cx,p.y-26*unit,5*unit,0,Math.PI*2);c.fill();c.restore();
  const b=p.bounds,bx=b.x+b.width/2,by=b.y+b.height/2,angle=activeClips()[piece]?.sleeveRegistration===1?powerClipMask(piece,side).frame?.angle||0:0;c.save();c.translate(bx,by);c.rotate(angle*Math.PI/180);c.translate(-bx,-by);c.strokeStyle='#36b8ff';c.setLineDash([8,6]);c.strokeRect(b.x,b.y,b.width,b.height);c.beginPath();c.moveTo(bx,b.y);c.lineTo(bx,b.y+b.height);c.moveTo(b.x,by);c.lineTo(b.x+b.width,by);c.stroke();c.setLineDash([]);c.fillStyle='#36b8ff';c.beginPath();c.arc(bx,by,4,0,Math.PI*2);c.fill();c.restore();c.restore();
}
function hitTextureRotation(x,y){
  if(!editingTexture||!pieceEditing)return null;const {piece,side}=textureSelection(),p=texturePlacement(piece,side);if(!p)return null;
  const unit=screenUnit(),cx=p.x+p.width/2,cy=p.y+p.height/2,h=rotatePoint({x:cx,y:p.y-26*unit},cx,cy,p.rotation*Math.PI/180);
  return Math.hypot(x-h.x,y-h.y)<10*unit?{piece,side,cx,cy,angle:Math.atan2(y-cy,x-cx),rotation:p.rotation}:null;
}
function hitTextureHandle(x,y){
  if(!editingTexture||!pieceEditing)return null;const {piece,side}=textureSelection(),p=texturePlacement(piece,side);if(!p)return null;
  const local=rotatePoint({x,y},p.x+p.width/2,p.y+p.height/2,-p.rotation*Math.PI/180),radius=12*screenUnit();
  for(const h of textureHandles(p))if(Math.abs(local.x-h.x)<=radius&&Math.abs(local.y-h.y)<=radius)return {piece,side,rotation:p.rotation*Math.PI/180,hx:h.hx,hy:h.hy,anchorX:p.x+(1-h.hx)*p.width/2,anchorY:p.y+(1-h.hy)*p.height/2,dx:h.hx*p.width,dy:h.hy*p.height,width:p.width,height:p.height,bounds:p.bounds,centerX:p.x+p.width/2,centerY:p.y+p.height/2};return null;
}
function rotatedTextureTransform(r,point){
  const local=rotatePoint(point,r.centerX,r.centerY,-r.rotation),next=anchoredTextureTransform(r,local),b=r.bounds;
  const center=rotatePoint({x:b.x+b.width/2+next.x*b.width,y:b.y+b.height/2+next.y*b.height},r.centerX,r.centerY,r.rotation);
  return {...next,x:(center.x-b.x-b.width/2)/b.width,y:(center.y-b.y-b.height/2)/b.height};
}
function anchoredTextureTransform(r,point){
  const initialX=r.initialScaleX??r.initialScale??1,initialY=r.initialScaleY??r.initialScale??1,hx=r.hx??Math.sign(r.dx),hy=r.hy??Math.sign(r.dy);
  let sx=initialX,sy=initialY;
  if(hx&&hy){const projection=((point.x-r.anchorX)*r.dx+(point.y-r.anchorY)*r.dy)/(r.dx*r.dx+r.dy*r.dy),factor=Math.max(Math.max(.2/initialX,.2/initialY),Math.min(Math.min(6/initialX,6/initialY),projection));sx=initialX*factor;sy=initialY*factor;}
  else if(hx)sx=Math.max(.2,Math.min(6,initialX*(point.x-r.anchorX)/r.dx));
  else if(hy)sy=Math.max(.2,Math.min(6,initialY*(point.y-r.anchorY)/r.dy));
  const width=(r.width??Math.abs(r.dx))*sx/initialX,height=(r.height??Math.abs(r.dy))*sy/initialY;
  const cx=hx?r.anchorX+hx*width/2:(r.centerX??r.anchorX),cy=hy?r.anchorY+hy*height/2:(r.centerY??r.anchorY),b=r.bounds;
  return {scale:Math.sqrt(sx*sy),scaleX:sx,scaleY:sy,x:(cx-b.x-b.width/2)/b.width,y:(cy-b.y-b.height/2)/b.height};
}
const shoulderTrimMasks=new Map();let trimSurface=null;
function trimMask(piece,side){
  if(piece!=='shoulder')return powerClipMask(piece,side);
  const key=`${side}:${$('raglan-enabled').checked}:${$('cuffs-enabled').checked}:${outputScale}`;
  if(shoulderTrimMasks.has(key))return shoulderTrimMasks.get(key);
  const body=powerClipMask(side,side),node=makeCanvas(),c=node.getContext('2d',{willReadFrequently:true});
  for(const part of [body,powerClipMask('left',side),powerClipMask('right',side)])c.drawImage(part.node,0,0);
  const data=c.getImageData(0,0,node.width,node.height).data,result={node,data,bounds:patternBounds(data,node.width,node.height,outputScale),bodyBounds:body.bounds};
  shoulderTrimMasks.set(key,result);return result;
}
function drawGarmentTrims(c,included){
  const settings=trimSettingsForMold(readTrimSettings(id=>$(id).type==='checkbox'?$(id).checked:$(id).value),$('raglan-enabled').checked);
  if(state.trimEdits?.linkedVersion!==3&&outputScale===1){
    const all=Object.fromEntries(Object.entries(settings).map(([group,values])=>[group,{...values,enabled:true}]));
    state.trimEdits=migrateTrimEdits(state.trimEdits||{},buildTrimBatches(all,['shirt','short'],trimMask));
  }
  if(!trimGroups.some(group=>settings[group].enabled))return;
  if(!trimSurface||trimSurface.width!==W*outputScale)trimSurface=makeCanvas();
  paintTrimBatches(c,buildTrimBatches(settings,included,trimMask,outputScale,state.trimEdits),trimSurface,outputScale);
}
function updateTrimControls(){
  const raglan=$('raglan-enabled').checked,available=group=>!raglan||!['sleeve','shoulder'].includes(group);
  $('edit-trims').disabled=!trimGroups.some(group=>available(group)&&$(`trim-${group}-enabled`).checked);
  $('trim-raglan-help').hidden=!raglan;
  for(const group of trimGroups){
    $(`trim-${group}-settings`).hidden=!$(`trim-${group}-enabled`).checked;
    const width=$(`trim-${group}-width`),value=group==='short-side'?Number(width.value)*1.25:Number(width.value);width.nextElementSibling.value=`${Number(value.toFixed(1))} px`;width.setAttribute('aria-valuetext',`${Number(value.toFixed(1))} píxeles`);
  }
  for(const group of ['sleeve','shoulder']){
    $(`trim-${group}-group`).hidden=raglan;
    for(const id of trimInputIds.filter(id=>id.startsWith(`trim-${group}-`)))$(id).disabled=raglan;
  }
  const singleShoulder=$('trim-shoulder-style').value==='single';$('trim-shoulder-width-field').hidden=singleShoulder;$('trim-shoulder-width').disabled=raglan||singleShoulder;$('trim-shoulder-width-help').hidden=!singleShoulder;$('trim-shoulder-width-help').textContent=`Mismo ancho que la manga: ${$('trim-sleeve-width').value} px.`;
  const double=$('trim-short-side-style').value==='double',twoColors=double||$('trim-short-side-mode').value!=='solid';
  $('trim-short-side-mode-field').hidden=double;$('trim-short-side-mode').disabled=double;
  $('trim-short-side-color2-field').hidden=!twoColors;$('trim-short-side-color2').disabled=!twoColors;
}
function drawPhotoshopGarment(c, included, includeDesign) {
  drawPhotoshopParts(c, included); // PARTS
  if (includeDesign&&!Object.keys(state.designVariants[state.activeVariant]?.clips||{}).length) for (const part of included) {
    const design = part === 'shirt' ? state.generatedParts.shirt || state.generatedParts.shirtRaglan : state.generatedParts[part];
    if (design) c.drawImage(design, 0, 0);
  }
  if(includeDesign)drawPowerClips(c,included,'body');
  // Sleeves are independent overlays above a fixed front/back surface.
  if(included.includes('shirt')){
    for(const name of ['photoSleeveLeft','photoSleeveRight'])c.drawImage(tintedMask(name,$('sleeve-color').value),0,0,W,H);
    if(includeDesign&&$('apply-sleeves').checked){
      const sleeves=$('raglan-enabled').checked?state.generatedParts.shirtSleevesRaglan||state.generatedParts.shirtSleeves:state.generatedParts.shirtSleeves;
      if(sleeves&&!Object.keys(state.designVariants[state.activeVariant]?.clips||{}).length)c.drawImage(sleeves,0,0);
      drawPowerClips(c,['shirt'],'sleeves');
    }
  }
  drawGarmentTrims(c,included);
  if(included.includes('shirt')){
    if($('cuffs-enabled').checked)c.drawImage(tintedMask('photoCuffs',$('cuff-color').value),0,0,W,H);
    c.drawImage(tintedMask('photoCollar',$('neck-color').value),0,0,W,H);
  }
  if (included.includes('socks')) c.drawImage(exportAssets?.photoShoes || state.assets.photoShoes, 0, 0, W, H);
}
const garmentSurface=makeCanvas();
function currentGarment() {
  if (state.garmentCache) return state.garmentCache;
  const target = garmentSurface, c = target.getContext('2d', { willReadFrequently: true }), included = visibleParts();c.clearRect(0,0,W,H);
  if (!state.assetsReady) return target;
  drawPhotoshopGarment(c, included, state.view === 'design');
  state.garmentCache = target;
  return target;
}
function drawCover(c, image, width = W, height = H) {
  const scale = Math.max(width / image.width, height / image.height), w = image.width * scale, h = image.height * scale;
  c.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
}
// The garment and every editable layer keep the same geometry with any background.
function transform() {return !state.assetsReady?{scale:1,x:0,y:0}:compositionTransform([maskBounds('photoDesignShirt'),...($('include-shorts').checked?[maskBounds('photoShort')]:[])],$('include-socks').checked);}
function screenUnit(){return frameWidth()/canvas.getBoundingClientRect().width/transform().scale;}
function framePoint(x,y){const t=transform();return {x:(frameWidth()-W)/2+t.x+x*t.scale,y:t.y+y*t.scale};}
const brandColorCache=new WeakMap();
function coloredBrandImage(image,key='brand'){
  const prefix=key==='short-brand'?'short-brand':key==='brand2'?'brand2':'brand';
  if(!image||!$(`${prefix}-color-enabled`).checked)return image;
  const color=$(`${prefix}-color`).value;let cache=brandColorCache.get(image);if(!cache){cache=new Map();brandColorCache.set(image,cache);}if(cache.has(color))return cache.get(color);
  const node=document.createElement('canvas');node.width=image.width;node.height=image.height;
  const c=node.getContext('2d');c.drawImage(image,0,0);c.globalCompositeOperation='source-in';c.fillStyle=color;c.fillRect(0,0,node.width,node.height);
  if(cache.size>=4)cache.delete(cache.keys().next().value);cache.set(color,node);return node;
}
function imageForLayer(key) {
  if (key === 'brand' || key==='brand2' || key === 'crest' || key === 'short-brand' || key === 'short-crest') {
    const type = key==='brand2'?'brand2':key.endsWith('brand') ? 'brand' : 'crest';
    const image=state.logos[type].find(item => item.id === $(type + '-select').value)?.image || null;
    return type==='brand'||type==='brand2'?coloredBrandImage(image,key):image;
  }
  return state.sponsors.find(item => item.id === key)?.image || null;
}
const footballFonts = {};
const clubFonts = [{"key": "club-adidas-2018", "family": "SportexClub1", "weight": 400, "label": "Adidas 2018", "file": "club-adidas-2018.ttf", "accents": true}, {"key": "club-alemania-2014", "family": "SportexClub2", "weight": 400, "label": "Alemania 2014", "file": "club-alemania-2014.ttf", "accents": false}, {"key": "club-argentina-2022-qatar", "family": "SportexClub3", "weight": 400, "label": "Argentina 2022 Qatar", "file": "club-argentina-2022-qatar.otf", "accents": true}, {"key": "club-argentina2018", "family": "SportexClub4", "weight": 400, "label": "Argentina2018", "file": "club-argentina2018.ttf", "accents": true}, {"key": "club-arsenal-2020-2021", "family": "SportexClub5", "weight": 400, "label": "arsenal 2020 2021", "file": "club-arsenal-2020-2021.ttf", "accents": false}, {"key": "club-barcelona19-20", "family": "SportexClub6", "weight": 400, "label": "Barcelona19-20", "file": "club-barcelona19-20.ttf", "accents": true}, {"key": "club-barcelona2013", "family": "SportexClub7", "weight": 400, "label": "Barcelona2013", "file": "club-barcelona2013.ttf", "accents": true}, {"key": "club-bayern-munchen-2021", "family": "SportexClub8", "weight": 400, "label": "bayern munchen 2021", "file": "club-bayern-munchen-2021.ttf", "accents": false}, {"key": "club-boca-juniors-2020", "family": "SportexClub13", "weight": 400, "label": "BOCA JUNIORS 2020", "file": "club-boca-juniors-2020.ttf", "accents": false}, {"key": "club-borussia-dortmund-23-24", "family": "SportexClub9", "weight": 400, "label": "Borussia Dortmund 23-24", "file": "club-borussia-dortmund-23-24.ttf", "accents": true}, {"key": "club-chelsea2011", "family": "SportexClub10", "weight": 400, "label": "Chelsea2011", "file": "club-chelsea2011.ttf", "accents": true}, {"key": "club-croatia-2021", "family": "SportexClub11", "weight": 400, "label": "Croatia 2021", "file": "club-croatia-2021.ttf", "accents": false}, {"key": "club-england-2020-2021", "family": "SportexClub12", "weight": 400, "label": "England 2020 2021", "file": "club-england-2020-2021.ttf", "accents": false}, {"key": "club-flamengo-adidas-2023", "family": "SportexClub15", "weight": 400, "label": "Flamengo Adidas 2023", "file": "club-flamengo-adidas-2023.otf", "accents": true}, {"key": "club-fmanchesterunited2017-2018", "family": "SportexClub16", "weight": 400, "label": "FManchesterUnited2017-2018", "file": "club-fmanchesterunited2017-2018.ttf", "accents": false}, {"key": "club-france-world-cup-2022-font", "family": "SportexClub17", "weight": 400, "label": "France - World Cup 2022 Font", "file": "club-france-world-cup-2022-font.ttf", "accents": false}, {"key": "club-france-2020-2021", "family": "SportexClub18", "weight": 400, "label": "france 2020 2021", "file": "club-france-2020-2021.ttf", "accents": false}, {"key": "club-germanyeurofont2021", "family": "SportexClub19", "weight": 400, "label": "germanyeurofont2021", "file": "club-germanyeurofont2021.ttf", "accents": false}, {"key": "club-holanda2018", "family": "SportexClub20", "weight": 400, "label": "Holanda2018", "file": "club-holanda2018.ttf", "accents": true}, {"key": "club-inter-milanfont-2020-2021", "family": "SportexClub21", "weight": 400, "label": "inter milanfont 2020-2021", "file": "club-inter-milanfont-2020-2021.ttf", "accents": false}, {"key": "club-jersey-m54", "family": "SportexClub22", "weight": 400, "label": "Jersey M54", "file": "club-jersey-m54.ttf", "accents": false}, {"key": "club-kv-mechelen-2021", "family": "SportexClub23", "weight": 400, "label": "KV Mechelen 2021", "file": "club-kv-mechelen-2021.ttf", "accents": true}, {"key": "club-la-liga-17-18", "family": "SportexClub24", "weight": 400, "label": "la liga 17-18", "file": "club-la-liga-17-18.ttf", "accents": true}, {"key": "club-liverpool-cup-2023", "family": "SportexClub25", "weight": 400, "label": "liverpool Cup 2023", "file": "club-liverpool-cup-2023.otf", "accents": false}, {"key": "club-manchester-city-year-dragon", "family": "SportexClub26", "weight": 400, "label": "Manchester City Year Dragon", "file": "club-manchester-city-year-dragon.ttf", "accents": true}, {"key": "club-mexico-font-third-2025", "family": "SportexClub27", "weight": 400, "label": "Mexico Font - Third 2025", "file": "club-mexico-font-third-2025.ttf", "accents": true}, {"key": "club-mls-major-league-soccer-2020", "family": "SportexClub28", "weight": 400, "label": "MLS Major League Soccer 2020", "file": "club-mls-major-league-soccer-2020.otf", "accents": false}, {"key": "club-nacional-uruguay-22-23", "family": "SportexClub29", "weight": 400, "label": "Nacional Uruguay 22 - 23", "file": "club-nacional-uruguay-22-23.ttf", "accents": true}, {"key": "club-nacional-uruguay-font-2024-2025", "family": "SportexClub30", "weight": 400, "label": "Nacional Uruguay Font - 2024-2025", "file": "club-nacional-uruguay-font-2024-2025.ttf", "accents": true}, {"key": "club-psg-2022-2023", "family": "SportexClub31", "weight": 400, "label": "PSG 2022-2023", "file": "club-psg-2022-2023.ttf", "accents": true}, {"key": "club-psg-ucl-font-2023-2024", "family": "SportexClub32", "weight": 400, "label": "PSG UCL Font - 2023-2024", "file": "club-psg-ucl-font-2023-2024.ttf", "accents": true}, {"key": "club-real-madrid-font-2024-2025", "family": "SportexClub33", "weight": 400, "label": "Real Madrid Font - 2024-2025", "file": "club-real-madrid-font-2024-2025.ttf", "accents": true}, {"key": "club-reamadrid-2020-2021", "family": "SportexClub34", "weight": 400, "label": "reamadrid-2020-2021", "file": "club-reamadrid-2020-2021.ttf", "accents": false}, {"key": "club-river-plate-2022", "family": "SportexClub35", "weight": 400, "label": "RIVER PLATE 2022", "file": "club-river-plate-2022.otf", "accents": true}, {"key": "club-river-plate-22-23", "family": "SportexClub36", "weight": 400, "label": "RIVER-PLATE 22-23", "file": "club-river-plate-22-23.ttf", "accents": true}, {"key": "club-sc-internacional-2023", "family": "SportexClub37", "weight": 400, "label": "SC Internacional 2023", "file": "club-sc-internacional-2023.ttf", "accents": true}, {"key": "club-wolfsburg-2020-2021", "family": "SportexClub38", "weight": 400, "label": "wolfsburg 2020 2021", "file": "club-wolfsburg-2020-2021.ttf", "accents": false}, {"key": "club-world-cup-2018-adidas", "family": "SportexClub14", "weight": 400, "label": "World Cup 2018 Adidas", "file": "club-world-cup-2018-adidas.ttf", "accents": false}];
for (const font of clubFonts) {
  footballFonts[font.key] = font;
  for (const id of ['name-font','number-font','selected-text-font']) {
    let group = $(id).querySelector('optgroup[label="Fuentes de fútbol"]');
    if (!group) { group = document.createElement('optgroup'); group.label = 'Fuentes de fútbol'; $(id).append(group); }
    const option = document.createElement('option'); option.value = font.key; option.textContent = font.label; group.append(option);
  }
}
const defaultFootballFont='club-real-madrid-font-2024-2025';
const labFontsReady=Promise.all((lab.company?.assets||[]).filter(a=>a.kind==='font').map(async asset=>{
  try{
  const key=`tenant-${asset.id}`,family=`SportexTenant${asset.id.replaceAll('-','')}`;
  const face=await new FontFace(family,`url(/api/lab/assets/${asset.id})`).load();document.fonts.add(face);
  footballFonts[key]={key,family,weight:400,label:asset.name};
  for(const id of ['name-font','number-font','selected-text-font'])$(id).add(new Option(asset.name,key));
  }catch{console.warn('No se pudo cargar una fuente de la empresa. Se conserva la fuente predeterminada.');}
}));
for(const [id,font] of Object.entries(preferredFontDefaults))$(id).value=font;
const fontHeightCache = new Map(),trackedFontCache=new Map();
const fontMeasureContext = document.createElement('canvas').getContext('2d');
function textLayout(key) {
  const font = footballFonts[key.startsWith('text-')?state.texts.find(t=>t.id===key)?.font:$(key === 'back-name' ? 'name-font' : 'number-font').value] || footballFonts[defaultFootballFont];
  const value=textFor(key)||'0',cacheKey=`${font.family}:${font.weight}:${value}`;
  let metrics = fontHeightCache.get(cacheKey);
  if (!metrics) {
    fontMeasureContext.font = `${font.weight} 1000px ${font.family}, sans-serif`;
    fontMeasureContext.textAlign='center';metrics=fontMeasureContext.measureText(value);
    if(fontHeightCache.size>=256)fontHeightCache.delete(fontHeightCache.keys().next().value);
    fontHeightCache.set(cacheKey, metrics);
  }
  const layout=fitTextInk(metrics,state.layers[key].size*.7*(state.layers[key].scaleY??1));
  const fontString=`${font.weight} ${layout.fontSize}px ${font.family}, sans-serif`,gap=(state.layers[key].letterSpacing||0)*(state.layers[key].scaleY??1);
  if(gap){
    const trackingKey=`${fontString}:${value}:${gap}`;let tracked=trackedFontCache.get(trackingKey);
    if(!tracked){fontMeasureContext.font=fontString;fontMeasureContext.textAlign='left';tracked=trackedGlyphLayout(value,text=>fontMeasureContext.measureText(text),gap);if(trackedFontCache.size>=256)trackedFontCache.delete(trackedFontCache.keys().next().value);trackedFontCache.set(trackingKey,tracked);}
    Object.assign(layout,tracked);
  }
  return {...layout,value,font:fontString};
}
function textFont(key){return textLayout(key).font;}
function isTextLayer(key){return ['front-number','back-number','short-number','back-name'].includes(key)||key?.startsWith('text-');}
function layerTextColor(key){return key.startsWith('text-')?state.texts.find(t=>t.id===key)?.color||'#ffffff':$(key==='back-name'?'ink-color':`${key}-color`).value;}
function textFor(key) {
  if(key.startsWith('text-'))return state.texts.find(t=>t.id===key)?.value||'';
  if (key === 'back-name') return $('player-name').value.trim().slice(0, 24).toLocaleUpperCase('es-UY');
  if (key === 'front-number' || key === 'short-number' || key === 'back-number') return $('player-number').value.trim().slice(0, 3);
  return '';
}
function layerBounds(key) {
  const layer = state.layers[key]; if (!layer) return null;
  const image = imageForLayer(key),scaleX=layer.scaleX??1,scaleY=layer.scaleY??1;
  if (image) {
    const aspect = image.width / image.height, width = aspect >= 1 ? layer.size : layer.size * aspect, height = aspect >= 1 ? layer.size / aspect : layer.size;
    return { x: layer.x, y: layer.y, width:width*scaleX, height:height*scaleY, image };
  }
  if (key === 'brand' || key==='brand2' || key === 'crest' || key === 'short-brand' || key === 'short-crest' || key.startsWith('sponsor-')) return null;
  const value = textFor(key); if (!value) return null;
  const layout=textLayout(key),ratio=scaleX/scaleY;
  return {...layout,width:layout.width*ratio,x:layer.x,y:layer.y,scaleX:ratio,scaleY:1};
}
const placementTargets=[['front','front','Camiseta · frente'],['back','back','Camiseta · espalda'],['right','front','Manga derecha · ambas vistas'],['left','front','Manga izquierda · ambas vistas'],['short','front','Short · frente'],['short','back','Short · espalda']];
function rotatableLayer(key){return key==='crest'||key==='short-crest'||key?.startsWith('sponsor-');}
function maskContains(mask,x,y){const px=Math.floor(x*outputScale),py=Math.floor(y*outputScale);return px>=0&&py>=0&&px<W*outputScale&&py<H*outputScale&&mask.data[(py*W*outputScale+px)*4+3]>24;}
function targetAt(x,y,shortOnly=false){
  if(!state.assetsReady)return null;
  for(const piece of shortOnly?['short']:['right','left','front','back','short']){
    if(piece==='short'&&!$('include-shorts').checked)continue;
    for(const side of piece==='front'||piece==='back'?[piece]:['front','back'])if(maskContains(powerClipMask(piece,side),x,y))return {piece,side};
  }return null;
}
function attachmentFor(key){
  const layer=state.layers[key];if(key==='short-crest')return {piece:'short',side:layer.attachment?.side||'front'};
  if(key==='crest')return {piece:'shirt',side:layer.attachment?.side||'front'};
  if(!key.startsWith('sponsor-'))return null;
  const a=layer.attachment;return a&&['front','back','right','left','short'].includes(a.piece)?a:targetAt(layer.x,layer.y)||{piece:'front',side:'front'};
}
const crestMasks=new Map();const restrictedGraphicCanvas=makeCanvas();
function attachmentMask(a){
  if(a.piece!=='shirt'){const mask=powerClipMask(a.piece,a.side);return {...mask,bounds:mask.legacyBounds};}
  const key=`${a.side}:${outputScale}`;if(crestMasks.has(key))return crestMasks.get(key);
  const node=makeCanvas(),c=node.getContext('2d',{willReadFrequently:true});c.drawImage(exportAssets?.photoDesignShirt||state.assets.photoDesignShirt,0,0,node.width,node.height);c.clearRect(a.side==='front'?W/2*outputScale:0,0,W/2*outputScale,H*outputScale);
  const result={node,data:c.getImageData(0,0,node.width,node.height).data};crestMasks.set(key,result);return result;
}
function sleeveHem(mask,x){
  const bounds=mask.bounds,cw=W*outputScale,ch=H*outputScale;
  if(!mask.data)return bounds.y+bounds.height;
  const px=Math.max(0,Math.min(cw-1,Math.floor(x*outputScale)));
  for(let y=Math.min(ch-1,Math.ceil((bounds.y+bounds.height)*outputScale));y>=Math.floor(bounds.y*outputScale);y--)if(mask.data[(y*cw+px)*4+3]>24)return (y+1)/outputScale;
  return bounds.y+bounds.height;
}
function layerInstances(key){
  const b=layerBounds(key);if(!b)return [];
  const attachment=rotatableLayer(key)?attachmentFor(key):null,base={...b,key,attachment,rotation:state.layers[key].rotation||0};
  if(!key.startsWith('sponsor-')||!['right','left'].includes(attachment?.piece))return [base];
  const other={piece:attachment.piece,side:attachment.side==='front'?'back':'front'},sourceMask=attachmentMask(attachment),targetMask=attachmentMask(other),source=sourceMask.bounds,target=targetMask.bounds,scale=target.width/source.width;
  const x=target.x+(1-(b.x-source.x)/source.width)*target.width,y=sleeveHem(targetMask,x)-(sleeveHem(sourceMask,b.x)-b.y)*scale;
  return [base,{...base,x,y,width:b.width*scale,height:b.height*scale,rotation:-base.rotation,attachment:other,copy:true}];
}
function adoptInstance(instance){
  if(!instance?.copy)return;
  const layer=state.layers[instance.key],b=layerBounds(instance.key);layer.scaleX=(layer.scaleX??1)*instance.width/b.width;layer.scaleY=(layer.scaleY??1)*instance.height/b.height;layer.x=instance.x;layer.y=instance.y;layer.rotation=instance.rotation;layer.attachment={...instance.attachment};
}
function moveAttachedLayer(key,x,y){
  const layer=state.layers[key];
  if(!rotatableLayer(key)){layer.x=x;layer.y=y;return;}
  let target=targetAt(x,y,key==='short-crest');if(!target)return;
  if(key==='crest'){if(target.piece==='short')return;target={piece:'shirt',side:target.side};}
  layer.x=x;layer.y=y;layer.attachment=target;
}
function layerKeys() {
  const keys = ['brand','brand2', 'crest', ...state.sponsors.map(s => s.id),...state.texts.map(t=>t.id), 'front-number', 'back-number', 'back-name', 'short-crest', 'short-brand', 'short-number'];
  return keys.filter(key => key.startsWith('sponsor-')
    ? state.sponsors.find(s => s.id === key)?.visible !== false && (attachmentFor(key).piece!=='short'||$('include-shorts').checked)
    : state.visibleLayers[key] !== false && (!key.startsWith('short-') || $('include-shorts').checked));
}
function drawGraphicImage(c,image,x,y,width,height){
  c.save();
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  c.drawImage(image,x,y,width,height);
  c.restore();
}
function outlinedImage(c, image, b, style) {
  const width = Math.max(1, Math.ceil(b.width*outputScale)), height = Math.max(1, Math.ceil(b.height*outputScale));
  const silhouette = document.createElement('canvas'); silhouette.width = width; silhouette.height = height;
  const sc = silhouette.getContext('2d'); drawGraphicImage(sc,image,0,0,width,height);
  sc.globalCompositeOperation = 'source-in'; sc.fillStyle = style.color; sc.fillRect(0, 0, width, height);
  const x = b.x - b.width / 2, y = b.y - b.height / 2;
  for (let radius = 1; radius <= style.width; radius++)
    for (let step = 0; step < 16; step++) {
      const angle = step * Math.PI / 8;
      drawGraphicImage(c,silhouette,x + Math.cos(angle) * radius,y + Math.sin(angle) * radius,b.width,b.height);
    }
  drawGraphicImage(c,image,x,y,b.width,b.height);
}
function drawLayer(c, key, highlight) {
  const b = layerBounds(key); if (!b) return;
  const style = state.layerStyles[key];
  if(b.image&&rotatableLayer(key)){
    for(const instance of layerInstances(key)){
      if(instance.attachment?.piece==='short'&&!$('include-shorts').checked)continue;
      const node=restrictedGraphicCanvas;if(node.width!==W*outputScale||node.height!==H*outputScale){node.width=W*outputScale;node.height=H*outputScale;}const lc=node.getContext('2d');lc.setTransform(1,0,0,1,0,0);lc.globalCompositeOperation='source-over';lc.clearRect(0,0,node.width,node.height);lc.setTransform(outputScale,0,0,outputScale,0,0);lc.translate(instance.x,instance.y);lc.rotate(instance.rotation*Math.PI/180);
      const local={...instance,x:0,y:0};if(style?.enabled)outlinedImage(lc,b.image,local,style);else drawGraphicImage(lc,b.image,-instance.width/2,-instance.height/2,instance.width,instance.height);
      lc.setTransform(1,0,0,1,0,0);lc.globalCompositeOperation='destination-in';lc.drawImage(attachmentMask(instance.attachment).node,0,0);c.drawImage(node,0,0,W,H);
    }return;
  }
  if (b.image) {
    if (style?.enabled) outlinedImage(c, b.image, b, style);
    else drawGraphicImage(c,b.image,b.x - b.width / 2,b.y - b.height / 2,b.width,b.height);
  } else { c.save(); c.translate(b.x,b.y);c.scale(b.scaleX,b.scaleY); c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = layerTextColor(key); c.font = b.font || textFont(key);
    if(b.glyphs)c.textAlign='left';
    const glyphs=b.glyphs||[{text:b.value,x:b.inkOffsetX||0}];
    if (style?.enabled) { c.strokeStyle = style.color; c.lineWidth = style.width * 2; c.lineJoin = 'round';for(const glyph of glyphs)c.strokeText(glyph.text,glyph.x,b.baselineOffset); }
    for(const glyph of glyphs)c.fillText(glyph.text,glyph.x,b.baselineOffset); c.restore(); }

}
let elementResize=null,elementRotation=null,outlinePanelOpen=false;
function positionSelectedTextColor(){
  const selected=selectedLayerKeys(),keys=colorableElements(selected),multiple=selected.length>1,key=multiple?keys.at(-1):state.selected,control=$('selected-text-color');
  const replacement=!multiple?selectedReplacementTarget():null,text=!multiple&&isTextLayer(key);$('action-replace-graphic').hidden=!replacement;
  control.classList.toggle('is-multiple',multiple);$('element-color-controls').hidden=!keys.length;$('text-spacing-control').hidden=!text;$('text-font-control').hidden=!text;$('selected-outline-controls').hidden=!outlinePanelOpen||multiple;
  if(text&&document.activeElement!==$('selected-text-font'))$('selected-text-font').value=key.startsWith('text-')?state.texts.find(t=>t.id===key)?.font:$(key==='back-name'?'name-font':'number-font').value;
  const b=!editingTexture&&key&&(keys.length||replacement||outlinePanelOpen)?layerBounds(key):null;if(!b){control.hidden=true;return;}
  if(keys.length){
    const input=$('selected-text-color-input'),colors=keys.map(key=>key.startsWith('text-')?layerTextColor(key):$(key==='back-name'?'ink-color':`${key}-color`).value),mixed=new Set(colors).size>1;
    $('selected-color-label').textContent=multiple?`Color · ${keys.length} ${keys.length===1?'elemento':'elementos'}`:'Color';$('selected-color-help').hidden=!multiple||keys.length===selected.length;
    input.setAttribute('aria-label',multiple?'Color de los elementos seleccionados':'Color del elemento seleccionado');if(input.value!==colors.at(-1))input.value=colors.at(-1);
    $('selected-text-color-value').textContent=multiple&&mixed?'Varios':colors.at(-1).toUpperCase();
  }
  if(text&&document.activeElement!==$('text-letter-spacing'))$('text-letter-spacing').value=state.layers[key].letterSpacing||0;
  control.hidden=false;if(multiple)return;
  const r=canvas.getBoundingClientRect(),v=$('canvas-viewport').getBoundingClientRect(),s=r.width/frameWidth(),point=framePoint(b.x,b.y),t=transform();
  const cx=r.left+point.x*s,bottom=r.top+(point.y+b.height/2*t.scale)*s,top=r.top+(point.y-b.height/2*t.scale)*s;
  if(cx<v.left||cx>v.right||bottom<v.top||top>v.bottom){control.hidden=true;return;}
  const half=control.offsetWidth/2,y=bottom+12+control.offsetHeight>v.bottom?Math.max(v.top+4,top-control.offsetHeight-36):bottom+12;
  control.style.left=`${Math.max(v.left+half+4,Math.min(v.right-half-4,cx))}px`;control.style.top=`${y}px`;
}
function applySelectionColor(color,commit=false,selection=selectedLayerKeys()){
  if(editingTexture||!/^#[0-9a-f]{6}$/i.test(color))return;
  const keys=colorableElements(selection);if(!keys.length)return;
  for(const key of keys){
    const custom=state.texts.find(t=>t.id===key);
    if(custom)custom.color=color;
    else {$(key==='back-name'?'ink-color':`${key}-color`).value=color;if(['brand','brand2','short-brand'].includes(key))$(`${key}-color-enabled`).checked=true;}
    queueTextStylePreview(key);
  }
  if(keys.includes('back-name'))$('color-value').textContent=color.toUpperCase();
  preferencesDirty=true;if(commit)flushTextStylePreview();
}
for(const type of ['input','change'])$('selected-text-color-input').addEventListener(type,event=>{
  applySelectionColor(event.target.value,event.type==='change');if(event.type==='change'){rememberDocumentColor(event.target.value);recordHistory();}
});
$('canvas-viewport').addEventListener('scroll',positionSelectedTextColor);
window.addEventListener('scroll',positionSelectedTextColor,true);
function selectedElementRectangle(){
  if(editingTexture||inlineEdit||!state.selected||!layerKeys().includes(state.selected)||selectedLayerKeys().length>1)return null;
  const b=layerBounds(state.selected);return b?{...b,x:b.x-b.width/2,y:b.y-b.height/2}:null;
}
function drawElementHandles(c){
  const keys=selectedLayerKeys();
  if(!editingTexture&&keys.length>1){
    const unit=screenUnit();c.save();c.strokeStyle='#42ed78';c.lineWidth=1.5*unit;c.setLineDash([5*unit,4*unit]);
    for(const key of keys)for(const b of layerInstances(key)){c.save();c.translate(b.x,b.y);c.rotate((b.rotation||0)*Math.PI/180);c.strokeRect(-b.width/2,-b.height/2,b.width,b.height);c.restore();}
    c.restore();return;
  }
  const p=selectedElementRectangle();if(!p)return;
  const unit=screenUnit(),handle=8*unit;
  c.save();const angle=(state.layers[state.selected].rotation||0)*Math.PI/180,cx=p.x+p.width/2,cy=p.y+p.height/2;c.translate(cx,cy);c.rotate(angle);c.translate(-cx,-cy);c.strokeStyle='#42ed78';c.lineWidth=1.5*unit;c.setLineDash([5*unit,4*unit]);c.strokeRect(p.x,p.y,p.width,p.height);c.setLineDash([]);c.fillStyle='#42ed78';
  for(const h of textureHandles(p)){c.fillRect(h.x-handle/2,h.y-handle/2,handle,handle);}
  if(rotatableLayer(state.selected)){const y=p.y-26*unit;c.beginPath();c.moveTo(cx,p.y);c.lineTo(cx,y);c.stroke();c.beginPath();c.arc(cx,y,5*unit,0,Math.PI*2);c.fill();}
  c.restore();
}
function drawSelectionMarquee(c){
  if(!selectionMarquee)return;const r=marqueeRectangle(),unit=screenUnit();
  c.save();c.fillStyle='#42ed7818';c.strokeStyle='#42ed78';c.lineWidth=unit;c.setLineDash([5*unit,3*unit]);c.fillRect(r.x,r.y,r.width,r.height);c.strokeRect(r.x,r.y,r.width,r.height);c.restore();
}
function rotatePoint(point,cx,cy,angle){const dx=point.x-cx,dy=point.y-cy;return {x:cx+dx*Math.cos(angle)-dy*Math.sin(angle),y:cy+dx*Math.sin(angle)+dy*Math.cos(angle)};}
function hitRotationHandle(x,y){
  const p=selectedElementRectangle();if(!p||!rotatableLayer(state.selected))return null;
  const cx=p.x+p.width/2,cy=p.y+p.height/2,unit=screenUnit(),angle=(state.layers[state.selected].rotation||0)*Math.PI/180,h=rotatePoint({x:cx,y:p.y-26*unit},cx,cy,angle);
  return Math.hypot(x-h.x,y-h.y)<10*unit?{key:state.selected,cx,cy,angle:Math.atan2(y-cy,x-cx),rotation:state.layers[state.selected].rotation||0}:null;
}
function hitElementHandle(x,y){
  const p=selectedElementRectangle();if(!p)return null;
  const rotation=(state.layers[state.selected].rotation||0)*Math.PI/180,local=rotatePoint({x,y},p.x+p.width/2,p.y+p.height/2,-rotation);x=local.x;y=local.y;
  const radius=9*screenUnit();
  for(const h of textureHandles(p))if(Math.abs(x-h.x)<=radius&&Math.abs(y-h.y)<=radius)return {key:state.selected,rotation,hx:h.hx,hy:h.hy,anchorX:p.x+(1-h.hx)*p.width/2,anchorY:p.y+(1-h.hy)*p.height/2,dx:h.hx*p.width,dy:h.hy*p.height,width:p.width,height:p.height,bounds:p,centerX:p.x+p.width/2,centerY:p.y+p.height/2,initialScaleX:state.layers[state.selected].scaleX??1,initialScaleY:state.layers[state.selected].scaleY??1};
  return null;
}
function resizedElement(r,point){
  if(r.hx&&r.hy)return proportionalResize(r,point);
  const cx=r.bounds.x+r.bounds.width/2,cy=r.bounds.y+r.bounds.height/2,local=rotatePoint(point,cx,cy,-(r.rotation||0)),t=anchoredTextureTransform(r,local),center=rotatePoint({x:cx+t.x*r.bounds.width,y:cy+t.y*r.bounds.height},cx,cy,r.rotation||0);return {scaleX:t.scaleX,scaleY:t.scaleY,x:center.x,y:center.y};
}
let litSceneReady=false,textStyleFrame=0;const pendingTextStyleKeys=new Set();
function textStyleRegion(keys){
  let left=W,top=H,right=0,bottom=0;
  for(const key of keys){const b=layerBounds(key);if(!b)continue;const layer=state.layers[key],pad=12*Math.max(1,layer.scaleX??1,layer.scaleY??1)+4;left=Math.min(left,b.x-b.width/2-pad);top=Math.min(top,b.y-b.height/2-pad);right=Math.max(right,b.x+b.width/2+pad);bottom=Math.max(bottom,b.y+b.height/2+pad);}
  const x=Math.max(0,Math.floor(left)),y=Math.max(0,Math.floor(top)),width=Math.min(W,Math.ceil(right))-x,height=Math.min(H,Math.ceil(bottom))-y;
  return width>0&&height>0?{x,y,width,height}:null;
}
function flushTextStylePreview(){
  if(textStyleFrame)cancelAnimationFrame(textStyleFrame);textStyleFrame=0;
  const region=[...pendingTextStyleKeys].some(rotatableLayer)?null:textStyleRegion(pendingTextStyleKeys);pendingTextStyleKeys.clear();render(true,region);
}
function queueTextStylePreview(key,commit=false){
  if(key)pendingTextStyleKeys.add(key);
  if(commit)flushTextStylePreview();else if(!textStyleFrame)textStyleFrame=requestAnimationFrame(flushTextStylePreview);
}
function render(showSelection = true, dirtyRegion=null) {
  if(outputScale!==1||!litSceneReady)dirtyRegion=null;
  ctx.save();
  if(dirtyRegion){ctx.beginPath();ctx.rect(dirtyRegion.x,dirtyRegion.y,dirtyRegion.width,dirtyRegion.height);ctx.clip();}
  ctx.clearRect(0, 0, W, H);

  ctx.save();
  if (outputScale === 1) ctx.drawImage(currentGarment(), 0, 0, W, H);
  else drawPhotoshopGarment(ctx, visibleParts(), state.view === 'design');
  for (const key of layerKeys()) drawLayer(ctx, key, showSelection && key === state.selected);
  ctx.restore();
  ctx.restore();
  if (state.assetsReady) applyPhotoshopLights(ctx, visibleParts(),dirtyRegion);
  if(outputScale===1)litSceneReady=true;

  presentScene(showSelection);
  scheduleWorkspaceSave();scheduleHistoryRecord();
}
function presentScene(showSelection=true){
  const display = canvas.getContext('2d');
  display.setTransform(outputScale, 0, 0, outputScale, 0, 0);
  display.clearRect(0, 0, frameWidth(), H);
  if (state.backgroundMode === 'white') { display.fillStyle = '#ffffff'; display.fillRect(0, 0, frameWidth(), H); }
  const bg = state.backgroundMode === 'delta' ? state.assets.background : state.backgroundMode === 'custom' ? state.customBackground : null;
  if (bg) drawCover(display, bg, frameWidth(), H);
  const t=transform();display.save();display.translate((frameWidth()-W)/2+t.x,t.y);display.scale(t.scale,t.scale);
  display.drawImage(sceneCanvas,0,0,W,H);
  if(showSelection&&outputScale===1){drawTextureAdjustment(display);drawElementHandles(display);drawSelectionMarquee(display);}display.restore();
  positionTextureActions();positionSelectedTextColor();positionCanvasActions();
}
function updateViewButtons() {
  updateTextureEditor();
  $('preview-raw-ai').hidden = state.view !== 'design' || !state.designVariants[state.activeVariant]?.rawImage;
  $('show-base').classList.toggle('active', state.view === 'base');
  $('show-design').disabled=!hasDesign()&&!Object.keys(state.customTextures).length;$('show-design').textContent=hasDesign()?'Diseño IA 1':'Texturas';
  $('show-design').classList.toggle('active', state.view === 'design' && state.activeVariant === 0);
  $('preview-tools').querySelectorAll('.generated-variant').forEach(button => button.remove());
  for (let index = 1; index < state.designVariants.length; index++) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'tool-button generated-variant';
    button.textContent = `Diseño IA ${index + 1}`; button.classList.toggle('active', state.view === 'design' && state.activeVariant === index);
    button.addEventListener('click', () => showVariant(index)); $('preview-tools').append(button);
  }
  $('apply-sleeves-control').hidden = !state.generatedParts.shirtSleeves&&!activeClips().left&&!activeClips().right;
  updateReferenceColorControls();
  invalidateGarment();
}
function showRawAiPreview() {
  const variant=state.designVariants[state.activeVariant];
  if (!variant?.rawImage) return;
  $('raw-ai-image').src=variant.rawImage;
  const labels={front:'Frente',back:'Espalda',right:'Manga derecha',left:'Manga izquierda',short:'Short',socks:'Medias'};
  $('refit-pattern').disabled=generationBusy||referenceColorsBusy||!Object.keys(variant.clips||{}).length;
  $('correct-atlas').disabled=generationBusy||referenceColorsBusy||!variant.layout?.rectangles?.length;
  $('raw-ai-info').textContent=`Diseño IA ${state.activeVariant+1} · Imagen sin recortar ni aplicar al molde. ${variant.layout?.tiles?.map(key=>labels[key]).join(' · ') || ''}`;
  if (!$('raw-ai-dialog').open) $('raw-ai-dialog').showModal();
}
async function refitCurrentPattern() {
  if(generationBusy||referenceColorsBusy||editingTexture)return;
  const original=state.designVariants[state.activeVariant];if(!original||!Object.keys(original.clips||{}).length)return;
  recordHistory();
  const variant={...original,clips:Object.fromEntries(Object.entries(original.clips).map(([piece,clip])=>[piece,resetPatternPlacement(structuredClone(clip))])),refitFrom:state.activeVariant};
  delete variant.referenceId;delete variant.cropError;delete variant.registrationWarnings;registerSleeveClips(variant,true);
  state.designVariants.push(variant);state.activeVariant=state.designVariants.length-1;state.generatedParts={...variant.parts};state.view='design';
  state.pendingReferenceAdjustment=false;
  // Color comparisons remain usable; only the old texture comparison is invalid.
  if(state.referenceComparison){state.referenceComparison.variantId=referenceVariantId(variant);for(const phase of ['before','after'])if(state.referenceComparison[phase])state.referenceComparison[phase]['reference-alignment']={inputs:{},transforms:captureTextureTransforms(variant.clips,Object.keys(variant.clips))};}
  $('raw-ai-dialog').close();updateViewButtons();invalidateGarment();scheduleWorkspaceSave();recordHistory();
  notice(`Diseño IA ${state.activeVariant+1}: estampados encajados en las dimensiones reales del molde. Conservamos el diseño anterior. Sin consumir créditos.`);
}
$('refit-pattern').addEventListener('click',refitCurrentPattern);
$('preview-raw-ai').addEventListener('click',showRawAiPreview);
$('close-raw-ai').addEventListener('click',()=> $('raw-ai-dialog').close());
const openAtlasRecovery=installAtlasRecovery({
  dialog:$('atlas-recovery-dialog'),canvas:$('atlas-recovery-canvas'),tabs:$('atlas-recovery-pieces'),status:$('atlas-recovery-status'),
  fields:Object.fromEntries(['x','y','width','height'].map(key=>[key,$(`atlas-recovery-${key}`)])),confirm:$('apply-atlas-recovery'),close:$('close-atlas-recovery'),
  async onApply(rectangles,session){
    if(session.sketchId!==activeSketchId||state.designVariants[state.activeVariant]!==session.original)throw new Error('Cambió el boceto activo. Volvé a abrir la separación.');
    const variant=recoveredVariant(session.original,rectangles);await prepareClips(variant);
    if(variant.cropError)throw new Error(variant.cropError);
    if(session.sketchId!==activeSketchId||state.designVariants[state.activeVariant]!==session.original)throw new Error('Cambió el boceto activo. No se aplicaron cambios.');
    registerSleeveClips(variant);recordHistory();
    state.designVariants.push(variant);state.activeVariant=state.designVariants.length-1;state.generatedParts={...variant.parts};state.view='design';state.pendingReferenceAdjustment=false;
    state.referenceComparison=null;
    $('raw-ai-dialog').close();updateViewButtons();scheduleWorkspaceSave();recordHistory();
    notice(`Piezas separadas en Diseño IA ${state.activeVariant+1}. Revisá su escala y margen en Ajustar estampado. Conservamos el original. Sin consumir créditos.`);
  }
});
$('correct-atlas').addEventListener('click',async()=>{
  if(generationBusy||referenceColorsBusy||editingTexture)return;
  const original=state.designVariants[state.activeVariant],sketchId=activeSketchId;if(!original?.rawImage||!original.layout?.rectangles)return;
  try{const image=await loadImage(original.rawImage);if(sketchId===activeSketchId&&state.designVariants[state.activeVariant]===original)openAtlasRecovery(image,original.layout,{original,sketchId});}catch(error){notice(error.message,true);}
});
async function showVariant(index) {
  if (!state.designVariants[index]) return;
  await prepareClips(state.designVariants[index]);
  state.activeVariant = index; state.generatedParts = { ...state.designVariants[index].parts };
  state.view = 'design'; updateViewButtons(); notice(state.designVariants[index].cropError||registrationReviewMessage(state.designVariants[index]),Boolean(state.designVariants[index].cropError));
}
function updateGenerate() { $('reference-image-actions').hidden=!state.referenceData;$('crop-reference-image').hidden=!state.referenceData; $('generate').disabled = generationsRemaining <= 0 || generationBusy || referenceColorsBusy || !(state.referenceData && state.apiReady && state.assetsReady && selectedParts().length); $('generate').title = '';updateReferenceColorControls(); }

const referenceColorFields = {
  neck: ['neck-color', 'Cuello'], cuffs: ['cuff-color', 'Puños'],
  frontNumber: ['front-number-color', 'Número del frente'], backNumber: ['back-number-color', 'Número de espalda'],
  shortNumber: ['short-number-color', 'Número del short'], name: ['ink-color', 'Nombre'],
  brand: ['brand-color', 'Marca de camiseta'], shortBrand: ['short-brand-color', 'Marca del short'],
  short: ['short-color', 'Short'], socks: ['sock-color', 'Medias']
};
const referenceComparisonGroups={
  'reference-neck-cuffs':['neck-color','cuff-color','cuffs-enabled'],
  'reference-socks':['sock-color'], 'reference-shorts':['short-color'],
  'reference-shirt-number':['front-number-color','back-number-color'],
  'reference-name':['ink-color'], 'reference-short-number':['short-number-color'],
  'reference-shirt-logo':['brand-color','brand-color-enabled'],
  'reference-short-logo':['short-brand-color','short-brand-color-enabled'],
  'reference-outlines':[], 'reference-alignment':[]
};
function referenceVariantId(variant){if(!variant)return null;return variant.referenceId??=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);}
function captureReferenceGroups(packet){
  const groups={};
  for(const [id,fields] of Object.entries(referenceComparisonGroups))groups[id]={inputs:Object.fromEntries(fields.map(field=>[field,field.endsWith('-enabled')?$(field).checked:$(field).value]))};
  groups['reference-outlines'].styles=Object.fromEntries(packet.context.elements.map(({id})=>[id,structuredClone(state.layerStyles[id]||null)]));
  groups['reference-alignment'].transforms=packet.variant&&packet.variant===state.designVariants?.[state.activeVariant]?captureTextureTransforms(packet.variant.clips,[...packet.context.targets,...(packet.patternTargets||[])].map(t=>t.piece)):{};
  return groups;
}
function restoreReferenceGroup(comparison,id,enabled){
  const saved=comparison?.[enabled?'after':'before']?.[id];if(!saved)return false;
  for(const [field,value] of Object.entries(saved.inputs||{})){if(field.endsWith('-enabled'))$(field).checked=value;else $(field).value=value;}
  if(saved.styles)for(const [key,style] of Object.entries(saved.styles)){if(!state.layers[key])continue;if(style===null)delete state.layerStyles[key];else state.layerStyles[key]=structuredClone(style);}
  if(saved.transforms){const variant=state.designVariants?.[state.activeVariant];if(variant?.referenceId!==comparison.variantId)return false;restoreTextureTransforms(variant.clips,saved.transforms);}
  return true;
}
function refreshReferenceAppearance(){
  $('cuff-color').disabled=!$('cuffs-enabled').checked;$('color-value').textContent=$('ink-color').value.toUpperCase();
  updateSelectedControls();if(state.view==='design'&&state.designVariants?.[state.activeVariant])updateTextureScale();invalidateGarment();scheduleWorkspaceSave();
}
function toggleReferenceComparison(event){
  if(referenceColorsBusy||generationBusy||editingTexture)return;
  const comparison=state.referenceComparison;if(!comparison)return;
  const enabled=event.target.checked;event.target.checked=!enabled;recordHistory();event.target.checked=enabled;
  restoreReferenceGroup(comparison,event.target.id,enabled);refreshReferenceAppearance();recordHistory();
  referenceColorMessages.set(activeSketchId,{reference:state.referenceData,text:'Comparación activa: marcado aplica el ajuste analizado; desmarcado restaura el valor anterior. No consume otro análisis.'});updateReferenceColorControls();
}
let referenceColorsBusy = false;
const referenceColorMessages = new Map();
function updateReferenceColorControls() {
  const button = $('copy-reference-colors'), status = $('reference-colors-status');
  button.disabled = referenceColorsBusy || generationBusy || !state.referenceData || !state.apiReady || !state.assetsReady || editingTexture;
  button.textContent = referenceColorsBusy ? 'Analizando referencia…' : 'Copiar colores de la referencia';
  const variant=state.designVariants?.[state.activeVariant];
  $('reference-alignment').disabled=state.view!=='design'||!Object.keys(variant?.clips||{}).length||Boolean(variant?.cropError);
  if(state.referenceComparison&&variant?.referenceId!==state.referenceComparison.variantId)$('reference-alignment').disabled=true;
  for(const id of Object.keys(referenceComparisonGroups))if(id!=='reference-alignment')$(id).disabled=referenceColorsBusy||generationBusy||editingTexture;
  if(referenceColorsBusy||generationBusy||editingTexture)$('reference-alignment').disabled=true;
  button.setAttribute('aria-busy', String(referenceColorsBusy));
  const message = referenceColorMessages.get(activeSketchId);
  status.textContent = referenceColorsBusy ? 'Analizando colores, contornos y posición del estampado…' : message?.reference === state.referenceData ? message.text : !state.referenceData ? 'Cargá una referencia en Diseño IA.' : !state.apiReady ? 'Configurá la API para analizar la referencia.' : 'Aplica colores y las opciones marcadas. Podés deshacerlo o corregirlo después. Usa análisis con IA.';
  status.classList.toggle('error', !referenceColorsBusy && message?.reference === state.referenceData && Boolean(message.error));
}
function applyReferenceColors(colors, baseline, {commit=true,inferred=[],preserveStructure=false}={}) {
  // Validate the complete response before mutating any document field.
  const entries = Object.entries(referenceColorFields);
  if (!colors || typeof colors !== 'object' || Array.isArray(colors) || Object.keys(colors).length !== entries.length || entries.some(([role]) => colors[role] !== null && (typeof colors[role] !== 'string' || !/^#[0-9a-f]{6}$/i.test(colors[role])))) throw new Error('No se recibieron colores válidos. Intentá de nuevo.');
  if(commit)recordHistory(); const applied = [], skipped = [];
  for (const [role, [field, label]] of entries) {
    const color = colors[role]; if (color === null) continue;
    const toggle = role === 'brand' ? 'brand-color-enabled' : role === 'shortBrand' ? 'short-brand-color-enabled' : role === 'cuffs' ? 'cuffs-enabled' : null;
    if ($(field).value !== baseline[field] || (toggle && $(toggle).checked !== baseline[toggle])) { skipped.push(label); continue; }
    $(field).value = color.toLowerCase();
    if (toggle && !(role==='cuffs'&&(preserveStructure||inferred.includes('color:cuffs')))) $(toggle).checked = true;
    applied.push(label); rememberDocumentColor(color);
  }
  $('cuff-color').disabled = !$('cuffs-enabled').checked;
  $('color-value').textContent = $('ink-color').value.toUpperCase();
  if(commit){updateSelectedControls(); invalidateGarment(); scheduleWorkspaceSave(); recordHistory();}
  return { applied, skipped };
}
function referenceThumbnail(image,max=640){
  const node=document.createElement('canvas'),scale=Math.min(1,max/Math.max(image.width,image.height));
  node.width=Math.max(1,Math.round(image.width*scale));node.height=Math.max(1,Math.round(image.height*scale));
  node.getContext('2d').drawImage(image,0,0,node.width,node.height);return node.toDataURL('image/png');
}
function referenceStructure(){return ['raglan-enabled','cuffs-enabled','include-shorts','include-socks','apply-sleeves'].map(id=>$(id).checked).join(':');}
function referenceTransformSignature(clip,piece,side){const t=clipTransform(clip,piece,side);return JSON.stringify([t.x||0,t.y||0,t.scaleX??t.scale??1,t.scaleY??t.scale??1,t.rotation||0]);}
function buildReferenceDetailContext(){
  const outlines=true,current=state.designVariants?.[state.activeVariant],alignment=state.view==='design'&&Boolean(Object.keys(current?.clips||{}).length)&&!current?.cropError;
  const variant=state.designVariants?.[state.activeVariant],context={extended:true,outlines,alignment,elements:[],targets:[],sources:[]};
  const packet={context,variant,styles:{},layers:{},transforms:{},srcs:{},patternTargets:[],structure:referenceStructure()};referenceVariantId(variant);
  if(outlines){
    for(const id of [...fixedLayerKeys,...state.sponsors.filter(s=>s.visible).map(s=>s.id)]){
      if(state.visibleLayers[id]===false||!layerBounds(id))continue;
      const a=attachmentFor(id),side=a?.side||(id.startsWith('back-')?'back':'front'),piece=a?.piece==='shirt'?side:a?.piece||(id.startsWith('short-')?'short':side);
      if(piece==='short'&&!$('include-shorts').checked)continue;
      context.elements.push({id,side,piece,size:state.layers[id].size});packet.styles[id]=JSON.stringify(state.layerStyles[id]||null);packet.layers[id]=JSON.stringify(state.layers[id]);
      if(context.elements.length===28)break;
    }
  }
  if(alignment){
    for(const [piece,clip] of Object.entries(variant.clips)){
      if(piece==='short'&&!$('include-shorts').checked||piece==='socks'&&!$('include-socks').checked||['left','right'].includes(piece)&&!$('apply-sleeves').checked)continue;
      const image=textureImages.get(clip.src);if(!image)continue;
      const registered=clip.patternGeometry===patternGeometryVersion;
      if(!registered)context.sources.push({piece,image:referenceThumbnail(image)});packet.srcs[piece]=clip.src;
      for(const side of ['front','back'].includes(piece)?[piece]:['front','back']){
        const b=clipPatternBounds(powerClipMask(piece,side),clip),base=textureBaseGeometry(clip,image,b);
        if(b.width<=0||b.height<=0)continue;
        const id=`${piece}:${side}`;(registered?packet.patternTargets:context.targets).push({id,piece,side,width:b.width,height:b.height,baseWidth:base.width,baseHeight:base.height,baseOffsetX:base.offsetX,baseOffsetY:base.offsetY});
        packet.transforms[id]=referenceTransformSignature(clip,piece,side);
      }
    }
  }
  if(context.elements.length||context.targets.length){render(false);context.mock=referenceThumbnail(canvas,768);render();}
  return packet;
}
function validateReferenceExtras(result,context){
  if(!result.colors||Object.keys(result.colors).length!==Object.keys(referenceColorFields).length||Object.keys(referenceColorFields).some(key=>result.colors[key]!==null&&!(typeof result.colors[key]==='string'&&/^#[0-9a-f]{6}$/i.test(result.colors[key]))))throw new Error('Los colores del análisis no son válidos.');
  const allowed=['observed','inferred'],number=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
  for(const {id} of context.elements){const o=result.outlines?.[id];if(!o||typeof o.enabled!=='boolean'||!/^#[0-9a-f]{6}$/i.test(o.color)||!number(o.width,1,10)||!allowed.includes(o.certainty))throw new Error('El análisis de contornos no es válido.');}
  for(const {id} of context.targets){const t=result.textures?.[id];if(!t||!number(t.x,-1,1)||!number(t.y,-1,1)||!number(t.scale,.4,3)||!number(t.rotation,-180,180)||!allowed.includes(t.certainty))throw new Error('El ajuste de estampado no es válido.');}
}
function applyReferenceExtras(result,packet){
  const applied=[],inferred=[],skipped=[];
  if($('reference-outlines').checked)for(const {id} of packet.context.elements){
    if(!state.layers[id]||JSON.stringify(state.layerStyles[id]||null)!==packet.styles[id]||JSON.stringify(state.layers[id])!==packet.layers[id]){skipped.push(id);continue;}
    const o=result.outlines[id];state.layerStyles[id]={enabled:o.enabled,color:o.color,width:Math.round(o.width)};
    applied.push(`contorno:${id}`);if(o.certainty==='inferred')inferred.push(`contorno:${id}`);if(o.enabled)rememberDocumentColor(o.color);
  }
  const sameTextureContext=packet.variant===state.designVariants?.[state.activeVariant]&&referenceStructure()===packet.structure;
  const targets=[...packet.context.targets,...(packet.patternTargets||[])];
  if($('reference-alignment').checked&&!sameTextureContext)skipped.push(...targets.map(t=>t.id));
  if($('reference-alignment').checked&&sameTextureContext)for(const {id,piece,side} of targets){
    const clip=packet.variant.clips[piece];
    const t=clip?.patternGeometry===patternGeometryVersion?{x:0,y:0,scale:1,rotation:0,...clip.automaticViews?.[side],certainty:'measured'}:result.textures[id];
    if(!clip||clip.contentWindow?.reviewRequired&&t.certainty==='inferred'||clip.src!==packet.srcs[piece]||referenceTransformSignature(clip,piece,side)!==packet.transforms[id]){skipped.push(id);continue;}
    const placement=clipTransform(clip,piece,side,true);
    Object.assign(placement,{x:t.x,y:t.y,scale:t.scale,scaleX:t.scale,scaleY:t.scale,rotation:t.rotation});
    applied.push(`estampado:${id}`);if(t.certainty==='inferred')inferred.push(`estampado:${id}`);
  }
  return {applied,inferred,skipped};
}
function referenceInferenceLabel(key){
  const parts=key.split(':'),type=parts.shift(),id=parts.join(':');
  if(type==='color')return referenceColorFields[id]?.[1]||id;
  const labels={'front-number':'número del frente','back-number':'número de espalda','short-number':'número del short','back-name':'nombre','brand':'marca camiseta','short-brand':'marca short','crest':'escudo camiseta','short-crest':'escudo short'};
  if(type==='outline'||type==='contorno')return `contorno de ${labels[id]||'sponsor'}`;
  const [piece,side]=parts;return `${pieceLabels[piece]||piece} · ${side==='back'?'espalda':'frente'}`;
}
async function copyReferenceColors({resetOptions=false}={}) {
  if (referenceColorsBusy || !state.referenceData || !state.apiReady || editingTexture) return;
  if(resetOptions)for(const id of Object.keys(referenceComparisonGroups))$(id).checked=true;
  const sourceId = activeSketchId, reference = state.referenceData;
  const baseline = Object.fromEntries([...Object.values(referenceColorFields).map(([field]) => [field, $(field).value]), ...['cuffs-enabled', 'brand-color-enabled', 'short-brand-color-enabled'].map(field => [field, $(field).checked])]);
  const packet=buildReferenceDetailContext();
  referenceColorsBusy = true; updateGenerate();
  try {
    const response = await lab.fetch('/api/reference-colors', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ reference,context:packet.context }), signal: AbortSignal.timeout(70_000) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'No se pudieron copiar los colores.');
    if (sourceId !== activeSketchId || reference !== state.referenceData || editingTexture) {
      referenceColorMessages.set(sourceId, { reference, text: 'No se aplicaron los colores porque cambiaste de boceto, referencia o modo de edición. Volvé a pulsar Copiar colores.' }); return;
    }
    validateReferenceExtras(result,packet.context);recordHistory();
    const selection=Object.fromEntries(Object.keys(referenceComparisonGroups).map(id=>[id,$(id).checked]));
    const comparison={variantId:referenceVariantId(packet.variant),before:captureReferenceGroups(packet),after:null};
    // Analyze every group once, then keep any unchecked group at its baseline.
    // Nothing is rendered until the requested selection has been restored.
    for(const id of Object.keys(referenceComparisonGroups))$(id).checked=true;
    // Apply geometry first: inferred cuff colors must not change the mask used
    // to measure texture registration during this request.
    const extra=applyReferenceExtras(result,packet);
    const { applied, skipped } = applyReferenceColors(result.colors, baseline,{commit:false,inferred:result.inferred||[],preserveStructure:packet.context.alignment});
    comparison.after=captureReferenceGroups(packet);state.referenceComparison=comparison;
    for(const [id,enabled] of Object.entries(selection)){$(id).checked=enabled;if(!enabled)restoreReferenceGroup(comparison,id,false);}
    refreshReferenceAppearance();recordHistory();
    const inferred=[...new Set([...(result.inferred||[]).filter(key=>key.startsWith('color:')&&applied.includes(referenceInferenceLabel(key))),...extra.inferred])];
    const text = 'Ajustes listos. Desmarcá para ver el valor anterior y volvé a marcar para reaplicar sin otro análisis.'+(inferred.length?` Inferidos por lógica: ${inferred.map(referenceInferenceLabel).join(', ')}.`:'') + (skipped.length||extra.skipped.length ? ' Conservamos los ajustes manuales o las piezas cuya posición no se pudo comprobar.' : '');
    referenceColorMessages.set(sourceId, { reference, text });
  } catch (error) {
    referenceColorMessages.set(sourceId, { reference, text: error.name === 'TimeoutError' ? 'El análisis tardó demasiado. Intentá de nuevo.' : error.message, error: true });
    if(resetOptions&&sourceId===activeSketchId)notice('El diseño está listo, pero no se completó el ajuste de referencia: '+error.message,true);
  } finally { referenceColorsBusy = false; updateGenerate(); }
}
$('copy-reference-colors').addEventListener('click',()=>copyReferenceColors({resetOptions:true}));
for(const id of Object.keys(referenceComparisonGroups))$(id).addEventListener('change',toggleReferenceComparison);
function runPendingReferenceAdjustment(){
  if(!state.pendingReferenceAdjustment||generationBusy||referenceColorsBusy||!state.apiReady||!state.assetsReady||editingTexture)return;
  state.pendingReferenceAdjustment=false;void copyReferenceColors({resetOptions:true});scheduleWorkspaceSave();
}
const pieceLabels={front:'Frente',back:'Espalda',right:'Manga derecha',left:'Manga izquierda',short:'Short',socks:'Medias'};
let cropPiece=null, cropReference=null, cropRect=null, cropStart=null;
function updateReferenceRegions() {
  const list=$('reference-region-list'); list.replaceChildren();
  for(const piece of designPieceKeys){
    const row=document.createElement('div');row.className='reference-region-row';
    const label=document.createElement('span');label.textContent=pieceLabels[piece];
    const button=document.createElement('button');button.type='button';button.className='tool-button';button.disabled=!state.referenceData;
    button.textContent=state.referenceRegions[piece]?'Cambiar recorte':'Marcar zona';
    button.addEventListener('click',()=>openReferenceCrop(piece));row.append(label,button);
    if(state.referenceRegions[piece]){const clear=document.createElement('button');clear.type='button';clear.className='tool-button';clear.textContent='×';clear.setAttribute('aria-label',`Quitar recorte de ${pieceLabels[piece]}`);clear.addEventListener('click',()=>{delete state.referenceRegions[piece];updateReferenceRegions();scheduleWorkspaceSave();});row.append(clear);}
    list.append(row);
  }
}
async function openReferenceCrop(piece){
  if(!state.referenceData)return;
  cropPiece=piece;cropReference=await loadImage(piece==='__image'?$('reference-preview')?.src||state.referenceData:state.referenceData);cropRect=piece==='__image'?null:state.referenceRegions[piece]||null;cropStart=null;
  const c=$('reference-crop-canvas');c.width=cropReference.width;c.height=cropReference.height;
  $('reference-crop-title').textContent=piece==='__image'?'Recortar imagen de referencia':`Referencia · ${pieceLabels[piece]}`;
  $('reference-crop-dialog').querySelector('header p').textContent=piece==='__image'?'Arrastrá para marcar el área de la imagen que querés conservar.':'Arrastrá para marcar la pieza completa en la referencia.';
  $('save-reference-crop').disabled=!cropRect;drawReferenceCrop();$('reference-crop-dialog').showModal();
}
function drawReferenceCrop(){
  const canvas=$('reference-crop-canvas'),c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);c.drawImage(cropReference,0,0);
  if(!cropRect)return;const r=cropRect,x=r.x*canvas.width,y=r.y*canvas.height,w=r.width*canvas.width,h=r.height*canvas.height;
  c.fillStyle='#0008';c.fillRect(0,0,canvas.width,canvas.height);c.drawImage(cropReference,x,y,w,h,x,y,w,h);
  c.strokeStyle='#cfe64e';c.lineWidth=Math.max(2,canvas.width/400);c.strokeRect(x,y,w,h);
}
function referenceCropPoint(event){const b=$('reference-crop-canvas').getBoundingClientRect();return {x:Math.max(0,Math.min(1,(event.clientX-b.left)/b.width)),y:Math.max(0,Math.min(1,(event.clientY-b.top)/b.height))};}
$('reference-crop-canvas').addEventListener('pointerdown',event=>{cropStart=referenceCropPoint(event);cropRect=null;event.target.setPointerCapture(event.pointerId);});
$('reference-crop-canvas').addEventListener('pointermove',event=>{if(!cropStart)return;const p=referenceCropPoint(event);cropRect={x:Math.min(p.x,cropStart.x),y:Math.min(p.y,cropStart.y),width:Math.abs(p.x-cropStart.x),height:Math.abs(p.y-cropStart.y)};drawReferenceCrop();});
$('reference-crop-canvas').addEventListener('pointerup',()=>{cropStart=null;$('save-reference-crop').disabled=!cropRect||cropRect.width<.02||cropRect.height<.02;});
$('reference-crop-canvas').addEventListener('pointercancel',()=>{cropStart=null;});
$('close-reference-crop').addEventListener('click',()=>$('reference-crop-dialog').close());
function croppedReferenceCanvas(image,rect){
  const node=document.createElement('canvas');node.width=Math.max(1,Math.round(image.width*rect.width));node.height=Math.max(1,Math.round(image.height*rect.height));
  node.getContext('2d').drawImage(image,image.width*rect.x,image.height*rect.y,image.width*rect.width,image.height*rect.height,0,0,node.width,node.height);return node;
}
$('crop-reference-image').addEventListener('click',()=>openReferenceCrop('__image'));
$('save-reference-crop').addEventListener('click',async()=>{
  if(!cropRect||cropRect.width<.02||cropRect.height<.02)return;
  if(cropPiece==='__image'){
    const node=croppedReferenceCanvas(cropReference,cropRect);
    const src=node.toDataURL('image/png');state.referenceData=await normalizeReference(src);$('reference-preview').src=src;state.referenceRegions={};state.referenceComparison=null;state.pendingReferenceAdjustment=false;referenceColorMessages.delete(activeSketchId);
  }else state.referenceRegions[cropPiece]={...cropRect};
  updateReferenceRegions();updateGenerate();scheduleWorkspaceSave();$('reference-crop-dialog').close();
});
async function croppedReferences(reference,regions,pieces){
  const image=await loadImage(reference),output={};
  for(const piece of pieces){const r=regions[piece];if(!r)continue;
    const sw=image.width*r.width,sh=image.height*r.height,scale=Math.min(1,1024/Math.max(sw,sh));
    const c=document.createElement('canvas');c.width=Math.max(1,Math.round(sw*scale));c.height=Math.max(1,Math.round(sh*scale));
    c.getContext('2d').drawImage(image,image.width*r.x,image.height*r.y,sw,sh,0,0,c.width,c.height);output[piece]=c.toDataURL('image/jpeg',.94);
  }return output;
}
updateReferenceRegions();
async function normalizeReference(src) {
  const image = await loadImage(src), node = document.createElement('canvas'), max = 1536, scale = Math.min(1, max / Math.max(image.width, image.height));
  node.width = Math.max(1, Math.round(image.width * scale)); node.height = Math.max(1, Math.round(image.height * scale));
  const c = node.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, node.width, node.height); c.drawImage(image, 0, 0, node.width, node.height);
  return node.toDataURL('image/jpeg', .88);
}
function rectangularDesignInput(width = API_W, height = API_H, layout = null) {
  const base = document.createElement('canvas'); base.width = width; base.height = height;
  const c = base.getContext('2d'); c.fillStyle = layout?.separator || '#b8b8b8'; c.fillRect(0, 0, width, height);
  const mask = document.createElement('canvas'); mask.width = width; mask.height = height;
  if (layout) {
    // Silhouette output edits only the real contour plus bleed. Legacy
    // rectangular guides keep the complete sheet editable for compatibility.
    const mc=mask.getContext('2d');mc.clearRect(0,0,width,height);
    if([silhouetteOutputVersion,rectangularOutputVersion,fittedRectangleVersion].includes(layout.outputShape)){mc.fillStyle='#000';mc.fillRect(0,0,width,height);}
    for(const rect of layout.rectangles){
      if(layout.outputShape===fittedRectangleVersion){c.fillStyle='#b7d7ed';c.fillRect(rect.x,rect.y,rect.width,rect.height);mc.clearRect(rect.x,rect.y,rect.width,rect.height);continue;}
      c.fillStyle=layout.registration===registrationVersion?'#f6d3ba':'#fff';c.fillRect(rect.x,rect.y,rect.width,rect.height);
      if(layout.guide===silhouetteGuideVersion){
        const side=rect.piece==='back'?'back':'front',patternMask=powerClipMask(rect.piece,side);
        const angle=layout.sleeveFrames?.[rect.piece]?.[side]?.angle||0;
        let pixels=patternGuidePixels(rect,layout.bleed,{data:patternMask.data,width:patternMask.node.width,height:patternMask.node.height,scale:outputScale},angle);
        if(layout.outputShape===rectangularOutputVersion){
          rect.landmarks=visibleGuideLandmarks(pixels);
          if(layout.pipeline===twoPassVersion){
            rect.visibleRows=guideVisibleRows(pixels);
            pixels=visibleOnlyGuide(pixels,layout.separator);
            rect.visibleRows.forEach((runs,y)=>{for(let i=0;i<runs.length;i+=2)mc.clearRect(rect.x+runs[i],rect.y+y,runs[i+1]-runs[i],1);});
          }else mc.clearRect(rect.x,rect.y,rect.width,rect.height);
        }
        if(layout.outputShape===silhouetteOutputVersion){
          pixels=silhouetteGuide(pixels,layout.bleed,layout.separator);rect.shape=pixels.shape;
          if(layout.cutline)paintCutline(pixels,layout.cutline,layout.outerline);
          pixels.shape.outer.forEach((runs,y)=>{for(let i=0;i<runs.length;i+=2)mc.clearRect(rect.x+runs[i],rect.y+y,runs[i+1]-runs[i],1);});
          if(layout.cutline)for(let y=0;y<pixels.height;y++)for(let x=0;x<pixels.width;x++){
            const i=(y*pixels.width+x)*4;if(isCutline(pixels.data[i],pixels.data[i+1],pixels.data[i+2],layout.cutline)||layout.outerline&&isCutline(pixels.data[i],pixels.data[i+1],pixels.data[i+2],layout.outerline))mc.fillRect(rect.x+x,rect.y+y,1,1);
          }
        }
        const guide=document.createElement('canvas');guide.width=pixels.width;guide.height=pixels.height;
        const gc=guide.getContext('2d'),im=gc.createImageData(pixels.width,pixels.height);im.data.set(pixels.data);gc.putImageData(im,0,0);c.drawImage(guide,rect.x,rect.y);
      }else if(layout.registration===registrationVersion){
        const inner=registrationWindow(rect,layout.bleed);
        c.fillStyle='#b7d7ed';c.fillRect(inner.x,inner.y,inner.width,inner.height);
        c.strokeStyle='#5485aa';c.lineWidth=1;c.beginPath();c.moveTo(inner.x+inner.width/2,inner.y);c.lineTo(inner.x+inner.width/2,inner.y+inner.height);c.moveTo(inner.x,inner.y+inner.height/2);c.lineTo(inner.x+inner.width,inner.y+inner.height/2);c.stroke();
      }
    }
  }
  return { image: base.toDataURL('image/png'), mask: mask.toDataURL('image/png') };
}
async function clipDesignToPart(image, part, maskName = flatMaskName(part), fillColor = null) {
  // Body and sleeves sample the same rectangle in the same coordinates, so stripes align at the seam.
  const node = makeCanvas(), c = node.getContext('2d', { willReadFrequently: true });
  c.fillStyle = fillColor || $(part === 'shirt' ? 'shirt-color' : part === 'short' ? 'short-color' : 'sock-color').value;
  for (const side of ['front', 'back']) {
    if(part==='short'){
      const mask=powerClipMask(part,side);
      drawTorsoTexture(c,image,mask,mask.bounds,image,{scale:1},c.fillStyle);
      continue;
    }
    const bounds = image.patternGeometry===patternGeometryVersion ? powerClipMask(part,side).bounds : maskBounds(`${side}-${part === 'shirt' ? 'photoDesignShirt' : flatMaskName(part)}`);
    c.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    drawPieceTexture(c,image,bounds.x,bounds.y,bounds.width,bounds.height);
  }
  const output = c.getImageData(0, 0, W, H), m = maskPixels(maskName);
  for (let i = 0; i < output.data.length; i += 4) {
    if (m[i + 3] <= 24) { output.data[i + 3] = 0; continue; }
    output.data[i + 3] = m[i + 3];
  }
  c.putImageData(output, 0, 0); return loadImage(node.toDataURL('image/png'));
}
function pieceRectangle(piece) {
  return powerClipMask(piece,piece==='back'?'back':'front').bounds;
}
function generationLayout(tiles) {
  const sleeveFrames={};
  const patterns=Object.fromEntries(tiles.map(piece=>{
    if(piece==='left'||piece==='right'){
      sleeveFrames[piece]=Object.fromEntries(['front','back'].map(side=>[side,powerClipMask(piece,side).frame]));
      return [piece,sleeveFrames[piece].front.bounds];
    }
    return [piece,pieceRectangle(piece)];
  }));
  return {...compactAtlas(tiles,patterns),bleed:0,registration:registrationVersion,outputShape:fittedRectangleVersion,physicalScale:1,sleeveFrames,bodyPatterns:{front:pieceRectangle('front'),back:pieceRectangle('back')}};
}
const stripeProfileCache=new WeakMap();
function clipStripeProfile(clip){
  const image=clip&&textureImages.get(clip.src);if(!image)return null;
  let entries=stripeProfileCache.get(image);if(!entries){entries=new Map();stripeProfileCache.set(image,entries);}
  const key=JSON.stringify(clip.contentWindow||null);if(entries.has(key))return entries.get(key);
  const node=document.createElement('canvas');node.width=image.width;node.height=image.height;const c=node.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);
  const profile=stripePeriod(c.getImageData(0,0,node.width,node.height),clip.contentWindow);
  entries.set(key,profile);return profile;
}
function registerSleeveClips(variant,refit=false){
  for(const piece of ['left','right']){
    const clip=variant.clips?.[piece];if(!clip||!refit&&clip.sleeveRegistration===1)continue;
    if(!refit&&!variant.layout?.tiles.includes(piece))continue;
    const image=textureImages.get(clip.src);if(!image)continue;
    clip.sleeveRegistration=1;clip.automaticViews={};clip.views={};
    for(const side of ['front','back']){
      const frame=refit?powerClipMask(piece,side).frame:variant.layout?.sleeveFrames?.[piece]?.[side]||powerClipMask(piece,side).frame;
      const body=variant.clips[side]||variant.clips.front||variant.clips.back,bodyImage=body&&textureImages.get(body.src);
      let factor=1;
      if(bodyImage){
        const bodyPiece=variant.clips[side]?side:variant.clips.front?'front':'back',bodyBounds=(!refit&&variant.layout?.bodyPatterns?.[bodyPiece])||clipPatternBounds(powerClipMask(bodyPiece,bodyPiece),body);
        const bodyBase=textureBaseGeometry(body,bodyImage,bodyBounds),sleeveBase=textureBaseGeometry(clip,image,frame.bounds);
        factor=sharedStripeScale(clipStripeProfile(body),clipStripeProfile(clip),bodyImage.width/bodyBase.width,image.width/sleeveBase.width);
      }
      // Scaling is evidence-based for matching repeated stripes; no blanket
      // zoom is applied to a unique sleeve motif or to the torso.
      clip.automaticViews[side]={x:0,y:0,scale:factor,scaleX:factor,scaleY:factor,rotation:frame.angle};
      clip.views[side]={...clip.automaticViews[side]};
    }
  }
}
const artworkRegionsCache=new WeakMap();
const silhouetteSources=new WeakMap();
const markedTiles=new WeakMap();
function transparentSilhouetteSource(image,layout){
  let entries=silhouetteSources.get(image);if(!entries){entries=new Map();silhouetteSources.set(image,entries);}
  if(!entries.has(layout.separator)){
    const node=document.createElement('canvas');node.width=image.width;node.height=image.height;
    const c=node.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);
    const pixels=c.getImageData(0,0,node.width,node.height),outside=exteriorMask(pixels.data,node.width,node.height,layout.separator);
    for(let i=0;i<outside.length;i++)if(outside[i])pixels.data[i*4+3]=0;
    c.putImageData(pixels,0,0);entries.set(layout.separator,node);
  }
  return entries.get(layout.separator);
}
function atlasRectangles(image,layout){
  if(layout.manualRectangles)return validateManualRectangles(layout.manualRectangles,layout);
  let cached=artworkRegionsCache.get(image);if(!cached){cached=new Map();artworkRegionsCache.set(image,cached);}
  const key=JSON.stringify([layout.columns,layout.rows,layout.rectangles,layout.packing,layout.separator,layout.outputShape,layout.cutline,layout.outerline]);
  if(!cached.has(key)){
    const node=document.createElement('canvas');node.width=image.width;node.height=image.height;
    const c=node.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);
    cached.set(key,detectAtlasRectangles(c.getImageData(0,0,node.width,node.height).data,node.width,node.height,layout));
  }
  return cached.get(key);
}
function artworkRectangle(image,layout,expected){
  return atlasRectangles(image,layout).find(rect=>rect.piece===expected.piece);
}
async function referenceSeparator(reference){
  const image=await loadImage(reference),node=document.createElement('canvas');node.width=96;node.height=96;
  const c=node.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0,96,96);
  return chooseAtlasSeparator(c.getImageData(0,0,96,96).data);
}
function atlasTile(image, layout, piece) {
  const expected=layout.rectangles.find(rect=>rect.piece===piece);
  if(!expected)throw new Error('Falta una pieza del diseño generado.');
  const rect=artworkRectangle(image,layout,expected),tile=document.createElement('canvas');
  if(rect.marked){
    let cache=markedTiles.get(image);if(!cache){cache=new Map();markedTiles.set(image,cache);}
    const key=JSON.stringify([layout,piece]);if(cache.has(key))return cache.get(key);
    const source=transparentSilhouetteSource(image,layout),pixels=source.getContext('2d',{willReadFrequently:true}).getImageData(0,0,source.width,source.height);
    const warped=warpMarkedTile(pixels.data,source.width,source.height,layout,rect),normalized=normalizedPatternTile(layout,piece,{...rect,marginReviewRequired:warped.marginReviewRequired});
    tile.width=warped.width;tile.height=warped.height;tile.contentWindow=normalized.contentWindow;tile.patternAspectRevision=normalizedPatternVersion;tile.patternGeometry=patternGeometryVersion;
    const c=tile.getContext('2d'),im=c.createImageData(tile.width,tile.height);im.data.set(warped.data);c.putImageData(im,0,0);cache.set(key,tile);return tile;
  }
  const normalized=rect.manual?{width:rect.width,height:rect.height,contentWindow:{x:0,y:0,width:1,height:1,reviewRequired:true}}:[registrationVersion,'garment-window-v3'].includes(layout.registration)?normalizedPatternTile(layout,piece,rect):null;
  const sx=image.width/(layout.columns*512),sy=image.height/(layout.rows*512);
  const nativeDensity=[rectangularOutputVersion,fittedRectangleVersion].includes(layout.outputShape);
  tile.width=Math.max(1,Math.round((normalized?.width??rect.width)*(nativeDensity?sx:1)));tile.height=Math.max(1,Math.round((normalized?.height??rect.height)*(nativeDensity?sy:1)));
  if(normalized){tile.contentWindow=normalized.contentWindow;tile.patternAspectRevision=normalizedPatternVersion;}
  if(layout.registration===registrationVersion||rect.manual)tile.patternGeometry=patternGeometryVersion;
  else if(layout.registration==='garment-window-v2')tile.contentWindow=croppedContentWindow(layout,piece,rect);
  const source=layout.outputShape===silhouetteOutputVersion?transparentSilhouetteSource(image,layout):image;
  tile.getContext('2d').drawImage(source,rect.x*sx,rect.y*sy,rect.width*sx,rect.height*sy,0,0,tile.width,tile.height);
  return tile;
}
function drawPieceTexture(c,image,x,y,width,height) {
  // Fit the explicitly registered visible area; keep its generated border outside the mask.
  const base=textureBaseGeometry(image,image,{width,height}),dw=base.width,dh=base.height;
  c.save();c.beginPath();c.rect(x,y,width,height);c.clip();
  c.drawImage(image,x+(width-dw)/2+base.offsetX,y+(height-dh)/2+base.offsetY,dw,dh);c.restore();
}
async function applyShirtPieces(image, layout, raglan, sleeves, fillColor, previous = null) {
  const node = makeCanvas(), c = node.getContext('2d');
  if (previous) c.drawImage(previous,0,0,W,H);
  for (const side of ['front', 'back']) {
    const maskName = `${side}-photoDesignShirt${sleeves ? 'Sleeves' : 'Body'}${sleeves&&raglan ? 'Raglan' : ''}`;
    const mask = state.assets[maskName];
    const regions = sleeves ? ['left', 'right'] : [side];
    const center = maskBounds(`${side}-photoDesignShirt`);
    const splitX = Math.round(center.x + center.width/2);
    for (const piece of regions) {
      if (!layout.tiles.includes(piece)) continue;
      const tile = atlasTile(image, layout, piece), partMask = makeCanvas(), mc = partMask.getContext('2d', {willReadFrequently:true});
      mc.drawImage(mask, 0, 0, W, H);
      if (sleeves) {
        // Anatomical left appears on the right in the front view, and vice versa in the back view.
        const screenLeft = side === 'front' ? piece === 'right' : piece === 'left';
        mc.clearRect(screenLeft ? splitX : 0, 0, screenLeft ? W-splitX : splitX, H);
      }
      const pixels = mc.getImageData(0,0,W,H).data;
      const bounds=patternBounds(pixels,W,H),left=bounds.x,top=bounds.y,right=left+bounds.width,bottom=top+bounds.height;
      if(right<=left || bottom<=top) continue;
      const layer=makeCanvas(), lc=layer.getContext('2d');
      lc.fillStyle=fillColor; lc.fillRect(left,top,right-left,bottom-top);
      if(sleeves)drawPieceTexture(lc,tile,left,top,right-left,bottom-top);
      else drawTorsoTexture(lc,tile,{node:partMask,data:pixels,bounds},bounds,tile,{},fillColor);
      lc.globalCompositeOperation='destination-in'; lc.drawImage(partMask,0,0);
      c.globalCompositeOperation='destination-out'; c.drawImage(partMask,0,0);
      c.globalCompositeOperation='source-over'; c.drawImage(layer,0,0);
    }
  }
  return loadImage(node.toDataURL('image/png'));
}
function chooseInkColor(image) {
  const sample = makeCanvas(), c = sample.getContext('2d', { willReadFrequently: true }); c.drawImage(image, 0, 0, W, H);
  const pixels = c.getImageData(0, 0, W, H).data, points = [[278, 506]]
    .map(([x,y]) => [Math.round(x * POSITION_SCALE), Math.round(y * POSITION_SCALE)]);
  let brightness = 0, count = 0;
  for (const [x,y] of points) for (let dy = -24; dy <= 24; dy += 12) for (let dx = -24; dx <= 24; dx += 12) {
    const i = ((y + dy) * W + x + dx) * 4;
    if (pixels[i + 3] > 160) { brightness += pixels[i] * .2126 + pixels[i + 1] * .7152 + pixels[i + 2] * .0722; count++; }
  }
  return count && brightness / count < 135 ? '#ffffff' : '#171d20';
}
async function atlasImagePixels(src){
  const image=await loadImage(src),node=document.createElement('canvas');node.width=image.width;node.height=image.height;
  const c=node.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);
  return {data:c.getImageData(0,0,node.width,node.height).data,width:node.width,height:node.height};
}
function atlasPixelsUrl(pixels){
  const node=document.createElement('canvas');node.width=pixels.width;node.height=pixels.height;
  const c=node.getContext('2d'),image=c.createImageData(node.width,node.height);image.data.set(pixels.data);c.putImageData(image,0,0);return node.toDataURL('image/png');
}
async function generate() {
  if (generationBusy || referenceColorsBusy || !state.referenceData || !state.assetsReady) return;
  generationsRemaining = readGenerationBalance(); updateGenerationBalance();
  if (generationsRemaining <= 0) { updateGenerate(); return notice('No quedan generaciones disponibles.', true); }
  const pieceTargets = selectedParts();
  if (!pieceTargets.length) return notice('Elegí al menos una pieza para generar.', true);
  const targets = [...new Set(pieceTargets.map(piece => ['short','socks'].includes(piece) ? piece : 'shirt'))];
  if (pieceTargets.some(piece => piece === 'left' || piece === 'right')) $('apply-sleeves').checked = true;
  if (targets.includes('short')) $('include-shorts').checked = true;
  if (targets.includes('socks')) $('include-socks').checked = true;
  const sourceId = activeSketchId, reference = state.referenceData, notes = $('notes').value;
  const layout = generationLayout(pieceTargets);
  const referenceRegions=structuredClone(state.referenceRegions);
  const pieceNotes = Object.fromEntries(['front','back','left','right'].map(piece => [piece, $(`piece-${piece}`).value]));
  const previousParts = { ...state.generatedParts };
  const previousClips=structuredClone(state.designVariants[state.activeVariant]?.clips||{});
  const masks = Object.fromEntries(targets.map(part => [part, flatMaskName(part)]));
  const colors = { shirt: $('shirt-color').value, short: $('short-color').value, socks: $('sock-color').value };
  invalidateGarment();
  generationBusy = true; generatingSketchId = sourceId; $('generation-overlay').hidden = false; renderSketchTabs();
  $('generate').disabled = true; $('generate').innerHTML = 'Generando boceto… <span>◌</span>'; notice('La IA está aplicando el diseño. Puede tardar unos minutos.');
  try {
    layout.separator='#00ff00';
    const rectangle=rectangularDesignInput(layout.columns*512,layout.rows*512,layout);
    const pieceReferences=await croppedReferences(reference,referenceRegions,pieceTargets);
    const request={mock:rectangle.image,reference,mask:rectangle.mask,width:layout.columns*512,height:layout.rows*512,parts:targets,notes,layout,pieceNotes,pieceReferences};
    const response=await lab.fetch('/api/generate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(request)});
    const result=await response.json();if(!response.ok)throw new Error(result.error||'No se pudo generar el boceto.');
    consumeGeneration(result.remaining);
    const image = await loadImage(result.image), nextParts = { ...previousParts };
    try { atlasRectangles(image,layout);if(layout.registration===registrationVersion)for(const piece of layout.tiles)normalizedPatternTile(layout,piece,artworkRectangle(image,layout,layout.rectangles.find(r=>r.piece===piece))); }
    catch(error){
      const variants=sourceId===activeSketchId?state.designVariants:sketches.get(sourceId).designVariants;
      variants.push({parts:{...previousParts},rawImage:result.image,layout:structuredClone(layout),clips:Object.fromEntries(Object.entries(previousClips).filter(([piece])=>!layout.tiles.includes(piece))),cropError:error.message});
      if(sourceId===activeSketchId){state.activeVariant=variants.length-1;state.view='design';updateViewButtons();notice(error.message,true);showRawAiPreview();}
      else {const sketch=sketches.get(sourceId);sketch.activeVariant=variants.length-1;sketch.view='design';sketch.notice=error.message;}
      scheduleWorkspaceSave();return;
    }
    for (const part of targets) {
      if (part === 'shirt') {
        nextParts.shirt = await applyShirtPieces(image, layout, false, false, colors.shirt, previousParts.shirt);
        nextParts.shirtSleeves = await applyShirtPieces(image, layout, false, true, colors.shirt, previousParts.shirtSleeves);
        nextParts.shirtRaglan = await applyShirtPieces(image, layout, true, false, colors.shirt, previousParts.shirtRaglan || previousParts.shirt);
        nextParts.shirtSleevesRaglan = await applyShirtPieces(image, layout, true, true, colors.shirt, previousParts.shirtSleevesRaglan || previousParts.shirtSleeves);
      } else nextParts[part] = await clipDesignToPart(atlasTile(image, layout, part), part, masks[part], colors[part]);
    }
    const variants = sourceId === activeSketchId ? state.designVariants : sketches.get(sourceId).designVariants;
    const clips=previousClips;
    for(const piece of pieceTargets){const tile=atlasTile(image,layout,piece);clips[piece]={...(tile.contentWindow?{contentWindow:tile.contentWindow}:{}),...(tile.patternAspectRevision?{patternAspectRevision:tile.patternAspectRevision}:{}),...(tile.patternGeometry?{patternGeometry:tile.patternGeometry}:{}),src:tile.toDataURL('image/png'),x:0,y:0,scale:1,bleed:layout.bleed,cropRevision:atlasCropRevision};}
    const variant={parts:{...nextParts},rawImage:result.image,layout:structuredClone(layout),clips};await prepareClips(variant);registerSleeveClips(variant);variants.push(variant);
    const review=registrationReviewMessage(variant);
    const message = (review?review+' ':'')+`Diseño IA ${variants.length} aplicado a ${pieceTargets.map(piece => ({front:'frente',back:'espalda',right:'manga derecha',left:'manga izquierda',short:'short',socks:'medias'})[piece]).join(', ')}. ${Number.isFinite(result.usage?.total_tokens) ? `Tokens: ${result.usage.total_tokens.toLocaleString('es-UY')}.` : 'La API no informó tokens.'} Las versiones anteriores siguen en sus pestañas.`;
    if (sourceId === activeSketchId) {
      state.generatedParts = nextParts; state.activeVariant = variants.length - 1; state.view = 'design';
      for(const piece of pieceTargets)state.textureModes[piece]='ai';state.pendingReferenceAdjustment=true;updateViewButtons(); notice(message); showRawAiPreview();
    } else {
      const sketch = sketches.get(sourceId); sketch.generatedParts = nextParts; sketch.activeVariant = variants.length - 1;
      for(const piece of pieceTargets)(sketch.textureModes??={})[piece]='ai';sketch.view = 'design'; sketch.notice = message; sketch.pendingReferenceAdjustment=true;renderSketchTabs();
    }
  } catch (error) {
    if (sourceId === activeSketchId) notice(error.message, true);
    else { const sketch = sketches.get(sourceId); if (sketch) sketch.notice = `Error de IA: ${error.message}`; }
  }
  finally { generationBusy = false; generatingSketchId = null; $('generation-overlay').hidden = true; $('generate').innerHTML = 'Generar diseño (1 crédito) <span>✦</span>'; updateGenerate(); renderSketchTabs();runPendingReferenceAdjustment(); }
}
let highResolutionAssets=null;
async function highResolutionSnapshot(){
  if(!state.assets?.photoBody)throw new Error('Esperá a que cargue el molde.');
  await document.fonts.ready;
  if(!highResolutionAssets){
    const names=Object.keys(state.assets).filter(key=>key.startsWith('photo'));
    highResolutionAssets=Promise.all(names.map(name=>loadImage(`/assets/psd-kit/hires/${name}.png`).then(image=>[name,image])))
      .then(entries=>Object.fromEntries(entries)).catch(error=>{highResolutionAssets=null;throw error;});
  }
  const assets=await highResolutionAssets;
  try {
    exportAssets=assets;
    outputScale = 2; canvas.width = frameWidth() * 2; canvas.height = H * 2; sceneCanvas.width = W * 2; sceneCanvas.height = H * 2; ctx.setTransform(2, 0, 0, 2, 0, 0);
    render(false);
    return canvas.toDataURL('image/png');
  }finally{
    outputScale = 1; exportAssets = null; canvas.width = frameWidth(); canvas.height = H; sceneCanvas.width = W; sceneCanvas.height = H;
    ctx.setTransform(1,0,0,1,0,0);
    state.tintCache?.clear(); state.maskPixels = {}; state.photoCoverage = {}; state.garmentCache = null;
    render();
  }
}
async function exportPng() {
  const buttons = [$('export'), $('export-top')]; buttons.forEach(b => b.disabled = true);
  try {
    notice('Preparando PNG en alta resolución…');
    const image=await highResolutionSnapshot();
    const link = document.createElement('a');
    const name = String(activeSketchId);
    const bytes = Uint8Array.from(atob(image.split(',')[1]), char => char.charCodeAt(0));
    const downloadUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
    link.download = `boceto-${name}-${$('design-format').value.replace(':','x')}.png`; link.href = downloadUrl; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 60000);
    notice(`Boceto de frente y espalda descargado en ${frameWidth()*2} × ${H*2} px.`);
  } catch (error) { notice(`No se pudo exportar el PNG: ${error.message}`, true); }
  finally {
    buttons.forEach(b => b.disabled = false);
  }
}
function updateSelectedControls() {
  const key = state.selected, selected = Boolean(key && state.layers[key]&&selectedLayerKeys().length<2);
  for (const id of ['outline-enabled', 'outline-color', 'outline-width']) $(id).disabled = !selected;
  const style = selected ? state.layerStyles[key] || { enabled: false, color: '#ffffff', width: 2 } : { enabled: false, color: '#ffffff', width: 2 };
  $('outline-enabled').checked = style.enabled;
  $('outline-color').value = style.color;
  $('outline-width').value = style.width;
  $('outline-width-value').textContent = `${style.width} px`;
  $('layer-edit-help').textContent = selected ? 'Arrastrá para mover. Vértices: ampliar en proporción. Laterales: ancho o alto libre. Círculo: rotar.' : 'Elegí un elemento en el mock para editar su contorno y tamaño.';
}
function selectedLayerKeys(){
  if(!state.selected)return [];
  const keys=state.selectedElements?.includes(state.selected)?state.selectedElements:[state.selected],visible=layerKeys();
  return keys.filter(key=>visible.includes(key)&&state.layers[key]&&layerBounds(key));
}
function setElementSelection(keys){
  if(state.selected!==keys.at(-1))outlinePanelOpen=false;state.selectedElements=[...new Set(keys)].filter(key=>state.layers[key]);state.selected=state.selectedElements.at(-1)||null;
  for(const key of state.selectedElements)rememberElementOrigin(key);
  updateSelectedControls();render();updateSponsorList();
}
function selectLayer(key) {setElementSelection(key?[key]:[]);}
function marqueeRectangle(){const m=selectionMarquee;return {x:Math.min(m.x,m.endX),y:Math.min(m.y,m.endY),width:Math.abs(m.endX-m.x),height:Math.abs(m.endY-m.y)};}
function alignSelectedElements(mode){
  if(editingTexture)return;const keys=selectedLayerKeys();if(keys.length<(mode==='shirt'?1:2))return;
  recordHistory();const items=keys.map(key=>({...layerBounds(key),key,rotation:state.layers[key].rotation||0}));
  const moves=alignElements(items,mode,item=>{const attachment=rotatableLayer(item.key)?attachmentFor(item.key):null,side=attachment?.side||(item.x<W/2?'front':'back');return powerClipMask(side,side).bounds;});
  for(const {key,x,y} of moves){state.layers[key].x=x;state.layers[key].y=y;}
  preferencesDirty=true;render();recordHistory();scheduleWorkspaceSave();
}
function hitLayerInstance(x,y){
  for(const key of layerKeys().reverse())for(const b of layerInstances(key).reverse()){
    if(b.attachment?.piece==='short'&&!$('include-shorts').checked)continue;
    if(b.attachment&&!maskContains(attachmentMask(b.attachment),x,y))continue;
    const p=rotatePoint({x,y},b.x,b.y,-b.rotation*Math.PI/180);if(Math.abs(p.x-b.x)<=b.width/2+8&&Math.abs(p.y-b.y)<=b.height/2+8)return b;
  }return null;
}
function hitLayer(x,y){return hitLayerInstance(x,y)?.key||null;}
function pointerPosition(event) {
  const rect = canvas.getBoundingClientRect(), t = transform();
  return { x: ((event.clientX - rect.left) * frameWidth() / rect.width - (frameWidth() - W) / 2 - t.x) / t.scale, y: ((event.clientY - rect.top) * H / rect.height - t.y) / t.scale };
}
canvas.addEventListener('pointerdown', event => {
  const p = pointerPosition(event),instance=editingTexture?null:hitLayerInstance(p.x,p.y),key=instance?.key;
  $('resize-popover').hidden = true;
  if(!editingTexture&&!spacePressed&&event.button===0&&(event.shiftKey||multiSelectMode)&&key){
    if(!selectedLayerKeys().includes(key))adoptInstance(instance);setElementSelection(toggleElement(selectedLayerKeys(),key));event.preventDefault();return;
  }
  const rotationHandle=!spacePressed&&event.button===0?hitRotationHandle(p.x,p.y):null;
  if(rotationHandle){elementRotation={...rotationHandle,pointerId:event.pointerId};canvas.setPointerCapture(event.pointerId);event.preventDefault();return;}
  const elementHandle=!spacePressed&&event.button===0?hitElementHandle(p.x,p.y):null;
  if(elementHandle){elementResize={...elementHandle,pointerId:event.pointerId};canvas.setPointerCapture(event.pointerId);event.preventDefault();return;}
  const textureTurn=!spacePressed&&event.button===0?hitTextureRotation(p.x,p.y):null;
  if(textureTurn){textureRotation={...textureTurn,pointerId:event.pointerId};canvas.setPointerCapture(event.pointerId);event.preventDefault();return;}
  const handle=!spacePressed&&event.button===0?hitTextureHandle(p.x,p.y):null;
  if(handle){hoveredTexture=null;const placement=clipTransform(activeClips()[handle.piece],handle.piece,handle.side,true);textureResize={...handle,pointerId:event.pointerId,initialScale:placement.scale||1,initialScaleX:placement.scaleX??placement.scale??1,initialScaleY:placement.scaleY??placement.scale??1};canvas.setPointerCapture(event.pointerId);event.preventDefault();return;}
  const texture= !spacePressed && event.button===0 ? hitTexture(p.x,p.y) : null;
  if(texture){beginPieceEdit(texture.piece,texture.side);hoveredTexture=null;textureSide=texture.side;const clip=clipTransform(activeClips()[texture.piece],texture.piece,texture.side,true);$('texture-piece').value=(texture.piece==='left'||texture.piece==='right')?`${texture.piece}:${texture.side}`:texture.piece;updateTextureScale();textureDrag={pointerId:event.pointerId,piece:texture.piece,side:texture.side,x:p.x,y:p.y,initialX:clip.x||0,initialY:clip.y||0,bounds:texture.bounds};canvas.setPointerCapture(event.pointerId);event.preventDefault();return;}
  if(!editingTexture&&!spacePressed&&event.button===0&&!key){
    selectionMarquee={pointerId:event.pointerId,x:p.x,y:p.y,endX:p.x,endY:p.y,base:event.shiftKey||multiSelectMode?selectedLayerKeys():[]};
    canvas.setPointerCapture(event.pointerId);event.preventDefault();return;
  }
  if (spacePressed || event.button === 1 || !key) {
    event.preventDefault();
    if (!editingTexture && !spacePressed && event.button !== 1) selectLayer(null);
    const viewport = $('canvas-viewport');
    panGesture = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
    canvas.setPointerCapture(event.pointerId); canvas.style.cursor = 'grabbing'; return;
  }
  adoptInstance(instance);if(!selectedLayerKeys().includes(key))selectLayer(key);
  const keys=selectedLayerKeys();
  state.dragging = { pointerId: event.pointerId, key,keys,origins:Object.fromEntries(keys.map(k=>[k,{x:state.layers[k].x,y:state.layers[k].y}])),x:p.x,y:p.y, dx: p.x - state.layers[key].x, dy: p.y - state.layers[key].y };
  canvas.setPointerCapture(event.pointerId);
});
let interactionFrame=0,interactionRegion=null;
function elementPaintRegion(key){
  let region=null;
  for(const b of layerInstances(key)){
    const pad=(state.layerStyles[key]?.enabled?state.layerStyles[key].width*3*Math.max(1,b.scaleX||1,b.scaleY||1):0)+18;
    region=unionRegion(region,rotatedBounds({...b,x:b.x-b.width/2,y:b.y-b.height/2},pad));
  }
  return region;
}
function queueInteraction(region,garment=false){
  if(garment)state.garmentCache=null;
  interactionRegion=unionRegion(interactionRegion,region);
  if(!interactionFrame)interactionFrame=requestAnimationFrame(flushInteraction);
}
function flushInteraction(){
  if(interactionFrame)cancelAnimationFrame(interactionFrame);interactionFrame=0;
  const region=interactionRegion;interactionRegion=null;
  updateTextureScale();render(true,region);
}
function texturePaintRegion(piece,side){
  const b=powerClipMask(piece,side).legacyBounds;
  return unionRegion({x:Math.max(0,b.x-3),y:Math.max(0,b.y-3),width:b.width+6,height:b.height+6},null);
}
canvas.addEventListener('pointermove', event => {
  if(selectionMarquee?.pointerId===event.pointerId){const p=pointerPosition(event);selectionMarquee.endX=p.x;selectionMarquee.endY=p.y;if(!marqueeFrame)marqueeFrame=requestAnimationFrame(()=>{marqueeFrame=0;presentScene();});return;}
  if(textureRotation?.pointerId===event.pointerId){const p=pointerPosition(event),r=textureRotation,clip=clipTransform(activeClips()[r.piece],r.piece,r.side,true);clip.rotation=(r.rotation+(Math.atan2(p.y-r.cy,p.x-r.cx)-r.angle)*180/Math.PI+540)%360-180;queueInteraction(texturePaintRegion(r.piece,r.side),true);return;}
  if(elementRotation?.pointerId===event.pointerId){const p=pointerPosition(event),r=elementRotation,before=elementPaintRegion(r.key);state.layers[r.key].rotation=(r.rotation+(Math.atan2(p.y-r.cy,p.x-r.cx)-r.angle)*180/Math.PI+540)%360-180;queueInteraction(unionRegion(before,elementPaintRegion(r.key)));return;}
  if(elementResize?.pointerId===event.pointerId){const before=elementPaintRegion(elementResize.key);Object.assign(state.layers[elementResize.key],resizedElement(elementResize,pointerPosition(event)));queueInteraction(unionRegion(before,elementPaintRegion(elementResize.key)));return;}
  if(textureResize?.pointerId===event.pointerId){const p=pointerPosition(event),r=textureResize,clip=clipTransform(activeClips()[r.piece],r.piece,r.side,true);Object.assign(clip,rotatedTextureTransform(r,p));queueInteraction(texturePaintRegion(r.piece,r.side),true);return;}
  if(textureDrag?.pointerId===event.pointerId){const p=pointerPosition(event),source=activeClips()[textureDrag.piece];if(!source)return;const clip=clipTransform(source,textureDrag.piece,textureDrag.side,true);clip.x=textureDrag.initialX+(p.x-textureDrag.x)/textureDrag.bounds.width;clip.y=textureDrag.initialY+(p.y-textureDrag.y)/textureDrag.bounds.height;canvas.style.cursor='grabbing';queueInteraction(texturePaintRegion(textureDrag.piece,textureDrag.side),true);return;}
  if (panGesture?.pointerId === event.pointerId) {
    const viewport = $('canvas-viewport');
    viewport.scrollLeft = panGesture.left - event.clientX + panGesture.x;
    viewport.scrollTop = panGesture.top - event.clientY + panGesture.y;
    return;
  }
  const p = pointerPosition(event);
  if (!state.dragging) {const handle=hitElementHandle(p.x,p.y)||hitTextureHandle(p.x,p.y),hover=pieceEditing?null:hitTexture(p.x,p.y,false);const changed=hover?.piece!==hoveredTexture?.piece||hover?.side!==hoveredTexture?.side;hoveredTexture=hover;canvas.style.cursor=(hitTextureRotation(p.x,p.y)||hitRotationHandle(p.x,p.y))?'crosshair':handle?(handle.hx===0?'ns-resize':handle.hy===0?'ew-resize':handle.hx===handle.hy?'nwse-resize':'nesw-resize'):(hover||hitTexture(p.x,p.y)||hitLayer(p.x,p.y))?'grab':'default';if(changed)presentScene();return; }
  if (state.dragging.pointerId !== event.pointerId) return;
  if(state.dragging.keys?.length>1){
    const drag=state.dragging,keys=drag.keys,old=keys.reduce((r,key)=>unionRegion(r,elementPaintRegion(key)),null),origins=Object.values(drag.origins);
    const dx=Math.max(-Math.min(...origins.map(o=>o.x)),Math.min(W-Math.max(...origins.map(o=>o.x)),p.x-drag.x)),dy=Math.max(-Math.min(...origins.map(o=>o.y)),Math.min(H-Math.max(...origins.map(o=>o.y)),p.y-drag.y));
    for(const key of keys){state.layers[key].x=drag.origins[key].x+dx;state.layers[key].y=drag.origins[key].y+dy;}
    canvas.style.cursor='grabbing';queueInteraction(keys.reduce((r,key)=>unionRegion(r,elementPaintRegion(key)),old));return;
  }
  const before=elementPaintRegion(state.dragging.key);
  moveAttachedLayer(state.dragging.key,Math.max(0,Math.min(W,p.x-state.dragging.dx)),Math.max(0,Math.min(H,p.y-state.dragging.dy)));
  canvas.style.cursor = 'grabbing'; queueInteraction(unionRegion(before,elementPaintRegion(state.dragging.key)));
});
function stopDrag(event) {
  if(selectionMarquee){const m=selectionMarquee,r=marqueeRectangle(),cancelled=event?.type==='pointercancel',hits=!cancelled&&r.width+r.height>4*screenUnit()?marqueeElements(layerKeys().flatMap(layerInstances),r):[];selectionMarquee=null;if(marqueeFrame)cancelAnimationFrame(marqueeFrame);marqueeFrame=0;setElementSelection([...m.base,...hits]);}
  if(state.dragging||elementRotation||elementResize)preferencesDirty=true;if(interactionFrame)flushInteraction();const movedSponsor=state.dragging?.keys?.some(key=>key.startsWith('sponsor-'))||state.dragging?.key?.startsWith('sponsor-')||elementRotation?.key?.startsWith('sponsor-');elementRotation=null;elementResize=null;textureRotation=null;textureResize=null; textureDrag=null; state.dragging = null; panGesture = null; canvas.style.cursor = spacePressed ? 'grab' : 'default';if(movedSponsor)updateSponsorList();
}
canvas.addEventListener('pointerleave',()=>{if(hoveredTexture){hoveredTexture=null;presentScene();}});
canvas.addEventListener('lostpointercapture',stopDrag);
canvas.addEventListener('pointerup', stopDrag); canvas.addEventListener('pointercancel', stopDrag);
canvas.addEventListener('dblclick', event => {
  if(editingTexture)return;
  const p = pointerPosition(event), key = hitLayer(p.x, p.y); if (!key) return;
  selectLayer(key); if(key.startsWith('text-')||['back-name','front-number','back-number','short-number'].includes(key)){openInlineText(key);return;} const pop = $('resize-popover'), shell = $('canvas-shell').getBoundingClientRect();
  $('resize-range').value = state.layers[key].size; $('resize-value').textContent = state.layers[key].size;
  pop.style.left = `${Math.max(8, Math.min(shell.width - 220, event.clientX - shell.left + 12))}px`;
  pop.style.top = `${Math.max(8, Math.min(shell.height - 78, event.clientY - shell.top + 12))}px`;
  pop.hidden = false; $('resize-range').focus();
});
let inlineEdit=null;
function positionInlineText(){
  if(!inlineEdit)return;
  const {key}=inlineEdit,layer=state.layers[key],input=$('inline-text-editor'),rect=canvas.getBoundingClientRect(),t=transform(),baseScale=rect.width/frameWidth(),scale=baseScale*t.scale;
  const font=textFont(key);fontMeasureContext.font=font;
  // Keep the lit canvas glyph visible; this transparent, matching input supplies the caret and keyboard editing.
  const value=textFor(key)||'0',m=fontMeasureContext.measureText(value),fontSize=parseFloat(font.match(/([\d.]+)px/)[1]);
  const ascent=m.actualBoundingBoxAscent,descent=m.actualBoundingBoxDescent,baseline=(ascent-descent)/2;
  const fontCenter=((m.fontBoundingBoxAscent??ascent)-(m.fontBoundingBoxDescent??descent))/2;
  const gap=(layer.letterSpacing||0)*(layer.scaleY??1),naturalWidth=Math.max(1,m.width+(Array.from(value).length-1)*gap),sx=(layer.scaleX??1)/(layer.scaleY??1),sy=1,point=framePoint(layer.x,layer.y+baseline-fontCenter);
  input.style.font=font.replace(`${fontSize}px`,`${fontSize*scale}px`);input.style.lineHeight='1';
  input.style.left=`${point.x*baseScale}px`;input.style.top=`${point.y*baseScale}px`;input.style.letterSpacing=`${gap*scale}px`;
  input.style.width=`${Math.max(1,naturalWidth*scale)}px`;input.style.height=`${fontSize*scale}px`;
  input.style.transform=`translate(-50%,-50%) scale(${sx},${sy})`;
  input.style.caretColor=layerTextColor(key);
}
function openInlineText(key){
  const field=$(key==='back-name'?'player-name':'player-number'),input=$('inline-text-editor');
  const custom=state.texts.find(t=>t.id===key);inlineEdit={key,field,custom,original:custom?custom.value:field.value};input.value=inlineEdit.original;input.maxLength=custom?80:key==='back-name'?24:3;input.style.textTransform=custom?'none':'uppercase';input.inputMode=custom||key==='back-name'?'text':'numeric';
  positionInlineText();input.hidden=false;input.focus();input.select();render();
}
$('inline-text-editor').addEventListener('input',event=>{if(!inlineEdit)return;const input=event.target;if(!inlineEdit.custom&&inlineEdit.field.id==='player-number')input.value=input.value.replace(/\D/g,'').slice(0,3);if(inlineEdit.custom)inlineEdit.custom.value=input.value;else inlineEdit.field.value=input.value;positionInlineText();render();});
$('inline-text-editor').addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Enter'){event.preventDefault();event.target.blur();}else if(event.key==='Escape'){if(inlineEdit.custom)inlineEdit.custom.value=inlineEdit.original;else inlineEdit.field.value=inlineEdit.original;render();event.target.blur();}});
$('inline-text-editor').addEventListener('blur',()=>{inlineEdit=null;$('inline-text-editor').hidden=true;render();scheduleWorkspaceSave();});
$('resize-range').addEventListener('input', event => { if (!state.selected) return; state.layers[state.selected].size = Number(event.target.value); $('resize-value').textContent = event.target.value; render(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') $('resize-popover').hidden = true; });
document.addEventListener('pointerdown', event => { if (!event.target.closest('#resize-popover, #mock-canvas')) $('resize-popover').hidden = true; });

async function loadReferenceFile(file) {
  if (!file) return; if (file.size > 15_000_000) return notice('La referencia supera 15 MB.', true);
  try { const src = await fileData(file); state.referenceData = await normalizeReference(src); state.referenceRegions = {}; state.referenceComparison=null;state.pendingReferenceAdjustment=false;referenceColorMessages.delete(activeSketchId);updateReferenceRegions(); $('reference-title').textContent = file.name;
    let preview = $('reference-preview');
    if (!preview) { preview = document.createElement('img'); preview.id = 'reference-preview'; preview.alt = 'Vista previa de la referencia'; $('reference-drop').append(preview); }
    preview.src = src; $('reference-drop').classList.add('has-image'); updateGenerate(); scheduleWorkspaceSave(); notice('Referencia cargada. Ya podés generar el diseño.'); }
  catch (error) { notice(error.message, true); }
  finally { $('reference-file').value = ''; }
}
async function loadLogoFile(type, file) {
  if (!file) return; if (file.size > 8_000_000) return notice('El logo supera 8 MB.', true);
  try { const image = await loadImage(await fileData(file)), id = `${type}-${Date.now()}-${Math.random()}`; state.logos[type].push({ id, name: file.name, image }); $(type + '-select').add(new Option(file.name, id)); $(type + '-select').value = id; state.visibleLayers[type] = true; $(`show-${type}`).checked = true; selectLayer(type); preferencesDirty=true;rememberPreferences();notice(`${file.name} cargado como capa editable.`); }
  catch (error) { notice(error.message, true); }
  finally { $(type + '-file').value = ''; }
}
function graphicReplacementTarget(key){
  if(!state.layers[key])return null;
  if(key==='crest'||key==='short-crest'){
    const asset=state.logos.crest.find(item=>item.id===$('crest-select').value);
    return asset?.image?{key,type:'crest',assetId:asset.id,image:asset.image}:null;
  }
  const sponsor=state.sponsors.find(item=>item.id===key);
  return key?.startsWith('sponsor-')&&sponsor?.image?{key,type:'sponsor',assetId:sponsor.id,image:sponsor.image}:null;
}
function selectedReplacementTarget(){const keys=selectedLayerKeys();return keys.length===1?graphicReplacementTarget(keys[0]):null;}
async function replaceGraphic(file,target){
  if(!file||!target)return;
  if(file.size>8_000_000)return notice('La imagen supera 8 MB.',true);
  if(!['image/png','image/webp','image/jpeg'].includes(file.type))return notice('Usá una imagen PNG, WebP o JPG.',true);
  try{
    const image=await loadImage(await fileData(file)),current=graphicReplacementTarget(target.key);
    if(activeSketchId!==target.sketchId||!current||current.assetId!==target.assetId||current.image!==target.image)return notice('El boceto o la imagen cambió. Seleccionala y volvé a reemplazarla.',true);
    recordHistory();
    const keys=target.type==='crest'?['crest','short-crest']:[target.key];
    for(const key of keys)if(state.layers[key])state.layers[key].size=replacementImageSize(state.layers[key].size,current.image,image);
    if(target.type==='crest'){
      state.logos.crest=state.logos.crest.map(item=>item.id===target.assetId?{...item,name:file.name,image}:item);
      const option=[...$('crest-select').options].find(item=>item.value===target.assetId);if(option)option.textContent=file.name;
    }else state.sponsors=state.sponsors.map(item=>item.id===target.assetId?{...item,name:file.name,image}:item);
    preferencesDirty=true;selectLayer(target.key);recordHistory();scheduleWorkspaceSave();
    notice(target.type==='crest'?'Escudo reemplazado en camiseta y short.':'Sponsor reemplazado. Conserva el alto, la posición y la rotación.');
  }catch(error){notice(`No se pudo reemplazar la imagen: ${error.message}`,true);}
}
function updateSponsorList() {
  const list = $('sponsor-list'); list.replaceChildren();
  document.querySelector('label[for="sponsor-file"]').textContent = state.sponsors.length ? '+ Agregar otro sponsor' : '+ Agregar sponsor';
  if (!state.sponsors.length) { const empty = document.createElement('span'); empty.className = 'empty-list'; empty.textContent = 'Todavía no hay sponsors.'; list.append(empty); return; }
  for (const sponsor of state.sponsors) {
    const row = document.createElement('div'); row.className = `sponsor-item${state.selected === sponsor.id ? ' active' : ''}`;
    const select = document.createElement('button'); select.type = 'button'; select.className = 'select-sponsor'; select.textContent = sponsor.name; select.title = `Seleccionar ${sponsor.name}`; select.addEventListener('click', () => selectLayer(sponsor.id));
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove-sponsor'; remove.textContent = '×'; remove.title = `Quitar ${sponsor.name}`; remove.setAttribute('aria-label', `Quitar ${sponsor.name}`);
    remove.addEventListener('click', () => { state.sponsors = state.sponsors.filter(s => s.id !== sponsor.id); delete state.layers[sponsor.id]; delete state.layerStyles[sponsor.id]; selectLayer(state.selected === sponsor.id ? null : state.selected); });
    const toggle = document.createElement('label'); toggle.className = 'toggle-field';
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = sponsor.visible !== false;
    checkbox.addEventListener('change', () => { sponsor.visible = checkbox.checked; if (!sponsor.visible && state.selected === sponsor.id) selectLayer(null); else render(); });
    toggle.append(checkbox, document.createTextNode('Mostrar sponsor'));
    const target=document.createElement('select');target.setAttribute('aria-label',`Ubicación de ${sponsor.name}`);const current=attachmentFor(sponsor.id);
    for(const [piece,side,label] of placementTargets)target.add(new Option(label,`${piece}:${side}`));target.value=`${current.piece}:${['right','left'].includes(current.piece)?'front':current.side}`;
    target.addEventListener('change',()=>{const [piece,side]=target.value.split(':'),layer=state.layers[sponsor.id],b=powerClipMask(piece,side).bounds;layer.attachment={piece,side};layer.x=b.x+b.width*(piece==='short'?.25:.5);layer.y=b.y+b.height*(piece==='short'?.6:.5);selectLayer(sponsor.id);});
    const angle=document.createElement('input');angle.type='number';angle.min=-180;angle.max=180;angle.step=1;angle.value=state.layers[sponsor.id].rotation||0;angle.setAttribute('aria-label',`Rotación de ${sponsor.name}`);angle.addEventListener('input',()=>{state.layers[sponsor.id].rotation=Math.max(-180,Math.min(180,Number(angle.value)||0));render();});
    const angleLabel=document.createElement('label');angleLabel.textContent='Rotación °';angleLabel.append(angle);row.append(select, remove, toggle,target,angleLabel); list.append(row);
  }
}
async function addSponsor(file) {
  if (!file) return; if (file.size > 8_000_000) return notice('El sponsor supera 8 MB.', true);
  try { const image = await loadImage(await fileData(file)), id = `sponsor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const index = state.sponsors.length; state.sponsors.push({ id, name: file.name, image, visible: true });
    state.layers[id] = { x: Math.round(240 * POSITION_SCALE), y: Math.round((400 + index * 80) * POSITION_SCALE), size: Math.round(130 * POSITION_SCALE),attachment:{piece:'front',side:'front'} };
    selectLayer(id); notice('Sponsor agregado. Arrastralo sobre la prenda o hacé doble clic para cambiar tamaño.');
  } catch (error) { notice(error.message, true); }
  finally { $('sponsor-file').value = ''; }
}
async function loadBackground(file) {
  if (!file) return; if (file.size > 15_000_000) return notice('El fondo supera 15 MB.', true);
  try { state.customBackground = await loadImage(await fileData(file)); $('background-select').querySelector('[value="custom"]').disabled = false; $('background-select').value = 'custom'; state.backgroundMode = 'custom'; render(); notice('Fondo cargado.'); }
  catch (error) { notice(error.message, true); }
  finally { $('background-file').value = ''; }
}
const sketchInputIds = [
  ...trimInputIds,
  ...Object.keys(referenceComparisonGroups),'brand-color-enabled','brand-color','brand2-color-enabled','brand2-color','short-brand-color-enabled','short-brand-color',
  'design-format', 'include-shorts', 'include-socks','cuffs-enabled', ...colorIds,
  ...designPieceKeys.map(piece => `gen-${piece}`), 'apply-sleeves', 'notes', 'piece-front', 'piece-back', 'piece-left', 'piece-right',
  'background-select', 'highlights-blend', 'highlights-opacity', 'shadows-blend', 'shadows-opacity',
  'brand-select','brand2-select', 'crest-select', 'player-number', 'player-name', 'number-font', 'name-font', 'ink-color',
  'raglan-enabled', ...numberColorIds,
  ...fixedLayerKeys.map(key => `show-${key}`)
];
const defaultInputs = Object.fromEntries(sketchInputIds.map(id => [id, $(id).type === 'checkbox' ? $(id).checked : $(id).value]));
const sketches = new Map(); let activeSketchId = 1, nextSketchId = 2, blankSketch = null, generationBusy = false, generatingSketchId = null;
const workspaceDbName = lab.managed?lab.key('bocetos'):'delta-bocetos', workspaceStoreName = 'workspace', workspaceKey = 'current-v1', workspaceSchemaVersion = 2;
let persistenceReady = false, persistTimer = null, browserPreferences = null, preferencesDirty=false,initialParameters=null;
function rememberPreferences(){
  if(!browserPreferences||preferencesDirty){const snapshot=captureSketch();snapshot.elementModel=initialParameters||snapshot.elementModel;browserPreferences=preferenceSnapshot(snapshot,fixedLayerKeys);preferencesDirty=false;}
}
for(const type of ['input','change'])document.addEventListener(type,event=>{
  if(persistenceReady&&!editingTexture&&event.target.closest('input,select,textarea'))preferencesDirty=true;
});

const editHistories=new Map();let historyTimer=null,historyRestoring=false;
const historySourceIds=new Map();let nextHistorySource=1;
function historySourceId(source){if(!source)return null;if(!historySourceIds.has(source))historySourceIds.set(source,nextHistorySource++);return historySourceIds.get(source);}
function historyKey(snapshot){
  return JSON.stringify({...snapshot,elementModel:undefined,layers:Object.fromEntries(Object.entries(snapshot.layers).map(([key,{originalTransform,...transform}])=>[key,transform])),notice:undefined,customTextures:Object.fromEntries(Object.entries(snapshot.customTextures||{}).map(([key,item])=>[key,{...item,clip:{...item.clip,src:historySourceId(item.clip.src)}}])),referenceData:historySourceId(snapshot.referenceData),referencePreview:historySourceId(snapshot.referencePreview),customBackground:historySourceId(snapshot.customBackground),logos:Object.fromEntries(Object.entries(snapshot.logos).map(([type,logos])=>[type,logos.map(l=>[l.id,historySourceId(l.image)])])),sponsors:snapshot.sponsors.map(s=>({...s,image:historySourceId(s.image)})),generatedParts:Object.fromEntries(Object.entries(snapshot.generatedParts).map(([key,image])=>[key,historySourceId(image)])),designVariants:snapshot.designVariants.map(v=>({...v,rawImage:historySourceId(v.rawImage),parts:Object.fromEntries(Object.entries(v.parts).map(([key,image])=>[key,historySourceId(image)])),clips:Object.fromEntries(Object.entries(v.clips||{}).map(([key,clip])=>[key,{...clip,src:historySourceId(clip.src)}]))}))});
}
function recordHistory(){
  if(!persistenceReady||historyRestoring||generationBusy||editingTexture)return;
  const snapshot=captureSketch(),signature=historyKey(snapshot);let history=editHistories.get(activeSketchId);
  if(!history){history={entries:[],index:-1};editHistories.set(activeSketchId,history);}
  if(history.entries[history.index]?.signature===signature){updateCanvasActions();return;}
  history.entries.splice(history.index+1);history.entries.push({snapshot,signature});if(history.entries.length>35)history.entries.shift();history.index=history.entries.length-1;updateCanvasActions();
}
function scheduleHistoryRecord(){if(!persistenceReady||historyRestoring||trimEditor?.active)return;clearTimeout(historyTimer);historyTimer=setTimeout(recordHistory,320);}
function stepHistory(direction){
  if(editingTexture)return;clearTimeout(historyTimer);if(inlineEdit)$('inline-text-editor').blur();recordHistory();const history=editHistories.get(activeSketchId),next=history?.index+direction;
  if(!history||next<0||next>=history.entries.length)return;
  if(textStyleFrame)cancelAnimationFrame(textStyleFrame);textStyleFrame=0;pendingTextStyleKeys.clear();
  historyRestoring=true;history.index=next;restoreSketch(history.entries[next].snapshot,{preserveViewport:true});historyRestoring=false;preferencesDirty=true;updateCanvasActions();scheduleWorkspaceSave();
}
function updateCanvasActions(){
  $('action-outline').disabled=editingTexture||selectedLayerKeys().length!==1;$('action-outline').setAttribute('aria-expanded',String(outlinePanelOpen));
  const h=editHistories.get(activeSketchId),selected=Boolean(state.selected&&layerBounds(state.selected));
  $('action-undo').disabled=editingTexture||!h||h.index<=0;$('action-redo').disabled=editingTexture||!h||h.index>=h.entries.length-1;
  $('action-restore').disabled=editingTexture||!selected;$('action-duplicate').disabled=editingTexture||!selected;$('action-delete').disabled=editingTexture||!selected;$('action-add-text').disabled=editingTexture;
  const count=selectedLayerKeys().length;
  $('align-elements-vertical').disabled=editingTexture||count<2;$('align-elements-horizontal').disabled=editingTexture||count<2;$('align-to-shirt').disabled=editingTexture||!count;
  $('selection-count').textContent=count>1?`${count} seleccionados`:'';
  for(const id of ['action-duplicate','action-restore'])if(count>1)$(id).disabled=true;
  const replacement=selectedReplacementTarget(),replaceButton=$('action-replace-graphic');
  replaceButton.hidden=!replacement;replaceButton.disabled=editingTexture||graphicReplacementBusy||!replacement;
  replaceButton.setAttribute('aria-label',replacement?.type==='crest'?'Reemplazar escudo':'Reemplazar sponsor');
  replaceButton.title=replacement?.type==='crest'?'Reemplazar escudo de camiseta y short; conserva alto, posición y rotación':'Reemplazar sponsor; conserva alto, posición y rotación';
}
function positionCanvasActions(){
  $('canvas-actions').hidden=editingTexture;$('document-palette').hidden=editingTexture;
  const expanded=document.querySelector('.preview-section').classList.contains('is-expanded'),button=$('expand-design');
  if(!expanded){const r=canvas.getBoundingClientRect(),v=$('canvas-viewport').getBoundingClientRect();button.style.left=`${Math.min(r.right,v.right)-42}px`;button.style.top=`${Math.min(r.bottom,v.bottom)-42}px`;}
  else {button.style.left='';button.style.top='';}
  updateCanvasActions();updateDocumentPalette();
}
let activePaletteField='shirt-color',paletteSignature='';
function paletteTarget(){
  const selected=selectedLayerKeys();if(selected.length>1)return {keys:colorableElements(selected)};
  const key=state.selected;if(key?.startsWith('text-'))return {key};
  if(['brand','brand2','short-brand','front-number','back-number','short-number'].includes(key))return {field:`${key}-color`};
  if(key==='back-name')return {field:'ink-color'};
  return {field:$(activePaletteField)?.disabled?'shirt-color':activePaletteField};
}
function updateDocumentPalette(){
  const current=[...document.querySelectorAll('input[type=color]')].filter(el=>!['palette-add-color','selected-text-color-input'].includes(el.id)).map(el=>el.value.toLowerCase());
  if(!state.documentPalette.length)state.documentPalette=[...new Set(current)];
  const colors=[...new Set([...state.documentPalette,...current,...state.texts.map(t=>t.color)])].filter(c=>/^#[0-9a-f]{6}$/i.test(c));
  const target=paletteTarget(),signature=JSON.stringify([colors,target]);if(signature===paletteSignature)return;paletteSignature=signature;
  const container=$('document-palette-swatches');container.replaceChildren();
  for(const color of colors){const button=document.createElement('button');button.type='button';button.style.backgroundColor=color;button.title=`Usar ${color.toUpperCase()}`;button.setAttribute('aria-label',`Usar color ${color.toUpperCase()}`);button.addEventListener('click',()=>applyPaletteColor(color));container.append(button);}
}
function rememberDocumentColor(color){if(!/^#[0-9a-f]{6}$/i.test(color))return;state.documentPalette=[...new Set([...state.documentPalette,color.toLowerCase()])].slice(-40);updateDocumentPalette();scheduleWorkspaceSave();scheduleHistoryRecord();}
function applyPaletteColor(color){
  const target=paletteTarget();if(target.keys&&!target.keys.length)return;
  recordHistory();rememberDocumentColor(color);
  if(target.keys){applySelectionColor(color,true,target.keys);recordHistory();return;}
  if(target.key){const text=state.texts.find(t=>t.id===target.key);text.color=color;queueTextStylePreview(target.key,true);return;}
  const field=$(target.field);if(!field)return;field.value=color;field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));
}
$('palette-add-color').addEventListener('change',event=>{recordHistory();rememberDocumentColor(event.target.value);});
document.addEventListener('focusin',event=>{if(event.target.matches('input[type=color]')&&!['palette-add-color','selected-text-color-input'].includes(event.target.id))activePaletteField=event.target.id;});
document.addEventListener('change',event=>{if(event.target.matches('input[type=color]')&&!['palette-add-color'].includes(event.target.id))rememberDocumentColor(event.target.value);});
function rememberElementOrigin(key){
  const layer=state.layers[key];if(!layer||layer.originalTransform)return;
  const {originalTransform,...transform}=layer;layer.originalTransform=structuredClone(transform);
}
function restoreSelectedElement(){
  const key=state.selected,layer=state.layers[key];if(!layer)return;recordHistory();
  const base=state.elementModel?.layers?.[key],original=base||frontPositions[key]||layer.originalTransform;
  if(original){const saved=structuredClone(original);state.layers[key]={...saved,originalTransform:structuredClone(saved)};}
  else {const attachment=attachmentFor(key)||{piece:'front',side:'front'},bounds=attachmentMask(attachment).bounds;state.layers[key]={x:bounds.x+bounds.width/2,y:bounds.y+bounds.height*.6,size:key.startsWith('sponsor-')?150:65,attachment:layer.attachment};}
  if(!base){state.layers[key].scaleX=state.layers[key].scaleY=1;state.layers[key].rotation=0;}preferencesDirty=true;selectLayer(key);
}
function addCanvasText(){
  recordHistory();const id=`text-${Date.now()}-${Math.random().toString(36).slice(2)}`,b=powerClipMask('front','front').bounds;
  state.texts.push({id,value:'TEXTO',font:$('name-font').value,color:'#ffffff'});state.layers[id]={x:b.x+b.width/2,y:b.y+b.height*.6,size:65};state.visibleLayers[id]=true;selectLayer(id);openInlineText(id);
}
async function duplicateSelected(){
  const key=state.selected;if(!key)return;recordHistory();const custom=state.texts.find(t=>t.id===key),sponsor=state.sponsors.find(s=>s.id===key);let id;
  if(sponsor){id=`sponsor-${Date.now()}`;state.sponsors.push({...sponsor,id,name:`${sponsor.name} · copia`});}
  else if(imageForLayer(key)){id=`sponsor-${Date.now()}`;let image=imageForLayer(key);if(!image.src)image=await loadImage(image.toDataURL('image/png'));state.sponsors.push({id,name:'Copia del elemento',image,visible:true});}
  else {id=`text-${Date.now()}`;state.texts.push({id,value:textFor(key),font:custom?.font||$(key==='back-name'?'name-font':'number-font').value,color:layerTextColor(key)});}
  state.layers[id]={...structuredClone(state.layers[key]),x:state.layers[key].x+18,y:state.layers[key].y+18};delete state.layers[id].originalTransform;state.layerStyles[id]=structuredClone(state.layerStyles[key]||{});state.visibleLayers[id]=true;selectLayer(id);
}
function deleteSelected(){
  const keys=selectedLayerKeys();if(!keys.length)return;recordHistory();
  for(const key of keys){
    if(key.startsWith('sponsor-')){state.sponsors=state.sponsors.filter(s=>s.id!==key);delete state.layers[key];}
    else if(key.startsWith('text-')){state.texts=state.texts.filter(t=>t.id!==key);delete state.layers[key];}
    else {state.visibleLayers[key]=false;$(`show-${key}`).checked=false;}
  }
  preferencesDirty=true;
  selectLayer(null);
}
$('action-restore').addEventListener('click',restoreSelectedElement);
$('action-undo').addEventListener('click',()=>stepHistory(-1));$('action-redo').addEventListener('click',()=>stepHistory(1));$('action-add-text').addEventListener('click',addCanvasText);$('action-duplicate').addEventListener('click',duplicateSelected);$('action-delete').addEventListener('click',deleteSelected);
window.addEventListener('scroll',positionCanvasActions,true);window.addEventListener('resize',positionCanvasActions);
document.addEventListener('keydown',event=>{if(event.target.closest('input,textarea,select')||editingTexture||trimEditor?.active)return;if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();stepHistory(event.shiftKey?1:-1);}else if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='y'){event.preventDefault();stepHistory(1);}else if(event.key==='Delete'||event.key==='Backspace'){event.preventDefault();deleteSelected();}});
document.addEventListener('pointerdown',event=>{if(event.target.closest('#mock-canvas,input,select,textarea,button')&&!event.target.closest('#canvas-actions'))recordHistory();},true);
document.addEventListener('focusin',event=>{if(event.target.closest('input,select,textarea'))recordHistory();});
document.addEventListener('change',event=>{if(event.target.closest('input,select,textarea'))scheduleHistoryRecord();});
function imageSource(image) { return image?.src || null; }
function serializeLogo(logo) { return { id: logo.id, name: logo.name, src: imageSource(logo.image) }; }
function serializeSketch(sketch) {
  return {
    ...sketch,
    customBackground: imageSource(sketch.customBackground),
    logos: { brand: sketch.logos.brand.map(serializeLogo),brand2:(sketch.logos.brand2||[]).map(serializeLogo), crest: sketch.logos.crest.map(serializeLogo) },
    sponsors: sketch.sponsors.map(sponsor => ({ ...sponsor, src: imageSource(sponsor.image), image: undefined })),
    generatedParts: Object.fromEntries(Object.entries(sketch.generatedParts).map(([key, image]) => [key, imageSource(image)])),
    designVariants: sketch.designVariants.map(variant => ({ ...variant, parts: Object.fromEntries(Object.entries(variant.parts).map(([key, image]) => [key, imageSource(image)])) }))
  };
}
async function restoreImage(src) { return src ? loadImage(src) : null; }
async function hydrateLogo(logo) { return { id: logo.id, name: logo.name, image: await restoreImage(logo.src) }; }
async function hydrateSketch(saved) {
  const [customBackground, brand, brand2, crest, sponsors, generatedEntries, variants] = await Promise.all([
    restoreImage(saved.customBackground),
    Promise.all(saved.logos.brand.map(hydrateLogo)),
    Promise.all((saved.logos.brand2||[]).map(hydrateLogo)),
    Promise.all(saved.logos.crest.map(hydrateLogo)),
    Promise.all(saved.sponsors.map(async sponsor => ({ ...sponsor, image: await restoreImage(sponsor.src) }))),
    Promise.all(Object.entries(saved.generatedParts).map(async ([key, src]) => [key, await restoreImage(src)])),
    Promise.all(saved.designVariants.map(async variant => ({ ...variant, parts: Object.fromEntries(await Promise.all(Object.entries(variant.parts).map(async ([key, src]) => [key, await restoreImage(src)]))) })))
  ]);
  await Promise.all(variants.map(prepareClips));
  await Promise.all(Object.values(saved.customTextures||{}).map(async item=>{if(!textureImages.has(item.clip.src))textureImages.set(item.clip.src,await loadImage(item.clip.src));}));
  return { ...saved, customBackground, logos: { brand,brand2, crest }, sponsors, generatedParts: Object.fromEntries(generatedEntries), designVariants: variants };
}
function workspaceDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(workspaceDbName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(workspaceStoreName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function readWorkspace() {
  const db = await workspaceDb();
  try { return await new Promise((resolve, reject) => {
    const request = db.transaction(workspaceStoreName, 'readonly').objectStore(workspaceStoreName).get(workspaceKey);
    request.onsuccess = () => resolve(request.result || null); request.onerror = () => reject(request.error);
  }); } finally { db.close(); }
}
async function persistWorkspace() {
  if (!persistenceReady || !blankSketch) return;
  try {
    const entries = [];
    for (const [id, sketch] of sketches) entries.push([id, serializeSketch(id === activeSketchId ? captureSketch() : sketch)]);
    rememberPreferences();
    const record = {parameterSetup:false,cuffOverlayVersion:1,initialParameters:structuredClone(initialParameters),fontPreferenceVersion:1, preferences:serializeSketch(withPreferences(blankSketch,browserPreferences)), version: workspaceSchemaVersion, activeSketchId, nextSketchId, blankSketch: serializeSketch(blankSketch), sketches: entries, savedAt: Date.now() };
    const db = await workspaceDb();
    try { await new Promise((resolve, reject) => {
      const transaction=db.transaction(workspaceStoreName, 'readwrite');
      transaction.objectStore(workspaceStoreName).put(record, workspaceKey);
      transaction.oncomplete=()=>resolve(); transaction.onerror=()=>reject(transaction.error); transaction.onabort=()=>reject(transaction.error);
    }); } finally { db.close(); }
  } catch (error) { console.warn('No se pudo guardar el boceto localmente.', error); }
}
function scheduleWorkspaceSave() {
  if (!persistenceReady) return;
  clearTimeout(persistTimer); persistTimer = setTimeout(persistWorkspace, 450);
}
async function restoreWorkspace() {
  try {
    const saved = await readWorkspace();
    if (!saved?.sketches?.length) return false;
    initialParameters=structuredClone(saved.initialParameters||saved.preferences?.elementModel||initialParameters);
    if(saved.cuffOverlayVersion!==1)for(const [,sketch] of saved.sketches)sketch.inputs['cuffs-enabled']=false;
    const restored = await Promise.all(saved.sketches.map(async ([id, sketch]) => [id, withApprovedTrimModel(await hydrateSketch(sketch))]));
    if (saved.version !== workspaceSchemaVersion) {
      for (const [, sketch] of restored) for (const key of ['brand', 'crest']) sketch.layers[key].size = frontPositions[key].size;
    }
    if(saved.fontPreferenceVersion!==1)for(const [,sketch] of restored)Object.assign(sketch.inputs,preferredFontDefaults);
    sketches.clear(); for (const [id, sketch] of restored) sketches.set(Number(id), sketch);
    blankSketch = saved.blankSketch ? withApprovedTrimModel(await hydrateSketch(saved.blankSketch)) : blankSketch;
    if (saved.version !== workspaceSchemaVersion) for (const key of ['brand', 'crest']) blankSketch.layers[key].size = frontPositions[key].size;
    activeSketchId = sketches.has(Number(saved.activeSketchId)) ? Number(saved.activeSketchId) : Number(restored[0][0]);
    nextSketchId = nextAvailableSketchId(sketches.keys());
    browserPreferences=preferenceSnapshot(saved.preferences ? withApprovedTrimModel(await hydrateSketch(saved.preferences)) : sketches.get(activeSketchId),fixedLayerKeys);
    if(saved.fontPreferenceVersion!==1)Object.assign(browserPreferences.inputs,preferredFontDefaults);
    restoreSketch(sketches.get(activeSketchId)); renderSketchTabs();
    notice('Bocetos restaurados desde este navegador.');
    return true;
  } catch (error) { console.warn('No se pudo restaurar el espacio de trabajo local.', error); return false; }
}
function captureSketch() {
  const inputs = Object.fromEntries(sketchInputIds.map(id => [id, $(id).type === 'checkbox' ? $(id).checked : $(id).value]));
  return {
    mockRevision: 2, positionRevision,elementModel:structuredClone(state.elementModel),trimEdits:structuredClone(state.trimEdits||{}),trimModelRevision:state.trimModelRevision,
    inputs, customTextures:structuredClone(state.customTextures),textureModes:{...state.textureModes},referenceData: state.referenceData, referenceRegions: structuredClone(state.referenceRegions), referenceTitle: $('reference-title').textContent,
    referencePreview: $('reference-preview')?.src || null,pendingPrintGeneration:state.pendingPrintGeneration||null,
    backgroundMode: state.backgroundMode, customBackground: state.customBackground,
    referenceComparison:structuredClone(state.referenceComparison||null),pendingReferenceAdjustment:Boolean(state.pendingReferenceAdjustment),documentPalette:[...state.documentPalette],texts:structuredClone(state.texts),logos: { brand: [...state.logos.brand],brand2:[...state.logos.brand2], crest: [...state.logos.crest] }, sponsors: state.sponsors.map(s => ({ ...s })),
    generatedParts: { ...state.generatedParts }, designVariants: state.designVariants.map(variant => ({ ...variant, clips: structuredClone(variant.clips || {}), parts: { ...variant.parts } })), activeVariant: state.activeVariant,
    view: state.view, layers: structuredClone(state.layers),
    visibleLayers: { ...state.visibleLayers }, layerStyles: structuredClone(state.layerStyles),
    notice: $('notice').textContent
  };
}
function restoreSketch(sketch,{preserveViewport=false}={}) {
  sketch=withApprovedTrimModel(sketch);state.trimModelRevision=sketch.trimModelRevision;
  const viewport=$('canvas-viewport'),savedViewport=preserveViewport?{zoom:editorZoom,left:viewport.scrollLeft,top:viewport.scrollTop}:null;
  inlineEdit=null;$('inline-text-editor').hidden=true;
  if ($('raw-ai-dialog').open) $('raw-ai-dialog').close();
  if ($('reference-crop-dialog').open) $('reference-crop-dialog').close();
  state.customTextures=structuredClone(sketch.customTextures||{});state.textureModes={...(sketch.textureModes||{})};state.documentPalette=[...(sketch.documentPalette||[])];state.referenceComparison=structuredClone(sketch.referenceComparison||null);state.pendingReferenceAdjustment=Boolean(sketch.pendingReferenceAdjustment);state.pendingPrintGeneration=sketch.pendingPrintGeneration||null;
  state.texts=structuredClone(sketch.texts||[]);state.trimEdits=structuredClone(sketch.trimEdits||{});
  state.referenceData = sketch.referenceData; state.referenceRegions = structuredClone(sketch.referenceRegions || {}); updateReferenceRegions(); state.backgroundMode = sketch.backgroundMode;
  state.customBackground = sketch.customBackground;
  state.logos = { brand: [...sketch.logos.brand],brand2:[...(sketch.logos.brand2||[])], crest: [...sketch.logos.crest] };state.elementModel=structuredClone(initialParameters||sketch.elementModel||null);
  state.sponsors = sketch.sponsors.map(s => ({ ...s })); state.generatedParts = { ...sketch.generatedParts };
  state.designVariants = sketch.designVariants.map(variant => ({ ...variant, clips: structuredClone(variant.clips || {}), parts: { ...variant.parts } })); state.activeVariant = sketch.activeVariant;
  state.view = sketch.view; state.layers = { ...structuredClone(frontPositions), ...structuredClone(sketch.layers) };
  if (sketch.mockRevision !== 2) {
    for (const key of fixedLayerKeys) state.layers[key] = { ...frontPositions[key] };
    // Old saved versions stay available but are not applied with the new PSD masks.
    state.view = 'base';
  }
  if (sketch.positionRevision !== positionRevision) {
    for (const key of fixedLayerKeys) state.layers[key] = { ...frontPositions[key] };
  }
  const migratedInputs = { ...defaultInputs, ...sketch.inputs,'design-format':'3:4' };
  for(const suffix of ['color','color-enabled'])if(!Object.hasOwn(sketch.inputs,`short-brand-${suffix}`))migratedInputs[`short-brand-${suffix}`]=migratedInputs[`brand-${suffix}`];
  for(const id of ['name-font','number-font'])if(!footballFonts[migratedInputs[id]])migratedInputs[id]=preferredFontDefaults[id];
  if (Object.hasOwn(sketch.inputs, 'gen-shirt') && !Object.hasOwn(sketch.inputs, 'gen-front')) {
    for (const piece of ['front','back','left','right']) migratedInputs[`gen-${piece}`] = Boolean(sketch.inputs['gen-shirt']);
  }
  for (const id of numberColorIds) if (!Object.hasOwn(sketch.inputs, id)) migratedInputs[id] = sketch.inputs['ink-color'] || defaultInputs[id];
  state.visibleLayers = { ...Object.fromEntries(fixedLayerKeys.map(key => [key, true])), ...sketch.visibleLayers }; state.layerStyles = structuredClone(sketch.layerStyles);
  state.selected = null;state.selectedElements=[];selectionMarquee=null; state.dragging = null; elementRotation=null;elementResize=null;textureDrag=null; editingTexture=false; pieceEditing=false; pieceEditSnapshot=null; textureEditSnapshot=null; updateTextureMode(); state.garmentCache = null;
  for (const type of ['brand','brand2', 'crest']) {
    $(type + '-select').replaceChildren(new Option(type === 'crest' ? 'Sin escudo' : 'Sin logo', ''));
    for (const logo of state.logos[type]) $(type + '-select').add(new Option(logo.name, logo.id));
  }
  for (const [id, value] of Object.entries(migratedInputs)) {
    if (!$(id)) continue;
    if ($(id).type === 'checkbox') $(id).checked = value;
    else $(id).value = value;
  }
  $('background-select').querySelector('[value="custom"]').disabled = !state.customBackground;
  $('reference-title').textContent = sketch.referenceTitle;
  $('reference-preview')?.remove(); $('reference-drop').classList.remove('has-image');
  if (sketch.referencePreview) { const preview = document.createElement('img'); preview.id = 'reference-preview'; preview.alt = 'Vista previa de la referencia'; preview.src = sketch.referencePreview; $('reference-drop').append(preview); $('reference-drop').classList.add('has-image'); }
  $('color-value').textContent = $('ink-color').value.toUpperCase();
  for (const layer of ['highlights', 'shadows']) $(`${layer}-opacity-value`).textContent = `${$(`${layer}-opacity`).value}%`;
  $('cuff-color').disabled=!$('cuffs-enabled').checked;
  updateTrimControls();
  updateFrame(!preserveViewport); updateSelectedControls(); updateSponsorList(); updateViewButtons(); updateGenerate();
  notice(state.view==='design'&&state.designVariants[state.activeVariant]?.cropError||registrationReviewMessage(state.designVariants[state.activeVariant])||sketch.notice,Boolean(state.view==='design'&&state.designVariants[state.activeVariant]?.cropError));
  if(savedViewport){const restoreView=()=>{editorZoom=savedViewport.zoom;viewport.scrollLeft=savedViewport.left;viewport.scrollTop=savedViewport.top;positionCanvasActions();positionSelectedTextColor();};restoreView();requestAnimationFrame(restoreView);}
}
function tabTitle(id) {
  const sketch = id === activeSketchId ? captureSketch() : sketches.get(id);
  return sketch?.inputs['team-name']?.trim() || `Boceto ${id}`;
}
function renderSketchTabs() {
  const list = $('sketch-tab-list'); list.replaceChildren();
  for (const id of sketches.keys()) {
    const tab = document.createElement('div'); tab.className = 'sketch-tab'; tab.setAttribute('role', 'tab'); tab.setAttribute('aria-selected', id === activeSketchId);
    const title = document.createElement('button'); title.className = 'sketch-tab-title'; title.type = 'button'; title.textContent = `${id === generatingSketchId ? '◌ ' : ''}${tabTitle(id)}`; title.title = tabTitle(id);
    title.addEventListener('click', () => switchSketch(id)); tab.append(title);
    if (sketches.size > 1) { const close = document.createElement('button'); close.className = 'sketch-tab-close'; close.type = 'button'; close.textContent = '×'; close.title = `Cerrar ${tabTitle(id)}`; close.setAttribute('aria-label', close.title); close.addEventListener('click', () => closeSketch(id)); tab.append(close); }
    list.append(tab);
  }
}
function switchSketch(id) {
  if (id === activeSketchId) return;
  recordHistory();
  rememberPreferences();sketches.set(activeSketchId, captureSketch()); activeSketchId = id;
  restoreSketch(sketches.get(id)); $('generation-overlay').hidden = id !== generatingSketchId; renderSketchTabs();runPendingReferenceAdjustment();
}
function newSketch() {
  if (!blankSketch) return;
  recordHistory();
  const current=captureSketch();sketches.set(activeSketchId,current);rememberPreferences();
  const id=nextAvailableSketchId(sketches.keys()),fresh=initialParameterSketch({...blankSketch,mockRevision:2,positionRevision},initialParameters,{logos:browserPreferences?.logos,sponsors:browserPreferences?.sponsors});editHistories.delete(id);
  sketches.set(id, fresh); activeSketchId = id; restoreSketch(fresh);nextSketchId=nextAvailableSketchId(sketches.keys()); $('generation-overlay').hidden = true; renderSketchTabs();
  scheduleWorkspaceSave();notice('Nuevo boceto creado con la configuración base guardada.');
}
let confirmationResolver=null;
function confirmEditorAction(title,message,acceptLabel){
  const dialog=$('editor-confirm-dialog');if(dialog.open)return Promise.resolve(false);
  $('editor-confirm-title').textContent=title;$('editor-confirm-message').textContent=message;$('editor-confirm-accept').textContent=acceptLabel;
  dialog.returnValue='cancel';return new Promise(resolve=>{confirmationResolver=resolve;dialog.showModal();$('editor-confirm-cancel').focus();});
}
$('editor-confirm-cancel').addEventListener('click',()=>$('editor-confirm-dialog').close('cancel'));
$('editor-confirm-accept').addEventListener('click',()=>$('editor-confirm-dialog').close('accept'));
$('editor-confirm-dialog').addEventListener('close',()=>{const resolve=confirmationResolver;confirmationResolver=null;resolve?.($('editor-confirm-dialog').returnValue==='accept');});
async function closeSketch(id) {
  if (id === generatingSketchId) return notice('Este boceto está generando. Podés cerrarlo cuando termine.');
  if (sketches.size < 2) return;
  if(!await confirmEditorAction(`Cerrar ${tabTitle(id)}`, 'Los cambios de esta pestaña se perderán. Los otros bocetos seguirán abiertos.', 'Cerrar boceto'))return;
  if(!sketches.has(id)||sketches.size<2||id===generatingSketchId)return;
  rememberPreferences();sketches.set(activeSketchId,captureSketch());
  if (id === activeSketchId) { const next = [...sketches.keys()].find(key => key !== id); activeSketchId = next; restoreSketch(sketches.get(next)); $('generation-overlay').hidden = next !== generatingSketchId; }
  sketches.delete(id);editHistories.delete(id);nextSketchId=nextAvailableSketchId(sketches.keys());renderSketchTabs();runPendingReferenceAdjustment();scheduleWorkspaceSave();
  $('sketch-tab-list').querySelector('[aria-selected="true"] .sketch-tab-title')?.focus();
}
$('new-sketch').addEventListener('click', newSketch);
$('raglan-enabled').addEventListener('change', ()=>{updateTrimControls();invalidateGarment();});
let trimRenderTimer;
for(const id of trimInputIds){
  $(id).addEventListener('input',()=>{updateTrimControls();clearTimeout(trimRenderTimer);trimRenderTimer=setTimeout(invalidateGarment,100);});
  $(id).addEventListener('change',()=>{clearTimeout(trimRenderTimer);updateTrimControls();invalidateGarment();});
}
updateTrimControls();
for (const id of ['include-shorts', 'include-socks']) $(id).addEventListener('change', changeGarmentStructure);
for (const piece of designPieceKeys) $(`gen-${piece}`).addEventListener('change', updateGenerate);
let colorRenderTimer;
for (const id of colorIds) {
  $(id).addEventListener('input', () => { clearTimeout(colorRenderTimer); colorRenderTimer = setTimeout(invalidateGarment, 240); });
  $(id).addEventListener('change', () => { clearTimeout(colorRenderTimer); invalidateGarment(); });
}
$('apply-sleeves').addEventListener('change', invalidateGarment);
$('cuffs-enabled').addEventListener('change',()=>{$('cuff-color').disabled=!$('cuffs-enabled').checked;invalidateGarment();});
for (const layer of ['highlights', 'shadows']) {
  $(`${layer}-blend`).addEventListener('change', invalidateGarment);
  $(`${layer}-opacity`).addEventListener('input', event => {
    $(`${layer}-opacity-value`).textContent = `${event.target.value}%`;
    invalidateGarment();
  });
}
$('reset-lights').addEventListener('click', () => {
  $('highlights-blend').value = 'screen'; $('highlights-opacity').value = 100;
  $('shadows-blend').value = 'linear-burn'; $('shadows-opacity').value = 100;
  $('highlights-opacity-value').textContent = '100%'; $('shadows-opacity-value').textContent = '100%';
  preferencesDirty=true;invalidateGarment();
});
$('background-select').addEventListener('change', event => { state.backgroundMode = event.target.value; render(); });
$('background-file').addEventListener('change', event => loadBackground(event.target.files[0]));
$('reference-file').addEventListener('change', event => loadReferenceFile(event.target.files[0]));
for (const type of ['brand','brand2', 'crest']) { $(type + '-file').addEventListener('change', event => loadLogoFile(type, event.target.files[0])); $(type + '-select').addEventListener('change', render); }
$('sponsor-file').addEventListener('change', event => addSponsor(event.target.files[0]));
for (const key of fixedLayerKeys) $(`show-${key}`).addEventListener('change', event => {
  state.visibleLayers[key] = event.target.checked;
  if (!event.target.checked && state.selected === key) selectLayer(null); else render();
});
for (const id of ['player-number', 'player-name']) $(id).addEventListener('input', render);
for(const key of ['brand','brand2','short-brand']){
  $(`${key}-color-enabled`).addEventListener('change',()=>queueTextStylePreview(key,true));
  for(const type of ['input','change'])$(`${key}-color`).addEventListener(type,()=>{$(`${key}-color-enabled`).checked=true;queueTextStylePreview(key,type==='change');});
}
for(const id of ['ink-color',...numberColorIds]){
  const key=id==='ink-color'?'back-name':id.replace('-color','');
  $(id).addEventListener('input',()=>{if(id==='ink-color')$('color-value').textContent=$(id).value.toUpperCase();queueTextStylePreview(key);});
  $(id).addEventListener('change',()=>queueTextStylePreview(key,true));
}
for (const id of ['name-font', 'number-font']) $(id).addEventListener('change', ()=>{fontHeightCache.clear();trackedFontCache.clear();render();});
$('selected-text-font').addEventListener('change',event=>{
  const key=state.selected;if(!isTextLayer(key)||selectedLayerKeys().length!==1)return;recordHistory();const custom=state.texts.find(t=>t.id===key);if(custom)custom.font=event.target.value;else $(key==='back-name'?'name-font':'number-font').value=event.target.value;fontHeightCache.clear();trackedFontCache.clear();preferencesDirty=true;render();recordHistory();scheduleWorkspaceSave();
});
$('action-outline').addEventListener('click',()=>{outlinePanelOpen=!outlinePanelOpen;updateCanvasActions();positionSelectedTextColor();});
function updateOutlinePreview(commit=false){
  if(!state.selected)return;
  state.layerStyles[state.selected]={enabled:$('outline-enabled').checked,color:$('outline-color').value,width:Number($('outline-width').value)};
  $('outline-width-value').textContent=`${$('outline-width').value} px`;queueTextStylePreview(state.selected,commit);
}
for(const id of ['outline-enabled','outline-color','outline-width']){
  $(id).addEventListener('input',()=>updateOutlinePreview());
  $(id).addEventListener('change',()=>updateOutlinePreview(true));
}
$('show-base').addEventListener('click', () => { state.view = 'base'; updateViewButtons(); });
$('show-design').addEventListener('click',()=>{if(hasDesign())showVariant(0);else {state.view='design';invalidateGarment();updateViewButtons();}});

$('generate').addEventListener('click', generate); $('export').addEventListener('click', exportPng); $('export-top').addEventListener('click', exportPng);
$('reference-drop').addEventListener('dragover', event => event.preventDefault());
$('reference-drop').addEventListener('drop', event => { event.preventDefault(); loadReferenceFile(event.dataTransfer.files[0]); });
for (const id of sketchInputIds) $(id).addEventListener('change', scheduleWorkspaceSave);
window.addEventListener('pagehide', persistWorkspace);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){clearTimeout(persistTimer);persistWorkspace();}});
$('text-letter-spacing').addEventListener('input',event=>{
  if(editingTexture||selectedLayerKeys().length!==1||!isTextLayer(state.selected)||event.target.value==='')return;
  const value=Number(event.target.value);if(!Number.isFinite(value)||value < -20||value > 100)return;
  state.layers[state.selected].letterSpacing=value;preferencesDirty=true;queueTextStylePreview(state.selected);
});
$('text-letter-spacing').addEventListener('change',()=>{flushTextStylePreview();recordHistory();});
$('align-elements-vertical').addEventListener('click',()=>alignSelectedElements('vertical'));
$('align-elements-horizontal').addEventListener('click',()=>alignSelectedElements('horizontal'));
$('align-to-shirt').addEventListener('click',()=>alignSelectedElements('shirt'));
$('action-replace-graphic').addEventListener('click',()=>{const target=selectedReplacementTarget();if(!target||graphicReplacementBusy||editingTexture)return;pendingGraphicReplacement={...target,sketchId:activeSketchId};$('replace-graphic-file').value='';$('replace-graphic-file').click();});
$('replace-graphic-file').addEventListener('change',async event=>{const target=pendingGraphicReplacement,file=event.target.files[0];pendingGraphicReplacement=null;if(!file||!target)return;graphicReplacementBusy=true;updateCanvasActions();try{await replaceGraphic(file,target);}finally{graphicReplacementBusy=false;event.target.value='';updateCanvasActions();}});
$('replace-graphic-file').addEventListener('cancel',()=>{pendingGraphicReplacement=null;$('replace-graphic-file').value='';});
function setPanelCollapsed(side,collapsed){
  const panel=$(`${side}-panel`),button=$(`toggle-${side}-panel`),label=side==='left'?'Nuevo boceto':'Composición';
  panel.classList.toggle('is-collapsed',collapsed);document.querySelector('.workspace').classList.toggle(`${side}-collapsed`,collapsed);
  button.setAttribute('aria-expanded',String(!collapsed));button.setAttribute('aria-label',`${collapsed?'Mostrar':'Ocultar'} ${label}`);button.title=`${collapsed?'Mostrar':'Ocultar'} ${label}`;button.textContent=(side==='left')!==collapsed?'‹':'›';
  try{localStorage.setItem(lab.key(`sportex-${side}-panel-collapsed`),String(collapsed));}catch{}
  requestAnimationFrame(()=>updateEditorZoom(editorZoom));
}
for(const side of ['left','right']){
  $(`toggle-${side}-panel`).addEventListener('click',()=>setPanelCollapsed(side,!$(`${side}-panel`).classList.contains('is-collapsed')));
  try{if(localStorage.getItem(lab.key(`sportex-${side}-panel-collapsed`))==='true')setPanelCollapsed(side,true);}catch{}
}
trimEditor=installTrimEditor({
  getBatches:()=>buildTrimBatches(trimSettingsForMold(readTrimSettings(id=>$(id).type==='checkbox'?$(id).checked:$(id).value),$('raglan-enabled').checked),visibleParts(),trimMask),
  getEdits:()=>state.trimEdits,setEdits:edits=>{state.trimEdits=edits;},
  onStart:()=>{clearTimeout(historyTimer);recordHistory();state.selected=null;updateSelectedControls();},
  preview:()=>{state.garmentCache=null;render(false);return canvas;},
  onFinish:()=>{preferencesDirty=true;recordHistory();scheduleWorkspaceSave();}
});
$('edit-trims').addEventListener('click',()=>{if(!state.assetsReady)return notice('Esperá a que cargue el molde.',true);if(!trimEditor.open())notice('Activá al menos un vivo para editarlo.');});
$('save-trim-model').addEventListener('click',()=>{
  if(!state.assetsReady)return notice('Esperá a que cargue el molde.',true);
  const sketch=captureSketch(),model={schemaVersion:1,inputs:Object.fromEntries(trimInputIds.map(id=>[id,sketch.inputs[id]])),trimEdits:structuredClone({linkedVersion:3,...Object.fromEntries(Object.entries(state.trimEdits||{}).filter(([key])=>key.startsWith('individual:')))})};
  const link=$('trim-model-download');link.href='data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(model,null,2));link.hidden=false;link.click();
  notice('Modelo de vivos preparado en JSON. Descargalo y compartilo para usar estos ajustes como base.');
});
async function init() {
  try {
    await labFontsReady;
    await Promise.all(Object.values(footballFonts).map(font => document.fonts.load(`${font.weight} 40px ${font.family}`, 'NOMBRE ÁÑ 0123456789')));
    fontHeightCache.clear();trackedFontCache.clear();

    const names = ['photoBody','photoBodyRaglan','photoSleeveLeft','photoSleeveRight','photoSleeveLeftRaglan','photoSleeveRightRaglan','photoCollar','photoCuffs','photoBackNeck','photoShort','photoSocks','photoShoes','photoBurnShirt','photoScreenShirt','photoBurnShirtRaglan','photoScreenShirtRaglan','photoBurnShort','photoScreenShort','photoBurnSocks','photoScreenSocks','photoDesignShirt','photoDesignShirtBody','photoDesignShirtSleeves','photoDesignShirtBodyRaglan','photoDesignShirtSleevesRaglan'];
    for (const side of ['front', 'back']) for (const key of ['photoDesignShirt','photoDesignShirtBody','photoDesignShirtBodyRaglan','photoDesignShirtSleeves','photoDesignShirtSleevesRaglan','photoShort','photoSocks']) names.push(`${side}-${key}`);
    const [background, ...loaded] = await Promise.all([loadImage('/assets/fondo-delta.png'), ...names.map(name => loadImage(`/assets/psd-kit/${name}.png?v=raglan-lights-5`))]);
    state.assets = { background, ...Object.fromEntries(names.map((name, i) => [name, loaded[i]])) };
    updateSelectedControls();
    state.assetsReady = true; invalidateGarment(); updateGenerate();
    initialParameters=await fetch('/initial-parameters.json').then(response=>{if(!response.ok)throw new Error('No se pudo cargar la configuración inicial.');return response.json();});
    if(lab.managed){
      const settings=lab.company.settings||{};
      if(settings.initialParameters?.kind==='sportex-initial-parameters')initialParameters=structuredClone(settings.initialParameters);
      initialParameters.inputs={...initialParameters.inputs,...(settings.numberFont?{'number-font':settings.numberFont}:{}),...(settings.nameFont?{'name-font':settings.nameFont}:{})};
      for(const asset of lab.company.assets){
        if(['brand','brand2'].includes(asset.kind)){
          const image=await loadImage(`/api/lab/assets/${asset.id}`);state.logos[asset.kind].push({id:asset.id,name:asset.name,image});
          initialParameters.logoFiles={...initialParameters.logoFiles,[asset.kind]:asset.name};
        }else if(asset.kind==='background'){state.customBackground=await loadImage(`/api/lab/assets/${asset.id}`);state.backgroundMode='custom';initialParameters.backgroundMode='custom';}
      }
      lab.install();
    }
    blankSketch = initialParameterSketch(withApprovedTrimModel(captureSketch()),initialParameters);restoreSketch(blankSketch);sketches.set(activeSketchId, blankSketch);
    if (!await restoreWorkspace()) renderSketchTabs();
    persistenceReady = true;scheduleWorkspaceSave();
    notice(state.view==='design'&&(state.designVariants[state.activeVariant]?.cropError||registrationReviewMessage(state.designVariants[state.activeVariant]))||'',Boolean(state.view==='design'&&state.designVariants[state.activeVariant]?.cropError));recordHistory();
  } catch (error) { console.error('Error al iniciar el editor:',error); notice('No se pudieron cargar los moldes del editor.', true); }
  try { const response = await fetch('/api/status'), data = await response.json(); state.apiReady = Boolean(data.ready); if (!state.apiReady) notice(lab.managed?'La conexión compartida de OpenAI está pendiente de configurar.':'El editor está listo. Configurá OPENAI_API_KEY en el servidor para generar con IA.'); updateGenerate();runPendingReferenceAdjustment(); }
  catch { notice('No se pudo consultar el estado de la IA.', true); }
}
init();
