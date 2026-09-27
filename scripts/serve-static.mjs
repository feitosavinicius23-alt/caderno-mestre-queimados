#!/usr/bin/env node
/**
 * Servidor estático mínimo para o build de produção (dist/).
 *
 * Sem websocket, sem hot-reload, sem dependência externa — só HTTP puro.
 * Replica o comportamento do Cloudflare Pages: arquivos reais são servidos
 * como estão e qualquer outra rota cai no index.html (SPA fallback).
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('dist');
const PORT = Number(process.env.PORT || 8080);

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

if (!fs.existsSync(ROOT)) {
  console.error('✕ dist/ não existe. Rode: npm run build');
  process.exit(1);
}

function enviar(res, status, corpo, tipo) {
  res.writeHead(status, {
    'Content-Type': tipo,
    'Cache-Control': 'no-cache',
    // Permite que a página seja exibida dentro do iframe de preview.
    'X-Frame-Options': 'ALLOWALL',
  });
  res.end(corpo);
}

const server = http.createServer((req, res) => {
  let caminho = decodeURIComponent((req.url || '/').split('?')[0]);
  if (caminho.endsWith('/')) caminho += 'index.html';

  // Impede escapar da pasta dist/.
  const alvo = path.join(ROOT, path.normalize(caminho).replace(/^(\.\.[/\\])+/, ''));
  if (!alvo.startsWith(ROOT)) return enviar(res, 403, 'Proibido', 'text/plain');

  if (fs.existsSync(alvo) && fs.statSync(alvo).isFile()) {
    const ext = path.extname(alvo).toLowerCase();
    return enviar(res, 200, fs.readFileSync(alvo), TIPOS[ext] || 'application/octet-stream');
  }

  // SPA fallback — igual ao _redirects do Cloudflare Pages.
  return enviar(res, 200, fs.readFileSync(path.join(ROOT, 'index.html')), TIPOS['.html']);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servindo dist/ em http://0.0.0.0:${PORT}`);
});
