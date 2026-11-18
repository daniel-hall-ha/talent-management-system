import 'dotenv/config';
import { existsSync } from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const backend = new URL(process.env.BACKEND_URL || 'http://127.0.0.1:3001');
if (!['http:', 'https:'].includes(backend.protocol)) throw new Error('BACKEND_URL must use http or https');
if (process.env.NODE_ENV === 'production' && !process.env.BACKEND_URL) throw new Error('Set BACKEND_URL for the web service');

const dist = resolve(dirname(fileURLToPath(import.meta.url)), 'dist');
const index = resolve(dist, 'index.html');
if (!existsSync(index)) throw new Error('Web build not found. Run npm run build -w apps/web first.');

const app = express();
app.disable('x-powered-by');
app.use('/api', (req, res) => {
  const incoming = new URL(req.originalUrl, 'http://local.invalid');
  const target = new URL(backend.origin);
  target.pathname = incoming.pathname;
  target.search = incoming.search;
  const headers = { ...req.headers, host: backend.host };
  delete headers.connection;
  delete headers['proxy-connection'];

  const transport = backend.protocol === 'https:' ? https : http;
  const upstream = transport.request(target, { method: req.method, headers }, response => {
    res.writeHead(response.statusCode || 502, response.headers);
    response.pipe(res);
  });
  upstream.setTimeout(120_000, () => upstream.destroy(new Error('Backend timed out')));
  upstream.on('error', () => {
    if (!res.headersSent) res.status(502).json({ error: 'Backend unavailable' });
    else res.destroy();
  });
  req.on('aborted', () => upstream.destroy());
  req.pipe(upstream);
});
app.use(express.static(dist, { index: false }));
app.get('*', (_req, res) => res.sendFile(index));

const port = Number(process.env.PORT || 3000);
app.listen(port, '0.0.0.0', () => console.log(`Web listening on ${port}`));
