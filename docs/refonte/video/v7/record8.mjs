// Vidéo du site, refaite sur l'application actuelle — enregistrement image par image (lecture seule).
// Même déroulé que record6.mjs (ancienne application) :
//   A : carte sombre, de l'île au terrain.
//   B : fond Ortho IGN → clic sur le terrain → la fiche défile → clic « Dossier ».
//   (D : le Dossier PDF, rendu à part par dossier7-render.mjs.)
//   C : retour sur l'île, carte sombre → Couches → PPR multirisque → on la retire → Zonage PLU par parcelle.
//   E : zonage PLU, de l'île au terrain.
// Différence de fabrication : la caméra de la carte est pilotée image par image (zooms exacts, tuiles toujours
// chargées avant la photo) au lieu de la molette. Rien n'est modifié dans le compte ; l'état est remis à la fin.
import { rmSync, mkdirSync, writeFileSync } from 'fs';
const SP = '/tmp/claude-0/-home-user-labuse-immo/c63124ce-02a1-58ce-ac83-598cbc29f87a/scratchpad';
const { launch } = await import(SP + '/video/browser.mjs');
const APP = 'https://app.labuse.immo/';
const IDU = '97415000EY1231';                       // terrain nu de la commune de Saint-Paul (Plateau Caillou)
const TERRAIN = [55.2706074, -21.0297538];          // centre du terrain (lon, lat)
const S = 2;                                        // même ralenti que la v6
const SEGS = (process.env.SEGS || 'A,B,C,E').split(',');
const ZFIN = +(process.env.ZFIN || 17.2);
const PANNEAU = process.env.PANNEAU || 'ouvert';   // 'ferme' : le panneau « Cartes » est rétracté hors champ (A et B : on ne voit que la carte)           // zoom d'arrivée du plan final (zonage PLU)
const XF = { x: 860, y: 470 };                      // où se pose le terrain à la fin du plan final

const b = await launch(['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']);
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: 'fr-FR', timezoneId: 'Indian/Reunion', storageState: SP + '/video/state.json' });
await ctx.addInitScript(() => {
  const mk = () => {
    if (document.getElementById('__cur')) return;
    const c = document.createElement('div'); c.id = '__cur';
    c.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M5 3l14 8-6 1.6L10.4 19z" fill="#fff" stroke="#071009" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, { position: 'fixed', left: '0', top: '0', zIndex: 2147483647, pointerEvents: 'none', transform: 'translate(-200px,-200px)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.5))' });
    const r = document.createElement('div'); r.id = '__rip';
    Object.assign(r.style, { position: 'fixed', left: '0', top: '0', width: '0', height: '0', border: '3px solid #4ADE80', borderRadius: '50%', zIndex: 2147483646, pointerEvents: 'none', opacity: '0' });
    document.body.append(r, c);
  };
  window.__cur = (x, y) => { mk(); document.getElementById('__cur').style.transform = `translate(${x - 5}px,${y - 3}px)`; };
  window.__rip = (x, y, t) => { mk(); const r = document.getElementById('__rip'); const s = 10 + 60 * t;
    Object.assign(r.style, { width: s + 'px', height: s + 'px', transform: `translate(${x - s / 2}px,${y - s / 2}px)`, opacity: String(t >= 1 ? 0 : 0.9 * (1 - t)) }); };
});
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('  [erreur page]', String(e).slice(0, 160)));

const journal = {};
let dir = '', n = 0, nomSeg = '';
const SUF = process.env.SUF || '';
const seg = (name) => { nomSeg = name; dir = SP + '/video/frames/' + name + SUF; rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true }); n = 0; journal[name] = { reperes: {} }; };
const snap = async () => { await p.screenshot({ path: `${dir}/${String(n++).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 }); };
const repere = (cle) => { journal[nomSeg].reperes[cle] = n; };      // index de la PROCHAINE image
const finSeg = () => { journal[nomSeg].n = n; console.log(nomSeg, n, 'images', JSON.stringify(journal[nomSeg].reperes)); writeFileSync(SP + '/video/frames/journal-' + nomSeg + SUF + '.json', JSON.stringify(journal[nomSeg])); };
const wait = (ms) => p.waitForTimeout(ms);
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const ease2 = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const lerp = (a, c, t) => a + (c - a) * t;
let cx = 1500, cy = 1000;
const curseur = async (x, y) => { cx = x; cy = y; await p.mouse.move(x, y); await p.evaluate(([a, c]) => window.__cur(a, c), [x, y]); };
const cacher = () => p.evaluate(() => window.__cur(-200, -200));
const move = async (x, y, steps) => {
  steps *= S; const x0 = cx, y0 = cy;
  for (let i = 1; i <= steps; i++) { const t = ease(i / steps); await curseur(x0 + (x - x0) * t, y0 + (y - y0) * t); await snap(); }
};
const ripple = async () => { for (const t of Array.from({ length: 4 * S }, (_, k) => (k + 1) / (4 * S))) { await p.evaluate(([a, c, s]) => window.__rip(a, c, s), [cx, cy, t]); await snap(); } };

// ── la carte ──
const etat = () => p.evaluate(() => { const m = window.__labuse_map; const c = m.getCenter(); return { centre: [c.lng, c.lat], zoom: m.getZoom() }; });
const repos = (max = 25000) => p.evaluate((max) => new Promise((res) => {      // attend que la carte ait fini de charger et de dessiner
  const m = window.__labuse_map; let fini = false; const ok = () => { if (!fini) { fini = true; res(); } };
  m.once('idle', ok); m.triggerRepaint(); setTimeout(ok, max);
}), max);
const cam = (centre, zoom, ecran, max = 25000) => p.evaluate(([c, z, e, max]) => new Promise((res) => {   // place le point c à l'écran en e (px page), au zoom z
  const m = window.__labuse_map; const r = m.getContainer().getBoundingClientRect(); let fini = false; const ok = () => { if (!fini) { fini = true; res(); } };
  m.once('idle', ok); setTimeout(ok, max);
  m.easeTo({ center: c, zoom: z, offset: [e.x - (r.x + r.width / 2), e.y - (r.y + r.height / 2)], duration: 0 }); m.triggerRepaint();
}), [centre, zoom, ecran, max]);
const ecranDe = (c) => p.evaluate((c) => { const m = window.__labuse_map; const q = m.project(c); const r = m.getContainer().getBoundingClientRect(); return { x: q.x + r.x, y: q.y + r.y }; }, c);
const centreCarte = () => p.evaluate(() => { const r = window.__labuse_map.getContainer().getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });

// ── fond de plan (mémorisé sur le compte : on repart de « Sombre » et on le remet à la fin) ──
const FOND = 'button[aria-label^="Fond de plan"]';
const item = (name) => p.getByRole('button', { name, exact: true });
const menuVisible = () => item('Plan IGN').isVisible().catch(() => false);
const fermerMenu = async () => {
  if (!(await menuVisible())) return;
  // menu ouvert = un voile invisible (div fixed inset-0) recouvre tout l'écran : un clic dessus referme le menu sans toucher la carte
  const voile = await p.evaluate(() => [...document.querySelectorAll('div.fixed.inset-0')].some((d) => d.children.length === 0));
  if (voile) { await p.mouse.click(700, 780); await wait(350); } else { await p.keyboard.press('Escape'); await wait(300); }
  if (await menuVisible()) throw new Error('menu fond de plan resté ouvert');
};
const fond = async () => (await p.locator(FOND).innerText()).trim();
const setFond = async (name) => {
  if ((await fond()) === name) return;
  await p.click(FOND); await wait(500); await item(name).click(); await wait(400); await fermerMenu(); await repos();
};
const fermerFiche = async () => { const f = p.getByRole('button', { name: 'Fermer la fiche' }); if (await f.count()) { await f.first().click(); await wait(1200); } };
const viderRecherche = async () => { await p.fill('input[placeholder^="Rechercher"]', ''); await p.evaluate(() => document.activeElement && document.activeElement.blur()); };

// ── mise en place : on relève la vue « île » de l'application et sa vue « terrain » (celle où elle recadre le terrain) ──
let vueIle, vueTerrain, P, P0;
const miseEnPlace = async () => {
  await p.goto(APP, { waitUntil: 'networkidle' }); await wait(2500);
  if (p.url().includes('/login')) throw new Error('session expirée : relancer login.mjs');
  await setFond('Sombre');
  if (await p.getByText('PPR multirisque', { exact: true }).count()) throw new Error('la liste des couches est ouverte ou une couche est active : état de départ non propre');
  if (PANNEAU === 'ferme') { await p.getByRole('button', { name: 'Fermer le panneau' }).click(); await wait(1500); if (await p.getByText('Tout le foncier de La Réunion.').isVisible().catch(() => false)) throw new Error('panneau non rétracté'); }
  await repos(); vueIle = await etat(); P0 = await ecranDe(TERRAIN);
  await p.fill('input[placeholder^="Rechercher"]', IDU); await p.keyboard.press('Enter'); await wait(7000); await repos();
  if (!(await p.evaluate((id) => document.body.innerText.includes(id), IDU))) throw new Error('fiche non ouverte par la recherche');
  vueTerrain = await etat(); P = await ecranDe(TERRAIN);
  await fermerFiche(); await viderRecherche(); await p.mouse.move(1439, 899); await wait(800);
  console.log('vue île', JSON.stringify(vueIle), 'terrain à l’écran', Math.round(P0.x), Math.round(P0.y), '| vue terrain', JSON.stringify(vueTerrain), 'terrain à l’écran', Math.round(P.x), Math.round(P.y));
};
const vueDeLIle = async () => { await cam(vueIle.centre, vueIle.zoom, await centreCarte()); await repos(); };
const vueDuTerrain = async () => { await cam(vueTerrain.centre, vueTerrain.zoom, await centreCarte()); await repos(); };
// trajet de zoom : le terrain glisse de son point de départ à son point d'arrivée pendant que le zoom monte
const trajet = async (z0, e0, z1, e1, N, chaque) => {
  for (let i = 1; i <= N; i++) { const u = ease2(i / N); const e = { x: lerp(e0.x, e1.x, u), y: lerp(e0.y, e1.y, u) };
    await cam(TERRAIN, lerp(z0, z1, u), e); if (chaque) await chaque(e); await snap(); }
};

await miseEnPlace();

// ── A : carte sombre, de l'île au terrain ──
if (SEGS.includes('A')) {
  await vueDeLIle();
  seg('A'); await cacher();
  for (let i = 0; i < 6; i++) await snap();
  await trajet(vueIle.zoom, P0, vueTerrain.zoom, P, 66);
  await vueDuTerrain(); for (let i = 0; i < 2; i++) await snap();
  finSeg();
}

// ── B : ortho → terrain → fiche → Dossier ──
let finB = { x: 1115, y: 702 };
if (SEGS.includes('B')) {
  await vueDuTerrain();
  seg('B'); cx = 1500; cy = 640; await cacher();
  for (let i = 0; i < 2 * S; i++) await snap();
  // la vue aérienne
  const fb = await p.locator(FOND).boundingBox();
  await move(fb.x + fb.width / 2, fb.y + fb.height / 2, 12);
  await ripple();
  await p.click(FOND);
  for (let i = 0; i < 3 * S; i++) { await wait(200 / S); await snap(); }
  const ob = await item('Ortho IGN').boundingBox();
  await move(ob.x + 60, ob.y + ob.height / 2, 7);
  await ripple();
  repere('ortho');                                   // fondu au montage entre l'image d'avant et l'image d'après
  await item('Ortho IGN').click(); await wait(600); await repos(40000); await wait(600); await repos();
  for (let i = 0; i < 4 * S; i++) await snap();
  await fermerMenu(); await p.mouse.move(cx, cy); await wait(400);
  for (let i = 0; i < 2 * S; i++) await snap();
  // clic sur le terrain
  await move(P.x, P.y, 10);
  await ripple();
  const avant = await etat();
  await p.mouse.click(P.x, P.y);
  for (let i = 0; i < 10 * S; i++) { await wait(350 / S); await snap(); }
  if (!(await p.evaluate((id) => document.body.innerText.includes(id), IDU))) throw new Error('fiche ' + IDU + ' non ouverte au clic');
  await p.getByText('SDP RESTANTE').first().waitFor({ timeout: 15000 });
  const apres = await etat(); console.log('carte au clic : avant', JSON.stringify(avant), 'après', JSON.stringify(apres));
  // la fiche défile (position imposée image par image, départ et arrêt en douceur)
  await move(1240, 560, 7);
  for (let i = 0; i < 12; i++) await snap();
  const dossier = p.getByRole('button', { name: 'Dossier', exact: true });
  const course = await dossier.evaluate((el) => { let e = el; while (e && !(e.scrollHeight > e.clientHeight + 5 && /auto|scroll/.test(getComputedStyle(e).overflowY))) e = e.parentElement; if (!e) return 0; e.setAttribute('data-defile-fiche', '1'); e.style.scrollBehavior = 'auto'; return e.scrollHeight - e.clientHeight; });
  console.log('course de la fiche', course, 'px');
  const NS = 40;
  for (let i = 1; i <= NS; i++) { await p.evaluate((y) => { document.querySelector('[data-defile-fiche]').scrollTop = y; }, Math.round(course * ease2(i / NS))); await p.mouse.move(cx, cy + (i % 2) * 0.5); await snap(); }
  // clic sur « Dossier »
  const db = await dossier.boundingBox();
  await move(db.x + db.width / 2, db.y + db.height / 2, 8);
  await ripple();
  const popup = ctx.waitForEvent('page', { timeout: 60000 }).catch(() => null);
  await p.mouse.click(db.x + db.width / 2, db.y + db.height / 2);
  for (let i = 0; i < 4 * S; i++) { await wait(120 / S); await snap(); }
  const np = await popup; if (np) await np.close();
  finB = { x: cx, y: cy }; journal.B.curseurFinal = finB;
  finSeg();
}

// ── C : retour sur l'île, carte sombre → Couches → PPR multirisque → Zonage PLU ──
const defileur = (el) => { let e = el; while (e && !(e.scrollHeight > e.clientHeight + 5 && /auto|scroll/.test(getComputedStyle(e).overflowY))) e = e.parentElement; return e; };
const defilerListe = async (loc, yCible, N) => {          // amène la ligne « loc » à la hauteur yCible, en N images
  const bb = await loc.boundingBox(); const top0 = await loc.evaluate((el, f) => { const sc = new Function('return ' + f)()(el); sc.style.scrollBehavior = 'auto'; return sc.scrollTop; }, defileur.toString());
  const delta = bb.y + bb.height / 2 - yCible;
  for (let i = 1; i <= N; i++) { await loc.evaluate((el, [f, y]) => { new Function('return ' + f)()(el).scrollTop = y; }, [defileur.toString(), Math.round(top0 + delta * ease2(i / N))]); await p.mouse.move(cx, cy + (i % 2) * 0.5); await snap(); }
};
let zrow = null;
if (SEGS.includes('C')) {
  await fermerFiche(); await viderRecherche();
  await setFond('Sombre');
  await vueDeLIle(); await p.mouse.move(finB.x, finB.y); await wait(1500); await repos();
  seg('C'); await curseur(finB.x, finB.y);
  for (let i = 0; i < 8 * S; i++) await snap();
  // Couches
  const cb = await p.locator('text=COUCHES').first().boundingBox();
  await move(cb.x + 280, cb.y + 8, 9);
  await ripple();
  await p.mouse.click(cb.x + 280, cb.y + 8);
  for (let i = 0; i < 3 * S; i++) { await wait(250 / S); await snap(); }
  await move(240, 520, 6);
  const row = p.getByText('PPR multirisque', { exact: true }).first();
  await defilerListe(row, 470, 22);
  // PPR multirisque
  let rb = await row.boundingBox();
  await move(rb.x + 40, rb.y + rb.height / 2, 7);
  await ripple();
  repere('ppr');
  await p.mouse.click(rb.x + 40, rb.y + rb.height / 2); await wait(800); await repos(60000); await wait(500); await repos();
  for (let i = 0; i < 14 * S; i++) await snap();
  // on la retire (le curseur est déjà sur la ligne)
  await ripple();
  repere('pprOff');
  await p.mouse.click(rb.x + 40, rb.y + rb.height / 2); await wait(600); await repos(40000);
  for (let i = 0; i < 6 * S; i++) await snap();
  // on remonte jusqu'à « Zonage PLU par parcelle (calibré) » et on la coche
  zrow = p.getByText('Zonage PLU par parcelle (calibré)', { exact: true }).first();
  await defilerListe(zrow, 330, 26);
  const zb = await zrow.boundingBox();
  await move(zb.x + 40, zb.y + zb.height / 2, 7);
  await ripple();
  repere('plu');
  await p.mouse.click(zb.x + 40, zb.y + zb.height / 2); await wait(800); await repos(60000); await wait(500); await repos();
  for (let i = 0; i < 6 * S; i++) await snap();
  // le curseur part sur la carte, à l'endroit du terrain
  await move(P0.x, P0.y, 10);
  for (let i = 0; i < 3 * S; i++) await snap();
  finSeg();
}

// ── E : zonage PLU, de l'île au terrain (le curseur reste sur le terrain) ──
if (SEGS.includes('E')) {
  if (!zrow) {   // E seul : on remet la carte dans l'état de la fin de C (île, carte sombre, liste des couches ouverte, zonage PLU coché)
    await fermerFiche(); await viderRecherche(); await setFond('Sombre'); await vueDeLIle();
    const cb = await p.locator('text=COUCHES').first().boundingBox(); await p.mouse.click(cb.x + 280, cb.y + 8); await wait(1200);
    zrow = p.getByText('Zonage PLU par parcelle (calibré)', { exact: true }).first();
    const zb = await zrow.boundingBox(); await p.mouse.click(zb.x + 40, zb.y + zb.height / 2); await wait(800); await repos(60000); await wait(500); await repos();
  }
  seg('E'); await curseur(P0.x, P0.y);
  await snap();
  await trajet(vueIle.zoom, P0, ZFIN, XF, 66, (e) => curseur(e.x, e.y));
  await repos(40000); for (let i = 0; i < 2; i++) await snap();
  finSeg();
}

// ── remise en état : zonage décoché, liste des couches repliée, carte sombre, vue île ──
if (zrow) {
  const zb2 = await zrow.boundingBox(); if (zb2) { await p.mouse.click(zb2.x + 40, zb2.y + zb2.height / 2); await wait(800); }
  const cb = await p.locator('text=COUCHES').first().boundingBox(); await p.mouse.click(cb.x + 280, cb.y + 8); await wait(600);
}
await fermerFiche(); await setFond('Sombre');
writeFileSync(SP + '/video/frames/journal' + (process.env.SEGS ? '-' + SEGS.join('') : '') + '.json', JSON.stringify({ idu: IDU, vueIle, vueTerrain, P, P0, ZFIN, XF, segments: journal }, null, 1));
console.log('fond final :', await fond(), '| couches actives restantes :', await p.getByText('Zonage PLU par parcelle (calibré)', { exact: true }).count());
await b.close();
