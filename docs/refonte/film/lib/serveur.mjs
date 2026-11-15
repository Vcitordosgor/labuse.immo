import http from 'http'; import { createReadStream, existsSync, statSync } from 'fs'; import { extname, join, normalize } from 'path';
const ROOT=new URL('..',import.meta.url).pathname.replace(/\/$/,'');
const T={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html; charset=utf-8','.css':'text/css','.json':'application/json','.geojson':'application/json','.bin':'application/octet-stream','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.pdf':'application/pdf'};
export const servir=(port=0)=>new Promise(r=>{const s=http.createServer((q,res)=>{const f=normalize(join(ROOT,decodeURIComponent(q.url.split('?')[0])));
  if(!f.startsWith(ROOT)||!existsSync(f)||!statSync(f).isFile()){res.writeHead(404);return res.end();}
  res.writeHead(200,{'content-type':T[extname(f)]||'application/octet-stream','cache-control':'no-store'});createReadStream(f).pipe(res);}).listen(port,'127.0.0.1',()=>r(s));});
