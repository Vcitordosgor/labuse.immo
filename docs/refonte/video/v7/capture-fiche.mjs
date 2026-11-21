// Capture de la VRAIE fiche parcelle (lecture seule) en très haute définition, pour l'incruster dans la vidéo 2.
// Sorties : fiche/<etat>.png (panneau entier, DPR élevé) + fiche/<etat>.json (boîtes des éléments, en px CSS relatifs au panneau).
import { writeFileSync } from 'fs';
const SP='/tmp/claude-0/-home-user-labuse-immo/c63124ce-02a1-58ce-ac83-598cbc29f87a/scratchpad';
const { launch } = await import(SP+'/video/browser.mjs');
const IDU=process.env.IDU||'97415000EY1231', DPR=+(process.env.DPR||3), H=+(process.env.H||1800);
const b = await launch(['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']);
const ctx = await b.newContext({ viewport:{width:1440,height:H}, deviceScaleFactor:DPR, locale:'fr-FR', timezoneId:'Indian/Reunion', storageState: SP+'/video/state.json' });
const p = await ctx.newPage(); const wait=(ms)=>p.waitForTimeout(ms);
await p.goto('https://app.labuse.immo/', { waitUntil:'networkidle', timeout:60000 }); await wait(2500);
if (p.url().includes('/login')) throw new Error('session expirée');
await p.fill('input[placeholder^="Rechercher"]', IDU); await p.keyboard.press('Enter'); await wait(9000);
await p.fill('input[placeholder^="Rechercher"]', ''); await p.evaluate(()=>document.activeElement&&document.activeElement.blur()); await p.mouse.move(700,1700); await wait(1200);
// repérage du panneau : plus petit ancêtre commun contenant l'IDU et « Signaler une erreur »
const marquer = () => p.evaluate((idu)=>{
  const tous=[...document.querySelectorAll('div,aside,section')];
  const c=tous.filter(e=>{const t=e.innerText||''; const r=e.getBoundingClientRect(); return t.includes(idu)&&t.includes('SDP RESTANTE')&&t.includes('Signaler une erreur')&&r.width>300&&r.width<560;});
  c.sort((a,b)=>a.querySelectorAll('*').length-b.querySelectorAll('*').length);
  const el=c[0]; if(!el) return null; document.querySelectorAll('[data-fiche]').forEach(e=>e.removeAttribute('data-fiche')); el.setAttribute('data-fiche','1');
  let s=el; while(s&&!(s.scrollHeight>s.clientHeight+4&&/auto|scroll/.test(getComputedStyle(s).overflowY))) s=s.parentElement;
  const r=el.getBoundingClientRect();
  return { boite:[r.x,r.y,r.width,r.height].map(v=>Math.round(v*100)/100), defile: s?{sh:s.scrollHeight,ch:s.clientHeight,tag:s.tagName,cls:(s.className||'').toString().slice(0,80)}:null, fond:getComputedStyle(el).backgroundColor, cls:(el.className||'').toString().slice(0,120) };
}, IDU);
const boites = () => p.evaluate(()=>{
  const el=document.querySelector('[data-fiche]'); const R=el.getBoundingClientRect(); const out=[];
  const rel=(e)=>{const r=e.getBoundingClientRect(); return [r.x-R.x,r.y-R.y,r.width,r.height].map(v=>Math.round(v*10)/10);};
  for (const e of el.querySelectorAll('button,a,[role=button]')) { const t=(e.getAttribute('aria-label')||e.innerText||e.title||'').trim().replace(/\s+/g,' ').slice(0,70); if(t&&e.offsetParent) out.push({type:'bouton',t,r:rel(e)}); }
  // tuiles d'indicateurs : plus petit conteneur portant un des six libellés
  for (const lib of ['SURFACE','ZONE','PENTE','EXPOSITION','RISQUES','SDP RESTANTE']) {
    const c=[...el.querySelectorAll('div')].filter(d=>{const t=(d.innerText||'').trim(); return t.includes(lib)&&d.getBoundingClientRect().width>80&&d.getBoundingClientRect().width<200&&d.getBoundingClientRect().height>40;});
    c.sort((a,b)=>b.getBoundingClientRect().width*b.getBoundingClientRect().height-a.getBoundingClientRect().width*a.getBoundingClientRect().height);
    if(c[0]) out.push({type:'indicateur',t:lib,texte:(c[0].innerText||'').trim().replace(/\s+/g,' '),r:rel(c[0])});
  }
  return { panneau:[R.x,R.y,R.width,R.height], elements:out, texte:(el.innerText||'').replace(/\n+/g,' | ').slice(0,6000) };
});
const prendre = async (nom) => {
  const m = await marquer(); if(!m) { console.log(nom,': panneau introuvable'); return; }
  const el = p.locator('[data-fiche]');
  await el.screenshot({ path: `${SP}/video/${process.env.SORTIE||'fiche'}/${nom}.png` });
  const bx = await boites(); writeFileSync(`${SP}/video/${process.env.SORTIE||'fiche'}/${nom}.json`, JSON.stringify({ idu:IDU, dpr:DPR, ...m, ...bx }, null, 1));
  console.log(nom, JSON.stringify(m.boite), 'défilement', JSON.stringify(m.defile), 'fond', m.fond, '| éléments', bx.elements.length);
};
await prendre('fiche-fermee');
// vue d'ensemble de l'écran (pour mémoire)
await p.screenshot({ path: SP+'/video/'+(process.env.SORTIE||'fiche')+'/ecran-entier.png', clip:{x:0,y:0,width:1440,height:900} });
// sections dépliées, une à la fois
for (const nom of (process.env.SECTIONS||'Urbanisme,Potentiel,Risques et environnement,Terrain').split(',')) {
  const btn = p.locator('[data-fiche] button').filter({ hasText: new RegExp('^\\s*'+nom) }).first();
  if (!(await btn.count())) { console.log('section absente :', nom); continue; }
  await btn.scrollIntoViewIfNeeded(); await btn.click(); await wait(1800);
  const cle = nom.toLowerCase().normalize('NFD').replace(/[^a-z]+/g,'-').replace(/-+$/,'');
  await prendre('section-'+cle);
  // on referme : même bouton s'il existe encore, sinon bouton « Retour »
  const again = p.locator('[data-fiche] button').filter({ hasText: new RegExp('^\\s*'+nom) }).first();
  if (await again.count()) { await again.click(); await wait(900); } else { const ret=p.getByRole('button',{name:/retour|fermer le détail/i}).first(); if(await ret.count()){ await ret.click(); await wait(900);} }
}
await p.getByRole('button',{name:'Fermer la fiche'}).click().catch(()=>{}); await wait(800);
await b.close();
