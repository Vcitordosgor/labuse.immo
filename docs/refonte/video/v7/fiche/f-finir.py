# Séquence « fiche parcelle » de la vidéo 3 (FV) — fin de chaîne : images brutes du navigateur (2880×1800) → images livrées 1440×900, journal, planche, images fixes.
#   /usr/bin/python3 -I f-finir.py FOND.jpg [--brut frames/fv-brut] [--journal journaux/fv-journal.json] [--sortie DOSSIER --journal-sortie FICHIER.json] [--sans-controle]
# · chaque image brute est ramenée en 1440×900 par PIL LANCZOS (comme video/montage9.py le fait pour les images de l'application), JPEG qualité 95 ;
# · l'image 0000 est LE FOND lui-même, réduit de la même façon (raccord exact avec l'image sur laquelle le coordinateur montre le clic) ; l'image 0 du navigateur
#   lui est comparée (elle doit être la même, au bruit du JPEG près : sinon la scène a touché au fond dès la première image) ;
# · écrit video/frames/FV/0000.jpg…, video/frames/journal-FV.json, controle-v2/planche-fv.jpg (une image sur trois), fixe-fv-tuiles.jpg, fixe-fv-outils.jpg.
import os, sys, json, shutil, subprocess, time
import numpy as np
from PIL import Image
R='/tmp/claude-0/-home-user-labuse-immo/c63124ce-02a1-58ce-ac83-598cbc29f87a/scratchpad/promo'; V=R+'/../video/frames'; V=os.path.normpath(V)
a=sys.argv[1:]; opt=lambda k,d: (a[a.index('--'+k)+1] if '--'+k in a else d)
fond=a[0]; brut=os.path.join(R,opt('brut','frames/fv-brut')); jr=os.path.join(R,opt('journal','journaux/fv-journal.json'))
L,H=1440,900; t0=time.time()
J=json.load(open(jr)); n=J['n']
manque=[i for i in range(n) if not os.path.exists(f'{brut}/{i:04d}.jpg')]
if manque: sys.exit(f'ÉCHEC : {len(manque)} image(s) brute(s) manquante(s) sur {n} (première : {manque[0]:04d}) — relancer le rendu')
sortie=opt('sortie',V+'/FV'); jsortie=opt('journal-sortie',V+'/journal-FV.json'); os.makedirs(sortie,exist_ok=True)      # (--sortie / --journal-sortie : pour un essai, sans toucher à la livraison)
for f in os.listdir(sortie):
    if f.endswith('.jpg'): os.remove(os.path.join(sortie,f))
def reduire(im): return im if im.size==(L,H) else im.resize((L,H),Image.LANCZOS)
B0=None
for i in range(n):
    im=reduire(Image.open(f'{brut}/{i:04d}.jpg').convert('RGB')); im.save(f'{sortie}/{i:04d}.jpg',quality=95)
    if i==0: B0=np.asarray(im).astype(np.float32)
# l'image 0 : le fond lui-même (comparé à l'image 0 du navigateur AVANT le JPEG final : l'écart qui reste est celui du JPEG 98 de la photo d'écran)
F0=reduire(Image.open(fond).convert('RGB')); A0=np.asarray(F0).astype(np.float32)
d=np.abs(A0-B0); eqm=float(((A0-B0)**2).mean()); psnr=99.0 if eqm<1e-9 else 10*np.log10(255*255/eqm)
F0.save(f'{sortie}/0000.jpg',quality=95)
ss=J.get('rendu',{}).get('ss',2)
print(f'image 0 : écart navigateur / fond réduit — moyen {d.mean():.2f}, maximal {d.max():.0f} sur 255, PSNR {psnr:.1f} dB',
      '(le fond, intact)' if psnr>=46 else ('(brouillon à 1 px par px : le navigateur réduit le fond à sa façon, écart attendu ; le rendu livré se fait à SS=2)' if ss<2 else '— ATTENTION : la première image du navigateur n’est pas le fond'))
# le journal livré
out={'n':n,'reperes':J['reperes'],'dossier':J['dossier'],'ips':30,'duree_s':J['duree_s'],'largeur':L,'hauteur':H,'details':J.get('details',{}),'fond':os.path.abspath(fond),
     'image0':{'psnr_navigateur_fond_db':round(float(psnr),1)},'rendu':J.get('rendu',{})}
json.dump(out,open(jsortie,'w'),ensure_ascii=False,indent=1)
print(f'{n} images → {sortie} ; journal → {jsortie} ({time.time()-t0:.1f} s)')
if '--sans-controle' not in a:
    C=R+'/controle-v2'
    subprocess.run(['/usr/bin/python3','-I',R+'/f-planche.py',sortie,C+'/planche-fv.jpg','--pas','3','--cols','6','--larg','480'],check=True)
    t=J.get('details',{}).get('tuiles',[24,36,48])
    shutil.copy(f'{sortie}/{min(n-1,t[2]+8):04d}.jpg',C+'/fixe-fv-tuiles.jpg')      # la troisième tuile allumée, les deux premières marquées
    shutil.copy(f'{sortie}/{n-1:04d}.jpg',C+'/fixe-fv-outils.jpg')                   # la dernière image : « Dossier » pressé
    print('contrôle →',C+'/planche-fv.jpg',C+'/fixe-fv-tuiles.jpg',C+'/fixe-fv-outils.jpg')
