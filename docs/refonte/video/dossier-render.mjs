import { mkdirSync, rmSync } from 'fs';
const SP = '/tmp/claude-0/-home-user-labuse-immo/c63124ce-02a1-58ce-ac83-598cbc29f87a/scratchpad';
const { launch } = await import(SP + '/video/browser.mjs');
const out = SP + '/video/frames/D'; rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
const b = await launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await p.goto('file://' + SP + '/video/dossier.html', { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
const total = await p.evaluate(() => window.TOTAL);
for (let i = 0; i < total; i++) {
  await p.evaluate((f) => window.render(f), i);
  await p.screenshot({ path: `${out}/${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 90 });
}
console.log('D', total, 'images');
await b.close();
