import http from 'http'; import { readFileSync, existsSync } from 'fs'; import { extname } from 'path';
const ROOT='/tmp/claude-0/-home-user-labuse-immo/c63124ce-02a1-58ce-ac83-598cbc29f87a/scratchpad';
const T={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.pdf':'application/pdf','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
export const serve = (port=8765) => new Promise(r=>{ const s=http.createServer((q,res)=>{ const f=ROOT+decodeURIComponent(q.url.split('?')[0]); if(!existsSync(f)){res.writeHead(404);return res.end();} res.writeHead(200,{'content-type':T[extname(f)]||'application/octet-stream'}); res.end(readFileSync(f)); }).listen(port,'127.0.0.1',()=>r(s)); });
