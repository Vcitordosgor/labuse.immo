// docs/audit/capture.mjs — node docs/audit/capture.mjs [avant|apres]
// Capture chaque page en 3 viewports + collecte les erreurs console.
import { chromium } from 'playwright-core';

const phase = process.argv[2] === 'apres' ? 'apres' : 'avant';
const base = 'http://localhost:3000';
const pages = ['/', '/nope-404', '/mentions-legales', '/confidentialite'];
const widths = [375, 768, 1440];
const out = `docs/audit/${phase}`;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const report = [];
for (const w of widths) {
  // reducedMotion: le CSS force alors .reveal à opacity:1 (contenu entier visible)
  // et neutralise scroll-behavior:smooth — capture déterministe de l'état posé.
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  for (const p of pages) {
    const errs = [];
    page.removeAllListeners('console');
    page.removeAllListeners('pageerror');
    page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
    page.on('pageerror', (e) => errs.push(String(e)));
    const resp = await page.goto(base + p, { waitUntil: 'networkidle' });
    // Déclenche tous les IntersectionObserver (reveal) en scrollant la page.
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      for (let y = 0; y <= document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 200));
    });
    await page.waitForTimeout(400);
    const name = p === '/' ? 'home' : p.replace(/^\//, '').replaceAll('/', '_');
    await page.screenshot({ path: `${out}/${name}-${w}.png`, fullPage: true });
    // detecte scroll horizontal
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (errs.length || overflow) report.push({ page: name, w, status: resp?.status(), errs, overflow });
  }
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(report, null, 2));
