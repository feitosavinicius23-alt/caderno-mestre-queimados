#!/usr/bin/env node
/**
 * npm run sync-content
 * Reconstrói manifest, disciplinas, metadados, índice de busca e histórico.
 * Idempotente: rodar duas vezes seguidas não altera nada na segunda vez.
 *
 * Flags: --dry-run (não escreve nada)
 */
import fs from 'node:fs';
import path from 'node:path';
import { formatReport, runSync } from '../lib/content-sync/sync.mjs';
import { hashString } from '../lib/content-sync/utils.mjs';
import { PUBLIC_DIR, RAW_DOC_PATH } from '../lib/content-sync/paths.mjs';
import { writeJsonIfChanged } from '../lib/content-sync/io.mjs';

const dryRun = process.argv.includes('--dry-run');
const result = runSync({ dryRun });

process.stdout.write(formatReport(result));

if (dryRun) process.stdout.write('(dry-run: nenhum arquivo foi escrito)\n\n');

if (!result.ok) {
  process.stdout.write('Sincronização abortada — corrija os erros acima.\n\n');
  process.exit(1);
}

// Publicado para que o botão do site possa comparar o documento do Drive
// diretamente, sem expor credenciais nem depender de dados do navegador.
if (!dryRun && fs.existsSync(RAW_DOC_PATH)) {
  writeJsonIfChanged(path.join(PUBLIC_DIR, 'sync-source.json'), {
    documento: 'Caderno Mestre — Queimados 2026',
    hash: hashString(fs.readFileSync(RAW_DOC_PATH, 'utf8')),
    verificadoEm: new Date().toISOString(),
  });
}
