// La plongée : photos aériennes IGN (pyramide centrée sur la parcelle d'exemple) + traits du cadastre.
import {clamp} from '/lib/anim.js';
export const pl={niveaux:[],px:0,py:0,vois:null,communes:null};
const img=(src)=>new Promise((ok,ko)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=ko;i.src=src;});
export async function charger(){
  const m=await fetch('/data/ortho/ortho.meta.json').then(r=>r.json()); pl.px=m.px; pl.py=m.py;
  pl.niveaux=await Promise.all(m.niveaux.map(async n=>({...n,img:await img('/data/ortho/'+n.fichier)})));
  pl.niveaux.sort((a,b)=>a.largeur_m-b.largeur_m);
  const v=await fetch('/data/voisinage-EY0109.json').then(r=>r.json()); pl.vois=v;
  const c=await fetch('/data/communes974.geojson').then(r=>r.json()); const K=Math.cos(21.13*Math.PI/180);
  const pr=([lon,lat])=>[(lon-55.53)*K*111320,(lat+21.13)*110540];
  pl.communes=Object.fromEntries(c.features.map(f=>[f.properties.code,(f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[f.geometry.coordinates]).map(p=>p[0].map(pr))]));
  return pl;
}
// photo aérienne : on prend le niveau le plus fin qui couvre encore tout le cadre ; dès qu'il faudrait l'agrandir,
// le niveau plus fin suivant vient se fondre par-dessus (au centre, là où il existe) : pas de saut de netteté.
// Quand les couleurs sont pleines (sat = 1), l'assombrissement est un simple voile noir : dix fois plus rapide qu'un filtre.
export function ortho(ctx,cam,alpha=1,{assombrir=0,sat=1}={}){
  if(alpha<=0.003) return; const W=ctx.canvas.width,H=ctx.canvas.height,s=cam.s;
  const gx0=cam.x-(cam.cx)/s, gx1=cam.x+(W-cam.cx)/s, gy1=cam.y+(cam.cy)/s, gy0=cam.y-(H-cam.cy)/s;
  let i=pl.niveaux.length-1; for(let k=0;k<pl.niveaux.length;k++){ const q=pl.niveaux[k]; if(q.x0<=gx0&&q.x1>=gx1&&q.y0<=gy0&&q.y1>=gy1){i=k;break;} }
  const n=pl.niveaux[i], f=i>0&&n.largeur_m<=2000?pl.niveaux[i-1]:null; const dn=n.w/(n.x1-n.x0); const w=f?clamp((s/dn-1)/0.5):0;
  const rect=(q)=>[cam.cx+(q.x0-cam.x)*s, cam.cy-(q.y1-cam.y)*s, (q.x1-q.x0)*s, (q.y1-q.y0)*s];
  const plein=sat>=0.999;
  ctx.save(); ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
  ctx.filter=plein?'none':`saturate(${sat}) brightness(${1-assombrir})`;
  ctx.globalAlpha=alpha; ctx.drawImage(n.img,...rect(n));
  if(w>0.003){ ctx.globalAlpha=alpha*w; ctx.drawImage(f.img,...rect(f)); }
  if(plein&&assombrir>0.002){ ctx.filter='none'; ctx.globalAlpha=alpha*assombrir; ctx.fillStyle='#000'; ctx.fillRect(...rect(n)); }
  ctx.restore();
}
// traits du cadastre autour de la parcelle (coordonnées relatives à la parcelle, en mètres)
// rayon : ne trace que les parcelles à moins de « rayon » mètres du terrain (le cadastre se dessine en partant de lui)
export function cadastre(ctx,cam,alpha=1,{couleur='rgba(74,222,128,0.85)',epais=1.2,sauf=null,rayon=Infinity}={}){
  if(alpha<=0.003||!pl.vois||rayon<=0) return; const s=cam.s, ox=cam.cx+(pl.vois.cx-cam.x)*s, oy=cam.cy-(pl.vois.cy-cam.y)*s;
  ctx.save(); ctx.globalAlpha=alpha; ctx.strokeStyle=couleur; ctx.lineWidth=epais; ctx.lineJoin='round'; ctx.beginPath();
  for(const p of pl.vois.parcelles){ if(p.id===sauf) continue; if(rayon<1e9){ const c=p.r[0][0]; if(Math.hypot(c[0],c[1])>rayon) continue; }
    for(const r of p.r){ r.forEach((c,i)=>{const x=ox+c[0]*s,y=oy-c[1]*s; i?ctx.lineTo(x,y):ctx.moveTo(x,y);}); ctx.closePath(); } }
  ctx.stroke(); ctx.restore();
}
// le contour d'une parcelle en coordonnées d'écran (anneau extérieur le plus long), pour y ancrer un fil
export function contour(cam,id){ const s=cam.s, ox=cam.cx+(pl.vois.cx-cam.x)*s, oy=cam.cy-(pl.vois.cy-cam.y)*s; const p=pl.vois.parcelles.find(q=>q.id===id); if(!p) return [];
  const r=p.r.reduce((a,b)=>b.length>a.length?b:a,p.r[0]); return r.map(c=>[ox+c[0]*s,oy-c[1]*s]); }
// où le segment (x,y) → centre du contour coupe-t-il ce contour ? (le point d'entrée, côté extérieur)
export function ancrage(poly,x,y){ if(!poly.length) return null; let cx=0,cy=0; for(const q of poly){cx+=q[0];cy+=q[1];} cx/=poly.length; cy/=poly.length;
  let best=null; for(let i=0;i<poly.length;i++){ const a=poly[i], b=poly[(i+1)%poly.length]; const rx=cx-x, ry=cy-y, sx=b[0]-a[0], sy=b[1]-a[1]; const d=rx*sy-ry*sx; if(Math.abs(d)<1e-9) continue;
    const t=((a[0]-x)*sy-(a[1]-y)*sx)/d, u=((a[0]-x)*ry-(a[1]-y)*rx)/d; if(t>=0&&t<=1&&u>=0&&u<=1&&(best===null||t<best)) best=t; }
  return best===null?[cx,cy]:[x+(cx-x)*best,y+(cy-y)*best]; }
export function tracerParcelle(ctx,cam,id){ const s=cam.s, ox=cam.cx+(pl.vois.cx-cam.x)*s, oy=cam.cy-(pl.vois.cy-cam.y)*s; const p=pl.vois.parcelles.find(q=>q.id===id); if(!p) return null;
  ctx.beginPath(); let xs=[],ys=[]; for(const r of p.r){ r.forEach((c,i)=>{const x=ox+c[0]*s,y=oy-c[1]*s; xs.push(x);ys.push(y); i?ctx.lineTo(x,y):ctx.moveTo(x,y);}); ctx.closePath(); }
  return {x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys)}; }

// limite d'une commune (contour réel), pour le palier de la descente
export function commune(ctx,cam,code,alpha=1,{couleur='#4ADE80',epais=2.5}={}){
  const P=pl.communes&&pl.communes[code]; if(!P||alpha<=0.003) return; const s=cam.s;
  ctx.save(); ctx.globalAlpha=alpha; ctx.strokeStyle=couleur; ctx.lineWidth=epais; ctx.lineJoin='round'; ctx.shadowColor=couleur; ctx.shadowBlur=14; ctx.beginPath();
  for(const r of P){ r.forEach((c,i)=>{const x=cam.cx+(c[0]-cam.x)*s,y=cam.cy-(c[1]-cam.y)*s; i?ctx.lineTo(x,y):ctx.moveTo(x,y);}); ctx.closePath(); }
  ctx.stroke(); ctx.restore();
}
