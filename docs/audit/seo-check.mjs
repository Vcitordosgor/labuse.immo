// docs/audit/seo-check.mjs — contrôle SEO du build (npm run build && node docs/audit/seo-check.mjs)
// Titles/descriptions, canonical, OG/Twitter, JSON-LD, sitemap/robots/llms, image de partage,
// polices locales, offre Flash, mots interdits. Sort en code 1 si un point casse (branchable en CI).
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const SITE = 'https://labuse.immo';
const pages = {
  'dist/index.html': { url: `${SITE}/`, types: ['Organization', 'WebSite', 'SoftwareApplication'] },
  'dist/mentions-legales/index.html': { url: `${SITE}/mentions-legales/`, types: ['Organization', 'WebSite', 'BreadcrumbList'] },
  'dist/confidentialite/index.html': { url: `${SITE}/confidentialite/`, types: ['Organization', 'WebSite', 'BreadcrumbList'] },
  'dist/404.html': { types: ['Organization', 'WebSite'], noindex: true },
};
// Promesses retirées et anciens tarifs : interdits dans les balises, le JSON-LD et llms.txt.
const FORBIDDEN = [/constructible/i, /propri[ée]taire/i, /\bscor/i, /\b290\b/, /\b490\b/, /mutable/i, /go\/no-go/i, /temps r[ée]el/i, /toujours à jour/i];

let fail = 0;
const err = (m) => { console.log('  ✗', m); fail++; };
const ok = (m) => console.log('  ✓', m);
const nb = (s) => s.replace(/[  ]/g, ' ');
const attr = (html, re) => html.match(re)?.[1];
const titles = new Set(), descs = new Set();

for (const [file, exp] of Object.entries(pages)) {
  console.log(`\n── ${file}`);
  if (!existsSync(file)) { err('absent'); continue; }
  const html = readFileSync(file, 'utf-8');
  const head = html.slice(0, html.indexOf('</head>'));

  const title = attr(head, /<title>([^<]*)<\/title>/) ?? '';
  const desc = attr(head, /name="description" content="([^"]*)"/) ?? '';
  if (!title || titles.has(title)) err(`title absent ou dupliqué : ${title}`);
  else { titles.add(title); title.length < 60 ? ok(`title ${title.length} car.`) : err(`title ${title.length} car. (≥ 60)`); }
  if (!desc || descs.has(desc)) err('description absente ou dupliquée');
  else { descs.add(desc); desc.length < 155 ? ok(`description ${desc.length} car.`) : err(`description ${desc.length} car. (≥ 155)`); }
  if (!exp.noindex && !/La Réunion/.test(title + desc)) err('« La Réunion » absent du title et de la description');

  const canonical = attr(head, /rel="canonical" href="([^"]*)"/);
  if (exp.noindex) {
    head.includes('name="robots" content="noindex"') ? ok('noindex') : err('noindex attendu');
    canonical ? err('pas de canonical attendu sur une page noindex') : ok('pas de canonical');
  } else {
    canonical === exp.url ? ok(`canonical ${canonical}`) : err(`canonical ${canonical} ≠ ${exp.url}`);
    head.includes('noindex') && err('noindex inattendu');
  }

  const meta = (p) => attr(head, new RegExp(`(?:property|name)="${p}" content="([^"]*)"`));
  for (const [p, v] of [['og:site_name', 'LABUSE'], ['og:locale', 'fr_FR'], ['og:type', 'website'], ['og:image', `${SITE}/og.jpg`], ['og:image:width', '1200'], ['og:image:height', '630'], ['twitter:card', 'summary_large_image'], ['twitter:image', `${SITE}/og.jpg`]]) {
    if (meta(p) !== v) err(`${p} = ${meta(p)} (attendu ${v})`);
  }
  for (const p of ['og:title', 'og:description', 'og:url', 'og:image:alt', 'twitter:title', 'twitter:description']) if (!meta(p)) err(`${p} absent`);
  ok('Open Graph + Twitter');

  const nodes = [];
  for (const [, json] of head.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
    try { const d = JSON.parse(json); nodes.push(...(d['@graph'] ?? [d])); } catch { err('JSON-LD illisible'); }
  }
  const types = nodes.map((n) => n['@type']);
  for (const t of exp.types) types.includes(t) ? ok(`JSON-LD ${t}`) : err(`JSON-LD ${t} manquant (${types.join(', ')})`);

  const seo = nb(title + ' ' + desc + ' ' + JSON.stringify(nodes) + ' ' + (meta('og:image:alt') ?? ''));
  for (const re of FORBIDDEN) if (re.test(seo)) err(`balises/JSON-LD : mot interdit ${re}`);

  if (file === 'dist/index.html') {
    const app = nodes.find((n) => n['@type'] === 'SoftwareApplication');
    const offers = [app?.offers ?? []].flat();
    offers.length === 1 ? ok('une seule Offer') : err(`${offers.length} Offer (attendu : 1, le Flash)`);
    const o = offers[0] ?? {};
    Number(o.price) === 79 && o.priceCurrency === 'EUR' && o.priceSpecification?.valueAddedTaxIncluded === false
      ? ok('Offer Flash 79 EUR HT') : err(`Offer incohérente : ${JSON.stringify(o)}`);
    nb(html).includes('79 € HT') ? ok('« 79 € HT » affiché dans la page') : err('« 79 € HT » introuvable dans la page');
  }
}

console.log('\n── fichiers de crawl');
for (const f of ['dist/sitemap-index.xml', 'dist/sitemap-0.xml', 'dist/robots.txt', 'dist/llms.txt', 'dist/og.jpg']) existsSync(f) ? ok(f) : err(`${f} absent`);
for (const f of ['dist/sitemap.xml', 'dist/og.png']) existsSync(f) && err(`${f} obsolète encore publié`);
const robots = readFileSync('dist/robots.txt', 'utf-8');
robots.includes(`Sitemap: ${SITE}/sitemap-index.xml`) ? ok('robots.txt → sitemap-index.xml') : err('robots.txt ne pointe pas sitemap-index.xml');
/Disallow:\s*\/\s*$/m.test(robots) && err('robots.txt bloque tout le site');
const locs = [...readFileSync('dist/sitemap-0.xml', 'utf-8').matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
locs.some((l) => l.includes('/404')) ? err('404 dans le sitemap') : ok('404 exclue du sitemap');
const expected = Object.values(pages).filter((p) => p.url).map((p) => p.url).sort();
JSON.stringify([...locs].sort()) === JSON.stringify(expected) ? ok(`sitemap = canonicals (${locs.length} URL)`) : err(`sitemap ${locs} ≠ ${expected}`);

const llms = nb(readFileSync('dist/llms.txt', 'utf-8'));
for (const re of FORBIDDEN) if (re.test(llms)) err(`llms.txt : mot interdit ${re}`);
llms.includes('79 € HT') ? ok('llms.txt : Flash 79 € HT') : err('llms.txt : prix du Flash absent');

// Image de partage : JPEG 1200×630, moins de 300 Ko (lecture du marqueur SOF).
const jpg = readFileSync('dist/og.jpg');
let w = 0, h = 0;
for (let i = 2; i < jpg.length - 9;) {
  if (jpg[i] !== 0xff) { i++; continue; }
  const m = jpg[i + 1];
  if (m >= 0xc0 && m <= 0xc3) { h = jpg.readUInt16BE(i + 5); w = jpg.readUInt16BE(i + 7); break; }
  i += 2 + jpg.readUInt16BE(i + 2);
}
w === 1200 && h === 630 ? ok('og.jpg 1200×630') : err(`og.jpg ${w}×${h}`);
jpg.length < 300_000 ? ok(`og.jpg ${Math.round(jpg.length / 1024)} Ko`) : err(`og.jpg trop lourde (${jpg.length} o)`);

// Polices : rien chez Google (CSP font-src 'self'), des woff2 servies depuis /_astro/.
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const files = walk('dist');
files.filter((f) => /\.(html|css|js)$/.test(f)).some((f) => /fonts\.(googleapis|gstatic)\.com/.test(readFileSync(f, 'utf-8')))
  ? err('appel à Google Fonts dans le build') : ok('aucun appel à Google Fonts');
files.some((f) => f.startsWith(join('dist', '_astro')) && f.endsWith('.woff2')) ? ok('polices woff2 auto-hébergées') : err('aucune police woff2 dans dist/_astro');

// @astrojs/sitemap doit rester en 3.2.1 exact (les 3.7.x plantent sur Astro 4).
const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
const inst = JSON.parse(readFileSync('node_modules/@astrojs/sitemap/package.json', 'utf-8')).version;
pkg.dependencies['@astrojs/sitemap'] === '3.2.1' && inst === '3.2.1' ? ok('@astrojs/sitemap 3.2.1 épinglé') : err(`@astrojs/sitemap ${pkg.dependencies['@astrojs/sitemap']} / installé ${inst}`);

console.log(fail ? `\n✗ ${fail} problème(s)` : '\n✓ Contrôle SEO : tout est bon');
process.exit(fail ? 1 : 0);
