// Vidéo 4 « les couches » : captures de la carte de l'application (lecture seule) selon un plan JSON.
//   node capturer2.mjs plan.json [dossier de sortie = app2]
// plan = { vues: [ { cle, nom, c:[lon,lat], larg (mètres au sol sur 1920 px) ou zoom, fond ('Sombre' par défaut), variantes:[ { cle, couches:[libellés exacts] } ] } ] }
// Sorties : <dossier>/<vue>-<variante>.png (1920×1080) et <dossier>/<vue>.json (emprise Web Mercator, pour caler la photo IGN).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
const SP = '/tmp/claude-0/-home-user-labuse-immo/c63124ce-02a1-58ce-ac83-598cbc29f87a/scratchpad';
const { launch } = await import(SP + '/video/browser.mjs');
const plan = JSON.parse(readFileSync(process.argv[2], 'utf8')); const OUT = SP + '/v4/' + (process.argv[3] || 'app2'); mkdirSync(OUT, { recursive: true });
const VW = 2900, VH = 1700, CADRE0 = { x: 695, y: 338, width: 1920, height: 1080 };
const b = await launch(['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']);
const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1, locale: 'fr-FR', timezoneId: 'Indian/Reunion', storageState: SP + '/video/state.json' });
const p = await ctx.newPage(); const wait = (ms) => p.waitForTimeout(ms);
await p.goto('https://app.labuse.immo/', { waitUntil: 'networkidle', timeout: 60000 }); await wait(3000);
if (p.url().includes('/login')) throw new Error('session expirée');
const fond = async () => (await p.locator('button[aria-label^="Fond de plan"]').innerText()).trim();
if ((await fond()) !== 'Sombre') throw new Error('fond de plan de départ : ' + (await fond()));
const repos = (max = 60000) => p.evaluate((max) => new Promise((res) => { const m = window.__labuse_map; let f = false; const ok = () => { if (!f) { f = true; res(); } }; m.once('idle', ok); m.triggerRepaint(); setTimeout(ok, max); }), max);
// liste des couches ouverte et repérée (on ne clique que dans cette liste)
const cb = await p.locator('text=COUCHES').first().boundingBox(); await p.mouse.click(cb.x + 280, cb.y + 8); await wait(1200);
await p.evaluate(() => { const t = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && (e.innerText || '').trim() === 'Limites communes'); let s = t; while (s && !(s.scrollHeight > s.clientHeight + 5 && /auto|scroll/.test(getComputedStyle(s).overflowY))) s = s.parentElement; s.setAttribute('data-liste', '1'); });
const actives = new Set();
const basculer = async (nom) => { const r = p.locator('[data-liste]').getByText(nom, { exact: true }).first(); if (!(await r.count())) throw new Error('couche introuvable : ' + nom); await r.scrollIntoViewIfNeeded(); await wait(150); await r.click(); await wait(500); actives.has(nom) ? actives.delete(nom) : actives.add(nom); };
const regler = async (voulues) => { for (const n of [...actives]) if (!voulues.includes(n)) await basculer(n); for (const n of voulues) if (!actives.has(n)) await basculer(n); await p.mouse.move(60, 1600); await repos(); await wait(500); await repos(); };
const R = 20037508.342789244, merc = (lon, lat) => [lon * R / 180, Math.log(Math.tan((90 + lat) * Math.PI / 360)) * R / Math.PI];
let fait = 0;
try {
  for (const v of plan.vues) {
    const CADRE = v.cadre || CADRE0;   // cadre propre à la vue (île entière : plus haut que 16/9)
    const z = v.zoom ?? Math.log2(78271.51696 * Math.cos(v.c[1] * Math.PI / 180) / (v.larg / 1920));
    await p.evaluate(([c, z, e]) => { const m = window.__labuse_map; const r = m.getContainer().getBoundingClientRect(); m.easeTo({ center: c, zoom: z, offset: [e[0] - (r.x + r.width / 2), e[1] - (r.y + r.height / 2)], duration: 0 }); }, [v.c, z, [CADRE.x + CADRE.width / 2, CADRE.y + CADRE.height / 2]]);
    await repos(); await wait(400); await repos();
    const coins = await p.evaluate(([cadre]) => { const m = window.__labuse_map; const r = m.getContainer().getBoundingClientRect(); const a = m.unproject([cadre.x - r.x, cadre.y - r.y]), c = m.unproject([cadre.x + cadre.width - r.x, cadre.y + cadre.height - r.y]); return { no: [a.lng, a.lat], se: [c.lng, c.lat], zoom: m.getZoom() }; }, [CADRE]);
    const a = merc(...coins.no), c = merc(...coins.se);
    writeFileSync(`${OUT}/${v.cle}.json`, JSON.stringify({ cle: v.cle, nom: v.nom, c: v.c, zoom: coins.zoom, no: coins.no, se: coins.se, bbox3857: [a[0], c[1], c[0], a[1]], taille: [CADRE.width, CADRE.height] }, null, 1));
    for (const va of v.variantes) {
      const f = `${OUT}/${v.cle}-${va.cle}.png`; if (existsSync(f) && process.env.REPRENDRE) continue;
      await regler(va.couches); await p.screenshot({ path: f, clip: CADRE }); fait++; console.log(v.cle, va.cle, 'z', coins.zoom.toFixed(2));
    }
  }
} finally {
  await regler([]).catch((e) => console.log('remise à zéro :', String(e).slice(0, 120)));
  await p.mouse.click(cb.x + 280, cb.y + 8).catch(() => {}); await wait(500);
  console.log(fait, 'captures | couches restées actives :', [...actives].length, '| fond :', await fond());
  await b.close();
}
