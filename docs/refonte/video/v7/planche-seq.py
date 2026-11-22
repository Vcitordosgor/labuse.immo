# Planche d'images consécutives du montage : /usr/bin/python3 -I planche-seq.py sortie.jpg debut fin pas [colonnes] [largeur]
import sys, os
from PIL import Image, ImageDraw
out, a, b, pas = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]); cols = int(sys.argv[5]) if len(sys.argv) > 5 else 6; tw = int(sys.argv[6]) if len(sys.argv) > 6 else 470
idx = list(range(a, b + 1, pas)); th = round(tw * 900 / 1440); rows = (len(idx) + cols - 1) // cols
pl = Image.new('RGB', (cols * tw + (cols + 1) * 4, rows * th + (rows + 1) * 4), (70, 70, 70)); dr = ImageDraw.Draw(pl)
for k, i in enumerate(idx):
    im = Image.open(f'seq/{i:05d}.jpg').convert('RGB').resize((tw, th), Image.LANCZOS); x, y = 4 + (k % cols) * (tw + 4), 4 + (k // cols) * (th + 4); pl.paste(im, (x, y))
    dr.rectangle([x, y, x + 96, y + 18], fill=(0, 0, 0)); dr.text((x + 4, y + 3), f'{i} · {i/30:.2f}s', fill=(255, 230, 0))
pl.save(out, quality=86); print(out, pl.size)
