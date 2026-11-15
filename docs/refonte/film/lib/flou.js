// Flou de mouvement des zooms rapides. Quand la caméra plonge ou remonte, tout ce qui est peint sur le canevas
// s'écarte du point visé : la moyenne des sous-images d'un obturateur à 180° revient à superposer des copies de
// l'image, agrandies autour de ce point. Les textes, posés par-dessus en HTML, restent nets.
let tmp=null;
// une passe : moyenne de n copies agrandies de 1 à exp(etire·(n-1)/n) autour de (cx, cy)
function passe(ctx,cx,cy,etire,n){
  const W=ctx.canvas.width,H=ctx.canvas.height; if(!tmp||tmp.width!==W||tmp.height!==H){tmp=document.createElement('canvas');tmp.width=W;tmp.height=H;}
  const g=tmp.getContext('2d'); g.globalCompositeOperation='copy'; g.drawImage(ctx.canvas,0,0);
  for(let i=1;i<n;i++){ const k=Math.exp(etire*i/n); ctx.globalAlpha=1/(i+1); ctx.setTransform(k,0,0,k,cx*(1-k),cy*(1-k)); ctx.drawImage(tmp,0,0); }   // moyenne courante
}
// v : vitesse du zoom, en logarithme d'échelle par seconde (positive ou négative) ; (cx, cy) : le point visé à l'écran
export function flouZoom(ctx,cx,cy,v,fps=30,obturateur=0.5){
  const W=ctx.canvas.width,H=ctx.canvas.height; const loin=Math.max(Math.hypot(cx,cy),Math.hypot(W-cx,cy),Math.hypot(cx,H-cy),Math.hypot(W-cx,H-cy));
  let etire=Math.abs(v)*obturateur/fps; const brut=loin*(Math.exp(etire)-1);                      // longueur de la traînée au bord, en pixels
  const u=Math.max(0,Math.min(1,(brut-0.8)/3.2)); etire*=u*u*(3-2*u);                             // entrée progressive : aucun seuil visible
  const trainee=loin*(Math.exp(etire)-1); if(trainee<0.35) return 0;
  const N=Math.max(2,Math.min(144,Math.ceil(trainee/1.6)));                                       // une copie tous les 1,6 px au bord
  ctx.save(); ctx.globalCompositeOperation='source-over'; ctx.filter='none'; ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
  if(N<=12) passe(ctx,cx,cy,etire,N);
  else { const n1=Math.ceil(Math.sqrt(N)), n2=Math.ceil(N/n1); passe(ctx,cx,cy,etire,n1); passe(ctx,cx,cy,etire/n1,n2); }   // deux passes : n1 × n2 copies réparties sans trou
  ctx.restore(); return N;
}
