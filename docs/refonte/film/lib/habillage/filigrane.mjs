// Fabrique le filigrane du pilote (PNG transparent 1920×1080), avec la police de la marque.
const ROOT=new URL('../..',import.meta.url).pathname.replace(/\/$/,'');
const { launch } = await import(ROOT+'/lib/browser.mjs'); const { servir } = await import(ROOT+'/lib/serveur.mjs');
const srv=await servir(0); const b=await launch(); const p=await b.newPage({viewport:{width:1920,height:1080}});
await p.goto(`http://127.0.0.1:${srv.address().port}/lib/habillage/filigrane.html`,{waitUntil:'networkidle'}); await p.evaluate(()=>document.fonts.ready);
await p.screenshot({path:ROOT+'/lib/habillage/filigrane.png',omitBackground:true}); const r=await p.evaluate(()=>{const q=document.getElementById('f').getBoundingClientRect();return [q.left,q.top,q.right,q.bottom].map(Math.round);});
console.log('filigrane.png', r.join(' ')); await b.close(); srv.close();
