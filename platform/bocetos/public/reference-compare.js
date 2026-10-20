const transformKeys = ['x','y','scale','scaleX','scaleY','rotation','views'];

export function captureTextureTransforms(clips, pieces) {
  return Object.fromEntries([...new Set(pieces)].filter(piece => clips?.[piece]).map(piece => [piece,
    Object.fromEntries(transformKeys.filter(key => Object.hasOwn(clips[piece], key)).map(key => [key, structuredClone(clips[piece][key])]))
  ]));
}

export function restoreTextureTransforms(clips, saved) {
  for (const [piece, transform] of Object.entries(saved || {})) {
    const clip = clips?.[piece]; if (!clip) continue;
    for (const key of transformKeys) {
      if (Object.hasOwn(transform, key)) clip[key] = structuredClone(transform[key]);
      else delete clip[key];
    }
  }
}
