// Vidéo 3 (démonstration de l'application) — séquence « fiche parcelle » (FV) : l'animation de la fiche de la vidéo 2, refaite pour un cadre 1440×900.
// Ce fichier ne sert qu'à scenes/f2-fiche-site.html. Rien de la vidéo 2 n'est modifié : lib/m-fiche.js (captures de la fiche, caméra) est importé tel quel ;
// les outils de rythme sont recopiés de lib/s-commun.js (mêmes formules), les cadres de lib/m-fiche.js (même style, tailles ramenées au cadre 1440×900).
//   · LE TEMPS : la scène est écrite dans le temps de la vidéo 2 (un temps = 0,55 s) et lue 1,375 fois plus vite : un temps = 0,4 s = 12 images.
//     Tout ce qui dure (ressorts, pulsations, glissements des cadres, flou de mouvement) est donc resserré dans la même proportion, rien n'est retouché à la main.
//   · LA NETTETÉ : le canevas est peint à « ss » px par px de l'image finale (2 pour le rendu : 2880×1800), toujours à partir des captures à 5 px par px CSS ;
//     les images sont ensuite ramenées en 1440×900 par PIL LANCZOS (f-finir.py), exactement comme le coordinateur ramène ses propres images.
//   · LE FOND : une image fixe de l'application (2880×1800), intacte sur la première image, puis assombrie, à peine avancée vers le terrain, floutée dans les gros plans.
import {clamp,lerp,prog,ease} from '/lib/anim.js';
import {fiche,ecran,arrondi,CARTE_FOND,FOND} from '/lib/m-fiche.js';

export const L=1440, H=900;                                   // le cadre de la vidéo 3
export const TEMPS=0.55, TEMPS_REEL=0.4, V2=TEMPS_REEL/TEMPS; // un temps de la vidéo 2 (unité de la scène) ; sa durée réelle ici ; rapport des deux
export const IMG=1/30/V2;                                     // une image du film (1/30 s) dans le temps de la scène
export const temps=(n)=>Math.round(n*TEMPS*1e6)/1e6;          // le n-ième temps de la séquence (n peut être fractionnaire : 1/3, 1/6 de temps)
export const image=(t)=>Math.round(t/IMG);                    // l'index de l'image du film à l'instant t de la scène
export const rendu={ss:1};                                    // px du canevas par px de l'image finale
export const VERT='#4ADE80';
const Q=0.8;                                                  // épaisseurs, lueurs et ombres de la vidéo 2 (1920×1080) ramenées au cadre 1440×900

// ───── outils de rythme : recopiés de lib/s-commun.js (inchangés) ─────
export const ressort=(u,w=16,z=0.42)=>{ if(u<=0) return 0; w*=0.82; z=Math.min(0.93,z+0.22); const wd=w*Math.sqrt(1-z*z); return 1-Math.exp(-z*w*u)*(Math.cos(wd*u)+(z*w/wd)*Math.sin(wd*u)); };
export const chute=(t,t0,duree=0.25,p=2)=>{ const u=t-t0, A=1/30; if(u<0) return 0; if(u<A) return 0.5+0.5*u/A; return Math.pow(clamp(1-(u-A)/Math.max(duree,0.2)),p); };
export const pouls=(t,t0,montee=0.1,retombee=0.4)=>{ const u=t-t0; if(u<=0) return 0; if(u<montee) return ease.smooth(u/montee); return Math.pow(clamp(1-(u-montee)/retombee),2); };

// ───── le fond : l'image fixe de l'application ─────
const charger=(src)=>new Promise((ok,ko)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>ko(new Error('fond introuvable : '+src));i.src=src;});
export const fond={img:null};
export async function chargerFond(src){ fond.img=await charger(src); const r=fond.img.naturalWidth/fond.img.naturalHeight; if(Math.abs(r-L/H)>0.01) console.error(`le fond n'est pas au rapport 16:10 (${fond.img.naturalWidth}×${fond.img.naturalHeight}) : il sera étiré`); return fond; }
// k : grossissement autour du terrain (tx, ty en px du cadre ; 1 = image intacte) ; sombre : voile sombre (0 = aucun) ; flou : en px du cadre
export function peindreFond(g,{k=1,tx=L/2,ty=H/2,sombre=0,flou=0}={}){
  const S=rendu.ss; g.setTransform(1,0,0,1,0,0); g.globalCompositeOperation='source-over'; g.globalAlpha=1; g.shadowColor='transparent'; g.imageSmoothingEnabled=true; g.imageSmoothingQuality='high';
  g.filter='none'; if(flou>0.15){ g.fillStyle=FOND; g.fillRect(0,0,L*S,H*S); g.filter=`blur(${(flou*S).toFixed(2)}px)`; }
  g.setTransform(S*k,0,0,S*k,S*tx*(1-k),S*ty*(1-k)); g.drawImage(fond.img,0,0,L,H); g.filter='none';
  g.setTransform(S,0,0,S,0,0); if(sombre>0.002){ g.fillStyle=`rgba(10,12,11,${sombre.toFixed(4)})`; g.fillRect(0,0,L,H); }
}
// un anneau à plat (option, éteinte par défaut) : trait fin #4ADE80 qui s'élargit et s'efface, comme au clic de la vidéo 2
export function anneau(g,x,y,t,t0,{r0=14,r1=90,duree=0.6,ep=3,ep1=1.2}={}){
  const q=prog(t,t0,t0+duree); if(t<=t0||q>=1) return; const e=ease.out(q), S=rendu.ss;
  g.save(); g.setTransform(S,0,0,S,0,0); g.globalCompositeOperation='source-over'; g.filter='none'; g.shadowColor='transparent';
  g.globalAlpha=Math.pow(1-q,1.4); g.strokeStyle=VERT; g.lineWidth=lerp(ep,ep1,e); g.beginPath(); g.arc(x,y,lerp(r0,r1,e),0,7); g.stroke(); g.restore(); }

// ───── les cadres vert menthe : recopiés de lib/m-fiche.js (même tracé, même lueur) ; les lueurs et les ombres, que le canevas compte en px réels, suivent « ss » ─────
const lisser=(ctx)=>{ ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high'; };
export function cadre(ctx,R,{alpha=1,ep=5,couleur=VERT,lueur=26,rayon=14,plein=0,gonfle=0}={}){
  if(alpha<=0.003) return; ep*=Q; gonfle*=Q; lueur*=Q*rendu.ss; const [x,y,w,h]=[R[0]-gonfle,R[1]-gonfle,R[2]+2*gonfle,R[3]+2*gonfle];
  ctx.save(); ctx.globalAlpha=Math.min(1,alpha); if(plein>0.003){ ctx.fillStyle=`rgba(74,222,128,${plein})`; arrondi(ctx,x,y,w,h,rayon); ctx.fill(); }
  ctx.strokeStyle=couleur; ctx.lineWidth=ep; ctx.shadowColor=couleur; ctx.shadowBlur=lueur; arrondi(ctx,x,y,w,h,rayon); ctx.stroke();
  ctx.shadowBlur=lueur*0.35; ctx.stroke(); ctx.restore();
}
// soulève un élément (s > 1) : ses pixels agrandis autour de son centre, détourés selon ses coins, avec une ombre — ou l'enfonce (s < 1) : sa place est d'abord
// rendue au fond du panneau, puis ses pixels sont reposés plus petits, un peu assombris (creux) ; r : dans le document courant ; src : où le lire dans la capture « doc »
export function poser(ctx,e,r,s,{doc='F',src=r,fixe=false,ombre=0.6,rayon=8,creux=0}={}){
  const q=ecran(e,r,fixe); if(Math.abs(s-1)<=0.002&&creux<=0.003) return q; const J=fiche.jeux[5], D=J.D, S=rendu.ss, w=q[2]*s, h=q[3]*s, x=q[0]+q[2]/2-w/2, y=q[1]+q[3]/2-h/2, rr=e.k*rayon*s;
  ctx.save(); lisser(ctx);
  if(s<1){ ctx.fillStyle=FOND; ctx.fillRect(q[0]-1,q[1]-1,q[2]+2,q[3]+2); }
  else { ctx.shadowColor=`rgba(0,0,0,${ombre})`; ctx.shadowBlur=46*(s-1)*8*Q*S; ctx.shadowOffsetY=18*(s-1)*8*Q*S; }
  ctx.fillStyle=CARTE_FOND; arrondi(ctx,x,y,w,h,rr); ctx.fill(); ctx.shadowColor='transparent';
  arrondi(ctx,x,y,w,h,rr); ctx.clip(); ctx.drawImage(J[doc],src[0]*D,src[1]*D,src[2]*D,src[3]*D,x,y,w,h);
  if(creux>0.003){ ctx.fillStyle=`rgba(4,6,5,${creux})`; ctx.fillRect(x,y,w,h); }
  ctx.restore(); return [x,y,w,h];
}
