import { mkdirSync, rmSync } from 'fs';
const SP = '/tmp/claude-0/-home-user-labuse-immo/c63124ce-02a1-58ce-ac83-598cbc29f87a/scratchpad';
const { launch } = await import(SP + '/video/browser.mjs');
const out = SP + '/video/frames/D9'; rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
const b = await launch(['--allow-file-access-from-files']);
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const { readdirSync } = await import('fs');
const lastB = readdirSync(SP + '/video/frames/B-v9').filter((f) => f.endsWith('.jpg')).sort().pop();
const jb = JSON.parse((await import('fs')).readFileSync(SP + '/video/frames/journal-B-v9.json', 'utf8'));
// Le montage finit le passage de la fiche en plan serré : on part de cette image recadrée (controle/B-dernier.jpg, faite par montage9.py --dernier B),
// avec le curseur à sa place dans ce cadre ; il regagne sa place réelle pendant le fondu de retour.
const cad = JSON.parse((await import('fs')).readFileSync(SP + '/video/controle/B-dernier.json', 'utf8')).cadre, c = jb.curseurFinal;
const cur0 = { x: (c.x - cad[0]) * 1440 / cad[2], y: (c.y - cad[1]) * 900 / cad[3], s: 1440 / cad[2] };
await p.addInitScript(([s, from, to, cur, cur0]) => { window.SLOW = s; window.FROM = from; window.TO = to; window.CUR = cur; window.CUR0 = cur0; }, [+(process.env.SLOW || 1), 'controle/B-dernier.jpg', 'frames/C-v9/0000.jpg', c, cur0]);
await p.goto('file://' + SP + '/video/dossier9.html', { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
const total = await p.evaluate(() => window.TOTAL);
for (let i = 0; i < total; i++) {
  await p.evaluate((f) => window.render(f), i);
  await p.screenshot({ path: `${out}/${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 90 });
}
console.log('D', total, 'images');
await b.close();
