# Planche de contrôle de la séquence FV : mosaïque de vignettes d'un dossier d'images numérotées, l'index d'image et l'heure inscrits sur chacune.
#   /usr/bin/python3 -I f-planche.py DOSSIER SORTIE.jpg [--pas 3] [--de 0] [--a 9999] [--cols 6] [--larg 480] [--q 88]
import os, sys
from PIL import Image, ImageDraw, ImageFont
a=sys.argv[1:]; opt=lambda k,d: (a[a.index('--'+k)+1] if '--'+k in a else d)
src,out=a[0],a[1]; pas=int(opt('pas',3)); de=int(opt('de',0)); fin=int(opt('a',9999)); cols=int(opt('cols',6)); larg=int(opt('larg',480))
fs={int(f[:-4]):os.path.join(src,f) for f in os.listdir(src) if f.endswith('.jpg') and f[:-4].isdigit()}
ids=[i for i in sorted(fs) if de<=i<=fin and (i-de)%pas==0]
if not ids: sys.exit('aucune image')
im0=Image.open(fs[ids[0]]); h=round(larg*im0.height/im0.width); rows=(len(ids)+cols-1)//cols; P=4
W=Image.new('RGB',(cols*(larg+P)+P,rows*(h+P)+P),(51,51,51)); d=ImageDraw.Draw(W)
try: font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf',max(13,larg//26))
except Exception: font=ImageFont.load_default()
for n,i in enumerate(ids):
    im=Image.open(fs[i]).convert('RGB').resize((larg,h),Image.LANCZOS); x=P+(n%cols)*(larg+P); y=P+(n//cols)*(h+P); W.paste(im,(x,y))
    s=f'{i:3d} {i/30:5.2f}s'; tw=d.textlength(s,font=font); d.rectangle((x+larg-tw-10,y,x+larg,y+font.size+6),fill=(0,0,0)); d.text((x+larg-tw-5,y+2),s,fill=(255,230,90),font=font)
W.save(out,quality=int(opt('q',88))); print(out,W.size,len(ids),'vignettes')
