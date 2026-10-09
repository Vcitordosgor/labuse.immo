// Captures HD (Retina) des écrans du carrousel « Zoom sur LABUSE ». Lecture seule ; fond de plan remis sur « Sombre » à la fin.
const SP='/tmp/claude-0/-home-user-labuse-immo/c63124ce-02a1-58ce-ac83-598cbc29f87a/scratchpad';
const OUT = SP + '/shots';
const { launch } = await import(SP+'/video/browser.mjs');
const b = await launch();
const ctx = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor: 2, storageState: SP+'/video/state.json' });
const p = await ctx.newPage(); const wait=ms=>p.waitForTimeout(ms);
const only = (process.env.ONLY || '').split(',').filter(Boolean); const want = (k) => !only.length || only.includes(k);
const FOND = 'button[aria-label="Fond de plan"]';
const overlay = () => p.locator('div.fixed.inset-0.z-10').count();
const clearOverlay = async () => { for (let i = 0; i < 3 && (await overlay()); i++) { await p.mouse.click(240, 720); await wait(400); } };
const closeMenu = clearOverlay;
const setFond = async (name) => { if ((await p.locator(FOND).innerText()).trim() === name) return;
  await p.click(FOND); await wait(500); await p.getByRole('button', { name, exact: true }).click(); await wait(400); await closeMenu(); await wait(2500); };
const rail = async (name) => { await clearOverlay(); await p.locator('nav, aside').getByText(name, { exact: true }).first().click(); await wait(2500); };
const search = async (idu) => { await p.fill('input[placeholder^="Rechercher"]', idu); await p.keyboard.press('Enter'); await wait(6500);
  await p.fill('input[placeholder^="Rechercher"]', ''); await p.evaluate(() => document.activeElement && document.activeElement.blur()); };
const shot = async (k) => { await p.mouse.move(1439, 899); await wait(300); await p.screenshot({ path: `${OUT}/${k}.png` }); console.log('ok', k); };
try {
  await p.goto('https://app.labuse.immo/', { waitUntil:'networkidle' }); await wait(2000);
  await setFond('Ortho IGN');
  if (want('fiche')) { await search('97415000EY0109'); await wait(2500); await shot('fiche'); }
  if (want('outils')) { await search('97415000EY0109');
    await p.getByRole('button', { name: 'Remonter le temps', exact: true }).first().click(); await wait(9000); await shot('outils'); await rail('Carte'); }
  if (want('outils2006')) { await search('97415000EY0109');
    await p.getByRole('button', { name: 'Remonter le temps', exact: true }).first().click(); await wait(4000);
    await p.getByText('2006', { exact: true }).first().click(); await wait(2000);
    await p.mouse.click(1398, 81); await wait(9000); await shot('outils2006'); await rail('Carte'); }
  if (want('pieges')) { await search('97415000EY0109'); await p.mouse.click(1398, 81); await wait(800);
    await rail('Outils'); await p.getByText('Pièges et risques', { exact: true }).first().click(); await wait(3000);
    await p.fill('input[placeholder^="Adresse, IDU"]', '97415000EY0109'); await p.keyboard.press('Enter'); await wait(9000); await shot('pieges'); await rail('Carte'); }
  if (want('crm')) { await search('97415000EY0109');
    const add = p.getByRole('button', { name: /^\+ ?CRM$/ }).first(); await add.scrollIntoViewIfNeeded(); await add.click(); await wait(900); await shot('crm');
    await clearOverlay(); await p.mouse.click(1398, 81); await wait(800); }
  if (want('carte')) { await rail('Carte'); await search('97415000EY0109'); await p.mouse.click(1398, 81); await wait(800);
    await p.mouse.move(725, 478); for (let i = 0; i < 3; i++) { await p.mouse.wheel(0, 120); await wait(250); } await wait(1500);
    const cb = await p.locator('text=COUCHES').first().boundingBox(); await p.mouse.click(cb.x + 280, cb.y + 8); await wait(1200);
    const row = p.getByText(process.env.LAYER || 'Zonage PLU par parcelle (calibré)', { exact: true }).first(); await row.scrollIntoViewIfNeeded();
    const rb = await row.boundingBox(); await p.mouse.click(rb.x + 40, rb.y + rb.height / 2); await wait(6000); await shot('carte');
    await p.mouse.click(rb.x + 40, rb.y + rb.height / 2); await wait(800); }
  if (want('docs')) { await rail('Docs'); await wait(1000); await shot('docs'); }
  if (want('radar')) { await rail('Radar'); await p.getByText('Radar', { exact: true }).nth(1).click(); await wait(12000); await shot('radar'); }
  if (want('sources')) { await rail('Sources'); await wait(1500); await shot('sources'); }
  if (want('projets')) { await rail('Projets'); await p.getByRole('button', { name: /Nouveau projet/ }).first().click(); await wait(1200); await shot('projets');
    await p.getByRole('button', { name: /Annuler/ }).first().click(); await wait(500); }
  if (want('copilote')) { await rail('Copilote');
    await p.locator('textarea, input[placeholder^="Ex."]').first().fill('Dis-moi tout sur la parcelle 97415000EY0109');
    await p.getByRole('button', { name: 'Envoyer', exact: true }).click();
    for (let i = 0; i < 30; i++) { await wait(3000); const busy = await p.evaluate(() => /Je cherche|en cours|…$/.test(document.body.innerText.slice(-400))); if (i > 6 && !busy) break; }
    await wait(2000); await shot('copilote'); }
} finally {
  await clearOverlay().catch(()=>{}); await rail('Carte').catch(()=>{}); await setFond('Sombre').catch(e=>console.log('fond', e.message));
  await rail('CRM').catch(()=>{}); console.log('CRM :', (await p.evaluate(()=>document.body.innerText)).match(/\d+ parcelles? suivies?/)?.[0]);
  console.log('fond final', (await p.locator(FOND).innerText().catch(()=>'?')).trim());
  await b.close();
}
