// Enregistrement image par image de la vidéo promo LABUSE (app.labuse.immo, compte client).
// Segment A : dézoom parcelle → île (sera inversé au montage = zoom d'entrée).
// Segment B : clic parcelle → fiche → défilement → dézoom → Couches → défilement → PPR multirisque.
import { rmSync, mkdirSync } from 'fs';
const SP = '/tmp/claude-0/-home-user-labuse-immo/c63124ce-02a1-58ce-ac83-598cbc29f87a/scratchpad';
const { launch } = await import(SP + '/video/browser.mjs');
const IDU = '97415000EY0054';
const P = { x: 650, y: 385 }; // position du terrain à l'écran (cadrage de l'accueil)

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

// Mise en place : parcelle centrée, fiche fermée, recherche vidée, carte décalée pour que le terrain
// soit à P (sa place dans le cadrage de l'accueil), zoom « Z1 ».
const setup = async () => {
  await p.goto('https://app.labuse.immo/', { waitUntil: 'networkidle' }); await wait(2000);
  await p.fill('input[placeholder^="Rechercher"]', IDU); await p.keyboard.press('Enter'); await wait(7000);
  await p.mouse.click(1398, 81); await wait(1500);
  await p.fill('input[placeholder^="Rechercher"]', ''); await p.evaluate(() => document.activeElement && document.activeElement.blur());
  // glisser la carte : terrain (725,478) → P
  await p.mouse.move(725, 478); await p.mouse.down(); await p.mouse.move(700, 450, { steps: 4 }); await p.mouse.move(P.x, P.y, { steps: 8 }); await p.mouse.up(); await wait(800);
  await p.mouse.move(P.x, P.y);
  for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, 120); await wait(220); }
  await wait(3500);
};

// ── Segment A : dézoom vers l'île (inversé au montage) ──
if (!process.env.SKIP_A) {
await setup();
seg('A');
await p.evaluate(() => window.__cur(-200, -200));
await snap();
for (let i = 0; i < 40; i++) { await p.mouse.wheel(0, 300); await wait(320); await snap(); }
await wait(2500); for (let i = 0; i < 4; i++) await snap();
console.log('A', n, 'images');
}

// ── Segment B ──
if (!process.env.SKIP_B) {
await setup();
seg('B');
cx = 1500; cy = 980;
await move(P.x, P.y, 12);
await ripple();
await p.mouse.click(P.x, P.y);
for (let i = 0; i < 10; i++) { await wait(350); await snap(); }
const idu = await p.evaluate(() => document.body.innerText.includes('97415000EY0054'));
console.log('fiche EY0054 ouverte :', idu);
// défilement rapide de la fiche
await move(1240, 560, 7);
for (let i = 0; i < 36; i++) { await p.mouse.wheel(0, 90); await wait(90); await snap(); }
// dézoom
await move(P.x + 40, P.y + 60, 7);
for (let i = 0; i < 22; i++) { await p.mouse.wheel(0, 120); await wait(240); await snap(); }
// Couches
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
const rb = await row.boundingBox();
await move(rb.x + 40, rb.y + rb.height / 2, 7);
await ripple();
await p.mouse.click(rb.x + 40, rb.y + rb.height / 2);
for (let i = 0; i < 14; i++) { await wait(400); await snap(); }
console.log('B', n, 'images');
}
await b.close();
