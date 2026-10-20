const hex = { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' };
const object = properties => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
const nullable = schema => ({ anyOf: [schema, { type: 'null' }] });
const number = (minimum, maximum) => ({ type: 'number', minimum, maximum });
const certainty = { type: 'string', enum: ['observed', 'inferred'] };
export const outlineSchema = object({ enabled: { type: 'boolean' }, color: hex, width: number(1, 10), certainty });
export const alignmentSchema = object({ x: number(-1, 1), y: number(-1, 1), scale: number(.4, 3), rotation: number(-180, 180), certainty });

export function detailSchema(colorSchema, context) {
  return object({
    colors: colorSchema,
    outlines: object(Object.fromEntries(context.elements.map(element => [element.id, nullable(outlineSchema)]))),
    textures: object(Object.fromEntries(context.targets.map(target => [target.id, nullable(alignmentSchema)])))
  });
}

export function validateDetailContext(value, isImage) {
  if (!value || value.extended !== true || typeof value.outlines !== 'boolean' || typeof value.alignment !== 'boolean'
    || !Array.isArray(value.elements) || value.elements.length > 28 || !Array.isArray(value.targets) || value.targets.length > 10
    || !Array.isArray(value.sources) || value.sources.length > 6 || (value.mock !== undefined && !isImage(value.mock))) throw new Error('invalid_context');
  const allowed = ['brand', 'brand2', 'crest', 'front-number', 'short-brand', 'short-crest', 'short-number', 'back-number', 'back-name'];
  const elements = value.elements.map(element => {
    if (!element || !(allowed.includes(element.id) || /^sponsor-[a-zA-Z0-9.-]{1,80}$/.test(element.id))
      || !['front','back'].includes(element.side) || !['front','back','right','left','short'].includes(element.piece)
      || !Number.isFinite(element.size) || element.size <= 0 || element.size > 2000) throw new Error('invalid_context');
    return { id: element.id, side: element.side, piece: element.piece, size: element.size };
  });
  const sources = value.sources.map(source => {
    if (!source || !['front','back','right','left','short','socks'].includes(source.piece) || !isImage(source.image)) throw new Error('invalid_context');
    return { piece: source.piece, image: source.image };
  });
  const targets = value.targets.map(target => {
    if (!target || !['front','back','right','left','short','socks'].includes(target.piece) || !['front','back'].includes(target.side)
      || target.id !== `${target.piece}:${target.side}` || !sources.some(source => source.piece === target.piece)
      || ![target.width, target.height, target.baseWidth, target.baseHeight].every(n => Number.isFinite(n) && n > 0 && n < 10000)) throw new Error('invalid_context');
    if ((target.piece === 'front' || target.piece === 'back') && target.piece !== target.side) throw new Error('invalid_context');
    const offsets={};for(const key of ['baseOffsetX','baseOffsetY'])if(target[key]!==undefined){if(!Number.isFinite(target[key])||Math.abs(target[key])>10000)throw new Error('invalid_context');offsets[key]=target[key];}
    return { id: target.id, piece: target.piece, side: target.side, width: target.width, height: target.height, baseWidth: target.baseWidth, baseHeight: target.baseHeight,...offsets };
  });
  for (const list of [elements.map(e => e.id), sources.map(s => s.piece), targets.map(t => t.id)]) if (new Set(list).size !== list.length) throw new Error('invalid_context');
  return { extended: true, outlines: value.outlines, alignment: value.alignment, elements, sources, targets, ...(value.mock ? { mock: value.mock } : {}) };
}

const finite = (n, min, max) => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
const isHex = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
export function validateDetails(value, context, validateColors) {
  const exact = (object, keys) => object && typeof object === 'object' && !Array.isArray(object) && Object.keys(object).length === keys.length && keys.every(key => Object.hasOwn(object, key));
  if (!exact(value, ['colors','outlines','textures']) || !exact(value.outlines, context.elements.map(e=>e.id)) || !exact(value.textures, context.targets.map(t=>t.id))) throw new Error('invalid_details');
  const colors = validateColors(value.colors), outlines = {}, textures = {};
  for (const { id } of context.elements) {
    const item = value.outlines[id];
    if (item === null) { outlines[id] = null; continue; }
    if (!exact(item, ['enabled','color','width','certainty']) || typeof item.enabled !== 'boolean' || !isHex(item.color) || !finite(item.width,1,10) || !['observed','inferred'].includes(item.certainty)) throw new Error('invalid_details');
    outlines[id] = { ...item, color: item.color.toLowerCase(), width: Math.round(item.width) };
  }
  for (const { id } of context.targets) {
    const item = value.textures[id];
    if (item === null) { textures[id] = null; continue; }
    if (!exact(item, ['x','y','scale','rotation','certainty']) || !finite(item.x,-1,1) || !finite(item.y,-1,1) || !finite(item.scale,.4,3) || !finite(item.rotation,-180,180) || !['observed','inferred'].includes(item.certainty)) throw new Error('invalid_details');
    textures[id] = { ...item };
  }
  return inferDetails({ colors, outlines, textures }, context);
}

export function inferDetails(result, context) {
  const inferred = [];
  // Consistent print family when only one of the related roles is visible.
  for (const group of [['backNumber','frontNumber','shortNumber','name'],['brand','shortBrand'],['neck','cuffs']]) {
    const known = group.find(key => result.colors[key] !== null);
    if (known) for (const key of group) if (result.colors[key] === null) { result.colors[key] = result.colors[known]; inferred.push(`color:${key}`); }
  }
  for (const element of context.elements) {
    let item = result.outlines[element.id];
    if (!item) {
      const family = element.id.includes('number') || element.id === 'back-name' ? ['back-number','front-number','short-number','back-name']
        : element.id.includes('crest') ? ['crest','short-crest'] : element.id.includes('brand') ? ['brand','short-brand'] : [];
      const peer = family.map(key => result.outlines[key]).find(value => value?.certainty === 'observed');
      item = result.outlines[element.id] = peer ? { ...peer, certainty:'inferred' } : { enabled:false,color:'#000000',width:2,certainty:'inferred' };
    }
    if (item.certainty === 'inferred') inferred.push(`outline:${element.id}`);
  }
  for (const target of context.targets) {
    let item = result.textures[target.id];
    if (!item) {
      // A sleeve's two views use the same source, but opposite screen angles.
      const peer = ['left','right'].includes(target.piece) ? result.textures[`${target.piece}:${target.side==='front'?'back':'front'}`] : null;
      item = result.textures[target.id] = peer?.certainty === 'observed'
        ? { ...peer, x:-peer.x, rotation:-peer.rotation, certainty:'inferred' }
        : { x:0,y:0,scale:1,rotation:0,certainty:'inferred' };
    }
    if (item.certainty === 'inferred') inferred.push(`texture:${target.id}`);
  }
  return { ...result, inferred };
}

export const detailInstructions = `Also analyze outlines and texture registration. IMAGE 1 is the design reference; a labeled CURRENT MOCK image is only the editor's present state, never evidence of the desired design. Each SOURCE image is a separate flat fabric texture and its label identifies the piece. Compare its actual motifs with the corresponding visible reference garment. Infer the texture placement needed to reproduce motif size, direction and the visible portion on that garment, including sleeves. Do not treat numbers, names, emblems, sponsors, seams, shadows or folds as fabric motifs. Use the provided target geometry: at scale=1, the entire source rectangle is displayed at the supplied baseWidth and baseHeight, with its registered center in the target bounding box (width and height). Optional baseOffsetX/baseOffsetY indicate the texture center displacement at scale=1, compensating for the actual crop; the application multiplies these offsets by the requested scale and then adds x*width and y*height. Do not compensate for these offsets again in x/y. Those dimensions already include that source's hidden bleed; never add another overscan factor. The garment silhouette clips the source, including curved shoulders and sides. Hidden border continuation is intentionally outside the garment; do not enlarge the artwork to bring that hidden continuation into view. Scale multiplies both texture axes equally (keep natural proportions); x and y are CENTER OFFSETS divided by target width and height, positive right/down. Rotation is clockwise degrees around the texture center. Match stripe count, stripe width, motif location and angle, not just palette. Avoid extreme rotation/scale when the pattern is repetitive or ambiguous. Anatomical RIGHT sleeve is screen-left in front and screen-right in back. LEFT is the converse. Analyze each supplied piece/view independently. Return null when you cannot identify matching motifs; the application uses conservative centered defaults and marks inference.
For outlines, return enabled true only for an actual external stroke around that element, with six-digit HEX color and approximate thickness in logical mockup pixels (usually 1-3). Distinguish an external outline from a drop shadow, texture edge, internal badge details, a sponsor's rectangular background or an outline already inherent in an uploaded logo. If the element is clearly visible and has no stroke, return enabled false with certainty observed. If absent/unclear return null. For sensible but indirect conclusions use certainty inferred. Never label a guess observed. Colors can be null when absent; the application will infer missing colors within related print families, and marks them inferred. Do not invent symbols, change garment geometry or generate any image.`;
