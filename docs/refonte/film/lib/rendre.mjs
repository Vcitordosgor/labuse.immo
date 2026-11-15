// Rendu image par image d'une scène : node lib/rendre.mjs scenes/x.html [--de 0] [--a DUR] [--fps 30] [--sortie frames/x] [--pas N] [--l 1920 --h 1080]
// La scène expose window.DUR (secondes) et window.render(t) ; window.pret (promesse) si elle charge des données.
import { mkdirSync, rmSync } from 'fs';
const A=process.argv.slice(2); const scene=A[0]; const opt=(k,d)=>{const i=A.indexOf('--'+k);return i<0?d:A[i+1];};
const ROOT=new URL('..',import.meta.url).pathname.replace(/\/$/,'');
const { launch } = await import(ROOT+'/lib/browser.mjs'); const { servir } = await import(ROOT+'/lib/serveur.mjs');
const fps=+opt('fps',30), L=+opt('l',1920), H=+opt('h',1080), pas=+opt('pas',1), qual=+opt('q',95);
const nom=scene.replace(/^.*\//,'').replace(/\.html$/,''); const sortie=ROOT+'/'+opt('sortie','frames/'+nom);
const srv=await servir(0); const port=srv.address().port;
const b=await launch(['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']);
const p=await b.newPage({viewport:{width:L,height:H},deviceScaleFactor:+opt('dpr',1)});
p.on('console',m=>{if(m.type()==='error')console.log('  [page]',m.text().slice(0,200));}); p.on('pageerror',e=>console.log('  [erreur]',String(e).slice(0,300)));
await p.goto(`http://127.0.0.1:${port}/${scene}`,{waitUntil:'networkidle'});
await p.evaluate(async()=>{await document.fonts.ready; if(window.pret) await window.pret;});
const DUR=await p.evaluate(()=>window.DUR); const de=+opt('de',0), a=+opt('a',DUR);
if(!opt('garder',false)){rmSync(sortie,{recursive:true,force:true});} mkdirSync(sortie,{recursive:true});
const i0=Math.round(de*fps), i1=Math.round(a*fps); const t0=Date.now(); let n=0;
for(let i=i0;i<i1;i+=pas){ await p.evaluate(async t=>{await window.render(t);}, i/fps); await p.screenshot({path:`${sortie}/${String(i).padStart(5,'0')}.jpg`,type:'jpeg',quality:qual}); n++; }
console.log(`${nom} : ${n} images (${de}s → ${a}s sur ${DUR}s, ${fps} i/s) en ${((Date.now()-t0)/1000).toFixed(1)} s → ${sortie.replace(ROOT+'/','')}`);
await b.close(); srv.close();
