// Dossier PDF de la v10 : part de la dernière image de la séquence « fiche » (frames/FV), revient sur la première image des couches.
import { mkdirSync, rmSync, readdirSync, readFileSync } from 'fs';
const SP = '/tmp/claude-0/-home-user-labuse-immo/c63124ce-02a1-58ce-ac83-598cbc29f87a/scratchpad';
const { launch } = await import(SP + '/video/browser.mjs');
const out = SP + '/video/frames/D10'; rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
const b = await launch(['--allow-file-access-from-files']);
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const lastF = readdirSync(SP + '/video/frames/FV').filter((f) => f.endsWith('.jpg')).sort().pop();
const cur = JSON.parse(readFileSync(SP + '/video/frames/journal-B-v9.json', 'utf8')).curseurFinal;   // là où commence le curseur du passage des couches
await p.addInitScript(([s, from, to, cur]) => { window.SLOW = s; window.FROM = from; window.TO = to; window.CUR = cur; }, [+(process.env.SLOW || 0.7), 'frames/FV/' + lastF, 'frames/C-v9/0000.jpg', cur]);
await p.goto('file://' + SP + '/video/dossier10.html', { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
const total = Math.round(await p.evaluate(() => window.TOTAL));
for (let i = 0; i < total; i++) { await p.evaluate((f) => window.render(f), i); await p.screenshot({ path: `${out}/${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 90 }); }
console.log('D', total, 'images, départ', lastF);
await b.close();
