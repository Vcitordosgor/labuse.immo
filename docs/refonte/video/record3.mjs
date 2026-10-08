// Vidéo promo LABUSE v3 — enregistrement image par image (app.labuse.immo, compte client d'essai).
// A : dézoom parcelle → île sur la carte sombre (inversé au montage = zoom d'entrée).
// B : fond Ortho IGN → clic parcelle → défilement de la fiche → clic « Dossier ».
// C : retour sur l'île dézoomée au max, carte sombre → Couches → PPR multirisque.
// (La scène du dossier PDF est rendue à part par dossier-render.mjs.)
import { rmSync, mkdirSync } from 'fs';
const SP = '/tmp/claude-0/-home-user-labuse-immo/c63124ce-02a1-58ce-ac83-598cbc29f87a/scratchpad';
const { launch } = await import(SP + '/video/browser.mjs');
const IDU = '97415000EY0109'; // 1 150 m², Plateau Caillou : pas de vente DVF ni de permis affichés
const P = { x: 650, y: 385 }; // position du terrain à l'écran au zoom Z1

const b = await launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, storageState: SP + '/video/state.json' });
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

let dir = '', n = 0;
const seg = (name) => { dir = SP + '/video/frames/' + name; rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true }); n = 0; };
const snap = async () => { await p.screenshot({ path: `${dir}/${String(n++).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 90 }); };
const wait = (ms) => p.waitForTimeout(ms);
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
let cx = 1500, cy = 1000;
const move = async (x, y, steps) => {
  const x0 = cx, y0 = cy;
  for (let i = 1; i <= steps; i++) { const t = ease(i / steps); cx = x0 + (x - x0) * t; cy = y0 + (y - y0) * t;
    await p.mouse.move(cx, cy); await p.evaluate(([a, c]) => window.__cur(a, c), [cx, cy]); await snap(); }
};
const ripple = async () => { for (const t of [0.15, 0.4, 0.7, 1]) { await p.evaluate(([a, c, s]) => window.__rip(a, c, s), [cx, cy, t]); await snap(); } };

// Fond de plan : le choix est mémorisé sur le compte → on repart toujours de « Sombre » et on le remet à la fin.
const FOND = 'button[aria-label="Fond de plan"]';
const menuVisible = () => p.getByRole('button', { name: 'Plan IGN', exact: true }).isVisible().catch(() => false);
const closeMenu = async () => { await p.mouse.click(240, 720); await wait(300); if (await menuVisible()) throw new Error('menu fond de plan resté ouvert'); };
const setFond = async (name) => {
  if ((await p.locator(FOND).innerText()).trim() === name) return;
  await p.click(FOND); await wait(500); await p.getByRole('button', { name, exact: true }).click(); await wait(400); await closeMenu(); await wait(1500);
};

// Mise en place : terrain à P, fiche fermée, recherche vidée, carte sombre, zoom Z1.
const setup = async () => {
  await p.goto('https://app.labuse.immo/', { waitUntil: 'networkidle' }); await wait(2000);
  if (p.url().includes('/login')) throw new Error('session expirée : relancer login.mjs');
  await setFond('Sombre');
  if (await p.getByText('PPR multirisque', { exact: true }).count()) throw new Error('couche PPR déjà active');
  await p.fill('input[placeholder^="Rechercher"]', IDU); await p.keyboard.press('Enter'); await wait(7000);
  await p.mouse.click(1398, 81); await wait(1500);
  await p.fill('input[placeholder^="Rechercher"]', ''); await p.evaluate(() => document.activeElement && document.activeElement.blur());
  await p.mouse.move(725, 478); await p.mouse.down(); await p.mouse.move(700, 450, { steps: 4 }); await p.mouse.move(P.x, P.y, { steps: 8 }); await p.mouse.up(); await wait(800);
  await p.mouse.move(P.x, P.y);
  for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, 120); await wait(220); }
  await wait(3500);
};

// ── A : dézoom vers l'île, carte sombre (inversé au montage) ──
if (!process.env.SKIP_A) {
  await setup();
  seg('A');
  await p.evaluate(() => window.__cur(-200, -200));
  await snap();
  for (let i = 0; i < 40; i++) { await p.mouse.wheel(0, 300); await wait(320); await snap(); }
  await wait(2500); for (let i = 0; i < 4; i++) await snap();
  console.log('A', n, 'images');
}

// ── B : ortho → parcelle → fiche → Dossier ──
await setup();
seg('B');
cx = 1500; cy = 640;
await p.evaluate(() => window.__cur(-200, -200));
await snap(); await snap();
// 3. vue ortho
const fb = await p.locator(FOND).boundingBox();
await move(fb.x + fb.width / 2, fb.y + fb.height / 2, 12);
await ripple();
await p.click(FOND);
for (let i = 0; i < 3; i++) { await wait(200); await snap(); }
const ob = await p.getByRole('button', { name: 'Ortho IGN', exact: true }).boundingBox();
await move(ob.x + 60, ob.y + ob.height / 2, 7);
await ripple();
await p.getByRole('button', { name: 'Ortho IGN', exact: true }).click();
await wait(3500); // chargement des tuiles coupé au montage
for (let i = 0; i < 4; i++) await snap();
await closeMenu(); await p.mouse.move(cx, cy); await wait(400);
for (let i = 0; i < 2; i++) await snap();
// 4. clic sur la parcelle
await move(P.x, P.y, 10);
await ripple();
await p.mouse.click(P.x, P.y);
for (let i = 0; i < 10; i++) { await wait(350); await snap(); }
if (!(await p.evaluate((id) => document.body.innerText.includes(id), IDU))) throw new Error('fiche ' + IDU + ' non ouverte');
// 5. défilement de la fiche (72 px par image, soit 20 % plus lent que la v1)
await move(1240, 560, 7);
const dossier = p.getByRole('button', { name: 'Dossier', exact: true });
let lastY = null, still = 0;
for (let i = 0; i < 40 && still < 2; i++) {
  await p.mouse.wheel(0, 72); await wait(90); await snap();
  const y = (await dossier.boundingBox()).y; still = (lastY !== null && Math.abs(y - lastY) < 1) ? still + 1 : 0; lastY = y;
}
// 6. clic sur « Dossier »
const db = await dossier.boundingBox();
await move(db.x + db.width / 2, db.y + db.height / 2, 8);
await ripple();
const popup = ctx.waitForEvent('page', { timeout: 60000 });
await p.mouse.click(db.x + db.width / 2, db.y + db.height / 2);
for (let i = 0; i < 4; i++) { await wait(120); await snap(); }
const np = await popup; await np.close();
console.log('B', n, 'images ; curseur final', Math.round(cx), Math.round(cy));
const endCur = { x: cx, y: cy };

// ── C : retour sur LABUSE, île dézoomée au max, carte sombre → Couches → PPR multirisque ──
await p.mouse.click(1398, 81); await wait(1200); // fermer la fiche
await setFond('Sombre'); // retour en vue sombre (hors champ)
await p.mouse.move(925, 480);
for (let i = 0; i < 40; i++) { await p.mouse.wheel(0, 300); await wait(250); }
await p.mouse.move(endCur.x, endCur.y); await wait(5000);
seg('C');
cx = endCur.x; cy = endCur.y; await p.evaluate(([a, c]) => window.__cur(a, c), [cx, cy]);
for (let i = 0; i < 8; i++) await snap();
// 8. Couches
const cb = await p.locator('text=COUCHES').first().boundingBox();
await move(cb.x + 280, cb.y + 8, 9);
await ripple();
await p.mouse.click(cb.x + 280, cb.y + 8);
for (let i = 0; i < 3; i++) { await wait(250); await snap(); }
await move(240, 520, 6);
const row = p.getByText('PPR multirisque', { exact: true }).first();
for (let i = 0; i < 40; i++) {
  const bb = await row.boundingBox();
  if (bb && bb.y < 560 && bb.y > 300) break;
  await p.mouse.wheel(0, 70); await wait(90); await snap();
}
// 9. clic sur PPR multirisque
const rb = await row.boundingBox();
await move(rb.x + 40, rb.y + rb.height / 2, 7);
await ripple();
await p.mouse.click(rb.x + 40, rb.y + rb.height / 2);
for (let i = 0; i < 14; i++) { await wait(400); await snap(); }
console.log('C', n, 'images');

// Remise en état du compte : couche décochée, fond « Sombre ».
await p.mouse.click(rb.x + 40, rb.y + rb.height / 2); await wait(800);
await setFond('Sombre');
await b.close();
