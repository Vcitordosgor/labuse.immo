# Photos IGN calées sur les captures : /usr/bin/python3 -I caler.py <dossier des captures> [cle…]   → ortho2/<cle>.jpg (1920×1080) et <cle>@2x.jpg (3840×2160)
import sys, os, json, subprocess, glob
D = os.path.dirname(os.path.abspath(__file__)); src = sys.argv[1]; cles = sys.argv[2:] or [os.path.basename(f)[:-5] for f in sorted(glob.glob(f'{D}/{src}/*.json'))]
os.makedirs(D + '/ortho2', exist_ok=True)
for cle in cles:
    b = json.load(open(f'{D}/{src}/{cle}.json'))['bbox3857']
    for L, H, suf in ((1920, 1080, ''), (3840, 2160, '@2x')):
        out = f'{D}/ortho2/{cle}{suf}.jpg'
        if os.path.exists(out) and os.path.getsize(out) > 20000: continue
        url = ("https://data.geopf.fr/wms-r/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=HR.ORTHOIMAGERY.ORTHOPHOTOS&STYLES=&CRS=EPSG:3857"
               f"&BBOX={b[0]:.3f},{b[1]:.3f},{b[2]:.3f},{b[3]:.3f}&WIDTH={L}&HEIGHT={H}&FORMAT=image/jpeg")
        r = subprocess.run(['curl', '-sSL', '--max-time', '180', '-o', out, '-w', '%{http_code} %{size_download}', url], capture_output=True, text=True); print(cle, suf, r.stdout)
