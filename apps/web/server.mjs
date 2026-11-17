import 'dotenv/config';
import { createServer, request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { createReadStream, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid port number');
if (!process.env.BACKEND_URL) throw new Error('Set BACKEND_URL to the separate API service URL');
const backend = new URL(process.env.BACKEND_URL);
if (!['http:', 'https:'].includes(backend.protocol)) throw new Error('BACKEND_URL must use http or https');
const dist = resolve(fileURLToPath(new URL('./dist/', import.meta.url)));
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.zip': 'application/zip',
};

function sendFile(req, res, file) {
  let stats;
  try { stats = statSync(file); } catch { res.writeHead(404); res.end('Not found'); return; }
  if (!stats.isFile()) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': mime[extname(file).toLowerCase()] || 'application/octet-stream', 'Content-Length': stats.size });
  if (req.method === 'HEAD') res.end();
  else createReadStream(file).pipe(res);
}

function proxy(req, res) {
  const target = new URL(req.url, backend);
  const transport = target.protocol === 'https:' ? httpsRequest : httpRequest;
  const upstream = transport(target, { method: req.method, headers: { ...req.headers, host: target.host } }, response => {
    res.writeHead(response.statusCode || 502, response.headers);
    response.pipe(res);
  });
  upstream.on('error', error => {
    console.error('API proxy failed:', error);
    if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Backend unavailable');
  });
  req.pipe(upstream);
}

createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); res.end('Invalid URL'); return; }
  if (pathname === '/api' || pathname.startsWith('/api/')) { proxy(req, res); return; }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end('Method not allowed'); return; }
  const file = resolve(dist, `.${pathname}`);
  if (file !== dist && !file.startsWith(dist + sep)) { res.writeHead(403); res.end('Forbidden'); return; }
  let exists = false;
  try { exists = statSync(file).isFile(); } catch { /* Fall through to client route. */ }
  if (exists) sendFile(req, res, file);
  else if (!extname(pathname)) sendFile(req, res, resolve(dist, 'index.html'));
  else { res.writeHead(404); res.end('Not found'); }
}).listen(port, '0.0.0.0', () => console.log(`Web listening on ${port}; proxying /api to ${backend.origin}`));
