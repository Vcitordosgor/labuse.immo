# Prépare toute la matière du film à partir des données ouvertes, pour UN terrain donné.
#   python3 -I donnees.py --idu 97415000EY0109            (tout)
#   python3 -I donnees.py --idu ... --etapes terrain,ortho (seulement certaines étapes : contours, cadastre, points, terrain, ortho)
# Sources : cadastre Etalab (toutes les parcelles du département 974), photos aériennes IGN (WMS data.geopf.fr),
# contours de l'île et des communes servis publiquement par l'application.
# Après un changement de terrain, il reste à la main : la ligne TERRAIN de lib/cadre.js (le script l'affiche), le nom du fichier
# de voisinage dans lib/plongee.js, le fil d'Ariane (scenes/a2, a3) et les valeurs de la fiche (scenes/a3), relevées dans l'application.
import gzip, json, struct, math, os, subprocess, sys, collections
R=os.path.dirname(os.path.abspath(__file__)); D=R+'/data'; O=D+'/ortho'
a=sys.argv[1:]; opt=lambda k,d=None: (a[a.index('--'+k)+1] if '--'+k in a else d)
IDU=opt('idu','97415000EY0109'); ETAPES=(opt('etapes','contours,cadastre,points,terrain,ortho')).split(',')
LON0, LAT0 = 55.53, -21.13; K=math.cos(math.radians(LAT0))            # projection locale, en mètres, centrée sur l'île
proj=lambda lon,lat: ((lon-LON0)*K*111320.0, (lat-LAT0)*110540.0)
lon=lambda x: LON0+x/(K*111320.0); lat=lambda y: LAT0+y/110540.0
# le cadre d'arrivée du film (voir lib/cadre.js) : 400 m de large, le terrain posé en (620, 520) sur 1920 × 1080
S1=1920/400; A1=(620,520)
CAD='https://cadastre.data.gouv.fr/data/etalab-cadastre/latest/geojson/departements/974/cadastre-974-parcelles.json.gz'
def curl(url,out,delai=900):
    r=subprocess.run(['curl','-sSL','--max-time',str(delai),'-o',out,'-w','%{http_code} %{size_download}',url],capture_output=True,text=True)
    print('  ',os.path.basename(out),'→',r.stdout,r.stderr[:120]); return r.stdout.startswith('200')
os.makedirs(O,exist_ok=True)
if 'contours' in ETAPES:
    for f in ('ile974.geojson','communes974.geojson'):
        if not os.path.exists(f'{D}/{f}'): curl('https://app.labuse.immo/'+f,f'{D}/{f}',60)
if 'cadastre' in ETAPES and not os.path.exists(D+'/cadastre-974-parcelles.json.gz'):
    curl(CAD,D+'/cadastre-974-parcelles.json.gz')
fe=None
def charger():
    global fe
    if fe is None:
        with gzip.open(D+'/cadastre-974-parcelles.json.gz','rt',encoding='utf-8') as f: fe=json.load(f)['features']
        print('  parcelles dans le fichier Etalab :',len(fe))
    return fe
def centre(ft):                                                        # centre de la boîte englobante du plus grand anneau extérieur
    g=ft['geometry']; polys=g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]; best=None
    for p in polys:
        r=p[0]; lx=[c[0] for c in r]; ly=[c[1] for c in r]; s=(max(lx)-min(lx))*(max(ly)-min(ly))
        if best is None or s>best[0]: best=(s,(min(lx)+max(lx))/2,(min(ly)+max(ly))/2)
    return proj(best[1],best[2])
if 'points' in ETAPES:
    recs=[]; comm=collections.Counter()
    for ft in charger():
        x,y=centre(ft); pr=ft['properties']; c=pr.get('commune',''); comm[c]+=1; recs.append((x,y,c,pr.get('contenance') or 0))
    codes=sorted(comm); idx={c:i for i,c in enumerate(codes)}
    with open(D+'/parcelles.bin','wb') as f:
        for x,y,c,ct in recs: f.write(struct.pack('<ffBf',x,y,idx[c],float(ct)))
    xs=[r[0] for r in recs]; ys=[r[1] for r in recs]
    lm=subprocess.run(['curl','-sSLI','--max-time','40',CAD],capture_output=True,text=True).stdout
    mil=next((l.split(':',1)[1].strip() for l in lm.splitlines() if l.lower().startswith('last-modified')),'')
    json.dump({'n':len(recs),'lon0':LON0,'lat0':LAT0,'k':K,'xmin':min(xs),'xmax':max(xs),'ymin':min(ys),'ymax':max(ys),'communes':codes,
               'par_commune':[comm[c] for c in codes],'octets_par_enregistrement':13,'millesime':mil},open(D+'/parcelles.meta.json','w'))
    print('  parcelles.bin :',len(recs),'points,',len(codes),'communes, millésime',mil)
PX=PY=None
if 'terrain' in ETAPES or 'ortho' in ETAPES:
    c=[ft for ft in charger() if ft['properties'].get('id')==IDU]
    if not c: sys.exit('terrain introuvable dans le cadastre : '+IDU)
    PX,PY=centre(c[0]); pr=c[0]['properties']; codes=json.load(open(D+'/parcelles.meta.json'))['communes']
    ref=f"{pr.get('section','')} {pr.get('numero','')}".strip()
    print(f"  terrain {IDU} : contenance {pr.get('contenance')} m², commune {pr.get('commune')}")
    print("  → ligne à reporter dans lib/cadre.js :")
    print(f"    export const TERRAIN={{x:{PX:.2f},y:{PY:.2f},id:'{IDU}',ref:'{ref}',commune:'…',code:'{pr.get('commune')}',indice:{codes.index(pr.get('commune'))},section:'{pr.get('section','')}'}};")
if 'terrain' in ETAPES:
    vois=[]
    for ft in charger():
        x,y=centre(ft)
        if abs(x-PX)<900 and abs(y-PY)<600:
            g=ft['geometry']; polys=g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
            vois.append({'id':ft['properties'].get('id'),'c':ft['properties'].get('contenance') or 0,
                         'r':[[[round(proj(q[0],q[1])[0]-PX,2),round(proj(q[0],q[1])[1]-PY,2)] for q in p[0]] for p in polys]})
    nom=f"voisinage-{IDU[-6:].lstrip('0') if False else IDU[8:]}.json"; json.dump({'cx':PX,'cy':PY,'parcelles':vois},open(f'{D}/{nom}','w'))
    print('  ',nom,':',len(vois),'parcelles voisines (1,8 km × 1,2 km)')
if 'ortho' in ETAPES:
    W=2560; meta=[]
    def wms(x0,x1,y0,y1,out,w,h):
        url=("https://data.geopf.fr/wms-r/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=HR.ORTHOIMAGERY.ORTHOPHOTOS"
             f"&STYLES=&CRS=CRS:84&BBOX={lon(x0):.7f},{lat(y0):.7f},{lon(x1):.7f},{lat(y1):.7f}&WIDTH={w}&HEIGHT={h}&FORMAT=image/jpeg")
        return curl(url,f'{O}/{out}',120)
    for L in (16000,8000,4000,2000,1000):                              # pyramide centrée sur le terrain
        hl=L*1440/W; x0,x1,y0,y1=PX-L/2,PX+L/2,PY-hl/2,PY+hl/2; out=f'ortho-{L}.jpg'; wms(x0,x1,y0,y1,out,W,1440)
        if L>=4000:                                                    # en mer, l'IGN renvoie du blanc : on le remplace par le fond du film
            brut=f'{O}/ortho-{L}.brut.jpg'; os.replace(f'{O}/{out}',brut)
            subprocess.run(['ffmpeg','-v','error','-y','-f','lavfi','-i',f'color=c=0x0A0C0B:s={W}x1440','-i',brut,'-filter_complex',
                            '[1]format=rgba,colorkey=0xFFFFFF:0.012:0.0[k];[0][k]overlay=format=auto,format=yuvj444p','-frames:v','1','-q:v','2',f'{O}/{out}'],check=True)
        meta.append({'largeur_m':L,'fichier':out,'x0':x0,'x1':x1,'y0':y0,'y1':y1,'w':W,'h':1440})
    # le cadre d'arrivée n'est pas centré sur le terrain : on télécharge exactement ce qu'il couvre, avec une marge, à la définition native (20 cm)
    g0,g1=-A1[0]/S1,(1920-A1[0])/S1; b0,b1=-(1080-A1[1])/S1,A1[1]/S1; m=30
    x0,x1,y0,y1=PX+g0-m,PX+g1+m+20,PY+b0-m,PY+b1+m; h=round(W*(y1-y0)/(x1-x0)); wms(x0,x1,y0,y1,'ortho-arrivee.jpg',W,h)
    meta.append({'largeur_m':round(x1-x0),'fichier':'ortho-arrivee.jpg','x0':x0,'x1':x1,'y0':y0,'y1':y1,'w':W,'h':h})
    json.dump({'px':PX,'py':PY,'niveaux':meta},open(O+'/ortho.meta.json','w'),indent=1)
    print('  ortho.meta.json :',[(n['largeur_m'],n['fichier']) for n in meta])
