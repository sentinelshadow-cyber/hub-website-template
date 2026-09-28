const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const zlib = require('zlib');

const ROOT = path.join(__dirname, 'shadowcloud-site');
const PORT = process.env.PORT || 39899;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain',
};

const server = http.createServer((req, res) => {
  const u = url.parse(req.url, true);
  let pathname = decodeURIComponent(u.pathname);

  if (pathname === '/_next/image') {
    let target;
    try { target = decodeURIComponent(u.query.url || ''); } catch (e) { target = u.query.url || ''; }
    return serveFile(target, 'image', res);
  }

  if (pathname === '/') pathname = '/index.html';

  let candidate;
  if (pathname.endsWith('/')) {
    candidate = path.join(ROOT, pathname, 'index.html');
  } else {
    const direct = path.join(ROOT, pathname);
    if (fs.existsSync(direct) && fs.statSync(direct).isFile()) {
      candidate = direct;
    } else {
      candidate = path.join(ROOT, pathname + '.html');
    }
  }
  serveFile(pathname, 'page', res, candidate);
});

function serveFile(rawTarget, kind, res, givenFile) {
  let file = givenFile;
  if (!file) {
    file = path.normalize(path.join(ROOT, rawTarget));
    if (!file.startsWith(ROOT)) return notFound(res);
  }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return notFound(res);
    const ext = path.extname(file).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';

    if (kind === 'image' || kind === 'page') {
      const sendPage = (buf) => {
        res.writeHead(200, {
          'Content-Type': type,
          'Content-Length': buf.length,
          'Cache-Control': 'public, max-age=604800',
        });
        res.end(buf);
      };
      if (ext === '.html') {
        // Inject a floating "Main Site" link into every page (added after hydration so React keeps it)
        fs.readFile(file, 'utf8', (err2, html) => {
          if (err2) return notFound(res);
          const hub = process.env.HUB_URL || 'http://localhost:3000/';
          const inject = `<script>(function(){var l=document.createElement('a');l.href='${hub}';l.textContent='← Main Site';l.style.cssText='position:fixed;bottom:20px;left:20px;z-index:9999;display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:10px;background:linear-gradient(90deg,#8b5cf6,#3b82f6);color:#fff;font:600 13px Inter,system-ui,sans-serif;text-decoration:none;box-shadow:0 4px 16px rgba(0,0,0,.4);transition:transform .15s';l.onmouseenter=function(){l.style.transform='translateY(-2px)'};l.onmouseleave=function(){l.style.transform=''};document.body.appendChild(l)})();</script>`;
          sendPage(Buffer.from(html.replace('</body>', inject + '</body>')));
        });
      } else {
        res.writeHead(200, {
          'Content-Type': type,
          'Content-Length': st.size,
          'Cache-Control': 'public, max-age=604800',
        });
        fs.createReadStream(file).pipe(res);
      }
    } else {
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size });
      fs.createReadStream(file).pipe(res);
    }
  });
}

function notFound(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Shadow Cloud mirror listening on port ${PORT}`);
});
