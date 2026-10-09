import { mkdirSync, rmSync } from 'fs';
const SP = '/tmp/claude-0/-home-user-labuse-immo/c63124ce-02a1-58ce-ac83-598cbc29f87a/scratchpad';
const { launch } = await import(SP + '/video/browser.mjs');
const out = SP + '/video/frames/L'; rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
const b = await launch();
const p = await b.newPage({ viewport: { width: 2880, height: 1800 }, deviceScaleFactor: 1 });
await p.goto('file://' + SP + '/video/logo.html', { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
// Le vol d'arrivée (0 → FLY s) passe à vitesse normale ; la pose, le mot LABUSE et l'atterrissage sont ralentis (× SLOW).
const FPS = 30, DUR = 2.85, S = +(process.env.SLOW || 1), FLY = +(process.env.FLY || 0);
const N = Math.round(FPS * (FLY + (DUR - FLY) * S));
const tAt = (i) => { const r = i / FPS; return r < FLY ? r : FLY + (r - FLY) / S; };
for (let i = 0; i < N; i++) {
  await p.evaluate((t) => window.render(t), Math.min(DUR, tAt(i)));
  await p.screenshot({ path: `${out}/${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 90 });
}
console.log('logo frames', N);
await b.close();
