# Montage : enchaîne les séquences d'images des plans, dans l'ordre, et encode en H.264 (bt709, 30 i/s, démarrage rapide).
# python3 -I monter.py sortie.mp4 plan1 plan2 ... [--crf 24] [--largeur 1920] [--grain 2] [--filigrane lib/habillage/filigrane.png]
import os, sys, subprocess, shutil
R=os.path.dirname(os.path.abspath(__file__))
a=sys.argv[1:]; opt=lambda k,d: (a[a.index('--'+k)+1] if '--'+k in a else d)
sortie=a[0]; plans=[x for i,x in enumerate(a[1:],1) if not x.startswith('--') and not a[i-1].startswith('--')]
crf=opt('crf','24'); larg=int(opt('largeur','1920')); grain=opt('grain','2'); fps=opt('fps','30'); fil=opt('filigrane','')
seq=R+'/seq-'+os.path.splitext(sortie)[0]; shutil.rmtree(seq,ignore_errors=True); os.makedirs(seq); os.makedirs(R+'/out',exist_ok=True)
n=0; rep=[]
for p in plans:
    fs=sorted(f for f in os.listdir(f'{R}/frames/{p}') if f.endswith('.jpg'))
    for f in fs: os.symlink(f'{R}/frames/{p}/{f}', f'{seq}/{n:06d}.jpg'); n+=1
    rep.append((p,len(fs)))
# tout se fait en RVB (les images sont des JPEG), puis une seule conversion vers le YUV bt709 de la vidéo HD
ch=['[0:v]format=gbrp[b]']
if fil: ch.append('[b][1:v]overlay=0:0:format=gbrp[c]')
else: ch.append('[b]null[c]')
fin=[]
if larg!=1920: fin.append(f'scale={larg}:-2:flags=lanczos')
fin.append('scale=out_color_matrix=bt709:out_range=tv'); fin.append('format=yuv420p')
if grain!='0': fin.append(f'noise=c0s={grain}:c0f=t')        # un grain très léger, sur la seule luminance, évite les bandes dans les fonds sombres
ch.append('[c]'+','.join(fin)+'[v]')
cmd=['ffmpeg','-v','error','-y','-framerate',fps,'-i',f'{seq}/%06d.jpg']+(['-i',f'{R}/{fil}'] if fil else [])+['-filter_complex',';'.join(ch),'-map','[v]',
     '-c:v','libx264','-preset','slow','-crf',crf,'-profile:v','high','-level','4.1','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-color_range','tv',
     '-movflags','+faststart','-an',f'{R}/out/{sortie}']
subprocess.run(cmd,check=True); shutil.rmtree(seq,ignore_errors=True)
print(' + '.join(f'{p} ({k} images)' for p,k in rep))
print(f'{sortie} : {n} images, {n/float(fps):.1f} s, {os.path.getsize(f"{R}/out/{sortie}")/1e6:.1f} Mo')
