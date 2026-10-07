import { mkdirSync, rmSync } from 'fs';
const SP = '/tmp/claude-0/-home-user-labuse-immo/c63124ce-02a1-58ce-ac83-598cbc29f87a/scratchpad';
const { launch } = await import(SP + '/video/browser.mjs');
const out = SP + '/video/frames/L'; rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
const b = await launch();
const p = await b.newPage({ viewport: { width: 2880, height: 1800 }, deviceScaleFactor: 1 });
await p.goto('file://' + SP + '/video/logo.html', { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
const FPS = 30, DUR = 2.85;
for (let i = 0; i < Math.round(FPS * DUR); i++) {
  await p.evaluate((t) => window.render(t), i / FPS);
  await p.screenshot({ path: `${out}/${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 90 });
}
console.log('logo frames', Math.round(FPS * DUR));
await b.close();
