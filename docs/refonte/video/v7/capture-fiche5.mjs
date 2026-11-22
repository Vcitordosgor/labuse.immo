// Capture de la vraie fiche à 5 px par px CSS, par bandes assemblées (lecture seule).
// Une fenêtre plus haute que 8192 px physiques se répète dans la capture (limite du rendu logiciel) : on garde donc une
// fenêtre de 1600 px CSS, on fait défiler le corps de la fiche et on recolle les bandes sous l'en-tête fixe.
// Sorties : fiche5/<etat>.png (même mise en page qu'une capture non défilée) + .json (boîtes en px CSS, relatives au panneau).
import { writeFileSync, mkdirSync } from 'fs';
import { execFileSync } from 'child_process';
const SP='/tmp/claude-0/-home-user-labuse-immo/c63124ce-02a1-58ce-ac83-598cbc29f87a/scratchpad';
const { launch } = await import(SP+'/video/browser.mjs');
const IDU=process.env.IDU||'97415000EY1231', DPR=5, H=1600, OUT=SP+'/video/fiche5'; mkdirSync(OUT+'/bandes',{recursive:true});
const b = await launch(['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']);
const ctx = await b.newContext({ viewport:{width:1440,height:H}, deviceScaleFactor:DPR, locale:'fr-FR', timezoneId:'Indian/Reunion', storageState: SP+'/video/state.json' });
const p = await ctx.newPage(); const wait=(ms)=>p.waitForTimeout(ms);
await p.goto('https://app.labuse.immo/', { waitUntil:'networkidle', timeout:60000 }); await wait(2500);
if (p.url().includes('/login')) throw new Error('session expirée');
await p.fill('input[placeholder^="Rechercher"]', IDU); await p.keyboard.press('Enter'); await wait(9000);
await p.fill('input[placeholder^="Rechercher"]', ''); await p.evaluate(()=>document.activeElement&&document.activeElement.blur()); await p.mouse.move(700,1500); await wait(1000);
const reperer = () => p.evaluate((idu)=>{
  const c=[...document.querySelectorAll('div,aside,section')].filter(e=>{const t=e.innerText||''; const r=e.getBoundingClientRect(); return t.includes(idu)&&t.includes('SDP RESTANTE')&&t.includes('Signaler une erreur')&&r.width>300&&r.width<560;});
  c.sort((a,b)=>a.querySelectorAll('*').length-b.querySelectorAll('*').length); const el=c[0]; if(!el) return null;
  let corps=el; while(corps&&!/auto|scroll/.test(getComputedStyle(corps).overflowY)) corps=corps.parentElement; if(!corps) return null;   // l'en-tête (collant) est DANS le conteneur qui défile
  document.querySelectorAll('[data-fiche],[data-corps]').forEach(e=>{e.removeAttribute('data-fiche');e.removeAttribute('data-corps');}); corps.setAttribute('data-fiche','1'); corps.setAttribute('data-corps','1'); corps.style.scrollBehavior='auto';
  const C=corps.getBoundingClientRect(); const colle=[...corps.querySelectorAll('*')].find(x=>getComputedStyle(x).position==='sticky'&&x.getBoundingClientRect().height>60);
  const tete=colle?colle.getBoundingClientRect().bottom-C.y:0;
  return { panneau:[C.x,C.y,C.width,C.height], tete, sh:corps.scrollHeight, ch:corps.clientHeight };
}, IDU);
const boites = (haut) => p.evaluate(()=>{ const el=document.querySelector('[data-fiche]'), corps=document.querySelector('[data-corps]'); const R=el.getBoundingClientRect(); const s=corps.scrollTop; const out=[];
  const rel=(e)=>{const r=e.getBoundingClientRect(); const dans=corps.contains(e); return [r.x-R.x, r.y-R.y+(dans?s:0), r.width, r.height].map(v=>Math.round(v*10)/10);};
  for (const e of el.querySelectorAll('button,a,[role=button]')) { const t=(e.getAttribute('aria-label')||e.innerText||e.title||'').trim().replace(/\s+/g,' ').slice(0,70); if(t&&e.offsetParent) out.push({type:'bouton',t,r:rel(e)}); }
  for (const lib of ['SURFACE','ZONE','PENTE','EXPOSITION','RISQUES','SDP RESTANTE']) { const c=[...el.querySelectorAll('div')].filter(d=>{const t=(d.innerText||'').trim(); const r=d.getBoundingClientRect(); return t.includes(lib)&&r.width>80&&r.width<200&&r.height>40;}); c.sort((a,b)=>b.getBoundingClientRect().width*b.getBoundingClientRect().height-a.getBoundingClientRect().width*a.getBoundingClientRect().height); if(c[0]) out.push({type:'indicateur',t:lib,texte:(c[0].innerText||'').trim().replace(/\s+/g,' '),r:rel(c[0])}); }
  return out; });
const prendre = async (nom) => {
  const m = await reperer(); if(!m) { console.log(nom, ': panneau introuvable'); return; }
  const [px,py,pw,ph]=m.panneau; const total=Math.max(m.sh, m.ch);
  await p.evaluate(()=>{document.querySelector('[data-corps]').scrollTop=0;}); await wait(300);
  const bx = await boites();
  const bandes=[]; const pas=Math.floor(m.ch - m.tete - 80); const maxi=Math.max(0, m.sh-m.ch);
  for (let s=0, k=0; ; k++) { const top=Math.min(s, maxi); await p.evaluate((y)=>{document.querySelector('[data-corps]').scrollTop=y;}, top); await wait(350);
    const reel = await p.evaluate(()=>document.querySelector('[data-corps]').scrollTop);
    await p.screenshot({ path:`${OUT}/bandes/${nom}-${k}.png`, clip:{x:px,y:py,width:pw,height:m.ch} }); bandes.push({k, top:reel});
    if (top >= maxi) break; s += pas; }
  await p.evaluate(()=>{document.querySelector('[data-corps]').scrollTop=0;});
  writeFileSync(`${OUT}/${nom}.json`, JSON.stringify({ idu:IDU, dpr:DPR, panneau:[px,py,pw,total], entete_px_css:m.tete, elements:bx }, null, 1));
  writeFileSync(`${OUT}/bandes/${nom}.json`, JSON.stringify({ nom, dpr:DPR, largeur:pw, tete:m.tete, ch:m.ch, sh:m.sh, total, bandes }));
  console.log(nom, 'panneau', JSON.stringify(m.panneau), 'en-tête collant', m.tete, 'visible', m.ch, 'contenu', m.sh, '→', bandes.length, 'bandes ; hauteur totale', total, 'px CSS');
};
await prendre('fiche-fermee');
for (const nom of (process.env.SECTIONS||'Urbanisme,Terrain,Potentiel,Risques et environnement').split(',')) {
  const btn = p.locator('[data-fiche] button').filter({ hasText: new RegExp('^\\s*'+nom) }).first(); if (!(await btn.count())) { console.log('section absente :', nom); continue; }
  await btn.scrollIntoViewIfNeeded(); await btn.click(); await p.mouse.move(700,1500); await wait(1800);
  await prendre('section-'+nom.toLowerCase().normalize('NFD').replace(/[^a-z]+/g,'-').replace(/-+$/,''));
  const again = p.locator('[data-fiche] button').filter({ hasText: new RegExp('^\\s*'+nom) }).first(); await again.scrollIntoViewIfNeeded(); await again.click(); await p.mouse.move(700,1500); await wait(900);
}
await p.getByRole('button',{name:'Fermer la fiche'}).click().catch(()=>{}); await wait(600);
await b.close();
