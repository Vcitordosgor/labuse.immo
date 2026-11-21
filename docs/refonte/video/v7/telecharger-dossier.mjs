// Télécharge (lecture seule, session déjà ouverte) le Dossier PDF de la parcelle, pour la scène du visualiseur.
import { writeFileSync } from 'fs';
const SP='/tmp/claude-0/-home-user-labuse-immo/c63124ce-02a1-58ce-ac83-598cbc29f87a/scratchpad';
const { client } = await import(SP+'/video/api.mjs');
const IDU=process.argv[2]||'97415000EY1231';
const c = await client();
const st = await c.get('/dossier/statut'); console.log('statut', st.status(), (await st.text()).slice(0,400));
const r = await c.get('/dossier/'+IDU+'.pdf', { headers:{ accept:'application/pdf' }, timeout:120000 });
console.log('pdf', r.status(), r.headers()['content-type'], r.headers()['content-disposition']||'');
const buf = await r.body(); writeFileSync(SP+'/video/dossier-pdf/'+IDU+'.pdf', buf); console.log(buf.length, 'octets');
await c.dispose();
