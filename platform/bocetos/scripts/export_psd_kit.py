from pathlib import Path
from psd_tools import PSDImage
from PIL import Image,ImageChops
import numpy as np,io,json,cv2,sys,argparse
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description='Exportar assets desde los PSD originales privados.')
parser.add_argument('--source',required=True,type=Path,help='Carpeta que contiene los PSD originales')
parser.add_argument('--raglan-only',action='store_true')
args=parser.parse_args()
SRC=args.source.resolve()
OUT=ROOT/'public/assets/psd-kit';OUT.mkdir(parents=True,exist_ok=True)
NATIVE=ROOT/'moldes/psd-cuello-redondo';NATIVE.mkdir(parents=True,exist_ok=True)
SIZE=(2160,3840); logical=(1080,1920)
combined={}; manifest={}
def union(*ims):
 a=Image.new('L',ims[0].size)
 for im in ims:a=ImageChops.lighter(a,im)
 return a
def sub(a,b):return ImageChops.multiply(a,ImageChops.invert(b))
def mask(layer,sz):
 a=Image.new('L',sz,layer.mask.background_color if layer.has_mask() else 0)
 if layer.has_mask():a.paste(layer.mask.topil(),layer.mask.bbox[:2])
 elif layer.has_pixels():a.paste(layer.topil().getchannel('A'),layer.offset)
 return a
def rgba(a):
 im=Image.new('RGBA',a.size,(255,255,255,0));im.putalpha(a);return im
def pixels(layer,sz):
 im=Image.new('RGBA',sz);tile=layer.topil().convert('RGBA');im.paste(tile,layer.offset)
 if layer.has_mask():im.putalpha(ImageChops.multiply(im.getchannel('A'),mask(layer,sz)))
 return im
def smooth_raglan_join(im,sleeves,body,raglan,coverage):
 # Only remove the obsolete set-in sleeve stitching inside the new raglan panel.
 # Original PSD lighting is preserved everywhere else, including the new raglan edge.
 def dilate(a,r):return cv2.dilate((np.array(a)>32).astype(np.uint8),cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(2*r+1,2*r+1)))
 inside=cv2.erode((np.array(coverage)>32).astype(np.uint8),np.ones((3,3),np.uint8))
 seam=(dilate(sleeves,7)&dilate(body,7)&dilate(raglan,18)&inside)*255
 data=np.array(im);fixed=data.copy()
 fixed[:,:,:3]=cv2.inpaint(data[:,:,:3],seam,9,cv2.INPAINT_TELEA)
 fixed[:,:,3]=cv2.inpaint(data[:,:,3],seam,9,cv2.INPAINT_TELEA)
 fixed[:,:,3]=np.minimum(fixed[:,:,3],np.array(coverage))
 return Image.fromarray(fixed),Image.fromarray(seam)

def save(side,key,im,psdsize):
 if '--raglan-only' in sys.argv and 'Raglan' not in key:return
 im.save(NATIVE/f'{side}-{key}.png')
 # Same PSD coordinates and scale for every layer. Front and back are always together.
 scale=2600/psdsize[1]; w=round(psdsize[0]*scale); h=2600
 x=(70 if side=='front' else 1130)+(960-w)//2;y=500
 full=Image.new('RGBA',SIZE);full.paste(im.resize((w,h),Image.Resampling.LANCZOS),(x,y))
 full.save(NATIVE/f'kit-{side}-{key}.png');full.resize(logical,Image.Resampling.LANCZOS).save(OUT/f'{side}-{key}.png')
 if key not in combined:combined[key]=Image.new('RGBA',SIZE)
 combined[key].alpha_composite(full)
for side,filename,prefix in [('front','mock-frente-cuello-redondo.psd','FRENTE'),('back','mock-espalda-cuello-redondo.psd','ESPALDA')]:
 d=PSDImage.open(SRC/filename);sz=d.size;root=next(g for g in d if g.visible)
 groups={('shirt' if 'CAMISETA' in g.name else 'short' if 'SHORT' in g.name else 'socks'):g for g in root}
 masks={}; shoes=Image.new('RGBA',sz)
 for part,g in groups.items():
  pg=next(x for x in g if x.name=='PARTS');sg=next(x for x in g if x.name=='SMARTS');lg=next(x for x in g if x.name not in ['PARTS','SMARTS'])
  pm={x.name.lower():mask(x,sz) for x in pg}
  if part=='shirt':
   body=next(x for x in sg if x.name=='BODY');bm=mask(body,sz)
   arms=union(*(mask(x,sz) for x in sg if x.name!='BODY'))
   collar=pm['collar'];cuffs=pm['shirt cuff'];inside=pm.get('back',Image.new('L',sz))
   # Back PARTS uses one SHIRT fill; split it with the original SMARTS masks.
   cloth=union(*(pm[k] for k in pm if k not in ['collar','shirt cuff','back']))
   # Use the original ARM smart-object masks. Subtracting BODY left garment-edge
   # and hem pixels in the sleeve mask, stretching its bounds down the torso.
   sleeves=ImageChops.multiply(cloth,arms);bodymask=sub(cloth,sleeves)
   nested=PSDImage.open(io.BytesIO(body.smart_object.data));r=next(x for x in nested.descendants() if x.name.lower()=='ranglan')
   ri=Image.new('RGBA',nested.size);ri.paste(r.topil().convert('RGBA'),r.offset)
   box=body.smart_object.transform_box;left,top=round(box[0]),round(box[1]);right,bottom=round(box[4]),round(box[5])
   raw_raglan=Image.new('L',sz);raw_raglan.paste(ri.getchannel('A').resize((right-left,bottom-top),Image.Resampling.LANCZOS),(left,top))
   ra=ImageChops.multiply(raw_raglan,bodymask)
   # Join the uncut raglan polygon to the ARM masks before clipping to the cloth.
   # Cutting it to BODY first creates a translucent line at the old arm seam.
   raglan_sleeves=ImageChops.multiply(union(sleeves,raw_raglan),cloth)
   joined=cv2.morphologyEx(np.array(raglan_sleeves),cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(15,15)))
   cloth_pixels=np.array(cloth);closed_cloth=cv2.morphologyEx(cloth_pixels,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(15,15)))
   interior=cv2.erode((cloth_pixels>32).astype(np.uint8),np.ones((15,15),np.uint8))>0
   welded_cloth=cloth_pixels.copy();welded_cloth[interior]=closed_cloth[interior]
   raglan_sleeves=Image.fromarray(np.minimum(joined,welded_cloth))
   raglan_body=sub(Image.fromarray(welded_cloth),raglan_sleeves)
   raglan_coverage=union(Image.fromarray(welded_cloth),collar,cuffs,inside)
   masks.update(photoBody=bodymask,photoBodyRaglan=raglan_body,photoSleeveLeft=sleeves,photoSleeveRight=Image.new('L',sz),photoSleeveLeftRaglan=raglan_sleeves,photoSleeveRightRaglan=Image.new('L',sz),photoCollar=collar,photoCuffs=cuffs,photoBackNeck=inside,photoRaglan=ra)
   finish=union(collar,cuffs,inside)
   masks.update(photoDesignShirt=sub(union(bodymask,sleeves),finish),photoDesignShirtBody=sub(bodymask,finish),photoDesignShirtSleeves=sub(sleeves,finish),photoDesignShirtBodyRaglan=sub(raglan_body,finish),photoDesignShirtSleevesRaglan=sub(raglan_sleeves,finish))
   coverage=union(cloth,collar,cuffs,inside)
  elif part=='short':masks['photoShort']=pm['shorts'];coverage=pm['shorts']
  else:
   masks['photoSocks']=pm['socks'];coverage=union(*pm.values())
   for x in pg:
    if x.name.lower()!='socks':
     tile=x.composite(force=True); positioned=Image.new('RGBA',sz);positioned.paste(tile,x.offset);shoes.alpha_composite(positioned)
  for l in lg:
   key=('photoScreen' if 'HIGHLIGHT' in l.name else 'photoBurn')+part.title()
   im=pixels(l,sz);im.putalpha(ImageChops.multiply(im.getchannel('A'),coverage));save(side,key,im,sz)
   if part=='shirt':
    fixed,seam=smooth_raglan_join(im,sleeves,bodymask,ra,raglan_coverage);save(side,key+'Raglan',fixed,sz)
    if key.startswith('photoBurn'):save(side,'photoRaglanJoin',rgba(seam),sz)
   manifest[f'{side}-{key}']={'name':l.name,'opacity':l.opacity,'blend':str(l.blend_mode)}
 for key,a in masks.items():save(side,key,rgba(a),sz)
 save(side,'photoShoes',shoes,sz)
for key,im in combined.items():
 im.save(NATIVE/f'kit-{key}.png');im.resize(logical,Image.Resampling.LANCZOS).save(OUT/f'{key}.png')
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print('Exported',len(combined),'aligned layers per kit to',OUT)
