#!/usr/bin/env node
/**
 * npm run build:sitemap
 * Gera public/sitemap.xml e public/robots.txt a partir do manifesto (requisito 54).
 * Rotas de aula seguem /aulas/<disciplina>/<slug>.
 */
import { readJson, writeTextIfChanged } from '../lib/content-sync/io.mjs';
import { MANIFEST_PATH, PUBLIC_DIR, SITE_URL } from '../lib/content-sync/paths.mjs';
import { slugify } from '../lib/content-sync/utils.mjs';
import path from 'node:path';

const manifest = readJson(MANIFEST_PATH, { aulas: [] });
const base = SITE_URL.replace(/\/$/, '');

const staticRoutes = [
  '', '/aulas', '/disciplinas', '/plano', '/missao', '/questoes', '/simulados',
  '/lei-seca', '/revisoes', '/erros', '/mapas', '/favoritos', '/estatisticas',
  '/novidades', '/busca', '/configuracoes',
];

const urls = [
  ...staticRoutes.map((route) => ({ loc: `${base}${route}`, priority: route === '' ? '1.0' : '0.6' })),
  ...(manifest.aulas || []).map((aula) => ({
    loc: `${base}/aulas/${slugify(aula.disciplina)}/${aula.slug}`,
    lastmod: aula.ultimaAtualizacao,
    priority: '0.8',
  })),
  ...[...new Set((manifest.aulas || []).map((a) => slugify(a.disciplina)))].map((s) => ({
    loc: `${base}/disciplinas/${s}`,
    priority: '0.7',
  })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) =>
      `  <url>\n    <loc>${url.loc}</loc>\n${url.lastmod ? `    <lastmod>${url.lastmod}</lastmod>\n` : ''}    <priority>${url.priority}</priority>\n  </url>`,
  )
  .join('\n')}
</urlset>
`;

const robots = `User-agent: *
Allow: /
Disallow: /status-sync

Sitemap: ${base}/sitemap.xml
`;

writeTextIfChanged(path.join(PUBLIC_DIR, 'sitemap.xml'), xml);
writeTextIfChanged(path.join(PUBLIC_DIR, 'robots.txt'), robots);
console.log(`Sitemap gerado com ${urls.length} URLs (base: ${base})`);
