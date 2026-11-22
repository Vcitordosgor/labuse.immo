// Vidéo du site v10 — nouveau début, d'un seul tenant et sans retour en arrière (lecture seule) :
//   H : île (carte sombre) → zoom sur le terrain → bouton « 3D » (relief + bâtiments) : la caméra bascule et recule →
//       fond « Ortho IGN » sans quitter la 3D → la caméra redescend vers le terrain → clic sur le terrain.
// La caméra 3D est posée explicitement (position et altitude de la caméra, cible et altitude de la cible) : avec le
// relief, un simple « zoom + inclinaison » peut placer la caméra sous le sol en amont du terrain (image en stries).
// Le clic final n'est pas envoyé à l'application (seule l'onde du clic est dessinée) : la fiche est montée ensuite.
// Rien n'est modifié dans le compte ; l'état est remis à la fin (fond « Sombre », 2D, vue de l'île).
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
let avant = null;   // crochet : appelé avant chaque image (caméra continue pendant les gestes du curseur)
const snap = async () => { if (avant) await avant(); await p.screenshot({ path: `${dir}/${String(n++).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 }); };
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
const b3 = p.locator('button[aria-label^="Relief 3D"]').first();
// caméra à la distance d (m) de la cible, inclinée de « pi » degrés, regardant vers « be » ; renvoie la garde au sol de la caméra
const camX = (d, pi, be, max = 90000) => p.evaluate(([T, d, pi, be, max]) => new Promise((res) => {
  const m = window.__labuse_map; const LL = m.getCenter().constructor; const to = new LL(T[0], T[1]); const rad = Math.PI / 180;
  const alt = (ll) => (m.terrain ? m.terrain.getElevationForLngLatZoom(ll, 14) : 0);
  const aT = alt(to), h = d * Math.sin(pi * rad);
  const from = new LL(T[0] - h * Math.sin(be * rad) / (111320 * Math.cos(T[1] * rad)), T[1] - h * Math.cos(be * rad) / 110540);
  const aF = aT + d * Math.cos(pi * rad); const garde = aF - alt(from);
  let f = false; const ok = () => { if (!f) { f = true; res(Math.round(garde)); } };
  m.once('idle', ok); setTimeout(ok, max);
  if (m.setCenterClampedToGround) m.setCenterClampedToGround(false);
  m.jumpTo(m.calculateCameraOptionsFromTo(from, aF, to, aT)); m.triggerRepaint();
}), [TERRAIN, d, pi, be, max]);
const mode = async (nom) => { await b3.click(); await wait(600); await item(nom).click(); await wait(1800); await repos(60000); };
// trajet de la caméra 3D, en images depuis le passage en 3D : bascule et recul (0 → NA), puis dérive lente et descente vers le terrain (NA → NB)
const NA = 26, NB = 92;
const K0 = [353, 0, 0], K1 = [950, 60, -28], K2 = [430, 40, 2];
const pose = (f) => { if (f <= NA) { const u = ease2(Math.max(0, f) / NA); return K0.map((a, i) => lerp(a, K1[i], u)); } const u = ease(Math.min(1, (f - NA) / (NB - NA))); return K1.map((a, i) => lerp(a, K2[i], u)); };
const tenir = async (k) => { for (let i = 0; i < k; i++) await snap(); };
const centreDe = async (loc) => { const b = await loc.boundingBox(); if (!b) throw new Error('élément introuvable'); return { x: b.x + b.width / 2, y: b.y + b.height / 2, b }; };
const C = await centreCarte();
let gardeMin = 1e9;
try {
  // ── hors champ : on charge le relief, les bâtiments et la photo aérienne de tout le trajet ──
  await vueDuTerrain();
  await mode('Relief + bâtiments'); await wait(2500); await repos(60000);
  for (let f = 0; f <= NB; f += 6) { await camX(...pose(f)); await wait(300); }
  await setFond('Ortho IGN'); await wait(2500); await repos(60000);
  for (let f = NA; f <= NB; f += 4) { await camX(...pose(f)); await wait(300); } await camX(...pose(NB)); await wait(1500); await repos(60000);
  await setFond('Sombre'); await mode('Aucun (2D)');
  await p.evaluate(() => { const m = window.__labuse_map; if (m.setCenterClampedToGround) m.setCenterClampedToGround(true); m.jumpTo({ pitch: 0, bearing: 0 }); });
  await vueDeLIle(); await p.mouse.move(1439, 899); await wait(800);

  // ── H ──
  seg('H'); cx = 1500; cy = 200; await cacher();
  await tenir(4);
  // île → terrain : le terrain glisse jusqu'au centre de la carte ; sur la fin, le curseur vient vers le bouton « 3D »
  let c3 = await centreDe(b3); const NZ = 40; let iz = 0;
  await trajet(vueIle.zoom, P0, 18, C, NZ, async () => { iz++; if (iz > NZ - 14) { const w = ease((iz - (NZ - 14)) / 14); await curseur(lerp(1500, c3.x, w), lerp(200, c3.y, w)); } });
  repere('terrain');
  // « 3D » → « Relief + bâtiments »
  await ripple(); await b3.click(); await wait(600); await snap(); await snap();
  let c = await centreDe(item('Relief + bâtiments')); await move(c.b.x + 80, c.y, 5); await ripple();
  repere('en3d');
  await item('Relief + bâtiments').click(); await wait(1800); await repos(60000);
  // caméra continue : chaque image avance d'un pas sur le trajet
  let f = 0; avant = async () => { const g = await camX(...pose(f)); gardeMin = Math.min(gardeMin, g); f++; };
  const cf = await centreDe(p.locator(FOND));
  await tenir(12);                                                   // f = 0 → 11 : la bascule commence
  await move(cf.x, cf.y, 14);                                        // f = 12 → 25 : le curseur va au bouton du fond de plan
  await ripple(); avant = null; await p.click(FOND); await wait(600); avant = async () => { const g = await camX(...pose(f)); gardeMin = Math.min(gardeMin, g); f++; };
  await tenir(2);
  c = await centreDe(item('Ortho IGN')); await move(c.b.x + 80, c.y, 5); await ripple();
  repere('ortho');
  avant = null; await item('Ortho IGN').click(); await wait(1500); await repos(60000); avant = async () => { const g = await camX(...pose(f)); gardeMin = Math.min(gardeMin, g); f++; };
  await tenir(3);
  avant = null; await fermerMenu(); await wait(400); avant = async () => { const g = await camX(...pose(f)); gardeMin = Math.min(gardeMin, g); f++; };
  repere('menuFerme');
  const reste = NB - f; console.log('images de caméra restantes avant le clic :', reste);
  await move(C.x, C.y, Math.max(8, reste - 6));                       // le curseur gagne le terrain pendant la descente
  while (f < NB - 3) await snap();
  repere('clic');
  await ripple();                                                    // onde du clic (le clic n'est pas envoyé à l'application)
  while (f <= NB) await snap();
  avant = null; await snap();
  journal.H.curseurFinal = { x: cx, y: cy }; journal.H.terrain = C; journal.H.gardeMin = gardeMin;
  finSeg();
} finally {
  avant = null;
  await fermerMenu().catch(() => {});
  await p.evaluate(() => { const m = window.__labuse_map; if (m.setCenterClampedToGround) m.setCenterClampedToGround(true); });
  if ((await b3.innerText()).trim() !== '3D') { await b3.click(); await wait(600); await item('Aucun (2D)').click(); await wait(1200); }
  await fermerMenu().catch(() => {}); await fermerFiche().catch(() => {}); await setFond('Sombre');
  await p.evaluate(() => { const m = window.__labuse_map; m.jumpTo({ pitch: 0, bearing: 0 }); }); await vueDeLIle();
  console.log('garde au sol minimale de la caméra :', gardeMin, 'm | fond final :', await fond(), '| 3D :', (await b3.innerText()).trim().replace(/\s+/g, ' '), '| URL', p.url());
  await b.close();
}
