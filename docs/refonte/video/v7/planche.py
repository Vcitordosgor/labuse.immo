# Planche de contrôle d'un segment : /usr/bin/python3 -I planche.py <dossier> <sortie.jpg> [pas] [colonnes] [largeur]
import sys, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]; pas = int(sys.argv[3]) if len(sys.argv) > 3 else 6; cols = int(sys.argv[4]) if len(sys.argv) > 4 else 6; tw = int(sys.argv[5]) if len(sys.argv) > 5 else 480
fs = sorted(f for f in os.listdir(d) if f.endswith('.jpg'))
sel = fs[::pas]
if fs[-1] not in sel: sel.append(fs[-1])
im0 = Image.open(os.path.join(d, sel[0])); th = round(tw * im0.size[1] / im0.size[0])
rows = (len(sel) + cols - 1) // cols
pl = Image.new('RGB', (cols * tw + (cols + 1) * 4, rows * th + (rows + 1) * 4), (70, 70, 70)); dr = ImageDraw.Draw(pl)
for i, f in enumerate(sel):
    im = Image.open(os.path.join(d, f)).convert('RGB').resize((tw, th), Image.LANCZOS)
    x, y = 4 + (i % cols) * (tw + 4), 4 + (i // cols) * (th + 4); pl.paste(im, (x, y))
    dr.rectangle([x, y, x + 62, y + 18], fill=(0, 0, 0)); dr.text((x + 4, y + 3), f[:-4], fill=(255, 230, 0))
pl.save(out, quality=86); print(out, pl.size, len(sel), 'vignettes sur', len(fs))
