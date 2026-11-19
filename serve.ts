// ViceFrame local preview server.
// Standard library only: `node serve.ts` puts the static app in ./app on
// http://localhost:8080 so the cover studio can be tried with no build
// step and no network access. Paths are pinned inside ./app.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const PORT = 8080;

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer((req, res) => {
  let pathname = '/';
  try {
    pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end('bad request');
    return;
  }
  if (pathname === '/') pathname = '/index.html';
  const target = resolve(join(appRoot, '.' + pathname));
  if (target !== appRoot && !target.startsWith(appRoot + sep)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  if (!existsSync(target) || !statSync(target).isFile()) {
    res.writeHead(404).end('not found');
    return;
  }
  const info = statSync(target);
  res.writeHead(200, {
    'content-type': TYPES[extname(target).toLowerCase()] || 'application/octet-stream',
    'content-length': info.size,
    'cache-control': 'no-store',
  });
  createReadStream(target).pipe(res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`ViceFrame app is live at http://localhost:${PORT}`);
});
