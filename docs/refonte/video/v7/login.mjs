const SP='/tmp/claude-0/-home-user-labuse-immo/c63124ce-02a1-58ce-ac83-598cbc29f87a/scratchpad';
const { launch } = await import(SP+'/video/browser.mjs');
const b = await launch();
const ctx = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1, locale:'fr-FR', timezoneId:'Indian/Reunion' });
const p = await ctx.newPage();
const r = await p.goto('https://app.labuse.immo/login', { waitUntil:'networkidle', timeout:60000 });
console.log('page de connexion :', r.status(), p.url());
console.log('champs :', JSON.stringify(await p.evaluate(()=>[...document.querySelectorAll('input,button')].map(e=>e.tagName+'#'+(e.id||'')+'['+(e.type||'')+']'+(e.innerText||'').trim().slice(0,24)))));
if (!process.env.LB_ID || !process.env.LB_PW) { console.log('identifiants absents (variables LB_ID / LB_PW)'); await b.close(); process.exit(0); }
await p.fill('#identifiant', process.env.LB_ID);
await p.fill('#password', process.env.LB_PW);
await p.click('button[type=submit]');
await p.waitForLoadState('networkidle').catch(()=>{}); await p.waitForTimeout(3500);
console.log('après connexion → URL', p.url());
console.log((await p.evaluate(() => document.body.innerText.slice(0,500))).replace(/\n+/g,' | '));
await p.screenshot({ path: SP+'/video/01-apres-login.png' });
if (!/\/login/.test(p.url())) { await ctx.storageState({ path: SP+'/video/state.json' }); console.log('session enregistrée'); }
await b.close();
