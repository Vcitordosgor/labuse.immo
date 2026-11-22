// Vidéo du site v9 — enregistrement image par image (lecture seule) : plus rapide, avec la vue 3D et la recherche par filtres.
//   G : sur le terrain, carte sombre → 3D (relief + bâtiments), la caméra recule et tourne → retour 2D.
//   B : vue aérienne → clic sur le terrain → la fiche défile → Dossier.
//   C : île → Couches → PPR multirisque (puis retiré) → Zonage PLU ;  E : zoom sur le zonage.
//   F : île → Filtres → Saint-Denis → 600 m² minimum, terrain nu → détenu par une société → liste brute.
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
const S = +(process.env.S || 1);                                        // même ralenti que la v6
const SEGS = (process.env.SEGS || 'G,B').split(',');
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
  await p.fill('input[placeholder^="Rechercher"]', IDU); await p.keyboard.press('Enter'); await p.getByText('SDP RESTANTE').first().waitFor({ timeout: 90000 }); await wait(2500); await repos();
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
const tenir = async (k) => { for (let i = 0; i < k; i++) await snap(); };
const cliquer = async (x, y, pas, apres = 2) => { await move(x, y, pas); await ripple(); await p.mouse.click(x, y); for (let i = 0; i < apres; i++) { await wait(160); await snap(); } };
const centreDe = async (loc) => { const b = await loc.boundingBox(); if (!b) throw new Error('élément introuvable'); return { x: b.x + b.width / 2, y: b.y + b.height / 2, b }; };
const defileur = (el) => { let e = el; while (e && !(e.scrollHeight > e.clientHeight + 5 && /auto|scroll/.test(getComputedStyle(e).overflowY))) e = e.parentElement; return e; };
const defilerListe = async (loc, yCible, N) => {          // amène l'élément « loc » à la hauteur yCible, en N images
  const bb = await loc.boundingBox(); const top0 = await loc.evaluate((el, f) => { const sc = new Function('return ' + f)()(el); sc.style.scrollBehavior = 'auto'; return sc.scrollTop; }, defileur.toString());
  const delta = bb.y + bb.height / 2 - yCible;
  for (let i = 1; i <= N; i++) { await loc.evaluate((el, [f, y]) => { new Function('return ' + f)()(el).scrollTop = y; }, [defileur.toString(), Math.round(top0 + delta * ease2(i / N))]); await p.mouse.move(cx, cy + (i % 2) * 0.5); await snap(); }
};

// ── G : la vue 3D (relief + bâtiments) sur la carte sombre, puis retour en 2D ──
if (SEGS.includes('G')) {
  await vueDuTerrain();
  const b3 = p.locator('button[aria-label^="Relief 3D"]').first();
  const etat3 = () => p.evaluate(() => { const m = window.__labuse_map; return { zoom: m.getZoom(), pitch: m.getPitch(), bearing: m.getBearing() }; });
  const cam3 = (z, pi, be, max = 40000) => p.evaluate(([c, z, pi, be, e, max]) => new Promise((res) => { const m = window.__labuse_map; const r = m.getContainer().getBoundingClientRect(); let f = false; const ok = () => { if (!f) { f = true; res(); } };
    m.once('idle', ok); setTimeout(ok, max); m.easeTo({ center: c, zoom: z, pitch: pi, bearing: be, offset: [e.x - (r.x + r.width / 2), e.y - (r.y + r.height / 2)], duration: 0 }); m.triggerRepaint(); }), [TERRAIN, z, pi, be, { x: P.x + 150, y: P.y + 40 }, max]);
  const POSE = { zoom: 16.5, pitch: 60, bearing: -30 }, POSE2 = { zoom: 16.75, pitch: 58, bearing: -6 };
  const mode = async (nom) => { await b3.click(); await wait(600); await item(nom).click(); await wait(1500); await repos(60000); };
  // hors champ : un premier passage en 3D pour charger le relief et les bâtiments des deux poses
  await mode('Relief + bâtiments'); await cam3(POSE.zoom, POSE.pitch, POSE.bearing); await wait(3000); await repos(60000); await cam3(POSE2.zoom, POSE2.pitch, POSE2.bearing); await wait(2000); await repos(60000);
  await mode('Aucun (2D)'); await p.evaluate(() => window.__labuse_map.jumpTo({ pitch: 0, bearing: 0 })); await vueDuTerrain(); await p.mouse.move(1439, 899); await wait(800);
  seg('G'); cx = 1500; cy = 640; await cacher();
  await tenir(2);
  let c = await centreDe(b3); await cliquer(c.x, c.y, 9, 3);
  c = await centreDe(item('Relief + bâtiments')); await move(c.b.x + 80, c.y, 5); await ripple();
  repere('en3d');
  await item('Relief + bâtiments').click(); await wait(1500); await repos(60000); await wait(2000); await repos(60000);
  const e0 = await etat3(); await snap();
  for (let i = 1; i <= 26; i++) { const u = ease2(i / 26); await cam3(lerp(e0.zoom, POSE.zoom, u), lerp(e0.pitch, POSE.pitch, u), lerp(e0.bearing, POSE.bearing, u)); await snap(); }
  repere('orbite');
  for (let i = 1; i <= 22; i++) { const u = i / 22; const v = u * u * (3 - 2 * u); await cam3(lerp(POSE.zoom, POSE2.zoom, v), lerp(POSE.pitch, POSE2.pitch, v), lerp(POSE.bearing, POSE2.bearing, v)); if (i === 8) { c = await centreDe(b3); } if (i >= 8) { const w = ease((i - 7) / 15); await curseur(lerp(cx, c.x, w * 0.35), lerp(cy, c.y, w * 0.35)); } await snap(); }
  c = await centreDe(b3); await cliquer(c.x, c.y, 4, 3);
  c = await centreDe(item('Aucun (2D)')); await move(c.b.x + 80, c.y, 4); await ripple();
  repere('en2d');
  await item('Aucun (2D)').click(); await wait(1500); await repos(60000);
  await p.evaluate(() => window.__labuse_map.jumpTo({ pitch: 0, bearing: 0 })); await repos();
  const e1 = await etat3(); await cam(TERRAIN, e1.zoom, { x: P.x + 150, y: P.y + 40 }); await snap();
  for (let i = 1; i <= 14; i++) { const u = ease2(i / 14); await cam(TERRAIN, lerp(e1.zoom, vueTerrain.zoom, u), { x: lerp(P.x + 150, P.x, u), y: lerp(P.y + 40, P.y, u) }); await snap(); }
  await vueDuTerrain(); await tenir(2);
  journal.G.curseurFinal = { x: cx, y: cy };
  finSeg();
}

// ── B : vue aérienne → terrain → fiche → Dossier ──
let finB = { x: 1115, y: 702 };
if (SEGS.includes('B')) {
  await vueDuTerrain();
  seg('B'); if (journal.G) await curseur(journal.G.curseurFinal.x, journal.G.curseurFinal.y); else { cx = 1500; cy = 640; await cacher(); }
  await tenir(1);
  let c = await centreDe(p.locator(FOND)); await cliquer(c.x, c.y, 6, 3);
  c = await centreDe(item('Ortho IGN')); await move(c.b.x + 60, c.y, 4); await ripple();
  repere('ortho');
  await item('Ortho IGN').click(); await wait(600); await repos(40000); await wait(600); await repos();
  await tenir(3);
  await fermerMenu(); await p.mouse.move(cx, cy); await wait(400);
  await tenir(1);
  repere('clic');
  await move(P.x, P.y, 8); await ripple();
  await p.mouse.click(P.x, P.y);
  for (let i = 0; i < 8; i++) { await wait(260); await snap(); }
  await p.getByText('SDP RESTANTE').first().waitFor({ timeout: 60000 }); await wait(600);
  repere('fiche');
  await move(1240, 470, 5); await tenir(8);
  const dossier = p.getByRole('button', { name: 'Dossier', exact: true });
  const course = await dossier.evaluate((el) => { let e = el; while (e && !(e.scrollHeight > e.clientHeight + 5 && /auto|scroll/.test(getComputedStyle(e).overflowY))) e = e.parentElement; if (!e) return 0; e.setAttribute('data-defile-fiche', '1'); e.style.scrollBehavior = 'auto'; return e.scrollHeight - e.clientHeight; });
  repere('defile');
  const etapes = [[0.36, 11, 4], [0.74, 11, 3], [1, 10, 2]]; let pos = 0;
  for (const [cible, N, pause] of etapes) { for (let i = 1; i <= N; i++) { await p.evaluate((y) => { document.querySelector('[data-defile-fiche]').scrollTop = y; }, Math.round(course * lerp(pos, cible, ease2(i / N)))); await p.mouse.move(cx, cy + (i % 2) * 0.5); await snap(); } pos = cible; await tenir(pause); }
  repere('dossier');
  const db = await dossier.boundingBox();
  await move(db.x + db.width / 2, db.y + db.height / 2, 6); await ripple();
  const popup = ctx.waitForEvent('page', { timeout: 60000 }).catch(() => null);
  await p.mouse.click(db.x + db.width / 2, db.y + db.height / 2);
  for (let i = 0; i < 4; i++) { await wait(120); await snap(); }
  const np = await popup; if (np) await np.close();
  finB = { x: cx, y: cy }; journal.B.curseurFinal = finB;
  finSeg();
  await fermerFiche(); await viderRecherche(); await setFond('Sombre');
}

// ── C : l'île, carte sombre → Couches → PPR multirisque → on la retire → Zonage PLU ──
let zrow = null;
if (SEGS.includes('C')) {
  if (process.env.FINB) finB = JSON.parse(process.env.FINB);
  await fermerFiche(); await viderRecherche(); await setFond('Sombre');
  await vueDeLIle(); await p.mouse.move(finB.x, finB.y); await wait(1500); await repos();
  seg('C'); await curseur(finB.x, finB.y);
  await tenir(5);
  const cb = await p.locator('text=COUCHES').first().boundingBox();
  repere('couches');
  await cliquer(cb.x + 280, cb.y + 8, 7, 3);
  await move(240, 520, 4);
  const row = p.getByText('PPR multirisque', { exact: true }).first();
  await defilerListe(row, 470, 12);
  let rb = await row.boundingBox();
  await move(rb.x + 40, rb.y + rb.height / 2, 5); await ripple();
  repere('ppr');
  await p.mouse.click(rb.x + 40, rb.y + rb.height / 2); await wait(800); await repos(60000); await wait(500); await repos();
  await tenir(15);
  await ripple();
  repere('pprOff');
  await p.mouse.click(rb.x + 40, rb.y + rb.height / 2); await wait(600); await repos(40000);
  await tenir(3);
  zrow = p.getByText('Zonage PLU par parcelle (calibré)', { exact: true }).first();
  await defilerListe(zrow, 330, 12);
  const zb = await zrow.boundingBox();
  await move(zb.x + 40, zb.y + zb.height / 2, 5); await ripple();
  repere('plu');
  await p.mouse.click(zb.x + 40, zb.y + zb.height / 2); await wait(800); await repos(60000); await wait(500); await repos();
  await tenir(3);
  repere('versCarte');
  await move(P0.x, P0.y, 7);
  await tenir(1);
  finSeg();
}

// ── E : zonage PLU, de l'île au terrain (le curseur reste sur le terrain) ──
if (SEGS.includes('E')) {
  if (!zrow) throw new Error('E suppose C enregistré dans la même passe');
  seg('E'); await curseur(P0.x, P0.y);
  await snap();
  await trajet(vueIle.zoom, P0, ZFIN, XF, 44, (e) => curseur(e.x, e.y));
  await repos(40000); await tenir(10);
  journal.E.curseurFinal = { x: cx, y: cy };
  finSeg();
}
if (zrow) {   // zonage décoché, liste des couches repliée
  const zb2 = await zrow.boundingBox(); if (zb2) { await p.mouse.click(zb2.x + 40, zb2.y + zb2.height / 2); await wait(800); }
  const cb = await p.locator('text=COUCHES').first().boundingBox(); await p.mouse.click(cb.x + 280, cb.y + 8); await wait(600);
}

// ── F : la recherche par filtres : Saint-Denis, 600 m² minimum, terrain nu, détenu par une société → liste brute ──
if (SEGS.includes('F')) {
  await fermerFiche(); await setFond('Sombre'); await vueDeLIle();
  const depart = journal.E ? journal.E.curseurFinal : { x: 860, y: 470 };
  await p.mouse.move(depart.x, depart.y); await wait(1200); await repos();
  seg('F'); await curseur(depart.x, depart.y);
  await tenir(4);
  const bouton = (nom) => p.getByRole('button', { name: nom, exact: true }).first();
  const volet = async (nom, pas) => { const bb = await p.getByText(nom, { exact: true }).first().boundingBox(); await cliquer(350, bb.y + bb.height / 2, pas, 3); };
  const fb = await p.locator('text=FILTRES').first().boundingBox();
  repere('filtres');
  await cliquer(fb.x + 280, fb.y + 8, 8, 3);
  repere('communes');
  await volet('Communes', 4);
  let c = await centreDe(bouton('Saint-Denis')); await cliquer(c.b.x + 70, c.y, 4, 1); await wait(700); await repos(); await tenir(3);
  repere('terrain');
  await volet('Le terrain', 5);
  const min = p.locator('input[placeholder="min"]').first(); c = await centreDe(min);
  await cliquer(c.x, c.y, 4, 1);
  for (const ch of '600') { await p.keyboard.type(ch); await wait(120); await tenir(2); }
  c = await centreDe(bouton('Terrain bâti')); await cliquer(c.b.x + 70, c.y, 5, 1);
  c = await centreDe(bouton('Non mesuré')); await cliquer(c.b.x + 70, c.y, 3, 1); await wait(700); await repos(); await tenir(3);
  repere('affiner');
  await volet('Affiner la recherche', 5);
  const soc = p.getByRole('button', { name: /^Détenu par une société/ }).first();
  await move(240, 560, 3);
  await defilerListe(soc, 560, 13);
  c = await centreDe(soc);
  repere('societe');
  await cliquer(c.b.x + 70, c.y, 4, 1); await wait(700); await repos(); await tenir(3);
  const liste = bouton('Voir la liste brute');
  await defilerListe(liste, 700, 9);
  c = await centreDe(liste); await move(c.x, c.y, 4); await ripple();
  repere('liste');
  await p.mouse.click(c.x, c.y); await p.getByText('RÉSULTATS').first().waitFor({ timeout: 60000 }); await wait(2500); await repos();
  await tenir(8);
  await move(240, 520, 4);
  const carte1 = p.getByText('Trier par surface').first();
  repere('defileListe');
  const sc0 = await carte1.evaluate((el, f) => { const sc = new Function('return ' + f)()(el); if (!sc) return null; sc.style.scrollBehavior = 'auto'; sc.setAttribute('data-resultats', '1'); return sc.scrollTop; }, defileur.toString());
  if (sc0 !== null) for (let i = 1; i <= 26; i++) { await p.evaluate((y) => { document.querySelector('[data-resultats]').scrollTop = y; }, Math.round(sc0 + 620 * ease2(i / 26))); await p.mouse.move(cx, cy + (i % 2) * 0.5); await snap(); }
  await tenir(8);
  journal.F.curseurFinal = { x: cx, y: cy };
  finSeg();
  // remise en état : retour aux filtres, réinitialisation, panneau replié
  const ret = p.getByRole('button', { name: /Retour/ }).first(); if (await ret.count()) { await ret.click(); await wait(1000); }
  const re = bouton('Réinitialiser'); if (await re.count()) { await re.scrollIntoViewIfNeeded().catch(() => {}); await re.click().catch(() => {}); await wait(1200); }
  const fb2 = await p.locator('text=FILTRES').first().boundingBox(); if (fb2) { await p.mouse.click(fb2.x + 280, fb2.y + 8); await wait(600); }
}

await fermerFiche(); await setFond('Sombre');
writeFileSync(SP + '/video/frames/journal' + SUF + '-' + SEGS.join('') + '.json', JSON.stringify({ idu: IDU, vueIle, vueTerrain, P, P0, ZFIN, XF, S, segments: journal }, null, 1));
console.log('fond final :', await fond(), '| URL', p.url());
await b.close();
