import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
await import('./build.mjs');
const root = resolve('dist');
const allowed = new Set(['index.html','kelola.html','app.js','kelola.js','styles.css','favicon.svg','logo-ehop.png','messages.json','editor.html','editor.js','editor.css','layout-runtime.css']);
const mime = { '.png':'image/png', '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.json':'application/json; charset=utf-8' };
http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const name = pathname === '/' ? 'index.html' : pathname.slice(1);
    if (!['GET','HEAD'].includes(req.method) || !allowed.has(name)) { res.writeHead(404).end(); return; }
    const data = await readFile(resolve(root, name));
    res.writeHead(200, { 'Content-Type': mime[extname(name)], 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'strict-origin-when-cross-origin' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch { res.writeHead(404).end('Halaman tidak ditemukan'); }
}).listen(Number(process.env.PORT || 4173), '127.0.0.1', () => console.log('Local: http://127.0.0.1:'+(process.env.PORT || 4173)));
