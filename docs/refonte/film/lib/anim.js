// Petite boîte à outils d'animation déterministe : tout est fonction du temps t (secondes), jamais de l'horloge.
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const lerp=(a,b,t)=>a+(b-a)*t;
export const prog=(t,a,b)=>clamp((t-a)/(b-a));              // avancement 0→1 entre a et b
export const ease={
  lin:t=>t,
  inOut:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,
  out:t=>1-Math.pow(1-t,3),
  out5:t=>1-Math.pow(1-t,5),
  in:t=>t*t*t,
  outExpo:t=>t>=1?1:1-Math.pow(2,-10*t),
  inOutQuart:t=>t<.5?8*t*t*t*t:1-Math.pow(-2*t+2,4)/2,
  outBack:t=>{const c=1.70158;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);},
  smooth:t=>t*t*(3-2*t),
};
// bruit pseudo-aléatoire stable (même graine → même valeur)
export const rnd=(i)=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};
// nombre « à la française » : 434 582 (espace fine insécable)
export const fr=(n)=>Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ');
// l'oiseau du logo : 19 points pliés autour de l'axe du corps (repris de docs/refonte/video/logo.html)
const PTS=[[2,15],[58,10],[100,18],[120,27],[140,18],[182,10],[238,15],[202,29],[162,40],[135,46],[127,49],[122,53],[120,60],[118,53],[113,49],[105,46],[78,40],[38,29],[2,15]];
export const oiseau=(deg)=>{
  const P=PTS.map(([x,y])=>{const u=(x-120)/118;const phi=deg*Math.PI/180*Math.pow(Math.abs(u),1.6)*(u<0?-1:1);
    const dx=x-120,dy=y-30,c=Math.cos(phi),s=Math.sin(phi);return [120+dx*c-dy*s,30+dx*s+dy*c];});
  const f=(i)=>P[i][0].toFixed(2)+' '+P[i][1].toFixed(2);
  return `M${f(0)} C${f(1)} ${f(2)} ${f(3)} C${f(4)} ${f(5)} ${f(6)} C${f(7)} ${f(8)} ${f(9)} C${f(10)} ${f(11)} ${f(12)} C${f(13)} ${f(14)} ${f(15)} C${f(16)} ${f(17)} ${f(18)} Z`;
};
