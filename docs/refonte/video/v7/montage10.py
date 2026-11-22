# Montage de la vidéo du site v10 : images → MP4 1440×900, 30 i/s.
#   /usr/bin/python3 -I montage10.py [sortie.mp4]          (variables : CRF)
#   /usr/bin/python3 -I montage10.py --dernier F            écrit controle/F-dernier.jpg (dernière image de F, recadrée) : départ du carton de fin
# Ordre : L10 (logo) · H (île → terrain → 3D → photo aérienne en 3D → clic) · FV (la fiche, animation de la vidéo 2) · D10 (Dossier PDF)
#         · C (couches) · E (zonage) · F (filtres) · L9fin (logo).
# Les passages enregistrés dans l'application sont resserrés au montage : ACCEL donne, par segment, des plages d'images
# sources jouées k fois plus vite (trajets du curseur, défilements) ; les temps forts (repères du journal) sont gardés.
import os, sys, json, math, subprocess, shutil
import numpy as np
from PIL import Image
V = '/tmp/claude-0/-home-user-labuse-immo/c63124ce-02a1-58ce-ac83-598cbc29f87a/scratchpad/video'
os.chdir(V)
DOS = {'L': 'L10', 'H': 'H-v10', 'V': 'FV', 'D': 'D10', 'C': 'C-v9', 'E': 'E-v9', 'F': 'F-v9', 'Z': 'L9fin'}
files = lambda seg: sorted(f for f in os.listdir('frames/' + DOS[seg]) if f.endswith('.jpg'))
def jr(seg):
    p = f'frames/journal-{DOS[seg]}.json'
    return json.load(open(p)) if os.path.exists(p) else {'reperes': {}}
FULL = [0, 0, 1440, 900]
PAN1, PAN2 = [0, 56, 960, 600], [0, 215, 960, 600]
ACCEL = {'H': [(26, 44, 2)], 'C': [(0, 4, 2), (8, 42, 3), (64, 85, 3), (88, 97, 2)], 'E': [(0, 9, 2), (46, 54, 2)], 'F': [(0, 146, 1.5)]}
FONDUS = {'H': {'en3d': 3, 'ortho': 5}, 'C': {'ppr': 6, 'pprOff': 4, 'plu': 5}, 'F': {'liste': 5}}
def cles(seg):
    """clés de caméra d'un segment : liste (index d'image source, rectangle [x, y, l, h] en px CSS)"""
    R = jr(seg)['reperes']; n = len(files(seg))
    if seg == 'F' and 'filtres' in R:
        return [(0, FULL), (R['filtres'] + 1, FULL), (R['filtres'] + 13, PAN1), (R['terrain'] - 6, PAN1), (R['terrain'] + 4, PAN2), (n - 1, PAN2)]
    return [(0, FULL), (n - 1, FULL)]
def lisse(t): return t * t * (3 - 2 * t)
def cadre(k, i):
    for (i0, r0), (i1, r1) in zip(k, k[1:]):
        if i0 <= i <= i1:
            t = 0 if i1 == i0 else lisse((i - i0) / (i1 - i0)); return [a + (b - a) * t for a, b in zip(r0, r1)]
    return k[-1][1]
def traiter(im, rect, dst):
    """recadre (rect en px CSS) et ramène en 1440×900"""
    e = im.size[0] / 1440; plein = abs(rect[2] - 1440) < 0.5 and abs(rect[0]) < 0.5 and abs(rect[1]) < 0.5
    if plein and im.size == (1440, 900): out = im
    elif plein: out = im.resize((1440, 900), Image.LANCZOS)
    else: out = im.resize((1440, 900), Image.LANCZOS, box=(rect[0] * e, rect[1] * e, (rect[0] + rect[2]) * e, (rect[1] + rect[3]) * e))
    out.save(dst, quality=93)
def garde(seg, i, pts, n):
    """faux si l'image source i tombe dans une plage accélérée et n'est pas une de celles qu'on garde"""
    if i in pts or i == n - 1: return True
    for a, b, k in ACCEL.get(seg, []):
        if a < i <= b and math.floor((i - a) / k) == math.floor((i - 1 - a) / k): return False
    return True
def avec_fondus(seg):
    """[(fichier a, fichier b ou None, mélange, index source)] : fondu de k images inséré juste avant chaque repère"""
    fs = [f'frames/{DOS[seg]}/{f}' for f in files(seg)]; R = jr(seg)['reperes']; pts = dict((R[c], k) for c, k in FONDUS.get(seg, {}).items() if c in R)
    out = []
    for i, f in enumerate(fs):
        if not garde(seg, i, pts, len(fs)): continue
        if i in pts and i > 0:
            k = pts[i]
            for j in range(1, k + 1): out.append((fs[i - 1], f, lisse(j / (k + 1)), i - 1 + j / (k + 1)))
        out.append((f, None, 0, i))
    return out
def saturation(path):
    a = np.asarray(Image.open(path).convert('RGB').resize((360, 225)).crop((105, 16, 355, 220))).astype(np.float32)
    mx, mn = a.max(axis=2), a.min(axis=2); return float(((mx - mn) / np.maximum(mx, 1)).mean())
if '--dernier' in sys.argv:
    seg = sys.argv[sys.argv.index('--dernier') + 1]
    k = cles(seg); n = len(files(seg)); src = f'frames/{DOS[seg]}/{files(seg)[-1]}'
    im = Image.open(src).convert('RGB'); r = cadre(k, n - 1); e = im.size[0] / 1440
    im.resize((2880, 1800), Image.LANCZOS, box=(r[0] * e, r[1] * e, (r[0] + r[2]) * e, (r[1] + r[3]) * e)).save(f'controle/{seg}-dernier.jpg', quality=95)
    json.dump({'cadre': r}, open(f'controle/{seg}-dernier.json', 'w')); print(f'controle/{seg}-dernier.jpg', [round(x) for x in r]); sys.exit(0)
plan = []          # (segment, a, b, mélange, index source)
for seg in ('L', 'H', 'V', 'D', 'C'):
    plan += [(seg,) + x for x in avec_fondus(seg)]
# E : le zonage apparaît d'un coup quand le zoom passe son seuil → fondu sur ce saut de saturation
E = avec_fondus('E'); S = [saturation(x[0]) for x in E]
d, pop = sorted(((S[i + 1] - S[i], i) for i in range(len(S) - 1)), reverse=True)[0]
print('saut de saturation dans E :', round(d, 3), 'à l’image', pop)
if d > 0.03:
    a, b = E[pop][0], E[pop + 1][0]; E = E[:pop + 1] + [(a, b, lisse(j / 6), E[pop][3] + j / 6) for j in range(1, 6)] + E[pop + 1:]
plan += [('E',) + x for x in E]
F = avec_fondus('F')
plan += [('EF', E[-1][0], F[0][0], lisse(j / 8), 0) for j in range(1, 8)]      # passage de E à F : fondu enchaîné
plan += [('F',) + x for x in F]
plan += [('Z',) + x for x in avec_fondus('Z')]
shutil.rmtree('seq10', ignore_errors=True); os.makedirs('seq10')
K = {s: cles(s) for s in DOS}
debuts = {}
for n, (seg, a, b, m, idx) in enumerate(plan):
    debuts.setdefault(seg, n)
    r = FULL if seg == 'EF' else cadre(K[seg], idx)
    dst = f'seq10/{n:05d}.jpg'; A_ = Image.open(a).convert('RGB')
    if b is None: traiter(A_, r, dst)
    else:
        B_ = Image.open(b).convert('RGB')
        if A_.size != B_.size or seg == 'EF': A_, B_ = A_.resize((1440, 900), Image.LANCZOS), B_.resize((1440, 900), Image.LANCZOS)
        traiter(Image.blend(A_, B_, m), r, dst)
N = len(plan); compte = {}
for x in plan: compte[x[0]] = compte.get(x[0], 0) + 1
print('images', N, '· durée', round(N / 30, 2), 's ·', compte)
print('débuts (s) :', {s: round(v / 30, 2) for s, v in debuts.items()})
json.dump({'n': N, 'debuts': debuts, 'compte': compte}, open('controle/montage10.json', 'w'))
out = [a for a in sys.argv[1:] if a.endswith('.mp4')]; out = out[0] if out else 'labuse-promo-v10.mp4'
vf = 'scale=1440:900:flags=lanczos:in_color_matrix=bt601:in_range=full:out_color_matrix=bt709:out_range=tv,format=yuv420p'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '30', '-i', 'seq10/%05d.jpg', '-vf', vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', os.environ.get('CRF', '21'),
                '-profile:v', 'high', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-movflags', '+faststart', '-an', out], check=True)
print(out, os.path.getsize(out), 'octets')
