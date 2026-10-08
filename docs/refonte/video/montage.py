# Montage de la vidéo promo : séquence d'images → MP4.
import os, subprocess, hashlib, re, shutil
FF = '../tools/node_modules/ffmpeg-static/ffmpeg'
def files(seg): return sorted(f for f in os.listdir('frames/' + seg) if f.endswith('.jpg'))
def md5(p): return hashlib.md5(open(p, 'rb').read()).hexdigest()
def static_from(seg):
    fs = files(seg); hs = [md5(f'frames/{seg}/{f}') for f in fs]; k = len(hs) - 1
    while k > 0 and hs[k - 1] == hs[-1]: k -= 1
    return k
def sat(path):
    out = subprocess.run([FF, '-v', 'info', '-i', path, '-vf', 'crop=1600:1500:840:150,scale=200:188,signalstats,metadata=print:key=lavfi.signalstats.SATAVG', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.search(r'SATAVG=([\d.]+)', out).group(1))
assert md5('frames/A/0000.jpg') == md5('frames/B/0000.jpg'), 'A et B ne partent pas de la même image'
a_end, e_end = static_from('A'), static_from('E')
# E inversé : on cherche le saut de saturation (apparition des couleurs du zonage)
E = files('E')[:e_end + 1]
S = [sat(f'frames/E/{f}') for f in E]
jumps = sorted(((S[i] - S[i + 1], i) for i in range(len(S) - 1)), reverse=True)[:3]
print('sauts de saturation (écart, index E):', [(round(d, 1), i) for d, i in jumps])
pop = jumps[0][1]           # E[pop] coloré, E[pop+1] pas encore
shutil.rmtree('frames/F', ignore_errors=True); os.makedirs('frames/F')
NF = 10
for k in range(1, NF + 1):
    a = k / (NF + 1)
    subprocess.run([FF, '-v', 'error', '-y', '-i', f'frames/E/{E[pop]}', '-i', f'frames/E/{E[pop+1]}', '-filter_complex', f'[0][1]blend=all_mode=normal:all_opacity={a:.3f},format=yuvj420p', '-q:v', '2', f'frames/F/{k:04d}.jpg'], check=True)
seq = []
seq += [f'frames/L/{f}' for f in files('L')]
seq += [f'frames/A/{f}' for f in files('A')[:a_end + 1][::-1]]
seq += [f'frames/B/{f}' for f in files('B')[1:]]
seq += [f'frames/D/{f}' for f in files('D')]
seq += [f'frames/C/{f}' for f in files('C')[1:]]
rev = E[::-1]                # île → parcelle
cut = rev.index(E[pop + 1]) + 1
seq += [f'frames/E/{f}' for f in rev[:cut]] + [f'frames/F/{k:04d}.jpg' for k in range(1, NF + 1)] + [f'frames/E/{f}' for f in rev[cut:]]
seq += [f'frames/E/{E[0]}'] * 48
shutil.rmtree('seq', ignore_errors=True); os.makedirs('seq')
for i, f in enumerate(seq): os.symlink(os.path.abspath(f), f'seq/{i:05d}.jpg')
n = len(seq); st = round(n / 30 - 0.8, 2)
print('images', n, 'durée', round(n / 30, 2), 's')
out = os.environ.get('OUT', 'labuse-promo.mp4')
subprocess.run([FF, '-v', 'error', '-y', '-framerate', '30', '-i', 'seq/%05d.jpg', '-vf', f'scale=1440:900:flags=lanczos,fade=t=out:st={st}:d=0.8:color=0x0A0C0B,format=yuv420p', '-c:v', 'libx264', '-preset', 'veryslow', '-crf', os.environ.get('CRF', '29'), '-tune', 'animation', '-movflags', '+faststart', '-an', out], check=True)
print(out, os.path.getsize(out))
