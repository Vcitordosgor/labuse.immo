// Lecture d'une ressource de l'application avec la session enregistrée (lecture seule).
const SP='/tmp/claude-0/-home-user-labuse-immo/c63124ce-02a1-58ce-ac83-598cbc29f87a/scratchpad';
import { request } from '/opt/node22/lib/node_modules/playwright/index.mjs';
export const client = async () => request.newContext({ baseURL:'https://app.labuse.immo', storageState: SP+'/video/state.json', extraHTTPHeaders:{accept:'application/json'} });
if ((process.argv[1]||'').endsWith('api.mjs')) { const c=await client(); const r=await c.get(process.argv[2]); const t=await r.text(); console.log(r.status(), t.length); console.log(t.slice(0, +(process.argv[3]||3000))); await c.dispose(); }
