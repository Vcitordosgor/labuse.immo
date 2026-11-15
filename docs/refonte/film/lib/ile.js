// L'île dessinée par ses parcelles (cadastre ouvert Etalab, 433 229 parcelles) : un nuage de points
// accumulé dans un tampon flottant puis converti en couleur — rapide, et fidèle à la densité réelle.
import {clamp,lerp,rnd} from '/lib/anim.js';
export const ile={N:0,X:null,Y:null,C:null,ordre:null,meta:null};
export async function charger({cle=null,graine=[1500,27500],alea=2500}={}){
  const [buf,meta]=await Promise.all([fetch('/data/parcelles.bin').then(r=>r.arrayBuffer()),fetch('/data/parcelles.meta.json').then(r=>r.json())]);
  const dv=new DataView(buf), N=buf.byteLength/13; const X=new Float32Array(N),Y=new Float32Array(N),C=new Uint8Array(N),k=new Float32Array(N);
  for(let i=0;i<N;i++){X[i]=dv.getFloat32(i*13,true);Y[i]=dv.getFloat32(i*13+4,true);C[i]=dv.getUint8(i*13+8);
    k[i]=cle?cle(X[i],Y[i],i):Math.hypot(X[i]-graine[0],Y[i]-graine[1])+rnd(i)*alea;}
  const ordre=new Uint32Array(N);for(let i=0;i<N;i++)ordre[i]=i;ordre.sort((a,b)=>k[a]-k[b]);
  // cles triées : permet de retrouver « combien de parcelles ont une clé ≤ v » par dichotomie
  const cles=new Float32Array(N);for(let j=0;j<N;j++)cles[j]=k[ordre[j]];
  Object.assign(ile,{N,X,Y,C,ordre,cles,meta});return ile;
}
export const jusqua=(v)=>{let a=0,b=ile.N;while(a<b){const m=(a+b)>>1;if(ile.cles[m]<=v)a=m+1;else b=m;}return a;};
// la rampe part du NOIR : le nuage est ajouté (lighter) par-dessus le fond, donc le fond ne se teinte jamais
const STOPS=[[0,0,0,0],[0.10,3,40,21],[0.42,30,140,76],[0.72,68,212,120],[1,198,238,212]];
const LUT=new Uint8ClampedArray(1024*3);
for(let i=0;i<1024;i++){const v=i/1023;let k=0;while(k<STOPS.length-2&&v>STOPS[k+1][0])k++;const a=STOPS[k],b=STOPS[k+1],u=clamp((v-a[0])/(b[0]-a[0]));
  LUT[i*3]=lerp(a[1],b[1],u);LUT[i*3+1]=lerp(a[2],b[2],u);LUT[i*3+2]=lerp(a[3],b[3],u);}
let acc=null,img=null,W=0,H=0,tmp=null;
// cam : {x,y} centre du monde (m) placé en (cx,cy) à l'écran, s = pixels par mètre.
// n : nombre de parcelles révélées (dans l'ordre de l'onde) ; front : part des dernières qui scintillent.
// commune : ne dessine que les parcelles d'une commune (indice dans parcelles.meta.json)
// seulFront : ne dessine que la bande des dernières parcelles révélées (un scintillement qui court le long de l'île)
export function dessiner(ctx,cam,{n=ile.N,gain=0.2,front=0,halo=0.55,rayon=0,alpha=1,fond='#0A0C0B',seulFront=false,commune=-1}={}){
  const cv=ctx.canvas; if(cv.width!==W||cv.height!==H){W=cv.width;H=cv.height;acc=new Float32Array(W*H);img=ctx.createImageData(W,H);tmp=document.createElement('canvas');tmp.width=W;tmp.height=H;}
  ctx.globalCompositeOperation='source-over'; ctx.filter='none'; ctx.globalAlpha=1;
  if(fond){ctx.fillStyle=fond;ctx.fillRect(0,0,W,H);}
  if(alpha<=0.003||n<=0) return;
  acc.fill(0); const {X,Y,ordre,C}=ile; const s=cam.s, ox=cam.cx-cam.x*s, oy=cam.cy+cam.y*s; n=Math.min(n,ile.N);
  const nf=Math.floor(front*ile.N), j0=n-nf; const rho=Math.min(4,Math.max(0,(rayon-0.5)*1.15)), r=Math.ceil(rho-1e-6);   // rayon continu : nul à l'échelle de l'île (comme à l'ouverture), puis la couronne extérieure entre en fondu
  for(let j=seulFront?Math.max(0,j0):0;j<n;j++){const i=ordre[j]; if(commune>=0&&C[i]!==commune)continue; const fx=ox+X[i]*s, fy=oy-Y[i]*s; if(fx<5||fy<5||fx>=W-6||fy>=H-6)continue;
    const x=fx|0,y=fy|0,ax=fx-x,ay=fy-y; let w=1; if(j>=j0){const a=(j-j0)/nf; w=seulFront?Math.sin(Math.PI*a):1+5*a*a*(rnd(i+7)>0.5?1:0.2);}
    const p=y*W+x; acc[p]+=w*(1-ax)*(1-ay); acc[p+1]+=w*ax*(1-ay); acc[p+W]+=w*(1-ax)*ay; acc[p+W+1]+=w*ax*ay;
    if(r){ for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){ if(!dx&&!dy)continue; const m=Math.max(dx<0?-dx:dx,dy<0?-dy:dy), c=rho-(m-1); acc[p+dy*W+dx]+=w*(c>=1?1:c)*0.6/(1+dx*dx+dy*dy); } }
  }
  const d=img.data; for(let p=0,q=0;p<acc.length;p++,q+=4){const v=1-Math.exp(-acc[p]*gain); const k=(v*1023|0)*3; d[q]=LUT[k];d[q+1]=LUT[k+1];d[q+2]=LUT[k+2];d[q+3]=255;}
  tmp.getContext('2d').putImageData(img,0,0);
  ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=alpha; ctx.drawImage(tmp,0,0);
  if(halo>0){ctx.globalAlpha=alpha*halo;ctx.filter='blur(7px)';ctx.drawImage(tmp,0,0);ctx.globalAlpha=alpha*halo*0.6;ctx.filter='blur(22px)';ctx.drawImage(tmp,0,0);}
  ctx.filter='none';ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
}
