"""Rebake the shipped combat sheets with Pillow, NumPy and OpenCV 4.10."""
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

ART = Path(__file__).resolve().parents[1] / 'app/src/main/assets/art'
SIZE = 104
GRID = np.dstack(np.meshgrid(np.arange(SIZE), np.arange(SIZE))).astype('float32')
cv2.setNumThreads(1)
flow = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
flow.setFinestScale(0)

def cell(img, x, y):
    f = img.crop((128*x,128*y,128*x+128,128*y+128)).resize((SIZE,SIZE),Image.Resampling.LANCZOS)
    a = np.array(f, dtype='float32') / 255
    a[:,:,:3] *= a[:,:,3:]
    return a

def brightness(a):
    rgb = a[:,:,:3] + .23*(1-a[:,:,3:])
    return cv2.cvtColor(np.uint8(rgb*255),cv2.COLOR_RGB2GRAY)

def morph(a, b, ab, ba, t):
    if t == 0: mix = a.copy()
    else:
        # Backward sample each pose at the interpolated position. Premultiplied
        # alpha keeps the transparent gutter from leaving a black fringe.
        left = cv2.remap(a,GRID-t*ab,None,cv2.INTER_LINEAR)
        right = cv2.remap(b,GRID-(1-t)*ba,None,cv2.INTER_LINEAR)
        mix = left*(1-t)+right*t
    mix[:,:,:3] /= np.maximum(mix[:,:,3:],1/255)
    return Image.fromarray(np.uint8(np.clip(mix,0,1)*255+.5))

def bake(keys, stops, out, y):
    for (start,a),(end,b) in zip(stops,stops[1:]):
        first,last = keys[a],keys[b]
        g,h=brightness(first),brightness(last)
        ab,ba=flow.calc(g,h,None),flow.calc(h,g,None)
        for i in range(start,end):
            frame=morph(first,last,ab,ba,(i-start)/(end-start))
            out.paste(frame,(SIZE*(i%8),SIZE*(y+i//8)))

def main():
    for path in sorted((ART/'motion').glob('*.webp')):
        lateral=Image.open(path).convert('RGBA')
        axial=Image.open(ART/'facing'/path.name).convert('RGBA')
        for direction in ['side','front','back']:
            sheet=Image.new('RGBA',(SIZE*8,SIZE*8))
            for team in (0,1):
                y=team*2
                if direction=='side':
                    keys=[cell(lateral,i%4,y+i//4) for i in range(8)]
                    walk=[(0,0),(4,1),(8,2),(12,3),(16,0)]
                    attack=[(0,1),(3,4),(7,5),(8,6),(12,7),(16,1)]
                    if path.stem=='scout':attack=[(0,1),(6,4),(8,5),(11,6),(14,7),(16,1)]
                else:
                    keys=[cell(axial,i,y+int(direction=='back')) for i in range(4)]
                    walk=[(0,0),(8,1),(16,0)]
                    attack=[(0,1),(6,2),(8,3),(11,3),(16,1)]
                bake(keys,walk,sheet,team*4)
                bake(keys,attack,sheet,team*4+2)
            dest=ART/'cycles'/direction/path.name
            dest.parent.mkdir(parents=True,exist_ok=True)
            sheet.save(dest,quality=82,method=5)
if __name__=='__main__': main()
