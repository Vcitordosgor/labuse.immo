// Rendu image par image de la séquence « fiche parcelle » de la vidéo 3 (scenes/f2-fiche-site.html) — variante de lib/n-rendre.mjs :
//   node lib/f-rendre.mjs [--fond f-data/fond.jpg] [--tx 575 --ty 498] [--ss 2] [--de 0] [--a N] [--pas 1] [--sortie frames/fv-brut] [--journal chemin.json] [--anneau 0] [--q 98]
// La page est photographiée à « ss » px par px (2 → images brutes 2880×1800, JPEG qualité 98) ; f-finir.py les ramène en 1440×900 (PIL LANCZOS).
// --de / --a sont des INDEX d'image (30 i/s). Le journal (index des temps forts, centre de « Dossier ») est celui que la scène calcule elle-même.
import { mkdirSync, rmSync, writeFileSync } from 'fs';
const A=process.argv.slice(2); const opt=(k,d)=>{const i=A.indexOf('--'+k);return i<0?d:A[i+1];};
const ROOT='/tmp/claude-0/-home-user-labuse-immo/c63124ce-02a1-58ce-ac83-598cbc29f87a/scratchpad/promo';
const { launch } = await import(ROOT+'/../video/browser.mjs'); const { servir } = await import(ROOT+'/lib/serveur.mjs');
const ss=+opt('ss',2), pas=+opt('pas',1), qual=+opt('q',98), fond=opt('fond','f-data/fond.jpg'), tx=opt('tx','575'), ty=opt('ty','498');
const sortie=ROOT+'/'+opt('sortie','frames/fv-brut');
const srv=await servir(0); const port=srv.address().port;
const b=await launch([]);
const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:ss});
let erreurs=0; p.on('console',m=>{if(m.type()==='error'){erreurs++;console.log('  [page]',m.text().slice(0,300));}}); p.on('pageerror',e=>{erreurs++;console.log('  [erreur]',String(e).slice(0,300));});
const url=`http://127.0.0.1:${port}/scenes/f2-fiche-site.html?fond=/${encodeURIComponent(fond).replace(/%2F/g,'/')}&tx=${tx}&ty=${ty}&ss=${ss}&anneau=${opt('anneau','0')}`;
await p.goto(url,{waitUntil:'networkidle'});
await p.evaluate(async()=>{ if(window.pret) await window.pret; });
const J=await p.evaluate(()=>window.JOURNAL); if(!J){ console.log('ÉCHEC : la scène ne s’est pas chargée'); await b.close(); srv.close(); process.exit(1); }
const de=+opt('de',0), a=+opt('a',J.n);
if(!opt('garder',false)){rmSync(sortie,{recursive:true,force:true});} mkdirSync(sortie,{recursive:true});
const t0=Date.now(); let n=0;
for(let i=de;i<a;i+=pas){ await p.evaluate(async t=>{await window.render(t);}, i/30); await p.screenshot({path:`${sortie}/${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:qual}); n++; }
const s=(Date.now()-t0)/1000;
if(opt('journal','')) writeFileSync(opt('journal',''),JSON.stringify({...J,rendu:{ss,secondes:Math.round(s*10)/10}},null,1));
console.log(`f2-fiche-site : ${n} images (${de} → ${a} sur ${J.n}, ss ${ss}) en ${s.toFixed(1)} s → ${sortie.replace(ROOT+'/','')}${erreurs?` — ${erreurs} ERREUR(S) de page`:''}`);
await b.close(); srv.close(); process.exit(erreurs?2:0);
