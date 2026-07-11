// docs/audit/seo-check.mjs — QA SEO sur dist/ (node docs/audit/seo-check.mjs)
// Vérifie : unicité + longueurs des titles/descriptions, canonical, OG/Twitter,
// parse des JSON-LD et types attendus, présence sitemap/robots/llms.
import { readFileSync, existsSync } from 'fs';

const pages = {
  'dist/index.html': { types: ['Organization', 'WebSite', 'SoftwareApplication'] },
  'dist/404.html': { types: ['Organization', 'WebSite'], noindex: true },
  'dist/mentions-legales/index.html': { types: ['Organization', 'WebSite', 'BreadcrumbList'] },
  'dist/confidentialite/index.html': { types: ['Organization', 'WebSite', 'BreadcrumbList'] },
};

let fail = 0;
const err = (m) => { console.log('  ❌', m); fail++; };
const ok = (m) => console.log('  ✅', m);
const titles = new Set(), descs = new Set();

for (const [file, expect] of Object.entries(pages)) {
  console.log(`\n── ${file}`);
  const html = readFileSync(file, 'utf-8');

  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  const desc = html.match(/name="description" content="([^"]*)"/)?.[1] ?? '';
  if (!title) err('title absent');
  else if (titles.has(title)) err(`title dupliqué : ${title}`);
  else { titles.add(title); ok(`title unique (${title.length} car.)${title.length > 60 ? ' ⚠️ > 60' : ''}`); if (title.length > 60) fail++; }
  if (!desc) err('meta description absente');
  else if (descs.has(desc)) err('description dupliquée');
  else { descs.add(desc); ok(`description unique (${desc.length} car.)${desc.length > 155 ? ' ⚠️ > 155' : ''}`); if (desc.length > 155) fail++; }

  const canonical = html.match(/rel="canonical" href="([^"]*)"/)?.[1];
  if (!canonical || !canonical.startsWith('https://labuse.immo/')) err('canonical absent ou relatif');
  else if (!canonical.endsWith('/')) err(`canonical sans trailing slash : ${canonical}`);
  else ok(`canonical ${canonical}`);

  for (const tag of ['og:title', 'og:description', 'og:type', 'og:url', 'og:image', 'twitter:card']) {
    if (!html.includes(`"${tag}"`)) err(`${tag} absent`);
  }
  ok('OG + Twitter complets');

  if (expect.noindex && !html.includes('name="robots" content="noindex"')) err('noindex attendu, absent');
  if (expect.noindex && html.includes('noindex')) ok('noindex présent');

  const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
  const found = [];
  for (const b of blocks) {
    try { found.push(JSON.parse(b[1])['@type']); }
    catch { err('JSON-LD invalide (parse)'); }
  }
  for (const t of expect.types) {
    if (found.includes(t)) ok(`JSON-LD ${t}`);
    else err(`JSON-LD ${t} manquant (trouvés : ${found.join(', ')})`);
  }
}

console.log('\n── fichiers crawl');
for (const f of ['dist/sitemap-index.xml', 'dist/sitemap-0.xml', 'dist/robots.txt', 'dist/llms.txt']) {
  existsSync(f) ? ok(f) : err(`${f} absent`);
}
// robots pointe vers le sitemap généré
const robots = readFileSync('dist/robots.txt', 'utf-8');
robots.includes('https://labuse.immo/sitemap-index.xml') ? ok('robots → sitemap-index.xml') : err('robots.txt ne référence pas sitemap-index.xml');
// le sitemap ne contient pas la 404
const sm = readFileSync('dist/sitemap-0.xml', 'utf-8');
sm.includes('/404') ? err('404 présente dans le sitemap') : ok('404 exclue du sitemap');
// cohérence prix : le JSON-LD reprend les prix affichés dans la page
const home = readFileSync('dist/index.html', 'utf-8');
const ld = [...home.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));
const app = ld.find((s) => s['@type'] === 'SoftwareApplication');
for (const o of app?.offers?.offers ?? []) {
  home.includes(`${o.price} €`) ? ok(`Offer ${o.name} ${o.price} € = prix affiché`) : err(`Offer ${o.name} ${o.price} € introuvable dans la page`);
}

console.log(fail ? `\n✖ ${fail} problème(s)` : '\n✔ QA SEO : tout est vert');
process.exit(fail ? 1 : 0);
