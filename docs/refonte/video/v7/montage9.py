# Montage de la vidéo du site v9 : images → MP4 1440×900, 30 i/s, avec une « caméra » de montage (recadrages animés dans
# les images enregistrées en 2880×1800 : on peut grossir jusqu'à 2 fois sans perte).
#   /usr/bin/python3 -I montage9.py [sortie.mp4]          (variables : CRF)
#   /usr/bin/python3 -I montage9.py --dernier B|F          écrit controle/<segment>-dernier.jpg (dernière image du segment, recadrée) : départ du dossier PDF et du carton de fin
# Ordre : L9 (logo) · A (île → terrain) · G (vue 3D) · B (vue aérienne, fiche, Dossier) · D9 (Dossier PDF) · C (couches) · E (zonage) · F (filtres) · L9fin (logo).
import os, sys, json, subprocess, shutil
import numpy as np
from PIL import Image
V = '/tmp/claude-0/-home-user-labuse-immo/c63124ce-02a1-58ce-ac83-598cbc29f87a/scratchpad/video'
os.chdir(V)
DOS = {'L': 'L9', 'A': 'A-pf', 'G': 'G-v9', 'B': 'B-v9', 'D': 'D9', 'C': 'C-v9', 'E': 'E-v9', 'F': 'F-v9', 'Z': 'L9fin'}
files = lambda seg: sorted(f for f in os.listdir('frames/' + DOS[seg]) if f.endswith('.jpg'))
def jr(seg):
    p = f'frames/journal-{DOS[seg]}.json'
    return json.load(open(p)) if os.path.exists(p) else {'reperes': {}}
FULL = [0, 0, 1440, 900]
FICHE1, FICHE2 = [511, 56, 929, 581], [511, 240, 929, 581]
TROISD = [118, 60, 1322, 826]
PAN1, PAN2 = [0, 56, 960, 600], [0, 215, 960, 600]
def cles(seg):
    """clés de caméra d'un segment : liste (index d'image source, rectangle [x, y, l, h] en px CSS)"""
    R = jr(seg)['reperes']; n = len(files(seg))
    if seg == 'G' and 'en3d' in R:
        return [(0, FULL), (R['en3d'], FULL), (R.get('orbite', R['en3d'] + 26), TROISD), (R['en2d'] - 6, TROISD), (R['en2d'] + 8, FULL), (n - 1, FULL)]
    if seg == 'B' and 'fiche' in R:
        return [(0, FULL), (R['fiche'] - 2, FULL), (R['fiche'] + 9, FICHE1), (R['dossier'] - 6, FICHE1), (R['dossier'] + 4, FICHE2), (n - 1, FICHE2)]
    if seg == 'F' and 'filtres' in R:
        return [(0, FULL), (R['filtres'] + 1, FULL), (R['filtres'] + 13, PAN1), (R['terrain'] - 6, PAN1), (R['terrain'] + 4, PAN2), (n - 1, PAN2)]
    return [(0, FULL), (n - 1, FULL)]
def lisse(t): return t * t * (3 - 2 * t)
def cadre(k, i):
    for (i0, r0), (i1, r1) in zip(k, k[1:]):
        if i0 <= i <= i1:
            t = 0 if i1 == i0 else lisse((i - i0) / (i1 - i0)); return [a + (b - a) * t for a, b in zip(r0, r1)]
    return k[-1][1]
def traiter(src, rect, dst):
    """recadre (rect en px CSS, images en 2 px par px CSS) et ramène en 1440×900"""
    im = Image.open(src).convert('RGB'); e = im.size[0] / 1440
    if abs(rect[2] - 1440) < 0.5 and abs(rect[0]) < 0.5 and abs(rect[1]) < 0.5: out = im.resize((1440, 900), Image.LANCZOS)
    else: out = im.resize((1440, 900), Image.LANCZOS, box=(rect[0] * e, rect[1] * e, (rect[0] + rect[2]) * e, (rect[1] + rect[3]) * e))
    out.save(dst, quality=93)
ACCEL = {'A': [(40, 73)], 'G': [(0, 14), (96, 111)], 'B': [(0, 10)]}
def avec_fondus(seg, reperes):
    """[(fichier a, fichier b ou None, mélange, index source)] : fondu de k images inséré juste avant chaque repère"""
    fs = [f'frames/{DOS[seg]}/{f}' for f in files(seg)]; R = jr(seg)['reperes']; pts = dict((R[c], k) for c, k in reperes.items() if c in R)
    out = []
    for i, f in enumerate(fs):
        # passages accélérés (une image sur deux) : fins de zoom et trajets du curseur sur la carte sombre, presque noire à cette échelle
        if any(a <= i <= b and (i - a) % 2 == 1 for a, b in ACCEL.get(seg, [])) and i not in pts and i + 1 not in pts and i < len(fs) - 1: continue
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
for seg, rep in (('L', {}), ('A', {}), ('G', {'en3d': 4, 'en2d': 4}), ('B', {'ortho': 4}), ('D', {}), ('C', {'ppr': 6, 'pprOff': 4, 'plu': 5})):
    lst = avec_fondus(seg, rep)
    if seg == 'A': lst = lst[3:]                      # on entre plus vite dans le zoom
    plan += [(seg,) + x for x in lst]
E = avec_fondus('E', {}); S = [saturation(x[0]) for x in E]
sauts = sorted(((S[i + 1] - S[i], i) for i in range(len(S) - 1)), reverse=True)[:2]; d, pop = sauts[0]
print('saut de saturation dans E :', round(d, 3), 'à l’image', pop)
if d > 0.03:
    a, b = E[pop][0], E[pop + 1][0]; E = E[:pop + 1] + [(a, b, lisse(j / 8), pop + j / 8) for j in range(1, 8)] + E[pop + 1:]
plan += [('E',) + x for x in E]
F = avec_fondus('F', {'liste': 5})
# passage de E à F : fondu enchaîné de 8 images entre la dernière image de E et la première de F
plan += [('EF', E[-1][0], F[0][0], lisse(j / 9), 0) for j in range(1, 9)]
plan += [('F',) + x for x in F]
plan += [('Z',) + x for x in avec_fondus('Z', {})]
shutil.rmtree('seq9', ignore_errors=True); os.makedirs('seq9')
K = {s: cles(s) for s in 'LAGBDCEFZ'}
for n, (seg, a, b, m, idx) in enumerate(plan):
    r = FULL if seg == 'EF' else cadre(K[seg], idx)
    dst = f'seq9/{n:05d}.jpg'
    if b is None: traiter(a, r, dst)
    else:
        A_, B_ = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
        if seg == 'EF':   # les deux images n'ont pas le même cadre : E plein cadre → F plein cadre
            Image.blend(A_.resize((1440, 900), Image.LANCZOS), B_.resize((1440, 900), Image.LANCZOS), m).save(dst, quality=93)
        else:
            tmp = 'seq9/_m.jpg'; Image.blend(A_, B_, m).save(tmp, quality=95); traiter(tmp, r, dst); os.remove(tmp)
N = len(plan); print('images', N, '· durée', round(N / 30, 2), 's ·', {s: sum(1 for x in plan if x[0] == s) for s in ('L', 'A', 'G', 'B', 'D', 'C', 'E', 'EF', 'F', 'Z')})
out = [a for a in sys.argv[1:] if a.endswith('.mp4')]; out = out[0] if out else 'labuse-promo-v9.mp4'
vf = 'scale=1440:900:flags=lanczos:in_color_matrix=bt601:in_range=full:out_color_matrix=bt709:out_range=tv,format=yuv420p'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '30', '-i', 'seq9/%05d.jpg', '-vf', vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', os.environ.get('CRF', '21'),
                '-profile:v', 'high', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-movflags', '+faststart', '-an', out], check=True)
print(out, os.path.getsize(out), 'octets')
