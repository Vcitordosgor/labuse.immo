// docs/audit/sections.mjs — capture chaque section lisiblement.
// node docs/audit/sections.mjs [avant|apres] [1440|375]
import { chromium } from 'playwright-core';

const phase = process.argv[2] === 'apres' ? 'apres' : 'avant';
const width = Number(process.argv[3] || 1440);
const names = ['00-header','01-hero','02-constat','03-features','04-howitworks','05-productpreview','06-datalayers','07-keyfigures','08-audience','09-pricing','10-finalcta','11-contact','12-trustbar','13-footer'];
const out = `docs/audit/${phase}/sec-${width}`;
import { mkdirSync } from 'fs';
mkdirSync(out, { recursive: true });

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
const p = await ctx.newPage();
await p.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
await p.waitForTimeout(300);
// header(1), main children sections, footer(16)
const els = await p.$$('body > header, main > section, body > footer');
for (let i = 0; i < els.length && i < names.length; i++) {
  await els[i].scrollIntoViewIfNeeded().catch(() => {});
  await p.waitForTimeout(120);
  await els[i].screenshot({ path: `${out}/${names[i]}.png` }).catch((e) => console.log('skip', names[i], e.message));
}
console.log(`captured ${els.length} sections @${width} -> ${out}`);
await b.close();
