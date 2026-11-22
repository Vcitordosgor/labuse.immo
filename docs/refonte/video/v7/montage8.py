# Montage de la vidéo du site refaite sur l'application actuelle : images → MP4 1440×900, 30 i/s.
# Ordre : L (logo) · A (île → terrain, carte sombre) · B (vue aérienne, fiche, Dossier) · D (Dossier PDF) · C (couches) · E (zonage PLU, île → terrain) · tenue · fondu.
# /usr/bin/python3 -I montage7.py [sortie.mp4]   (variables : CRF, TENUE)
import os, sys, json, subprocess, shutil
import numpy as np
from PIL import Image
V = '/tmp/claude-0/-home-user-labuse-immo/c63124ce-02a1-58ce-ac83-598cbc29f87a/scratchpad/video'
os.chdir(V)
DOS = {'L': 'L8', 'A': 'A-pf', 'B': 'B-pf', 'D': 'D8', 'C': 'C', 'E': 'E'}   # v8 : logo plus gros avec la phrase de marque ; A et B enregistrés panneau « Cartes » rétracté
files = lambda seg: sorted(f for f in os.listdir('frames/' + DOS[seg]) if f.endswith('.jpg'))
jr = lambda seg: json.load(open(f'frames/journal-{DOS[seg]}.json'))
shutil.rmtree('frames/F', ignore_errors=True); os.makedirs('frames/F')
nf = [0]
def fondu(a, b, k):
    """k images intermédiaires entre les fichiers a et b"""
    A, B = Image.open(a).convert('RGB'), Image.open(b).convert('RGB'); out = []
    for i in range(1, k + 1):
        t = i / (k + 1); t = t * t * (3 - 2 * t)
        f = f'frames/F/{nf[0]:04d}.jpg'; nf[0] += 1; Image.blend(A, B, t).save(f, quality=92); out.append(f)
    return out
def avec_fondus(seg, reperes, depart=0):
    """liste des images du segment, avec un fondu inséré juste avant chaque repère {cle: nb d'images}"""
    fs = [f'frames/{DOS[seg]}/{f}' for f in files(seg)]; J = jr(seg)['reperes']; pts = sorted((J[c], k) for c, k in reperes.items() if c in J)
    out = []; i0 = depart
    for idx, k in pts:
        out += fs[i0:idx] + fondu(fs[idx - 1], fs[idx], k); i0 = idx
    return out + fs[i0:]
def saturation(path):
    a = np.asarray(Image.open(path).convert('RGB').resize((360, 225)).crop((105, 16, 355, 220))).astype(np.float32)
    mx, mn = a.max(axis=2), a.min(axis=2); return float(((mx - mn) / np.maximum(mx, 1)).mean())
seq = [f'frames/{DOS["L"]}/{f}' for f in files('L')]
seq += [f'frames/{DOS["A"]}/{f}' for f in files('A')]
seq += avec_fondus('B', {'ortho': 5})
seq += [f'frames/{DOS["D"]}/{f}' for f in files('D')]
seq += avec_fondus('C', {'ppr': 8, 'pprOff': 6, 'plu': 8})
# E : l'apparition des couleurs du zonage en cours de zoom est adoucie par un fondu, comme dans l'ancienne vidéo
E = [f'frames/{DOS["E"]}/{f}' for f in files('E')]; S = [saturation(f) for f in E]
sauts = sorted(((S[i + 1] - S[i], i) for i in range(len(S) - 1)), reverse=True)[:3]
print('sauts de saturation (écart, index E) :', [(round(d, 3), i) for d, i in sauts])
d, pop = sauts[0]
seq += (E[:pop + 1] + fondu(E[pop], E[pop + 1], 10) + E[pop + 1:]) if d > 0.03 else E
seq += [E[-1]] * int(os.environ.get('TENUE', '48'))
shutil.rmtree('seq', ignore_errors=True); os.makedirs('seq')
for i, f in enumerate(seq): os.symlink(os.path.abspath(f), f'seq/{i:05d}.jpg')
n = len(seq); st = round(n / 30 - 0.8, 2)
print('images', n, '· durée', round(n / 30, 2), 's')
out = sys.argv[1] if len(sys.argv) > 1 else 'labuse-promo-v8.mp4'
vf = ('scale=1440:900:flags=lanczos:in_color_matrix=bt601:in_range=full:out_color_matrix=bt709:out_range=tv,'
      f'fade=t=out:st={st}:d=0.8:color=0x0A0C0B,format=yuv420p')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '30', '-i', 'seq/%05d.jpg', '-vf', vf, '-c:v', 'libx264', '-preset', 'veryslow', '-crf', os.environ.get('CRF', '22'),
                '-tune', 'animation', '-profile:v', 'high', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-movflags', '+faststart', '-an', out], check=True)
print(out, os.path.getsize(out), 'octets')
