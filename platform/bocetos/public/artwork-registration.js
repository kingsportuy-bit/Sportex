import {patternGeometryVersion} from './pattern-geometry.js';
// Bleed is total added size: 20% means 10% of the garment size per edge.
export const generationBleed = .20;
export const registrationVersion = 'garment-window-v4';
export const normalizedPatternVersion = 1;
export const silhouetteGuideVersion = 'pattern-silhouette-v1';
export const rectangularOutputVersion = 'rectangle-mask-v1';
export const fittedRectangleVersion = 'pattern-rectangles-v1';

// Landmarks refer to the REAL visible contour, not to the outer swatch. They
// are local pixel coordinates; the prompt translates them to atlas pixels.
export function visibleGuideLandmarks(pixels){
  const rows=[];
  for(const fraction of [.18,.35,.5,.7,.88]){
    const y=Math.min(pixels.height-1,Math.floor(pixels.height*fraction)),spans=[];
    let open=false;
    for(let x=0;x<pixels.width;x++){
      const p=(y*pixels.width+x)*4,inside=pixels.data[p]===183&&pixels.data[p+1]===215&&pixels.data[p+2]===237;
      if(inside&&!open){spans.push(x);open=true;}
      if(open&&(!inside||x===pixels.width-1)){spans.push(inside?x+1:x);open=false;}
    }
    if(spans.length)rows.push({y,spans});
  }
  return rows;
}

// The same real mask and cuff frame used when rendering the garment. Hidden
// curved sides are peach too: a bounding rectangle alone is not the visible area.
export function patternGuidePixels(rect,bleed,mask,angle=0){
  const {width,height,pattern:p}=rect;
  const data=new Uint8ClampedArray(width*height*4),a=angle*Math.PI/180,cos=Math.cos(a),sin=Math.sin(a);
  const cx=p.x+p.width/2,cy=p.y+p.height/2,scale=mask.scale||1;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const u=((x+.5)/width-.5)*p.width*(1+bleed),v=((y+.5)/height-.5)*p.height*(1+bleed);
    const mx=Math.floor((cx+u*cos-v*sin)*scale),my=Math.floor((cy+u*sin+v*cos)*scale);
    const visible=Math.abs(u)<=p.width/2&&Math.abs(v)<=p.height/2&&mx>=0&&my>=0&&mx<mask.width&&my<mask.height&&mask.data[(my*mask.width+mx)*4+3]>=128;
    data.set(visible?[183,215,237,255]:[246,211,186,255],(y*width+x)*4);
  }
  return {data,width,height};
}
export function registrationWindow(rect, bleed = generationBleed) {
  const width = rect.width / (1 + bleed), height = rect.height / (1 + bleed);
  return {x:rect.x+(rect.width-width)/2,y:rect.y+(rect.height-height)/2,width,height};
}
export function registrationInstructions(layout) {
  const bleed=layout.bleed, edge=bleed/2;
  const windows=layout.rectangles.map(rect=>{
    const w=registrationWindow(rect,bleed), f=n=>Number(n.toFixed(2));
    const pattern=rect.pattern?` Actual PSD pattern: ${f(rect.pattern.width)} by ${f(rect.pattern.height)} logical pixels. `:'';
    return `${rect.piece}: visible garment bounding window x=${f(w.x)}, y=${f(w.y)}, width=${f(w.width)}, height=${f(w.height)} pixels.${pattern}`;
  }).join('\n');
  if(layout.guide===silhouetteGuideVersion)return `IMAGE 1 IS A TWO-ZONE REGISTRATION MAP, NOT ARTWORK TO COPY.
BLUE (#b7d7ed) = the exact printable silhouette from the real PSD pattern. Reconstruct ALL design visible in the reference INSIDE THIS BLUE SHAPE, at corresponding positions relative to its shoulders, side seams, chest and hem. Blue is NOT a bounding rectangle. Keep any printed border or side detail that is visible in the reference inside the blue silhouette at that height. Do not move it out to the outer rectangle edge.
PEACH (#f6d3ba) = HIDDEN CONTINUATION ONLY. This includes the curved spaces outside the silhouette, neckline void and an EXTRA ${edge*100}% of garment width/height on EACH outer edge. Generate NEW fabric artwork in ALL peach areas by logically continuing the neighboring colors, curves, stripes and motifs. This continuation is additional to the visible design, not part of its allotted area. For a ${100}% visible design, output ${100+bleed*100}% width and height of fabric, plus the hidden curved side regions. Do not spread the visible design over the complete outer rectangle. Do not enlarge or shrink the visible composition to simulate this extension.
EXAMPLE: if the reference has a white central panel with dark curved borders that remain visible near both side seams, BOTH borders must remain visible inside the blue shape at the same relative heights. Continue white/orange/dark areas naturally beyond the blue boundary into peach. Never put those visible borders at the peach outer edge where they would disappear when clipped.
First establish the visible composition in BLUE; then extend only into PEACH, within this SAME image generation. The finished output must be a COMPLETE STRAIGHT-EDGED RECTANGLE of fabric. Remove every blue/peach guide color and guide shape: do not output a garment cutout, neckline, cuff, seam, lighting or transparent silhouette. Replace the blue neckline void with underlying fabric continuation, not a collar. The application will clip the rectangular result with the real mask and map only its inner registered window to the pattern. It will not invent missing continuation by zooming.
Match front and back independently; remove names, numbers, crests, brands and sponsors while reconstructing the underlying artwork. Preserve printed panel borders; exclude construction trims.
${layout.physicalScale===1?`All pieces share ${Number(layout.pixelsPerUnit).toFixed(4)} pixels per logical garment unit. Sleeves contain FEWER repeats than the torso, at matching physical motif width. Sleeve blue masks are unrotated: the bottom edge is parallel to the cuff. Do not add the cuff angle again; the editor applies it.`:''}
The following coordinates describe only the BOUNDING BOX of the blue silhouette, not its visible curved boundary. Use the blue pixels for visible placement and the outer rectangle for hidden continuation:\n${windows}`;
  const scaleRule=layout.physicalScale===1?`SHARED PRINT SCALE: All rectangles in IMAGE 1 use the SAME ${Number(layout.pixelsPerUnit).toFixed(4)} image pixels per logical garment unit. A sleeve is physically smaller than the torso: show FEWER repeats of the same stripe or motif, NOT the torso's full stripe count squeezed into the sleeve. Keep matching stripe and motif widths equal in PIXELS across torso and sleeves on this sheet. Sleeve rectangles are already unrotated into their cuff coordinate system: their BOTTOM horizontal edge is PARALLEL to the cuff. Reconstruct the sleeve pattern relative to that edge; the application rotates it to each actual cuff angle. Never bake that mockup angle into the swatch a second time. Preserve any genuinely different sleeve design in the reference. `:'';
  return `${scaleRule}VISIBLE DESIGN AND HIDDEN BLEED ARE DIFFERENT REGIONS. Each fabric rectangle includes ${edge*100}% of the garment width/height EXTRA ON EACH EDGE (${bleed*100}% total added size). The reference shows a curved, tapered garment silhouette, NOT the complete rectangular fabric swatch. First reconstruct the artwork INSIDE the corresponding garment silhouette at its observed position and scale; then CONTINUE that artwork into the hidden regions outside the silhouette and into the extra border. Do not fit all visible artwork to the OUTER rectangle: that would crop reference details when the garment mask is applied. Never shrink, enlarge, shift or duplicate the visible composition to manufacture bleed. Infer hidden continuation of existing shapes and colors without adding new motifs. Do not mirror, stretch or repeat edge pixels. Top shoulder corners, curved sides, neckline openings and the added border are hidden fabric areas, not new positions for visible reference motifs. A detail seen at a curved side edge must remain at that silhouette edge, not move to the rectangle edge. Keep a center stripe at the garment center. Match reference landmarks at chest, middle, side and hem. FRONT and BACK dimensions describe ONLY the torso pattern, never the combined shirt-plus-sleeves span. Measure stripe width and count across the TORSO between its two side seams. Keep that exact count across the inner visible window; additional strips of the repeating design belong in the outer bleed. Do not include the sleeves in the torso width. Match each sleeve separately to its own measured pattern. The final application maps this inner window directly to the PSD pattern; there is no subsequent artistic zoom or automatic rescaling. Mapping garment bounding coordinates (u,v) to rectangle coordinates is ((u+${edge})/${1+bleed},(v+${edge})/${1+bleed}); only points INSIDE the silhouette are visible.\n${windows}\n${layout.registration===registrationVersion?'IMAGE 1 is a REGISTRATION GUIDE: the peach outer band is the EXTRA HIDDEN BLEED; the inner pale blue RECTANGLE is the visible design window, and thin blue centerlines mark its center. No garment silhouette is drawn: all guides are plain rectangles. Reconstruct the full VISIBLE reference composition inside this inner rectangle, preserving side and shoulder landmarks from the corresponding reference; generate additional continuation in the peach outer band. The outer band must already contain NEW continuation pixels in the generated file; the application will not create those pixels by zooming. These guide colors and lines are NOT artwork: remove them completely in the result, leaving each complete straight-edged rectangle filled only with clean fabric artwork.':''}`;
}

// Express the guide's visible window in coordinates of the ACTUAL detected crop.
// This preserves registration even if the generated outer rectangle drifts.
export function croppedContentWindow(layout,piece,actual){
  const expected=layout.rectangles.find(rect=>rect.piece===piece);
  if(!expected)throw new Error('Falta la zona visible de la pieza.');
  const inner=registrationWindow(expected,layout.bleed);
  const result={x:(inner.x-actual.x)/actual.width,y:(inner.y-actual.y)/actual.height,width:inner.width/actual.width,height:inner.height/actual.height};
  const tolerance=.005;
  if(Object.values(result).some(n=>!Number.isFinite(n))||result.width<=0||result.height<=0)throw new Error('La geometría del rectángulo generado no es válida.');
  if(result.x < -tolerance||result.y < -tolerance||result.x+result.width>1+tolerance||result.y+result.height>1+tolerance){
    // A complete detected swatch may have moved/resized in its atlas cell.
    // Its bleed is then unverified: preserve ALL its pixels, avoid invented
    // overscan, and expose it for manual adjustment instead of blocking the kit.
    if(actual.width<expected.width*.65||actual.height<expected.height*.65)throw new Error('El rectángulo generado está incompleto. El original se conserva sin aplicar.');
    return {x:0,y:0,width:1,height:1,reviewRequired:true};
  }
  return result;
}
export function textureBaseGeometry(clip,image,bounds){
  // Uploaded artwork is placed as a proportional image. Only the user's
  // independent scaleX/scaleY controls may change that original aspect.
  if(clip.custom){
    const scale=Math.min(bounds.width/image.width,bounds.height/image.height);
    return {width:image.width*scale,height:image.height*scale,offsetX:0,offsetY:0};
  }
  const content=clip.contentWindow;
  if(content){
    const scale=Math.max(bounds.width/(image.width*content.width),bounds.height/(image.height*content.height));
    // Registered pieces map their source window to the actual pattern on BOTH
    // axes. Cover/max is wrong here: it silently enlarges stripes on the other
    // axis, especially when front/back sleeve projections differ.
    const width=clip.patternGeometry===patternGeometryVersion?bounds.width/content.width:image.width*scale;
    const height=clip.patternGeometry===patternGeometryVersion?bounds.height/content.height:image.height*scale;
    return {width,height,offsetX:(.5-content.x-content.width/2)*width,offsetY:(.5-content.y-content.height/2)*height};
  }
  // Compatibility for saved textures without an explicit source registration.
  const scale=Math.max(bounds.width/image.width,bounds.height/image.height)*(1+(clip.bleed??.10));
  return {width:image.width*scale,height:image.height*scale,offsetX:0,offsetY:0};
}

export function normalizedPatternTile(layout,piece,actual){
  const expected=layout.rectangles.find(rect=>rect.piece===piece);
  if(!expected||![actual.width,actual.height,expected.width,expected.height].every(n=>Number.isFinite(n)&&n>0))throw new Error('No se puede ajustar la textura a la proporción del patrón.');
  if(layout.outputShape===fittedRectangleVersion)return {width:expected.width,height:expected.height,contentWindow:{x:0,y:0,width:1,height:1}};
  if(layout.outputShape===rectangularOutputVersion&&!actual.manual){
    const contentWindow=croppedContentWindow(layout,piece,actual);
    if(contentWindow.reviewRequired)throw new Error(`Falta parte de la zona visible de ${piece}. El original se conserva sin aplicar.`);
    const epsilon=.005;
    const missingBleed=actual.x>expected.x+epsilon||actual.y>expected.y+epsilon||actual.x+actual.width<expected.x+expected.width-epsilon||actual.y+actual.height<expected.y+expected.height-epsilon;
    // Keep the guide's absolute visible window. Recentering it in a resized
    // detected rectangle silently changes stripe position and magnification.
    return {width:Math.max(1,Math.round(actual.width)),height:Math.max(1,Math.round(actual.height)),contentWindow:{...contentWindow,...(missingBleed?{reviewRequired:true}: {})}};
  }
  // A displaced/resized panel has no verified generated bleed. Keep its full
  // content visible and expose it for adjustment; never add speculative zoom.
  if(actual.reviewRequired)return {width:actual.width,height:actual.height,contentWindow:{x:0,y:0,width:1,height:1,reviewRequired:true}};
  const inner=registrationWindow({x:0,y:0,width:expected.width,height:expected.height},layout.bleed);
  // Normalize the complete swatch BEFORE applying the garment mask. Translation
  // on the atlas is irrelevant; the central visible window travels with it.
  return {width:expected.width,height:expected.height,contentWindow:{x:inner.x/expected.width,y:inner.y/expected.height,width:inner.width/expected.width,height:inner.height/expected.height,...(actual.marginReviewRequired?{reviewRequired:true}: {})}};
}
